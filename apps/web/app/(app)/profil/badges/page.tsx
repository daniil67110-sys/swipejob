import Link from 'next/link';
import { ArrowLeft, Lock, Trophy } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { listUserBadges, type BadgeDef } from '@/lib/badges';

export const metadata = {
  title: 'Mes badges — SwipeJob',
};

const COLOR_CLASSES: Record<BadgeDef['color'], string> = {
  primary: 'from-primary-500 to-info-500',
  success: 'from-success-500 to-info-500',
  info: 'from-info-500 to-primary-500',
  accent: 'from-accent-500 to-warning-500',
  warning: 'from-warning-500 to-accent-500',
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
      {/* Back */}
      <Link
        href="/profil"
        className="inline-flex items-center gap-1.5 text-caption font-semibold text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
        Retour au profil
      </Link>

      {/* Header */}
      <header className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-accent-500 via-primary-500 to-info-500 text-white p-6">
        <div className="flex items-start gap-4">
          <span className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Trophy className="w-7 h-7" strokeWidth={2.25} aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-caption uppercase tracking-wider font-semibold text-white/85">
              Mes badges
            </p>
            <h1 className="text-display-md font-display font-bold leading-tight">
              {unlockedCount} / {total} débloqué{unlockedCount > 1 ? 's' : ''}
            </h1>
            <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
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

      {/* Unlocked */}
      {unlocked.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-heading-sm font-semibold text-neutral-900">
            Débloqués · {unlocked.length}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unlocked.map((b) => (
              <BadgeCard key={b.code} badge={b} state="unlocked" />
            ))}
          </ul>
        </section>
      ) : null}

      {/* Locked */}
      {locked.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-heading-sm font-semibold text-neutral-900">
            À débloquer · {locked.length}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {locked.map((b) => (
              <BadgeCard key={b.code} badge={b} state="locked" />
            ))}
          </ul>
        </section>
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
  const gradient = COLOR_CLASSES[badge.color];
  return (
    <li
      className={`relative rounded-2xl bg-white shadow-sm overflow-hidden border ${
        state === 'unlocked' ? 'border-neutral-100' : 'border-neutral-100 opacity-70'
      }`}
    >
      <div
        className={`h-1 bg-gradient-to-r ${state === 'unlocked' ? gradient : 'from-neutral-200 to-neutral-300'}`}
      />
      <div className="p-4 flex items-center gap-3">
        <span
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl ${
            state === 'unlocked'
              ? `bg-gradient-to-br ${gradient} text-white shadow-sm`
              : 'bg-neutral-100 text-neutral-400'
          }`}
          aria-hidden="true"
        >
          {state === 'unlocked' ? badge.emoji : <Lock className="w-5 h-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body-sm font-semibold text-neutral-900">{badge.title}</p>
          <p className="text-caption text-neutral-600 line-clamp-2">{badge.description}</p>
          {state === 'unlocked' && badge.unlockedAt ? (
            <p className="text-caption text-neutral-400 mt-1">
              Débloqué le {formatDateFr(badge.unlockedAt)}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}
