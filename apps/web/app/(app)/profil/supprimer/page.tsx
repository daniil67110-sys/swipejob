import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Trash2 } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { FadeIn } from '@/components/shared/motion/FadeIn';
import { DeletionForm } from './DeletionForm';

export default async function SupprimerPage() {
  const session = await requireVerifiedAuth({});
  const email = session.user?.email ?? '';

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 pt-10 pb-24">
      <FadeIn>
        <Link
          href="/profil/confidentialite"
          className="inline-flex items-center gap-1.5 text-caption font-semibold text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Retour à la confidentialité
        </Link>
      </FadeIn>

      <FadeIn delay={0.05}>
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-caption font-semibold text-red-700 ring-1 ring-red-200">
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Zone dangereuse
          </span>
          <h1 className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold leading-[1.05] text-neutral-900 sm:text-6xl">
            Supprimer <span className="italic text-neutral-400">mon compte</span>
          </h1>
          <p className="text-body-md leading-relaxed text-neutral-600">
            Cette page te permet de demander la suppression de ton compte SwipeJob et de toutes tes
            données personnelles, conformément au RGPD.
          </p>
        </header>
      </FadeIn>

      <FadeIn delay={0.15}>
        <div className="relative overflow-hidden rounded-3xl border border-red-200 bg-white shadow-sm">
          <div className="h-1 bg-red-500" />
          <div className="p-6">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-200">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-neutral-900">
                  Cette action est <span className="italic text-red-600">irréversible</span>
                </h2>
                <p className="mt-0.5 text-body-sm text-neutral-600">
                  Toutes tes données seront effacées sous 30 jours. Aucune récupération possible.
                </p>
              </div>
            </div>
            <DeletionForm userEmail={email} />
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
