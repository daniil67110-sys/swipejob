/**
 * App layout — Guard placeholder
 * Sera enrichi en Story 1.3 avec la vérification d'authentification (Auth.js v5)
 */

// TODO: Story 1.3 — remplacer par un vrai guard d'authentification
// import { auth } from '@/lib/auth';
// import { redirect } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Guard placeholder — en V1, pas de redirection (Story 1.3)
  return <>{children}</>;
}
