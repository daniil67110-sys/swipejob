import Link from 'next/link';
import { ArrowLeft, Clock, Download, Mail, ShieldCheck } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { listMyRgpdExportsAction } from './actions';
import { RequestExportButton } from './RequestExportButton';

export const metadata = {
  title: 'Export de mes données — SwipeJob',
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: 'En cours', color: 'bg-warning-100 text-warning-500' },
  completed: { label: 'Prêt', color: 'bg-success-100 text-success-500' },
  failed: { label: 'Échec', color: 'bg-error-100 text-error-500' },
  expired: { label: 'Expiré', color: 'bg-neutral-100 text-neutral-500' },
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
      <Link
        href="/profil/confidentialite"
        className="inline-flex items-center gap-1.5 text-caption font-semibold text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
        Retour à la confidentialité
      </Link>

      <header className="space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-100 text-success-500 text-caption font-semibold tracking-wide">
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          Portabilité RGPD art. 20
        </span>
        <h1 className="text-display-lg font-display font-bold text-neutral-900 leading-[1.05]">
          Exporter mes données
        </h1>
        <p className="text-body-md text-neutral-600">
          Récupère l&apos;ensemble de tes données personnelles : profil, CV, préférences,
          candidatures, swipes, badges, consentements. Format JSON (machine) et PDF (lisible).
        </p>
      </header>

      {/* Request */}
      <section className="relative rounded-2xl bg-white shadow-md overflow-hidden border border-neutral-100">
        <div className="h-1 bg-gradient-to-r from-info-500 to-success-500" />
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InfoTile
              icon={Clock}
              title="Délai"
              text="Quelques minutes à 24h max"
              colorBg="bg-info-100"
              colorText="text-info-500"
            />
            <InfoTile
              icon={Mail}
              title="Livraison"
              text="Email avec liens de download"
              colorBg="bg-primary-100"
              colorText="text-primary-500"
            />
            <InfoTile
              icon={ShieldCheck}
              title="Sécurité"
              text="URLs signées, 7 jours puis purge"
              colorBg="bg-success-100"
              colorText="text-success-500"
            />
          </div>
          <RequestExportButton />
        </div>
      </section>

      {/* History */}
      {items.length > 0 ? (
        <section className="relative rounded-2xl bg-white shadow-sm overflow-hidden border border-neutral-100">
          <div className="h-1 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />
          <div className="p-6 space-y-3">
            <h2 className="text-heading-sm font-semibold text-neutral-900">Mes demandes</h2>
            <ul className="divide-y divide-neutral-100">
              {items.map((item) => {
                const status = STATUS_LABEL[item.status] ?? STATUS_LABEL.pending!;
                return (
                  <li key={item.id} className="py-3 flex items-center justify-between gap-3">
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
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-caption font-semibold ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function InfoTile({
  icon: Icon,
  title,
  text,
  colorBg,
  colorText,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  title: string;
  text: string;
  colorBg: string;
  colorText: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-neutral-50/40 p-4">
      <span
        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${colorBg} ${colorText} mb-2`}
      >
        <Icon className="w-4 h-4" aria-hidden />
      </span>
      <p className="text-caption font-semibold text-neutral-900">{title}</p>
      <p className="text-caption text-neutral-600 mt-0.5">{text}</p>
    </div>
  );
}
