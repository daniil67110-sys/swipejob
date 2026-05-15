import { NextResponse } from 'next/server';

/**
 * Health check API endpoint pour le monitoring
 * - force-dynamic: empêche la mise en cache statique du résultat de santé
 * - HEAD et OPTIONS: pour les sondes de monitoring et les pré-vols CORS
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildHealthResponse() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'web',
      version: process.env['npm_package_version'] ?? '0.1.0',
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}

export function GET() {
  return buildHealthResponse();
}

export function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: 'GET, HEAD, OPTIONS',
      'Cache-Control': 'no-store',
    },
  });
}
