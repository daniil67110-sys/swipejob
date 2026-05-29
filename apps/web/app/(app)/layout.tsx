import type { ReactNode } from 'react';
import { requireVerifiedAuth } from '@/lib/auth';
import { Sidebar } from '@/components/shared/Sidebar';
import { TopMenuButton } from '@/components/shared/TopMenuButton';
import { BadgeUnlockProvider } from '@/components/engagement/BadgeUnlockProvider';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireVerifiedAuth({});
  return (
    <BadgeUnlockProvider>
      <div className="min-h-dvh bg-[#f7f5f1]">
        <Sidebar />
        <TopMenuButton />
        <div className="lg:pl-64">{children}</div>
      </div>
    </BadgeUnlockProvider>
  );
}
