import Link from 'next/link';
import { ArrowLeft, Download, Lock, Shield, Trash2 } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { CONSENT_CATALOG, getCurrentConsents } from '@/lib/consents';
import { FadeIn } from '@/components/shared/motion/FadeIn';
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
      <FadeIn>
        <Link
          href="/profil"
          className="inline-flex items-center gap-1.5 text-caption font-semibold text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Retour au profil
        </Link>
      </FadeIn>

      <FadeIn delay={0.05}>
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-caption font-semibold text-neutral-700 ring-1 ring-neutral-200">
            <Shield className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
            Confidentialité
          </span>
          <h1 className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold leading-[1.05] text-neutral-900 sm:text-6xl">
            Mes données & <span className="italic text-neutral-400">consentements</span>
          </h1>
          <p className="text-body-md leading-relaxed text-neutral-600">
            Tu contrôles ce que SwipeJob fait avec tes données. Tout est conforme RGPD.
          </p>
        </header>
      </FadeIn>

      <FadeIn delay={0.15}>
        <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="h-1 bg-neutral-900" />
          <div className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-900 text-white">
                <Lock className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-neutral-900">
                  Mes consentements
                </h2>
                <p className="mt-0.5 text-caption text-neutral-500">
                  Activé / désactivé par finalité, modifiable à tout moment.
                </p>
              </div>
            </div>
            <ConsentToggles catalog={CONSENT_CATALOG} initial={consents} />
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.25}>
        <Link
          href="/profil/confidentialite/export"
          className="group block overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="h-1 bg-neutral-900" />
          <div className="flex items-center gap-3 p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-white">
              <Download className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-body-md font-semibold text-neutral-900">Exporter mes données</p>
              <p className="mt-0.5 text-caption text-neutral-600">
                Récupère ton profil, CV, candidatures et historique au format JSON + PDF (RGPD art.
                20).
              </p>
            </div>
            <ArrowLeft
              className="h-5 w-5 shrink-0 rotate-180 text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-orange-500"
              aria-hidden="true"
            />
          </div>
        </Link>
      </FadeIn>

      <FadeIn delay={0.35}>
        <Link
          href="/profil/supprimer"
          className="group block overflow-hidden rounded-3xl border border-red-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="h-1 bg-red-500" />
          <div className="flex items-center gap-3 p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-200">
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-body-md font-semibold text-neutral-900">Supprimer mon compte</p>
              <p className="mt-0.5 text-caption text-neutral-600">
                Effacement complet sous 30 jours, avec lien de rétractation (RGPD art. 17).
              </p>
            </div>
            <ArrowLeft
              className="h-5 w-5 shrink-0 rotate-180 text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-red-500"
              aria-hidden="true"
            />
          </div>
        </Link>
      </FadeIn>
    </div>
  );
}
