import type { ReactNode } from 'react';
import { requireVerifiedAuth } from '@/lib/auth';
import { Sidebar } from '@/components/shared/Sidebar';
import { TopMenuButton } from '@/components/shared/TopMenuButton';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireVerifiedAuth({});
  return (
    <div className="min-h-dvh bg-neutral-50">
      <Sidebar />
      <TopMenuButton />
      <div className="lg:pl-64">{children}</div>
    </div>
  );
}
