import type { LucideIcon } from 'lucide-react';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const TONE_CLASSES: Record<Tone, { ring: string; iconBg: string; iconColor: string }> = {
  neutral: {
    ring: 'ring-neutral-200',
    iconBg: 'bg-neutral-100',
    iconColor: 'text-neutral-600',
  },
  info: {
    ring: 'ring-info-200',
    iconBg: 'bg-info-50',
    iconColor: 'text-info-600',
  },
  success: {
    ring: 'ring-success-200',
    iconBg: 'bg-success-50',
    iconColor: 'text-success-600',
  },
  warning: {
    ring: 'ring-warning-200',
    iconBg: 'bg-warning-50',
    iconColor: 'text-warning-600',
  },
  danger: {
    ring: 'ring-danger-200',
    iconBg: 'bg-danger-50',
    iconColor: 'text-danger-600',
  },
};

export type KpiCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
  /** Si > 0, affiche une pastille "à traiter" indiquant qu'une action admin est attendue. */
  actionRequired?: boolean;
};

/**
 * Story 8.2 — Carte KPI pour le dashboard admin.
 *
 * Pas de couleur sur le chiffre lui-même : le ton sert à hiérarchiser visuellement
 * les cards (warning = ralentir le scan ; danger = action urgente requise).
 */
export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
  hint,
  actionRequired = false,
}: KpiCardProps) {
  const classes = TONE_CLASSES[tone];
  const formatted = new Intl.NumberFormat('fr-FR').format(value);
  return (
    <article
      className={`rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm ring-1 ${classes.ring}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`w-10 h-10 rounded-xl ${classes.iconBg} ${classes.iconColor} flex items-center justify-center`}
        >
          <Icon className="w-5 h-5" strokeWidth={2.25} aria-hidden="true" />
        </span>
        {actionRequired && value > 0 ? (
          <span
            className="text-[10px] font-semibold uppercase tracking-wider text-danger-600 bg-danger-50 px-2 py-1 rounded-md"
            aria-label="Action requise"
          >
            À traiter
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-caption uppercase tracking-wider text-neutral-500 font-semibold">
        {label}
      </p>
      <p
        className="mt-1 text-display-sm font-display font-bold text-neutral-900 tabular-nums"
        aria-live="polite"
      >
        {formatted}
      </p>
      {hint ? <p className="mt-1 text-caption text-neutral-500">{hint}</p> : null}
    </article>
  );
}
