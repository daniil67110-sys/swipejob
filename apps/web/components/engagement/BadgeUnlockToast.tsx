'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, X } from 'lucide-react';
import type { BadgeDef } from '@/lib/badges';

type Props = {
  badges: BadgeDef[];
  onDone?: () => void;
};

const COLOR_MAP: Record<BadgeDef['color'], { gradient: string; ring: string }> = {
  primary: { gradient: 'from-primary-500 to-info-500', ring: 'ring-primary-200' },
  success: { gradient: 'from-success-500 to-info-500', ring: 'ring-success-200' },
  info: { gradient: 'from-info-500 to-primary-500', ring: 'ring-info-200' },
  accent: { gradient: 'from-accent-500 to-warning-500', ring: 'ring-accent-200' },
  warning: { gradient: 'from-warning-500 to-accent-500', ring: 'ring-warning-200' },
};

const CONFETTI_PARTICLES = 26;
const SHOW_DURATION_MS = 5500;

/**
 * Story 5.2 — affiche une carte célébratoire centrée pendant ~5s pour chaque
 * badge débloqué, accompagnée d'un burst de confettis. Présente dans le layout
 * (app) et alimentée par le hook `useUnlockedBadges` qui collecte les unlocks
 * remontés par les server actions.
 */
export function BadgeUnlockToast({ badges, onDone }: Props) {
  const router = useRouter();
  const [active, setActive] = useState<BadgeDef | null>(null);
  const [queue, setQueue] = useState<BadgeDef[]>(badges);

  useEffect(() => {
    setQueue((q) => [...q, ...badges]);
  }, [badges]);

  useEffect(() => {
    if (active) return;
    if (queue.length === 0) {
      onDone?.();
      return;
    }
    const [next, ...rest] = queue;
    setActive(next ?? null);
    setQueue(rest);
    const timer = setTimeout(() => {
      setActive(null);
      router.refresh();
    }, SHOW_DURATION_MS);
    return () => clearTimeout(timer);
  }, [active, queue, onDone, router]);

  if (!active) return null;
  const palette = COLOR_MAP[active.color];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-20 z-[80] flex justify-center pointer-events-none"
    >
      <AnimatePresence>
        <motion.div
          key={active.code}
          initial={{ opacity: 0, y: -30, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="pointer-events-auto relative max-w-sm w-[calc(100vw-2rem)]"
        >
          <ConfettiBurst color={active.color} />

          <Link
            href="/profil/badges"
            onClick={() => setActive(null)}
            className={`relative block rounded-2xl bg-white shadow-2xl ring-2 ${palette.ring} overflow-hidden`}
          >
            <div className={`h-1.5 bg-gradient-to-r ${palette.gradient}`} />
            <div className="p-5 flex items-center gap-4">
              <span
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${palette.gradient} text-white text-2xl flex items-center justify-center shadow-md shrink-0`}
                aria-hidden="true"
              >
                {active.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-caption uppercase tracking-wider font-semibold text-neutral-500 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-warning-500" aria-hidden="true" />
                  Badge débloqué
                </p>
                <p className="text-heading-md font-semibold text-neutral-900 leading-tight">
                  {active.title}
                </p>
                <p className="text-caption text-neutral-600 mt-0.5">{active.description}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setActive(null);
                }}
                aria-label="Fermer"
                className="shrink-0 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** UX-DR10 — ConfettiBurst minimaliste sans dep externe (Framer Motion only). */
function ConfettiBurst({ color }: { color: BadgeDef['color'] }) {
  const palette =
    color === 'success'
      ? ['#1FB87A', '#3998FF', '#FFA940']
      : color === 'accent'
        ? ['#FF7B5A', '#FFA940', '#4F5BFF']
        : color === 'warning'
          ? ['#FFA940', '#FF7B5A', '#3998FF']
          : ['#4F5BFF', '#3998FF', '#1FB87A'];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" aria-hidden="true">
      {Array.from({ length: CONFETTI_PARTICLES }).map((_, i) => {
        const angle = (i / CONFETTI_PARTICLES) * Math.PI * 2;
        const distance = 80 + Math.random() * 80;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        const bg = palette[i % palette.length];
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
            animate={{
              x: dx,
              y: dy,
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1, 1, 0.5],
              rotate: Math.random() * 360,
            }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 w-2 h-2 rounded-sm"
            style={{ backgroundColor: bg }}
          />
        );
      })}
    </div>
  );
}
