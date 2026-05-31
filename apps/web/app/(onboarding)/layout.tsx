import type { ReactNode } from 'react';
import Link from 'next/link';
import { requireVerifiedAuth } from '@/lib/auth';
import { SwipejobLogo } from '@/components/shared/SwipejobLogo';

export const dynamic = 'force-dynamic';

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  // Onboarding flow lui-même : skip birthDate/consent checks pour éviter loop redirect
  // sur les pages /onboarding/age. Les pages onboarding hors flow age (ex: /etape-1-cv)
  // appellent leur propre `requireVerifiedAuth({})` complet en début de fichier.
  await requireVerifiedAuth({ skipOnboardingChecks: true });
  return (
    <div className="relative min-h-dvh bg-[#f7f5f1] flex flex-col">
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-[#f7f5f1]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <SwipejobLogo asLink href="/deck" size="sm" />
        </div>
      </header>
      <div className="relative flex-1">{children}</div>
      <nav
        aria-label="Liens légaux"
        className="relative flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-caption text-neutral-400 py-6 px-6"
      >
        <Link href="/mentions-legales" className="hover:text-neutral-700 hover:underline">
          Mentions légales
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/cgu" className="hover:text-neutral-700 hover:underline">
          CGU
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/politique-confidentialite" className="hover:text-neutral-700 hover:underline">
          Confidentialité
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/cookies" className="hover:text-neutral-700 hover:underline">
          Cookies
        </Link>
      </nav>
    </div>
  );
}
