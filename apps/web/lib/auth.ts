/**
 * Auth.js v5 stub
 * Sera implémenté en Story 1.3 (OAuth Google) et Story 1.4 (email/password)
 */

// TODO: Story 1.3 — implémenter avec Auth.js v5
// import NextAuth from 'next-auth';
// import { authConfig } from '@/lib/auth.config';

export const AUTH_CONFIG = {
  sessionStrategy: 'jwt' as const,
  pages: {
    signIn: '/login',
  },
};
