'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, ShieldCheck, ShieldOff, UserMinus } from 'lucide-react';
import {
  anonymizeUserAction,
  changeUserRoleAction,
  type ActionResult,
} from '@/app/admin/utilisateurs/[id]/actions';

export type UserAdminActionsProps = {
  userId: string;
  currentRole: 'USER' | 'ADMIN';
  isSelf: boolean;
  isAnonymized: boolean;
  isPurged: boolean;
};

/**
 * Story 8.4 — Section client des actions admin (changer rôle, forcer anonymisation).
 *
 * Confirmation native via `confirm()` pour le changement de rôle. Pour
 * l'anonymisation (irréversible), confirmation par saisie du mot "ANONYMISER"
 * dans un mini-form en bas de la carte.
 */
export function UserAdminActions({
  userId,
  currentRole,
  isSelf,
  isAnonymized,
  isPurged,
}: UserAdminActionsProps) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [confirmation, setConfirmation] = useState('');

  if (isPurged) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
        <p className="text-body-sm text-neutral-600">
          Ce compte a été purgé définitivement. Aucune action possible.
        </p>
      </section>
    );
  }

  if (isSelf) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
        <p className="text-body-sm text-neutral-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning-600" aria-hidden="true" />
          Vous ne pouvez pas modifier votre propre compte depuis le back-office.
        </p>
      </section>
    );
  }

  const targetRole: 'USER' | 'ADMIN' = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';

  const handleRoleChange = () => {
    setFeedback(null);
    const label =
      targetRole === 'ADMIN'
        ? 'Promouvoir cet utilisateur en ADMIN ?'
        : 'Retirer les privilèges ADMIN à cet utilisateur ?';
    if (!window.confirm(label)) return;
    startTransition(async () => {
      const result: ActionResult = await changeUserRoleAction({ userId, role: targetRole });
      if (result.ok) {
        setFeedback({ kind: 'success', text: `Rôle changé en ${targetRole}.` });
      } else {
        setFeedback({ kind: 'error', text: `Échec : ${result.error}` });
      }
    });
  };

  const handleAnonymize = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result: ActionResult = await anonymizeUserAction({ userId, confirmation });
      if (result.ok) {
        setFeedback({
          kind: 'success',
          text: "Anonymisation en file d'attente. Le worker traite dans quelques secondes — rafraîchir la page après.",
        });
        setConfirmation('');
      } else {
        setFeedback({ kind: 'error', text: `Échec : ${result.error}` });
      }
    });
  };

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-6">
      <h2 className="text-heading-sm font-semibold text-neutral-900 uppercase tracking-wider">
        Actions admin
      </h2>

      {/* Action 1 — Changer rôle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-neutral-100">
        <div>
          <p className="text-body-sm font-semibold text-neutral-900">Changer le rôle</p>
          <p className="text-caption text-neutral-500">
            Rôle actuel : <strong>{currentRole}</strong>. Après changement :{' '}
            <strong>{targetRole}</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRoleChange}
          disabled={pending}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-body-sm font-semibold focus:outline-none focus:ring-2 focus:ring-info-300 disabled:opacity-50 ${
            targetRole === 'ADMIN'
              ? 'bg-warning-600 text-white hover:bg-warning-700'
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
          }`}
        >
          {targetRole === 'ADMIN' ? (
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ShieldOff className="w-4 h-4" aria-hidden="true" />
          )}
          {targetRole === 'ADMIN' ? 'Promouvoir admin' : 'Retirer admin'}
        </button>
      </div>

      {/* Action 2 — Forcer anonymisation */}
      <div>
        <p className="text-body-sm font-semibold text-neutral-900">Forcer anonymisation RGPD</p>
        <p className="text-caption text-neutral-500 mt-1">
          Déclenche immédiatement le job d&apos;anonymisation (clear PII, DELETE CVs, purge R2,
          email à l&apos;ancienne adresse). <strong>Irréversible.</strong>
        </p>

        {isAnonymized ? (
          <p className="mt-3 text-body-sm text-neutral-600 italic">
            Cet utilisateur est déjà anonymisé.
          </p>
        ) : (
          <form onSubmit={handleAnonymize} className="mt-3 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder='Tapez "ANONYMISER" pour confirmer'
              autoComplete="off"
              className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-body-sm focus:outline-none focus:ring-2 focus:ring-danger-300"
            />
            <button
              type="submit"
              disabled={pending || confirmation !== 'ANONYMISER'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-body-sm font-semibold bg-danger-600 text-white hover:bg-danger-700 focus:outline-none focus:ring-2 focus:ring-danger-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserMinus className="w-4 h-4" aria-hidden="true" />
              {pending ? 'En cours...' : 'Anonymiser'}
            </button>
          </form>
        )}
      </div>

      {/* Feedback */}
      {feedback ? (
        <p
          className={`text-body-sm ${
            feedback.kind === 'success' ? 'text-success-700' : 'text-danger-700'
          }`}
          role="status"
          aria-live="polite"
        >
          {feedback.text}
        </p>
      ) : null}
    </section>
  );
}
