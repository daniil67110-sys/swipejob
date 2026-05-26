import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const TRACE_ID_HEADER = 'x-trace-id';

/**
 * Routes protégées : pattern préfixe path. Le route group `(onboarding)` n'apparaît
 * pas dans l'URL — on cible directement les segments réels.
 */
const PROTECTED_PREFIXES = [
  '/etape-',
  '/deck',
  '/candidatures',
  '/matches',
  '/profil',
  '/parametres',
  '/coach',
  '/wrapped',
];

/**
 * Cookie name Auth.js v5 : `__Secure-authjs.session-token` en prod (HTTPS),
 * `authjs.session-token` en dev. Middleware Edge-compatible : on vérifie
 * uniquement la présence du cookie (la session DB est validée côté layout).
 */
function hasSessionCookie(request: NextRequest): boolean {
  return (
    request.cookies.has('authjs.session-token') ||
    request.cookies.has('__Secure-authjs.session-token')
  );
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const traceId = request.headers.get(TRACE_ID_HEADER) ?? crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(TRACE_ID_HEADER, traceId);

  const pathname = request.nextUrl.pathname;
  if (isProtected(pathname) && !hasSessionCookie(request)) {
    const signinUrl = new URL('/inscription', request.url);
    signinUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(signinUrl);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set(TRACE_ID_HEADER, traceId);
  return response;
}

export const config = {
  matcher: [
    '/((?!api/auth|api/health|api/sentry-test|_next/static|_next/image|favicon.ico|manifest.webmanifest|sitemap.xml|robots.txt|public/).*)',
  ],
};
