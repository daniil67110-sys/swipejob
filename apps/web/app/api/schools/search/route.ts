import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { isDatabaseConfigured } from '@/lib/db';
import { searchSchools } from '@/lib/schools';
import { schoolsSearchRateLimit } from '@/lib/rate-limit';
import { withErrorHandler } from '@/lib/with-error-handler';

export const runtime = 'nodejs';

const MAX_QUERY_LEN = 100;

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } },
      { status: 401 },
    );
  }
  if (!isDatabaseConfigured) {
    return NextResponse.json({ ok: true, data: [] });
  }

  // Rate limit 30 req/min/user (AC2 Story 1.9). Pg_trgm fuzzy est coûteux ;
  // un autocomplete naïf peut spammer 100+ requêtes en quelques secondes.
  const rl = await schoolsSearchRateLimit.limit(session.user.id);
  if (!rl.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'RATE_LIMITED', message: 'Trop de requêtes.' } },
      { status: 429 },
    );
  }

  const q = request.nextUrl.searchParams.get('q') ?? '';
  // Borne haute : empêche un q de 10000 chars de saturer le bind SQL.
  if (q.length < 2 || q.length > MAX_QUERY_LEN) {
    return NextResponse.json({ ok: true, data: [] });
  }
  const results = await searchSchools(q, 10);
  return NextResponse.json({ ok: true, data: results });
});
