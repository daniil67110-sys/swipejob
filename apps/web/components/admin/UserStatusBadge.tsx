import type { UserRow } from '@/lib/admin/users-list';

type Status = 'active' | 'anonymized' | 'deleted_pending' | 'purged';

function deriveStatus(user: Pick<UserRow, 'deletedAt' | 'anonymizedAt' | 'purgedAt'>): Status {
  if (user.purgedAt) return 'purged';
  if (user.anonymizedAt) return 'anonymized';
  if (user.deletedAt) return 'deleted_pending';
  return 'active';
}

const STATUS_LABELS: Record<Status, { label: string; classes: string }> = {
  active: {
    label: 'Actif',
    classes: 'bg-success-50 text-success-700 ring-success-200',
  },
  anonymized: {
    label: 'Anonymisé',
    classes: 'bg-neutral-100 text-neutral-600 ring-neutral-300',
  },
  deleted_pending: {
    label: 'Suppression demandée',
    classes: 'bg-warning-50 text-warning-700 ring-warning-200',
  },
  purged: {
    label: 'Purgé',
    classes: 'bg-danger-50 text-danger-700 ring-danger-200',
  },
};

export type UserStatusBadgeProps = {
  user: Pick<UserRow, 'deletedAt' | 'anonymizedAt' | 'purgedAt'>;
};

export function UserStatusBadge({ user }: UserStatusBadgeProps) {
  const status = deriveStatus(user);
  const { label, classes } = STATUS_LABELS[status];
  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md ring-1 ${classes}`}
    >
      {label}
    </span>
  );
}
