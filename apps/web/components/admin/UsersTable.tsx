import Link from 'next/link';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { UserStatusBadge } from './UserStatusBadge';
import type { UserRow } from '@/lib/admin/users-list';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeZone: 'Europe/Paris',
});

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Europe/Paris',
});

export type UsersTableProps = {
  rows: UserRow[];
};

/**
 * Story 8.3 — Tableau utilisateurs. Lecture seule (les actions arriveront en 8.4).
 *
 * Chaque ligne est un lien vers `/admin/utilisateurs/[id]` — la cible n'existe
 * pas encore avant 8.4 (404 attendu en attendant).
 */
export function UsersTable({ rows }: UsersTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
        <p className="text-body-md text-neutral-600">
          Aucun utilisateur ne correspond à ces filtres.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-neutral-500 uppercase text-[11px] tracking-wider font-semibold">
          <tr>
            <th scope="col" className="text-left px-4 py-3">
              Email
            </th>
            <th scope="col" className="text-left px-4 py-3">
              Nom
            </th>
            <th scope="col" className="text-left px-4 py-3">
              Inscrit le
            </th>
            <th scope="col" className="text-left px-4 py-3">
              Dernière activité
            </th>
            <th scope="col" className="text-left px-4 py-3">
              Statut
            </th>
            <th scope="col" className="px-4 py-3 sr-only">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
              <td className="px-4 py-3 align-middle">
                <div className="flex items-center gap-2">
                  {row.role === 'ADMIN' ? (
                    <ShieldCheck
                      className="w-4 h-4 text-warning-600 shrink-0"
                      aria-label="Administrateur"
                    />
                  ) : null}
                  <Link
                    href={`/admin/utilisateurs/${row.id}`}
                    className="text-info-600 hover:underline font-medium break-all"
                  >
                    {row.email}
                  </Link>
                </div>
              </td>
              <td className="px-4 py-3 align-middle text-neutral-700">
                {row.name ?? <span className="text-neutral-400 italic">—</span>}
              </td>
              <td className="px-4 py-3 align-middle text-neutral-700 tabular-nums">
                {dateFormatter.format(row.createdAt)}
              </td>
              <td className="px-4 py-3 align-middle text-neutral-700 tabular-nums">
                {row.lastSeenAt ? (
                  dateTimeFormatter.format(row.lastSeenAt)
                ) : (
                  <span className="text-neutral-400 italic">jamais</span>
                )}
              </td>
              <td className="px-4 py-3 align-middle">
                <UserStatusBadge user={row} />
              </td>
              <td className="px-4 py-3 align-middle text-right">
                <Link
                  href={`/admin/utilisateurs/${row.id}`}
                  aria-label={`Voir le détail de ${row.email}`}
                  className="inline-flex items-center text-neutral-400 hover:text-neutral-700"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
