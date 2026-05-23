import type { ReactNode } from 'react';
import { requireVerifiedAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  // Onboarding flow lui-même : skip birthDate/consent checks pour éviter loop redirect
  // sur les pages /onboarding/age. Les pages onboarding hors flow age (ex: /etape-1-cv)
  // appellent leur propre `requireVerifiedAuth({})` complet en début de fichier.
  await requireVerifiedAuth({ skipOnboardingChecks: true });
  return (
    <div className="relative min-h-dvh bg-neutral-50 overflow-hidden">
      {/* Gradient blobs décoratifs */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full bg-info-500/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-success-500/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative">{children}</div>
    </div>
  );
}
