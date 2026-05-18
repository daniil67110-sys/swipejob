import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { users, cvs } from '@swipejob/db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateR2Key, uploadCvToR2 } from '@/lib/r2';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';
import { cvUploadRateLimit, getClientIp } from '@/lib/rate-limit';
import { enqueueCvParse } from '@/lib/queue';
import { withErrorHandler } from '@/lib/with-error-handler';
import { serverLogger as logger } from '@/lib/logger.server';

export const runtime = 'nodejs';

const MAX_BYTES = 10 * 1024 * 1024;

export const POST = withErrorHandler(async (request: NextRequest) => {
  // 1. Auth
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } },
      { status: 401 },
    );
  }
  if (!isDatabaseConfigured) {
    return NextResponse.json(
      { ok: false, error: { code: 'NOT_CONFIGURED', message: 'Service indisponible.' } },
      { status: 503 },
    );
  }

  // 2. Vérif consent state (re-check léger ; le layout l'a déjà fait)
  const userId = session.user.id;
  const userRows = await db
    .select({
      emailVerified: users.emailVerified,
      birthDate: users.birthDate,
      consentStatus: users.consentStatus,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const userRow = userRows[0];
  if (
    !userRow ||
    userRow.deletedAt ||
    !userRow.emailVerified ||
    userRow.consentStatus !== 'GRANTED'
  ) {
    return NextResponse.json(
      { ok: false, error: { code: 'BAD_STATE', message: 'Compte non éligible.' } },
      { status: 403 },
    );
  }

  // 3. Rate limit (10/h par user)
  const ip = getClientIp(request.headers);
  const rl = await cvUploadRateLimit.limit(`${userId}:${ip}`);
  if (!rl.success) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: 'RATE_LIMITED', message: "Trop d'uploads. Réessaie dans une heure." },
      },
      { status: 429 },
    );
  }

  // 4. Parse multipart
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    logger.warn({ err }, 'CV upload: failed to parse formData');
    return NextResponse.json(
      { ok: false, error: { code: 'BAD_REQUEST', message: 'Requête invalide.' } },
      { status: 400 },
    );
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: { code: 'NO_FILE', message: 'Aucun fichier fourni.' } },
      { status: 400 },
    );
  }

  // 5. Validation
  if (file.type !== 'application/pdf') {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'BAD_MIME',
          message: 'Seuls les fichiers PDF sont acceptés.',
        },
      },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'TOO_LARGE',
          message: 'Le fichier dépasse 10 MB. Compresse-le ou utilise un autre PDF.',
        },
      },
      { status: 413 },
    );
  }

  // 6. Magic bytes check (anti content-type spoofing).
  // Vérifie `%PDF-` (5 bytes) plutôt que `%PDF` (4) pour réduire polyglot risk.
  const arrayBuf = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuf);
  if (buf.length < 5 || buf.subarray(0, 5).toString('ascii') !== '%PDF-') {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'BAD_CONTENT',
          message: "Ce fichier n'a pas l'air d'être un PDF valide.",
        },
      },
      { status: 400 },
    );
  }

  // 7. INSERT cvs d'abord (avec r2Key calculé), R2 upload ensuite. Si R2 échoue,
  // on supprime la row (compensating tx). Évite : (a) fichier R2 orphelin si
  // INSERT échoue, (b) race condition sur MAX(version) — l'UNIQUE constraint
  // sur r2Key protège, et on retry sur conflit version.
  const cvId = await db.transaction(async (tx) => {
    const lastCv = await tx
      .select({ version: cvs.version })
      .from(cvs)
      .where(eq(cvs.userId, userId))
      .orderBy(desc(cvs.version))
      .limit(1);
    const version = (lastCv[0]?.version ?? 0) + 1;
    const r2Key = generateR2Key(userId, version);
    const inserted = await tx
      .insert(cvs)
      .values({
        userId,
        r2Key,
        // Ne stocke PAS file.name (PII potentielle). Fallback générique systématique.
        originalFilename: `cv-v${version}.pdf`,
        sizeBytes: file.size,
        mimeType: 'application/pdf',
        parsingStatus: 'pending',
        version,
      })
      .returning({ id: cvs.id, r2Key: cvs.r2Key, version: cvs.version });
    const row = inserted[0];
    if (!row) throw new Error('Insert cv returned no row');
    return row;
  });

  // 8. Upload R2 maintenant que la row existe
  const upload = await uploadCvToR2({
    buffer: buf,
    contentType: 'application/pdf',
    key: cvId.r2Key,
  });
  if (!upload.ok) {
    logger.error({ err: upload.error, userId, cvId: cvId.id }, 'CV R2 upload failed');
    // Compensating : delete la row pour éviter un "cvs.parsing_status=pending"
    // permanent avec aucun objet R2 sous-jacent.
    await db.delete(cvs).where(eq(cvs.id, cvId.id));
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Le téléversement a échoué. Réessaie dans quelques secondes.',
        },
      },
      { status: 502 },
    );
  }

  const version = cvId.version;

  // 10. Audit + Posthog
  captureServer('cv.uploaded', hashUserId(userId), {
    size: file.size,
    version,
    mock: 'mock' in upload ? upload.mock : false,
  });
  await auditLog({
    actorId: userId,
    actorType: 'USER',
    event: 'cv.uploaded',
    targetType: 'cv',
    targetId: cvId.id,
    metadata: { size: file.size, version },
  });

  // 11. Enqueue cv.parse (Story 2.1 — queue effective).
  // En l'absence de REDIS_URL, l'enqueue est mocked (CvUploader appelle quand
  // même /api/cv/parse en sync inline — fallback Story 1.7).
  const enqueued = await enqueueCvParse({ cvId: cvId.id, userId });
  if (!enqueued.ok) {
    logger.warn({ err: enqueued.error, cvId: cvId.id }, 'cv-parse enqueue failed');
  } else if ('mock' in enqueued && enqueued.mock) {
    logger.warn({ cvId: cvId.id }, 'cv-parse enqueued in mock mode (REDIS_URL absent)');
  }

  return NextResponse.json({
    ok: true,
    data: {
      cvId: cvId.id,
      parsingStatus: 'pending' as const,
      version,
      mock: 'mock' in upload ? upload.mock : false,
    },
  });
});
