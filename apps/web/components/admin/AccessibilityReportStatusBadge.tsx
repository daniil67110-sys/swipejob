import type { ReportStatus } from '@/lib/admin/accessibility-reports';

const STATUS_LABELS: Record<ReportStatus, { label: string; classes: string }> = {
  open: {
    label: 'Ouvert',
    classes: 'bg-warning-50 text-warning-700 ring-warning-200',
  },
  acknowledged: {
    label: 'Pris en charge',
    classes: 'bg-info-50 text-info-700 ring-info-200',
  },
  resolved: {
    label: 'Résolu',
    classes: 'bg-success-50 text-success-700 ring-success-200',
  },
  wontfix: {
    label: 'Hors scope',
    classes: 'bg-neutral-100 text-neutral-600 ring-neutral-300',
  },
};

export type AccessibilityReportStatusBadgeProps = {
  status: ReportStatus;
};

export function AccessibilityReportStatusBadge({ status }: AccessibilityReportStatusBadgeProps) {
  const { label, classes } = STATUS_LABELS[status];
  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md ring-1 ${classes}`}
    >
      {label}
    </span>
  );
}
