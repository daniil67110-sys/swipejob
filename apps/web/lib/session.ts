import 'server-only';
import { cookies } from 'next/headers';
import { db } from './db';
import { sessions } from '@swipejob/db/schema';
import { createId } from '@swipejob/db/lib/id';

const COOKIE_MAX_AGE_S = 30 * 24 * 3600;

function getCookieName(): string {
  return process.env.NODE_ENV === 'production'
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';
}

/**
 * Create a database session row + set the Auth.js v5 cookie.
 *
 * Used after magic-link email verification (Story 1.4) and after credentials login,
 * since Auth.js v5 Credentials provider doesn't natively support DB sessions.
 * Auth.js still reads this cookie via DrizzleAdapter.getSessionAndUser.
 */
export async function createDatabaseSession(userId: string): Promise<string> {
  const sessionToken = createId();
  const expires = new Date(Date.now() + COOKIE_MAX_AGE_S * 1000);

  await db.insert(sessions).values({ sessionToken, userId, expires });

  const store = await cookies();
  store.set({
    name: getCookieName(),
    value: sessionToken,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  });

  return sessionToken;
}
