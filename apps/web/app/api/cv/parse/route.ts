import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { auth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { cvs, iaAuditLogs, profiles } from '@swipejob/db/schema';
import { extractCvText, parseCvWithLLM } from '@/lib/cv-parser';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';
import { env, isR2Configured } from '@/lib/env';
import { withErrorHandler } from '@/lib/with-error-handler';
import { serverLogger as logger } from '@/lib/logger.server';

export const runtime = 'nodejs';
export const maxDuration = 30;

async function downloadFromR2(key: string): Promise<Buffer | null> {
  if (
    !isR2Configured ||
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET_NAME
  ) {
    return null;
  }
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
  const res = await client.send(new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }));
  const stream = res.Body;
  if (!stream || !('transformToByteArray' in stream)) {
    return null;
  }
  const bytes = await (
    stream as { transformToByteArray: () => Promise<Uint8Array> }
  ).transformToByteArray();
  return Buffer.from(bytes);
}

export const POST = withErrorHandler(async (request: NextRequest) => {
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
  const userId = session.user.id;

  let body: { cvId?: string };
  try {
    body = (await request.json()) as { cvId?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'BAD_REQUEST', message: 'JSON invalide.' } },
      { status: 400 },
    );
  }
  if (!body.cvId || typeof body.cvId !== 'string') {
    return NextResponse.json(
      { ok: false, error: { code: 'BAD_REQUEST', message: 'cvId requis.' } },
      { status: 400 },
    );
  }

  const cvRows = await db
    .select({
      id: cvs.id,
      userId: cvs.userId,
      r2Key: cvs.r2Key,
      parsingStatus: cvs.parsingStatus,
    })
    .from(cvs)
    .where(eq(cvs.id, body.cvId))
    .limit(1);
  const cv = cvRows[0];
  if (!cv || cv.userId !== userId) {
    return NextResponse.json(
      { ok: false, error: { code: 'NOT_FOUND', message: 'CV introuvable.' } },
      { status: 404 },
    );
  }
  if (cv.parsingStatus === 'completed') {
    return NextResponse.json({
      ok: true,
      data: { cvId: cv.id, status: 'completed', alreadyParsed: true },
    });
  }

  // 1. Download R2 (ou mock — buffer empty pour fallback test)
  let buf: Buffer | null = null;
  try {
    buf = await downloadFromR2(cv.r2Key);
  } catch (err) {
    logger.error({ err, cvId: cv.id }, 'R2 download failed');
  }

  // 2. Extract text (pdf-parse)
  let text = '';
  if (buf) {
    try {
      text = await extractCvText(buf);
    } catch (err) {
      logger.error({ err, cvId: cv.id }, 'pdf-parse failed');
    }
  }

  // 3. LLM parse (or fallback)
  const { parsedCv, meta } = await parseCvWithLLM(text || '(empty)');

  // 4-6. Transaction : upsert profile + insert ia_audit_logs + update cv status.
  // Sinon crash entre les 3 → profil créé mais cvs.parsing_status reste 'pending'
  // → l'utilisateur ne peut jamais accéder à /etape-1-cv/revue.
  const newStatus = 'completed' as const; // V1 : on accepte fallback comme completed
  await db.transaction(async (tx) => {
    await tx
      .insert(profiles)
      .values({
        userId,
        firstName: parsedCv.firstName,
        lastName: parsedCv.lastName,
        headline: parsedCv.headline,
        summary: parsedCv.summary,
        phone: parsedCv.phoneE164,
        city: parsedCv.currentLocation,
        linkedinUrl: parsedCv.linkedinUrl,
        experiences: parsedCv.experiences,
        educations: parsedCv.educations,
        skills: parsedCv.skills,
        languages: parsedCv.languages,
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          firstName: parsedCv.firstName,
          lastName: parsedCv.lastName,
          headline: parsedCv.headline,
          summary: parsedCv.summary,
          phone: parsedCv.phoneE164,
          city: parsedCv.currentLocation,
          linkedinUrl: parsedCv.linkedinUrl,
          experiences: parsedCv.experiences,
          educations: parsedCv.educations,
          skills: parsedCv.skills,
          languages: parsedCv.languages,
        },
      });

    await tx.insert(iaAuditLogs).values({
      userId,
      model: meta.model,
      provider: meta.parsedByFallback ? 'fallback' : 'mistral',
      promptHash: meta.promptHash,
      featureType: 'cv_parse',
      latencyMs: meta.latencyMs,
      tokensInput: meta.tokensInput,
      tokensOutput: meta.tokensOutput,
      success: meta.success,
      errorCode: meta.success ? null : 'parse_failed_fallback',
      metadata: {
        cvId: cv.id,
        firstNameFound: Boolean(parsedCv.firstName),
        schoolsCount: parsedCv.educations.length,
        experiencesCount: parsedCv.experiences.length,
        skillsCount: parsedCv.skills.length,
      },
    });

    await tx
      .update(cvs)
      .set({
        parsingStatus: newStatus,
        parsingError: meta.parsedByFallback ? 'parsed_with_fallback' : null,
      })
      .where(eq(cvs.id, cv.id));
  });

  // 7. Audit + Posthog
  captureServer('cv.parsed', hashUserId(userId), {
    fallback: meta.parsedByFallback,
    latencyMs: meta.latencyMs,
  });
  await auditLog({
    actorId: userId,
    actorType: 'USER',
    event: 'profile.cv_parsed',
    targetType: 'cv',
    targetId: cv.id,
    metadata: {
      latencyMs: meta.latencyMs,
      fallback: meta.parsedByFallback,
    },
  });

  return NextResponse.json({
    ok: true,
    data: { cvId: cv.id, status: newStatus, fallback: meta.parsedByFallback },
  });
});
