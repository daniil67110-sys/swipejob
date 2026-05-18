import type { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth';

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  await requireAuth();
  return <div className="min-h-dvh bg-neutral-50">{children}</div>;
}
