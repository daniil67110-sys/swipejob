import Link from 'next/link';
import { ArrowLeft, Download, Lock, Shield, Trash2 } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { CONSENT_CATALOG, getCurrentConsents } from '@/lib/consents';
import { ConsentToggles } from './ConsentToggles';

export const metadata = {
  title: 'Confidentialité — SwipeJob',
};

export default async function ConfidentialitePage() {
  const session = await requireVerifiedAuth({});
  const userId = session.user?.id;
  if (!userId) return null;

  const consents = await getCurrentConsents(userId);

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6 pb-24">
      <Link
        href="/profil"
        className="inline-flex items-center gap-1.5 text-caption font-semibold text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
        Retour au profil
      </Link>

      {/* Header */}
      <header className="space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-info-100 to-success-100 text-primary-600 text-caption font-semibold tracking-wide">
          <Shield className="w-3.5 h-3.5" aria-hidden="true" />
          Confidentialité
        </span>
        <h1 className="text-display-lg font-display font-bold text-neutral-900 leading-[1.05]">
          Mes données &{' '}
          <span className="bg-gradient-to-r from-info-500 via-primary-500 to-success-500 bg-clip-text text-transparent">
            consentements
          </span>
        </h1>
        <p className="text-body-md text-neutral-600">
          Tu contrôles ce que SwipeJob fait avec tes données. Tout est conforme RGPD.
        </p>
      </header>

      {/* Consents */}
      <section className="relative rounded-2xl bg-white shadow-sm overflow-hidden border border-neutral-100">
        <div className="h-1 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-info-100 text-info-500 flex items-center justify-center">
              <Lock className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-heading-md font-semibold text-neutral-900">Mes consentements</h2>
              <p className="text-caption text-neutral-500 mt-0.5">
                Activé / désactivé par finalité, modifiable à tout moment.
              </p>
            </div>
          </div>
          <ConsentToggles catalog={CONSENT_CATALOG} initial={consents} />
        </div>
      </section>

      {/* Export */}
      <Link
        href="/profil/confidentialite/export"
        className="block relative rounded-2xl bg-white shadow-sm overflow-hidden border border-neutral-100 hover:shadow-md transition-shadow"
      >
        <div className="h-1 bg-gradient-to-r from-info-500 to-success-500" />
        <div className="p-5 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-success-100 text-success-500 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-body-md font-semibold text-neutral-900">Exporter mes données</p>
            <p className="text-caption text-neutral-600 mt-0.5">
              Récupère ton profil, CV, candidatures et historique au format JSON + PDF (RGPD art.
              20).
            </p>
          </div>
          <ArrowLeft className="w-5 h-5 text-neutral-400 shrink-0 rotate-180" aria-hidden="true" />
        </div>
      </Link>

      {/* Delete */}
      <Link
        href="/profil/supprimer"
        className="block relative rounded-2xl bg-white shadow-sm overflow-hidden border border-error-100 hover:shadow-md transition-shadow"
      >
        <div className="h-1 bg-gradient-to-r from-error-500 to-warning-500" />
        <div className="p-5 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-error-100 text-error-500 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-body-md font-semibold text-neutral-900">Supprimer mon compte</p>
            <p className="text-caption text-neutral-600 mt-0.5">
              Effacement complet sous 30 jours, avec lien de rétractation (RGPD art. 17).
            </p>
          </div>
          <ArrowLeft className="w-5 h-5 text-neutral-400 shrink-0 rotate-180" aria-hidden="true" />
        </div>
      </Link>
    </div>
  );
}
