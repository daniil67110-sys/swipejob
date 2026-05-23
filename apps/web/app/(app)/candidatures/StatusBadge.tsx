import { statusLabel, type ApplicationStatus } from './lib';

const STYLES: Record<ApplicationStatus, string> = {
  pending_letter: 'bg-warning-100 text-warning-500',
  letter_generated: 'bg-warning-100 text-warning-500',
  pending_review: 'bg-warning-100 text-warning-500',
  sent: 'bg-neutral-100 text-neutral-600',
  cancelled_by_user: 'bg-neutral-100 text-neutral-600',
  failed: 'bg-error-100 text-error-500',
  read: 'bg-info-100 text-info-500',
  replied: 'bg-primary-100 text-primary-500',
  interview_scheduled: 'bg-primary-100 text-primary-500',
  signed: 'bg-success-100 text-success-500',
  rejected: 'bg-error-100 text-error-500',
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
