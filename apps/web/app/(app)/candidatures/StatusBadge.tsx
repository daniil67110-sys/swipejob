import { statusLabel, type ApplicationStatus } from './lib';

const STYLES: Record<ApplicationStatus, string> = {
  pending_letter: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  letter_generated: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  pending_review: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  sent: 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200',
  cancelled_by_user: 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200',
  failed: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  read: 'bg-[#f7f5f1] text-neutral-700 ring-1 ring-neutral-200',
  replied: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  interview_scheduled: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  signed: 'bg-neutral-900 text-white',
  rejected: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-caption font-semibold whitespace-nowrap ${STYLES[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}
