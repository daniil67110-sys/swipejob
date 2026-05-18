import type { ReactNode } from 'react';
import { requireVerifiedAuth } from '@/lib/auth';

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  await requireVerifiedAuth();
  return <div className="min-h-dvh bg-neutral-50">{children}</div>;
}
