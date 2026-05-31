import Link from 'next/link';
import { ArrowLeft, Sparkles, UserCheck, Users } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { env } from '@/lib/env';
import { getOrCreateReferralCode, getReferralStats } from '@/lib/referrals';
import { FadeIn } from '@/components/shared/motion/FadeIn';
import { Stagger } from '@/components/shared/motion/Stagger';
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
      <FadeIn>
        <Link
          href="/profil"
          className="inline-flex items-center gap-1.5 text-caption font-semibold text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Retour au profil
        </Link>
      </FadeIn>

      <FadeIn delay={0.1}>
        <header
          className="relative overflow-hidden rounded-3xl p-6 text-white shadow-sm"
          style={{ backgroundColor: '#0D0D14' }}
        >
          <div className="flex items-start gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <Sparkles className="h-7 w-7" strokeWidth={2.25} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-caption font-semibold uppercase tracking-[0.18em] text-white/70">
                Parrainage
              </p>
              <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold leading-tight">
                Invite tes <span className="italic text-white/60">potes</span>
              </h1>
              <p className="mt-1 text-body-sm text-white/85">
                Ton lien unique te suit partout. Plus tu partages, plus la commu grandit.
              </p>
            </div>
          </div>
        </header>
      </FadeIn>

      <Stagger className="grid grid-cols-2 gap-3" stagger={0.08} initialDelay={0.2}>
        <StatCard icon={Users} label="Inscriptions" value={stats.totalSignups} />
        <StatCard icon={UserCheck} label="Filleuls actifs" value={stats.totalValidated} />
      </Stagger>

      <FadeIn delay={0.35}>
        <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="h-1 bg-neutral-900" />
          <div className="space-y-4 p-6">
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-neutral-900">
              Mon <span className="italic text-neutral-400">lien</span>
            </h2>
            {url && code ? (
              <ReferralShareButtons url={url} code={code} />
            ) : (
              <p className="text-body-sm text-red-600">
                Impossible de générer ton lien pour le moment. Réessaie plus tard.
              </p>
            )}
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.45}>
        <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="h-1 bg-neutral-900" />
          <div className="space-y-3 p-6">
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-neutral-900">
              Comment <span className="italic text-neutral-400">ça marche</span>
            </h2>
            <ol className="space-y-2.5 text-body-sm text-neutral-700">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-caption font-bold text-white">
                  1
                </span>
                <span>Partage ton lien via WhatsApp, SMS ou email.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-caption font-bold text-white">
                  2
                </span>
                <span>Ton pote s&apos;inscrit via ton lien. Le compteur monte.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-caption font-bold text-white">
                  3
                </span>
                <span>
                  Dès qu&apos;il swipe sa première offre, ton parrainage est validé et tu décroches
                  le badge <strong>Premier parrainage</strong>.
                </span>
              </li>
            </ol>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  label: string;
  value: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-white">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-neutral-500">
            {label}
          </p>
          <p className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold leading-none tabular-nums text-neutral-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
