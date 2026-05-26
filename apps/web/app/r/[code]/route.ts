import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { captureServer, hashUserId } from '@/lib/analytics';
import {
  REFERRAL_COOKIE_MAX_AGE_DAYS,
  REFERRAL_COOKIE_NAME,
  findReferrerByCode,
  sanitizeReferralCode,
} from '@/lib/referrals';
import { serverLogger as logger } from '@/lib/logger.server';

/**
 * Story 5.3 — Handler de partage `/r/[code]`.
 *
 * Comportement :
 * - Code invalide → redirect vers landing publique sans setter de cookie.
 * - User déjà authentifié → redirect vers /deck (anti self-referral simple),
 *   pas de cookie. Si c'est son propre code → pareil, silencieusement.
 * - Anonyme + code valide → set cookie httpOnly 30j + redirect /inscription.
 *
 * Cookie : `swipejob_ref=CODE` (httpOnly, SameSite=Lax, Secure en prod).
 * Sera lu par les flows signup (auth.ts events.createUser, valider-email).
 */
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
): Promise<NextResponse> {
  const params = await context.params;
  const code = sanitizeReferralCode(params.code);
  const origin = request.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(new URL('/', origin));
  }

  // Si user déjà connecté → on n'attribue pas et on l'envoie au deck.
  const session = await auth();
  if (session?.user?.id) {
    return NextResponse.redirect(new URL('/deck', origin));
  }

  const referrer = await findReferrerByCode(code);
  if (!referrer) {
    logger.info({ code }, 'Referral code unknown — redirect home');
    return NextResponse.redirect(new URL('/inscription', origin));
  }

  captureServer('referral.clicked', hashUserId(`anon:${code}`), {
    code,
    referrer_hash: hashUserId(referrer.userId),
  });

  const response = NextResponse.redirect(new URL('/inscription', origin));
  response.cookies.set({
    name: REFERRAL_COOKIE_NAME,
    value: code,
    maxAge: REFERRAL_COOKIE_MAX_AGE_DAYS * 24 * 3600,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    path: '/',
  });
  return response;
}
