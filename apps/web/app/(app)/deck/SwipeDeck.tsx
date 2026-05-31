'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, Heart, PartyPopper, Sparkles, X } from 'lucide-react';
import { SwipeCard, UndoToast, type SwipeCardData } from './SwipeCard';
import { OfferDetailModal } from './OfferDetailModal';
import { swipeOfferAction } from './swipe-actions';
import { MatchCelebration } from './MatchCelebration';
import { useBadgeUnlock } from '@/components/engagement/BadgeUnlockProvider';

export function SwipeDeck({
  offers,
  showExplanation,
  siteUrl,
}: {
  offers: SwipeCardData[];
  showExplanation: boolean;
  siteUrl: string;
}) {
  const router = useRouter();
  const { trigger: triggerBadgeUnlock } = useBadgeUnlock();
  const [index, setIndex] = useState(0);
  const [detailOffer, setDetailOffer] = useState<SwipeCardData | null>(null);
  const [undo, setUndo] = useState<string | null>(null);
  const [celebrationKey, setCelebrationKey] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const total = offers.length;
  const current = offers[index];
  const isFinished = index >= total;

  const handleSwipe = (direction: 'left' | 'right' | 'up') => {
    if (!current) return;
    setError(null);
    if (direction === 'right') {
      setCelebrationKey(Date.now());
      setTimeout(() => setCelebrationKey(null), 1400);
    }
    startTransition(async () => {
      const res = await swipeOfferAction({ offerId: current.id, direction });
      if (!res.ok) {
        setError(res.error.message);
        setCelebrationKey(null);
        return;
      }
      if (res.data.applicationId) setUndo(res.data.applicationId);
      if (res.data.unlockedBadges?.length) triggerBadgeUnlock(res.data.unlockedBadges);
      setIndex((i) => Math.min(i + 1, total));
      startTransition(() => router.refresh());
    });
  };

  // Raccourcis clavier
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSwipe('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSwipe('right');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleSwipe('up');
      } else if (e.key === ' ') {
        e.preventDefault();
        setDetailOffer(current);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current]);

  if (total === 0 || !current) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl border border-neutral-200 bg-white p-14 text-center shadow-sm"
      >
        <motion.div
          animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400"
        >
          <Sparkles className="h-7 w-7" strokeWidth={1.6} aria-hidden="true" />
        </motion.div>
        <p className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold leading-tight text-neutral-900">
          Pas d&apos;offre <span className="italic text-neutral-400">pour le moment</span>
        </p>
        <p className="mt-3 text-body-sm text-neutral-500">
          Reviens dans quelques heures pour découvrir de nouvelles opportunités.
        </p>
      </motion.div>
    );
  }

  if (isFinished) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-white via-[#f7f5f1] to-orange-50 p-14 text-center shadow-sm"
      >
        <motion.div
          animate={{
            rotate: [0, 14, -8, 12, 0],
            scale: [1, 1.15, 1, 1.08, 1],
          }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg"
        >
          <PartyPopper className="h-8 w-8" strokeWidth={2.2} aria-hidden="true" />
        </motion.div>
        <p className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl">
          Deck du jour <span className="italic text-neutral-400">terminé</span>
        </p>
        <p className="mx-auto mt-4 max-w-md text-body-md leading-relaxed text-neutral-600">
          Bravo, tu as parcouru toutes tes offres. Reviens demain pour de nouvelles opportunités —
          ton deck personnalisé t&apos;attend chaque matin.
        </p>
      </motion.div>
    );
  }

  const progressPct = ((index + 1) / total) * 100;
  const remaining = total - index - 1;

  return (
    <>
      <MatchCelebration triggerKey={celebrationKey} />
      <div className="space-y-5 pb-32">
        {/* Progress bar éditoriale */}
        <div className="space-y-2" aria-live="polite">
          <div className="flex items-center justify-between text-caption font-semibold">
            <span className="uppercase tracking-[0.18em] text-neutral-700">
              Carte {index + 1} <span className="text-neutral-400">sur {total}</span>
            </span>
            <span className="text-neutral-400">
              {remaining > 0
                ? `${remaining} restante${remaining > 1 ? 's' : ''}`
                : 'Dernière carte'}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
            <motion.div
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-neutral-900 via-neutral-800 to-orange-500"
              role="progressbar"
              aria-valuenow={index + 1}
              aria-valuemin={1}
              aria-valuemax={total}
              aria-label={`Carte ${index + 1} sur ${total}`}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <SwipeCard
            key={current.id}
            offer={current}
            showExplanation={showExplanation}
            onSwipe={handleSwipe}
            onShowDetail={() => setDetailOffer(current)}
          />
        </AnimatePresence>

        {error ? (
          <p role="alert" aria-live="polite" className="text-center text-caption text-red-500">
            {error}
          </p>
        ) : null}
      </div>

      {/* Boutons d'actions flottants */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 lg:left-64">
        <div className="h-32 bg-gradient-to-t from-[#f7f5f1] via-[#f7f5f1]/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-5 px-6">
          {/* Passer */}
          <motion.button
            type="button"
            onClick={() => handleSwipe('left')}
            disabled={isPending}
            aria-label="Passer cette offre"
            whileHover={{ scale: 1.12, rotate: -6 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-neutral-900 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.25)] ring-2 ring-neutral-200 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-6 w-6" strokeWidth={2.8} aria-hidden="true" />
          </motion.button>

          {/* Favoris */}
          <motion.button
            type="button"
            onClick={() => handleSwipe('up')}
            disabled={isPending}
            aria-label="Ajouter aux favoris"
            whileHover={{ scale: 1.12, y: -3 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-neutral-900 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.18)] ring-2 ring-neutral-200 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Bookmark className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
          </motion.button>

          {/* Candidater — primary */}
          <motion.button
            type="button"
            onClick={() => handleSwipe('right')}
            disabled={isPending}
            aria-label="Candidater"
            whileHover={{ scale: 1.12, rotate: 6 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
            className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-[0_12px_36px_-8px_rgba(251,146,60,0.6)] ring-2 ring-orange-300 transition-shadow hover:shadow-[0_16px_44px_-8px_rgba(251,146,60,0.8)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Heart className="h-7 w-7" fill="currentColor" aria-hidden="true" />
          </motion.button>
        </div>
      </div>

      {detailOffer ? (
        <OfferDetailModal
          offer={detailOffer}
          siteUrl={siteUrl}
          onClose={() => setDetailOffer(null)}
        />
      ) : null}
      <AnimatePresence>
        {undo ? <UndoToast applicationId={undo} onDismiss={() => setUndo(null)} /> : null}
      </AnimatePresence>
    </>
  );
}
