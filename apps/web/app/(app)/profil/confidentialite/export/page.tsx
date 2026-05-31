import Link from 'next/link';
import { ArrowLeft, Clock, Download, Mail, ShieldCheck } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { FadeIn } from '@/components/shared/motion/FadeIn';
import { Stagger } from '@/components/shared/motion/Stagger';
import { listMyRgpdExportsAction } from './actions';
import { RequestExportButton } from './RequestExportButton';

export const metadata = {
  title: 'Export de mes données — SwipeJob',
};

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  completed: 'bg-neutral-900 text-white',
  failed: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  expired: 'bg-[#f7f5f1] text-neutral-500 ring-1 ring-neutral-200',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'En cours',
  completed: 'Prêt',
  failed: 'Échec',
  expired: 'Expiré',
};

function formatDateFr(d: Date | null): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export default async function ExportPage() {
  await requireVerifiedAuth({});
  const res = await listMyRgpdExportsAction();
  const items = res.ok ? res.data.items : [];

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6 pb-24">
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
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-caption font-semibold text-neutral-700 ring-1 ring-neutral-200">
            <Download className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
            Portabilité RGPD art. 20
          </span>
          <h1 className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold leading-[1.05] text-neutral-900 sm:text-6xl">
            Exporter <span className="italic text-neutral-400">mes données</span>
          </h1>
          <p className="text-body-md leading-relaxed text-neutral-600">
            Récupère l&apos;ensemble de tes données personnelles : profil, CV, préférences,
            candidatures, swipes, badges, consentements. Format JSON (machine) et PDF (lisible).
          </p>
        </header>
      </FadeIn>

      <FadeIn delay={0.15}>
        <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="h-1 bg-neutral-900" />
          <div className="space-y-4 p-6">
            <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-3" stagger={0.06}>
              <InfoTile icon={Clock} title="Délai" text="Quelques minutes à 24h max" />
              <InfoTile icon={Mail} title="Livraison" text="Email avec liens de download" />
              <InfoTile
                icon={ShieldCheck}
                title="Sécurité"
                text="URLs signées, 7 jours puis purge"
              />
            </Stagger>
            <RequestExportButton />
          </div>
        </section>
      </FadeIn>

      {items.length > 0 ? (
        <FadeIn delay={0.25}>
          <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <div className="h-1 bg-neutral-900" />
            <div className="space-y-3 p-6">
              <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-neutral-900">
                Mes <span className="italic text-neutral-400">demandes</span>
              </h2>
              <ul className="divide-y divide-neutral-100">
                {items.map((item) => {
                  const statusClass = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending!;
                  const statusLabel = STATUS_LABEL[item.status] ?? STATUS_LABEL.pending!;
                  return (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-body-sm text-neutral-900">
                          Demandé le {formatDateFr(item.requestedAt)}
                        </p>
                        {item.completedAt ? (
                          <p className="text-caption text-neutral-500">
                            Prêt le {formatDateFr(item.completedAt)} · expire le{' '}
                            {formatDateFr(item.expiresAt)}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-caption font-semibold ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </FadeIn>
      ) : null}
    </div>
  );
}

function InfoTile({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f7f5f1] p-4 ring-1 ring-neutral-200">
      <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <p className="text-caption font-semibold text-neutral-900">{title}</p>
      <p className="mt-0.5 text-caption text-neutral-600">{text}</p>
    </div>
  );
}
