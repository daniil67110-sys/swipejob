import type { ReactNode } from 'react';
import { requireVerifiedAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  // Onboarding flow lui-même : skip birthDate/consent checks pour éviter loop redirect
  // sur les pages /onboarding/age. Les pages onboarding hors flow age (ex: /etape-1-cv)
  // appellent leur propre `requireVerifiedAuth({})` complet en début de fichier.
  await requireVerifiedAuth({ skipOnboardingChecks: true });
  return <div className="min-h-dvh bg-neutral-50">{children}</div>;
}
