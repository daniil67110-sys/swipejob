import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const TRACE_ID_HEADER = 'x-trace-id';

export function middleware(request: NextRequest) {
  const traceId = request.headers.get(TRACE_ID_HEADER) ?? crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(TRACE_ID_HEADER, traceId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set(TRACE_ID_HEADER, traceId);
  return response;
}

export const config = {
  matcher: [
    '/((?!api/health|api/sentry-test|_next/static|_next/image|favicon.ico|manifest.webmanifest|sitemap.xml|robots.txt|public/).*)',
  ],
};
