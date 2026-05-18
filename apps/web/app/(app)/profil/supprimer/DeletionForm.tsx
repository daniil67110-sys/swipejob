'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { requestAccountDeletionAction } from './actions';

export function DeletionForm({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    startTransition(async () => {
      const res = await requestAccountDeletionAction({ confirmEmail });
      if (res.ok) {
        router.push(res.data.redirectTo);
      } else {
        setServerError(res.error.message);
      }
    });
  };

  if (step === 1) {
    return (
      <div className="space-y-4 rounded-md border border-error-500/40 bg-error-100/30 p-4">
        <h2 className="text-lg font-semibold">Es-tu sûr·e ?</h2>
        <p className="text-sm text-neutral-800">En continuant :</p>
        <ul className="list-disc list-inside text-sm text-neutral-800 space-y-1">
          <li>Ton CV et profil seront marqués pour suppression sous 30 jours (RGPD).</li>
          <li>Tu seras déconnecté·e immédiatement.</li>
          <li>Tes candidatures envoyées restent valides pour les recruteurs déjà contactés.</li>
          <li>Cette action est irréversible passé un délai de 24h.</li>
        </ul>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="rounded-md bg-error-500 px-4 py-3 text-sm font-medium text-white hover:opacity-90 min-h-[44px]"
          >
            Continuer
          </button>
          <a
            href="/profil"
            className="rounded-md border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-50 min-h-[44px]"
          >
            Annuler
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-md border border-error-500/40 bg-error-100/30 p-4"
    >
      <div className="space-y-1">
        <label htmlFor="confirm-email" className="block text-sm font-medium text-neutral-900">
          Pour confirmer, saisis ton email ({userEmail}) :
        </label>
        <input
          id="confirm-email"
          type="email"
          required
          autoComplete="off"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-h-[44px]"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-error-500 px-4 py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]"
        >
          {isPending ? 'Suppression…' : 'Confirmer la suppression'}
        </button>
        <button
          type="button"
          onClick={() => setStep(1)}
          className="rounded-md border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-50 min-h-[44px]"
        >
          Retour
        </button>
      </div>
      {serverError ? (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-md border border-error-500/40 bg-error-100 p-3 text-sm text-error-500"
        >
          {serverError}
        </div>
      ) : null}
    </form>
  );
}
