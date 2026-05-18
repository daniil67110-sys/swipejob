import 'server-only';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { redirect } from 'next/navigation';
import { db, isDatabaseConfigured } from '@swipejob/db';
import * as schema from '@swipejob/db/schema';
import { captureServer, hashUserId } from './analytics';
import { auditLog } from './audit';
import { env, isAuthConfigured } from './env';
import { serverLogger as logger } from './logger.server';

const isAuthFullyConfigured = isAuthConfigured && isDatabaseConfigured;

/**
 * Auth.js v5 (NextAuth successor) configuration.
 *
 * Mode conditionnel : si `AUTH_SECRET`/`AUTH_GOOGLE_*` absents en dev,
 * `handlers` répond 503 et `signIn` throw — permet le boot CI/dev sans creds OAuth.
 *
 * Sessions : strategy 'database' (architecture.md ligne 312 — révocation immédiate RGPD).
 * Cookies : HttpOnly + SameSite=Lax + Secure (prod) — défaut Auth.js v5.
 * MaxAge : 30 jours (NFR-S6 invalidation 30j inactivité).
 */

// DrizzleAdapter requires very strict table types that don't match our custom
// citext email and our snake_case account column naming. Runtime contract is fine,
// but TS narrowing is overly strict — cast to bypass type incompatibility.
// Lazy-initialized to avoid touching the Proxy db stub when no DATABASE_URL.
function makeAdapter() {
  return DrizzleAdapter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db as any,
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      usersTable: schema.users as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      accountsTable: schema.accounts as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sessionsTable: schema.sessions as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      verificationTokensTable: schema.verificationTokens as any,
    },
  );
}

const authConfig: NextAuthConfig = {
  adapter: isAuthFullyConfigured ? makeAdapter() : undefined,
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      // Scopes minimaux RGPD : openid + email + profile (le minimum nécessaire pour Google).
      authorization: { params: { scope: 'openid email profile' } },
    }),
  ],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: '/inscription',
    error: '/inscription',
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google') {
        logger.warn({ provider: account?.provider }, 'signIn rejected: non-google provider');
        return false;
      }
      if (profile?.email_verified !== true) {
        logger.warn({ provider: account.provider }, 'signIn rejected: google email not verified');
        return false;
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // ignore malformed urls
      }
      return baseUrl;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      try {
        captureServer('user.signup', hashUserId(user.id), {
          method: 'google',
          locale: 'fr-FR',
        });
        await auditLog({
          actorId: user.id,
          actorType: 'USER',
          event: 'auth.signup',
          targetType: 'user',
          targetId: user.id,
          metadata: { method: 'google' },
        });
      } catch (err) {
        logger.error({ err, userId: user.id }, 'createUser event handler failed');
      }
    },
    async signIn({ user, isNewUser }) {
      if (!user.id || isNewUser) return; // signup already handled in createUser
      try {
        captureServer('user.login', hashUserId(user.id), { method: 'google' });
        await auditLog({
          actorId: user.id,
          actorType: 'USER',
          event: 'auth.login',
          targetType: 'user',
          targetId: user.id,
          metadata: { method: 'google' },
        });
      } catch (err) {
        logger.error({ err, userId: user.id }, 'signIn event handler failed');
      }
    },
  },
  trustHost: env.AUTH_TRUST_HOST,
  secret: env.AUTH_SECRET,
};

function notConfigured(): never {
  throw new Error(
    'Auth.js not configured: set AUTH_SECRET + AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET. ' +
      'See docs/runbooks/auth-google.md.',
  );
}

const realAuth = isAuthFullyConfigured ? NextAuth(authConfig) : null;

export const handlers = realAuth?.handlers ?? {
  GET: () =>
    new Response('Auth not configured. See docs/runbooks/auth-google.md.', { status: 503 }),
  POST: () =>
    new Response('Auth not configured. See docs/runbooks/auth-google.md.', { status: 503 }),
};

export const auth: ReturnType<typeof NextAuth>['auth'] =
  realAuth?.auth ?? ((async () => null) as unknown as ReturnType<typeof NextAuth>['auth']);

export const signIn: ReturnType<typeof NextAuth>['signIn'] =
  realAuth?.signIn ?? (notConfigured as unknown as ReturnType<typeof NextAuth>['signIn']);

export const signOut: ReturnType<typeof NextAuth>['signOut'] =
  realAuth?.signOut ?? (notConfigured as unknown as ReturnType<typeof NextAuth>['signOut']);

/**
 * Server Component / Server Action helper : redirect /inscription si pas de session.
 * Convention architecture.md ligne 628.
 */
export async function requireAuth(nextPath?: string) {
  const session = await auth();
  if (!session?.user) {
    const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : '';
    redirect(`/inscription${next}`);
  }
  return session;
}

export async function getOptionalAuth() {
  return auth();
}
