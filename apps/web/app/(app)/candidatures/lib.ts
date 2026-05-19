/**
 * Helpers partagés pour le dashboard candidatures (Story 4.1/4.2/4.3).
 */

export type ApplicationStatus =
  | 'pending_letter'
  | 'letter_generated'
  | 'pending_review'
  | 'sent'
  | 'cancelled_by_user'
  | 'failed'
  | 'read'
  | 'replied'
  | 'interview_scheduled'
  | 'signed'
  | 'rejected';

export type ManualStatus = Exclude<
  ApplicationStatus,
  'pending_letter' | 'letter_generated' | 'pending_review' | 'failed' | 'cancelled_by_user'
>;

export const MANUAL_STATUSES: ReadonlyArray<ManualStatus> = [
  'sent',
  'read',
  'replied',
  'interview_scheduled',
  'signed',
  'rejected',
];

const LABELS: Record<ApplicationStatus, string> = {
  pending_letter: 'En préparation',
  letter_generated: 'Lettre prête',
  pending_review: 'À relire',
  sent: 'Envoyée',
  cancelled_by_user: 'Annulée',
  failed: 'Échec',
  read: 'Lue',
  replied: 'Réponse reçue',
  interview_scheduled: 'Entretien planifié',
  signed: 'Signature 🎉',
  rejected: 'Refusée',
};

export function statusLabel(s: ApplicationStatus): string {
  return LABELS[s] ?? s;
}

/**
 * Couleurs sémantiques (mapping vers nos variants Badge).
 * default = primary, secondary = neutre, destructive = rouge, outline = bordure simple.
 */
export function statusBadgeVariant(
  s: ApplicationStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (s) {
    case 'signed':
    case 'interview_scheduled':
    case 'replied':
      return 'default';
    case 'sent':
    case 'read':
      return 'outline';
    case 'rejected':
    case 'failed':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function formatDateFr(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
