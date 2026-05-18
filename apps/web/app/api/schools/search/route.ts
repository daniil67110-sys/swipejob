import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { isDatabaseConfigured } from '@/lib/db';
import { searchSchools } from '@/lib/schools';
import { withErrorHandler } from '@/lib/with-error-handler';

export const runtime = 'nodejs';

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
  const q = request.nextUrl.searchParams.get('q') ?? '';
  if (q.length < 2) {
    return NextResponse.json({ ok: true, data: [] });
  }
  const results = await searchSchools(q, 10);
  return NextResponse.json({ ok: true, data: results });
});
