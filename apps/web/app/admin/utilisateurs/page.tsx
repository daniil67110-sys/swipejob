import type { Metadata } from 'next';
import { UsersFilterBar } from '@/components/admin/UsersFilterBar';
import { UsersPagination } from '@/components/admin/UsersPagination';
import { UsersTable } from '@/components/admin/UsersTable';
import { listUsers, parsePage, parseSearchQuery, parseUserStatus } from '@/lib/admin/users-list';

export const metadata: Metadata = {
  title: 'Utilisateurs · Admin SwipeJob',
  robots: { index: false, follow: false },
};

/**
 * Story 8.3 — Liste paginée des utilisateurs.
 *
 * Pas de cache : on veut toujours la liste fraîche (un user qui vient de
 * demander la suppression doit apparaître immédiatement avec le badge
 * "Suppression demandée").
 */
export const dynamic = 'force-dynamic';

type SearchParams = {
  q?: string;
  status?: string;
  page?: string;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = parseSearchQuery(params.q);
  const status = parseUserStatus(params.status);
  const page = parsePage(params.page);

  const result = await listUsers({ q, status, page });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-display-sm font-display font-bold text-neutral-900">Utilisateurs</h1>
        <p className="mt-2 text-body-md text-neutral-600">
          Recherche, filtres et accès au détail. Les actions (anonymisation manuelle, suppression,
          changement de rôle) arriveront en Story 8.4.
        </p>
      </header>

      <UsersFilterBar defaultQ={params.q ?? ''} defaultStatus={status} />

      <UsersTable rows={result.rows} />

      <UsersPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        pageSize={result.pageSize}
        preserved={{ q, status: status === 'all' ? undefined : status }}
      />
    </div>
  );
}
