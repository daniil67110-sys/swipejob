import { AlertTriangle, Trash2 } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { DeletionForm } from './DeletionForm';

export default async function SupprimerPage() {
  const session = await requireVerifiedAuth({});
  const email = session.user?.email ?? '';

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 pt-10 pb-24">
      <header className="space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error-100 text-error-500 text-caption font-semibold tracking-wide">
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          Zone dangereuse
        </span>
        <h1 className="text-display-lg font-display font-bold text-neutral-900 leading-[1.05]">
          Supprimer mon compte
        </h1>
        <p className="text-body-md text-neutral-600">
          Cette page te permet de demander la suppression de ton compte SwipeJob et de toutes tes
          données personnelles, conformément au RGPD.
        </p>
      </header>

      <div className="relative rounded-2xl bg-white shadow-md overflow-hidden border border-error-100">
        <div className="h-1.5 bg-gradient-to-r from-error-500 to-warning-500" />
        <div className="p-6">
          <div className="flex items-start gap-3 mb-5">
            <span className="w-10 h-10 rounded-xl bg-error-100 text-error-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-heading-md font-semibold text-neutral-900">
                Cette action est irréversible
              </h2>
              <p className="text-body-sm text-neutral-600 mt-0.5">
                Toutes tes données seront effacées sous 30 jours. Aucune récupération possible.
              </p>
            </div>
          </div>
          <DeletionForm userEmail={email} />
        </div>
      </div>
    </div>
  );
}
