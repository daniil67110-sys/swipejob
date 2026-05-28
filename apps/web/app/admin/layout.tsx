import type { ReactNode } from 'react';
import { requireAdmin } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';

/**
 * Story 8.1 — Layout back-office admin.
 *
 * Garde : `requireAdmin()` renvoie 404 si l'utilisateur n'est pas ADMIN
 * (anonyme → redirect /inscription via requireAuth en interne).
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();
  return (
    <div className="min-h-dvh bg-neutral-50">
      <AdminSidebar />
      <div className="lg:pl-64">
        <header className="border-b border-neutral-200 bg-white px-6 py-3 flex items-center justify-between">
          <div>
            <p className="text-caption uppercase tracking-wider text-neutral-500 font-semibold">
              Back-office
            </p>
            <p className="text-body-sm text-neutral-700">
              Connecté·e :{' '}
              <span className="font-medium text-neutral-900">{session.user?.email}</span>
            </p>
          </div>
          <span
            className="text-[10px] font-semibold uppercase tracking-wider text-warning-600 bg-warning-100 px-2 py-1 rounded-md"
            aria-label="Rôle administrateur"
          >
            Admin
          </span>
        </header>
        <main className="px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
