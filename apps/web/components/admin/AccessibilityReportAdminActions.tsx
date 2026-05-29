'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2 } from 'lucide-react';
import {
  updateReportNotesAction,
  updateReportStatusAction,
} from '@/app/admin/signalements/[id]/actions';
import type { ReportStatus } from '@/lib/admin/accessibility-reports';

type StatusOption = { value: ReportStatus; label: string };
const STATUS_OPTIONS: StatusOption[] = [
  { value: 'open', label: 'Ouvert' },
  { value: 'acknowledged', label: 'Pris en charge' },
  { value: 'resolved', label: 'Résolu' },
  { value: 'wontfix', label: 'Hors scope' },
];

const ERROR_MESSAGES: Record<string, string> = {
  session_invalid: 'Session expirée. Reconnecte-toi.',
  invalid_input: 'Saisie invalide.',
  report_not_found: 'Ce signalement n’existe plus.',
};

function describeError(code: string): string {
  return ERROR_MESSAGES[code] ?? 'Une erreur est survenue.';
}

export type AccessibilityReportAdminActionsProps = {
  reportId: string;
  currentStatus: ReportStatus;
  currentNotes: string | null;
};

export function AccessibilityReportAdminActions({
  reportId,
  currentStatus,
  currentNotes,
}: AccessibilityReportAdminActionsProps) {
  const [status, setStatus] = useState<ReportStatus>(currentStatus);
  const [notes, setNotes] = useState<string>(currentNotes ?? '');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [statusSavedAt, setStatusSavedAt] = useState<number | null>(null);
  const [notesSavedAt, setNotesSavedAt] = useState<number | null>(null);
  const [isStatusPending, startStatusTransition] = useTransition();
  const [isNotesPending, startNotesTransition] = useTransition();

  function handleStatusChange(next: ReportStatus) {
    if (next === status) return;
    setStatusError(null);
    setStatus(next);
    startStatusTransition(async () => {
      const res = await updateReportStatusAction({ reportId, status: next });
      if (!res.ok) {
        setStatusError(describeError(res.error));
        setStatus(currentStatus);
      } else {
        setStatusSavedAt(Date.now());
      }
    });
  }

  function handleNotesSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotesError(null);
    startNotesTransition(async () => {
      const res = await updateReportNotesAction({ reportId, notes });
      if (!res.ok) {
        setNotesError(describeError(res.error));
      } else {
        setNotesSavedAt(Date.now());
      }
    });
  }

  const notesDirty = notes.trim() !== (currentNotes ?? '').trim();

  return (
    <div className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-heading-md font-display font-semibold text-neutral-900">
        Traitement du signalement
      </h2>

      <fieldset className="space-y-2" disabled={isStatusPending}>
        <legend className="text-caption uppercase tracking-wider text-neutral-500 font-semibold">
          Statut
        </legend>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => {
            const isActive = status === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleStatusChange(option.value)}
                aria-pressed={isActive}
                className={`px-3 py-2 rounded-lg text-body-sm font-medium ring-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isActive
                    ? 'bg-neutral-900 text-white ring-transparent'
                    : 'bg-white text-neutral-700 ring-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {option.label}
              </button>
            );
          })}
          {isStatusPending ? (
            <span className="inline-flex items-center gap-1 text-caption text-neutral-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              Enregistrement…
            </span>
          ) : statusSavedAt ? (
            <span
              className="inline-flex items-center gap-1 text-caption text-success-600"
              role="status"
            >
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              Enregistré
            </span>
          ) : null}
        </div>
        {statusError ? (
          <p role="alert" className="text-caption text-danger-700">
            {statusError}
          </p>
        ) : null}
      </fieldset>

      <form onSubmit={handleNotesSubmit} className="space-y-2">
        <label
          htmlFor="admin-notes"
          className="block text-caption uppercase tracking-wider text-neutral-500 font-semibold"
        >
          Notes internes
        </label>
        <textarea
          id="admin-notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={4000}
          rows={5}
          disabled={isNotesPending}
          placeholder="Suivi de résolution, contexte interne, action menée…"
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-info-300 disabled:bg-neutral-50"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!notesDirty || isNotesPending}
            className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-body-sm font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isNotesPending ? 'Enregistrement…' : 'Enregistrer les notes'}
          </button>
          {notesSavedAt && !notesDirty ? (
            <span
              className="inline-flex items-center gap-1 text-caption text-success-600"
              role="status"
            >
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              Notes enregistrées
            </span>
          ) : null}
          <span className="text-caption text-neutral-400 tabular-nums ml-auto">
            {notes.length} / 4000
          </span>
        </div>
        {notesError ? (
          <p role="alert" className="text-caption text-danger-700">
            {notesError}
          </p>
        ) : null}
      </form>
    </div>
  );
}
