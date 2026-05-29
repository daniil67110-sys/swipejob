import Link from 'next/link';
import { ChevronRight, Mail } from 'lucide-react';
import { AccessibilityReportStatusBadge } from './AccessibilityReportStatusBadge';
import type { ReportListRow } from '@/lib/admin/accessibility-reports';

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Europe/Paris',
});

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export type AccessibilityReportsTableProps = {
  rows: ReportListRow[];
};

export function AccessibilityReportsTable({ rows }: AccessibilityReportsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
        <p className="text-body-md text-neutral-600">
          Aucun signalement ne correspond à ce filtre.
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
              Reçu le
            </th>
            <th scope="col" className="text-left px-4 py-3">
              URL signalée
            </th>
            <th scope="col" className="text-left px-4 py-3">
              Statut
            </th>
            <th scope="col" className="text-left px-4 py-3">
              Contact
            </th>
            <th scope="col" className="px-4 py-3 sr-only">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
              <td className="px-4 py-3 align-middle text-neutral-700 tabular-nums whitespace-nowrap">
                {dateTimeFormatter.format(row.createdAt)}
              </td>
              <td className="px-4 py-3 align-middle">
                <Link
                  href={`/admin/signalements/${row.id}`}
                  className="text-info-600 hover:underline font-medium break-all"
                >
                  {truncate(row.url, 80)}
                </Link>
              </td>
              <td className="px-4 py-3 align-middle">
                <AccessibilityReportStatusBadge status={row.status} />
              </td>
              <td className="px-4 py-3 align-middle">
                {row.hasContact ? (
                  <span
                    className="inline-flex items-center gap-1 text-neutral-600"
                    aria-label="Le rapporteur a laissé une adresse de contact"
                  >
                    <Mail className="w-4 h-4" aria-hidden="true" />
                    <span className="text-body-sm">Oui</span>
                  </span>
                ) : (
                  <span className="text-neutral-400 italic">—</span>
                )}
              </td>
              <td className="px-4 py-3 align-middle text-right">
                <Link
                  href={`/admin/signalements/${row.id}`}
                  aria-label={`Voir le détail du signalement reçu le ${dateTimeFormatter.format(row.createdAt)}`}
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
