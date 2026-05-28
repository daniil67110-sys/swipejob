import type { DefaultSession } from 'next-auth';

/**
 * Story 8.1 — Ajoute `role` (USER | ADMIN) au type de session.
 * Propagé depuis la table `users.role` dans le callback `session` de auth.ts.
 * Utilisé par requireAdmin() pour gérer l'accès au back-office /admin.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'USER' | 'ADMIN';
    } & DefaultSession['user'];
  }
}
