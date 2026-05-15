import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware Next.js — V1 passthrough
 * Sera enrichi en Story 1.3 (Auth.js v5 session guard)
 */
export function middleware(_request: NextRequest) {
  // V1: passthrough — l'authentification sera gérée par Auth.js (Story 1.3)
  return NextResponse.next();
}

export const config = {
  // Matcher: toutes les routes sauf les assets statiques
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|public/).*)'],
};
