import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  const isProduction = process.env['NODE_ENV'] === 'production';
  const vercelEnv = process.env['VERCEL_ENV'];
  if (isProduction || vercelEnv === 'preview' || vercelEnv === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }
  throw new Error('Sentry test error from /api/sentry-test — this is expected.');
}
