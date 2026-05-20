import type { ReactNode } from 'react';
import { requireVerifiedAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireVerifiedAuth({});
  return <div className="min-h-dvh bg-neutral-50">{children}</div>;
}
