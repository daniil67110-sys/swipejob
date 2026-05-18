import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { users, cvs } from '@swipejob/db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateR2Key, uploadCvToR2 } from '@/lib/r2';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';
import { cvUploadRateLimit, getClientIp } from '@/lib/rate-limit';
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

  // 6. Magic bytes check (anti content-type spoofing)
  const arrayBuf = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuf);
  if (buf.length < 4 || buf.subarray(0, 4).toString('ascii') !== '%PDF') {
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

  // 7. Compute version
  const lastCv = await db
    .select({ version: cvs.version })
    .from(cvs)
    .where(eq(cvs.userId, userId))
    .orderBy(desc(cvs.version))
    .limit(1);
  const version = (lastCv[0]?.version ?? 0) + 1;

  // 8. Upload R2
  const r2Key = generateR2Key(userId, version);
  const upload = await uploadCvToR2({
    buffer: buf,
    contentType: 'application/pdf',
    key: r2Key,
  });
  if (!upload.ok) {
    logger.error({ err: upload.error, userId }, 'CV R2 upload failed');
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

  // 9. Insert row cvs
  const inserted = await db
    .insert(cvs)
    .values({
      userId,
      r2Key,
      originalFilename: file.name || `cv-v${version}.pdf`,
      sizeBytes: file.size,
      mimeType: 'application/pdf',
      parsingStatus: 'pending',
      version,
    })
    .returning({ id: cvs.id });
  const cvId = inserted[0]?.id;
  if (!cvId) {
    throw new Error('Insert cv returned no row');
  }

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
    targetId: cvId,
    metadata: { size: file.size, version },
  });

  // 11. Enqueue cv.parse (Story 2.1 implémente la queue effective)
  logger.warn(
    { cvId, userId },
    'cv.parse job not enqueued (BullMQ Story 2.1) — manual processing required',
  );

  return NextResponse.json({
    ok: true,
    data: {
      cvId,
      parsingStatus: 'pending' as const,
      version,
      mock: 'mock' in upload ? upload.mock : false,
    },
  });
});
