import type { AuditLogRow } from '@/lib/admin/audit-logs';

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: 'Europe/Paris',
});

const ACTOR_TYPE_CLASSES: Record<string, string> = {
  USER: 'bg-info-50 text-info-700 ring-info-200',
  ADMIN: 'bg-warning-50 text-warning-700 ring-warning-200',
  SYSTEM: 'bg-neutral-100 text-neutral-700 ring-neutral-200',
};

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function metadataPreview(metadata: Record<string, unknown> | null): string {
  if (!metadata) return '';
  const json = JSON.stringify(metadata);
  return truncate(json, 100);
}

export type AuditLogsTableProps = {
  rows: AuditLogRow[];
};

export function AuditLogsTable({ rows }: AuditLogsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
        <p className="text-body-md text-neutral-600">
          Aucun audit log ne correspond à ces filtres.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-neutral-500 uppercase text-[11px] tracking-wider font-semibold">
          <tr>
            <th scope="col" className="text-left px-4 py-3 whitespace-nowrap">
              Date
            </th>
            <th scope="col" className="text-left px-4 py-3">
              Acteur
            </th>
            <th scope="col" className="text-left px-4 py-3">
              Événement
            </th>
            <th scope="col" className="text-left px-4 py-3">
              Cible
            </th>
            <th scope="col" className="text-left px-4 py-3">
              Métadonnées
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 font-mono text-[12px]">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-neutral-50 transition-colors align-top">
              <td className="px-4 py-2 text-neutral-700 tabular-nums whitespace-nowrap">
                {dateTimeFormatter.format(row.createdAt)}
              </td>
              <td className="px-4 py-2">
                <div className="flex flex-col gap-1">
                  <span
                    className={`inline-flex items-center w-fit text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ring-1 ${
                      ACTOR_TYPE_CLASSES[row.actorType] ?? ''
                    }`}
                  >
                    {row.actorType}
                  </span>
                  {row.actorId ? (
                    <span className="text-neutral-600 break-all">{truncate(row.actorId, 20)}</span>
                  ) : (
                    <span className="text-neutral-400 italic font-sans">—</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-2 text-neutral-900 font-semibold">{row.event}</td>
              <td className="px-4 py-2 text-neutral-700">
                {row.targetType ? (
                  <div className="flex flex-col gap-0.5">
                    <span>{row.targetType}</span>
                    {row.targetId ? (
                      <span className="text-neutral-500 break-all">
                        {truncate(row.targetId, 24)}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-neutral-400 italic font-sans">—</span>
                )}
              </td>
              <td className="px-4 py-2 text-neutral-600">
                {row.metadata ? (
                  <code className="text-[11px] break-all">{metadataPreview(row.metadata)}</code>
                ) : (
                  <span className="text-neutral-400 italic font-sans">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
