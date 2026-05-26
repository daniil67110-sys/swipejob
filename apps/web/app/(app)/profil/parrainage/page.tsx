import Link from 'next/link';
import { ArrowLeft, Sparkles, UserCheck, Users } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { env } from '@/lib/env';
import { getOrCreateReferralCode, getReferralStats } from '@/lib/referrals';
import { ReferralShareButtons } from './ReferralShareButtons';

export const metadata = {
  title: 'Inviter mes amis — SwipeJob',
};

export default async function ParrainagePage() {
  const session = await requireVerifiedAuth({});
  const userId = session.user?.id;
  if (!userId) return null;

  const [code, stats] = await Promise.all([
    getOrCreateReferralCode(userId),
    getReferralStats(userId),
  ]);

  const baseUrl = env.SITE_URL.replace(/\/$/, '');
  const url = code ? `${baseUrl}/r/${code}` : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6 pb-24">
      {/* Back */}
      <Link
        href="/profil"
        className="inline-flex items-center gap-1.5 text-caption font-semibold text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
        Retour au profil
      </Link>

      {/* Hero */}
      <header className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-accent-500 via-primary-500 to-info-500 text-white p-6">
        <div className="flex items-start gap-4">
          <span className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Sparkles className="w-7 h-7" strokeWidth={2.25} aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-caption uppercase tracking-wider font-semibold text-white/85">
              Parrainage
            </p>
            <h1 className="text-display-md font-display font-bold leading-tight">
              Invite tes potes
            </h1>
            <p className="text-body-sm text-white/90 mt-1">
              Ton lien unique te suit partout. Plus tu partages, plus la commu grandit.
            </p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Users}
          label="Inscriptions"
          value={stats.totalSignups}
          colorBg="bg-info-100"
          colorText="text-info-500"
        />
        <StatCard
          icon={UserCheck}
          label="Filleuls actifs"
          value={stats.totalValidated}
          colorBg="bg-success-100"
          colorText="text-success-500"
        />
      </section>

      {/* Share */}
      <section className="relative rounded-2xl bg-white shadow-sm overflow-hidden border border-neutral-100">
        <div className="h-1 bg-gradient-to-r from-info-500 via-primary-500 to-accent-500" />
        <div className="p-6 space-y-4">
          <h2 className="text-heading-sm font-semibold text-neutral-900">Mon lien</h2>
          {url && code ? (
            <ReferralShareButtons url={url} code={code} />
          ) : (
            <p className="text-body-sm text-error-500">
              Impossible de générer ton lien pour le moment. Réessaie plus tard.
            </p>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="relative rounded-2xl bg-white shadow-sm overflow-hidden border border-neutral-100">
        <div className="h-1 bg-gradient-to-r from-info-500 to-success-500" />
        <div className="p-6 space-y-3">
          <h2 className="text-heading-sm font-semibold text-neutral-900">Comment ça marche</h2>
          <ol className="space-y-2.5 text-body-sm text-neutral-700">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-info-100 text-info-500 text-caption font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <span>Partage ton lien via WhatsApp, SMS ou email.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-500 text-caption font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <span>Ton pote s&apos;inscrit via ton lien. Le compteur monte.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-success-100 text-success-500 text-caption font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <span>
                Dès qu&apos;il swipe sa première offre, ton parrainage est validé et tu décroches le
                badge <strong>Premier parrainage</strong>.
              </span>
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  colorBg,
  colorText,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  label: string;
  value: number;
  colorBg: string;
  colorText: string;
}) {
  return (
    <div className="relative rounded-2xl bg-white shadow-sm overflow-hidden border border-neutral-100 p-5">
      <div className="flex items-center gap-3">
        <span
          className={`w-11 h-11 rounded-xl ${colorBg} ${colorText} flex items-center justify-center shrink-0`}
        >
          <Icon className="w-5 h-5" aria-hidden />
        </span>
        <div>
          <p className="text-caption text-neutral-500 font-medium">{label}</p>
          <p className="text-display-md font-display font-bold text-neutral-900 leading-none tabular-nums">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
