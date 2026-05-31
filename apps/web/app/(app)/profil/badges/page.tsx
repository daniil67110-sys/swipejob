import Link from 'next/link';
import { ArrowLeft, Lock, Trophy } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { listUserBadges, type BadgeDef } from '@/lib/badges';
import { FadeIn } from '@/components/shared/motion/FadeIn';
import { Stagger } from '@/components/shared/motion/Stagger';

export const metadata = {
  title: 'Mes badges — SwipeJob',
};

function formatDateFr(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export default async function BadgesPage() {
  const session = await requireVerifiedAuth({});
  const userId = session.user?.id;
  if (!userId) return null;

  const badges = await listUserBadges(userId);
  const unlocked = badges.filter((b) => b.unlockedAt !== null);
  const locked = badges.filter((b) => b.unlockedAt === null);
  const unlockedCount = unlocked.length;
  const total = badges.length;
  const pct = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 pb-24">
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
              <Trophy className="h-7 w-7" strokeWidth={2.25} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-caption font-semibold uppercase tracking-[0.18em] text-white/70">
                Mes badges
              </p>
              <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold leading-tight">
                {unlockedCount} / {total}{' '}
                <span className="italic text-white/60">débloqué{unlockedCount > 1 ? 's' : ''}</span>
              </h1>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <div
                  className="h-full rounded-full bg-orange-500 transition-all"
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={unlockedCount}
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-label={`${pct}% de badges débloqués`}
                />
              </div>
            </div>
          </div>
        </header>
      </FadeIn>

      {unlocked.length > 0 ? (
        <FadeIn delay={0.2}>
          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-neutral-900">
              Débloqués <span className="italic text-neutral-400">· {unlocked.length}</span>
            </h2>
            <Stagger as="ul" className="grid grid-cols-1 gap-3 sm:grid-cols-2" stagger={0.05}>
              {unlocked.map((b) => (
                <BadgeCard key={b.code} badge={b} state="unlocked" />
              ))}
            </Stagger>
          </section>
        </FadeIn>
      ) : null}

      {locked.length > 0 ? (
        <FadeIn delay={0.3}>
          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-neutral-900">
              À débloquer <span className="italic text-neutral-400">· {locked.length}</span>
            </h2>
            <Stagger as="ul" className="grid grid-cols-1 gap-3 sm:grid-cols-2" stagger={0.04}>
              {locked.map((b) => (
                <BadgeCard key={b.code} badge={b} state="locked" />
              ))}
            </Stagger>
          </section>
        </FadeIn>
      ) : null}
    </div>
  );
}

function BadgeCard({
  badge,
  state,
}: {
  badge: BadgeDef & { unlockedAt: Date | null };
  state: 'locked' | 'unlocked';
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        state === 'unlocked' ? 'border-neutral-200' : 'border-neutral-200 opacity-60'
      }`}
    >
      <div className={`h-1 ${state === 'unlocked' ? 'bg-orange-500' : 'bg-neutral-200'}`} />
      <div className="flex items-center gap-3 p-4">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${
            state === 'unlocked'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'bg-[#f7f5f1] text-neutral-400 ring-1 ring-neutral-200'
          }`}
          aria-hidden="true"
        >
          {state === 'unlocked' ? badge.emoji : <Lock className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body-sm font-semibold text-neutral-900">{badge.title}</p>
          <p className="line-clamp-2 text-caption text-neutral-600">{badge.description}</p>
          {state === 'unlocked' && badge.unlockedAt ? (
            <p className="mt-1 text-caption text-neutral-400">
              Débloqué le {formatDateFr(badge.unlockedAt)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
