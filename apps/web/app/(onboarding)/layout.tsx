import type { ReactNode } from 'react';
import Link from 'next/link';
import { requireVerifiedAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  // Onboarding flow lui-même : skip birthDate/consent checks pour éviter loop redirect
  // sur les pages /onboarding/age. Les pages onboarding hors flow age (ex: /etape-1-cv)
  // appellent leur propre `requireVerifiedAuth({})` complet en début de fichier.
  await requireVerifiedAuth({ skipOnboardingChecks: true });
  return (
    <div className="relative min-h-dvh bg-neutral-50 overflow-hidden flex flex-col">
      {/* Gradient blobs décoratifs */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full bg-info-500/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-success-500/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative flex-1">{children}</div>
      <nav
        aria-label="Liens légaux"
        className="relative flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-caption text-neutral-400 py-6 px-6"
      >
        <Link href="/mentions-legales" className="hover:text-neutral-600 hover:underline">
          Mentions légales
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/cgu" className="hover:text-neutral-600 hover:underline">
          CGU
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/politique-confidentialite" className="hover:text-neutral-600 hover:underline">
          Confidentialité
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/cookies" className="hover:text-neutral-600 hover:underline">
          Cookies
        </Link>
      </nav>
    </div>
  );
}
