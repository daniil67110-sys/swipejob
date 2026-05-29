'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  CalendarDays,
  Clock,
  Euro,
  GraduationCap,
  Hammer,
  Heart,
  Languages,
  Laptop,
  MapPin,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type PanInfo,
} from 'framer-motion';
import { CompanyLogo } from '@/components/shared/CompanyLogo';
import { undoApplicationAction } from './swipe-actions';
import { MatchExplanationPopover, type MatchReason } from './MatchExplanationPopover';

export type SwipeCardData = {
  id: string;
  title: string;
  description?: string | null;
  companyName: string | null;
  companyLogoUrl?: string | null;
  locationCity: string | null;
  contractType: string | null;
  remoteMode?: string | null;
  salaryMinMonthly: number | null;
  salaryMaxMonthly: number | null;
  startDate?: string | null;
  duration?: string | null;
  publishedAt?: Date | string | null;
  requirements?: {
    skills?: string[];
    educationLevels?: string[];
    languages?: string[];
  } | null;
  sourceUrl: string | null;
  matchScore: number;
  matchReasons: MatchReason[];
};

const SWIPE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 500;

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  if (min && max) return `${min} - ${max} €/mois`;
  return `${min ?? max} €/mois`;
}

function formatDateShort(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatPublishedAgo(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 1) return "Publiée aujourd'hui";
  if (days === 1) return 'Publiée hier';
  if (days < 7) return `Publiée il y a ${days} jours`;
  if (days < 30) return `Publiée il y a ${Math.floor(days / 7)} sem.`;
  return `Publiée il y a ${Math.floor(days / 30)} mois`;
}

function formatRemoteMode(mode: string | null | undefined): string | null {
  if (!mode) return null;
  const lower = mode.toLowerCase();
  if (lower.includes('full') || lower.includes('100')) return 'Télétravail';
  if (lower.includes('partial') || lower.includes('hybrid')) return 'Hybride';
  if (lower.includes('no') || lower.includes('on-site') || lower.includes('on_site'))
    return 'Sur site';
  return mode;
}

export function SwipeCard({
  offer,
  showExplanation,
  onSwipe,
  onShowDetail,
}: {
  offer: SwipeCardData;
  showExplanation: boolean;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  onShowDetail: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-22, 0, 22]);

  // 3D tilt suit le curseur (désactivé pendant le drag)
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const sTiltX = useSpring(tiltX, { stiffness: 180, damping: 18 });
  const sTiltY = useSpring(tiltY, { stiffness: 180, damping: 18 });
  const [isDragging, setIsDragging] = useState(false);

  const passOpacity = useTransform(x, [-160, -40, 0], [1, 0, 0]);
  const applyOpacity = useTransform(x, [0, 40, 160], [0, 0, 1]);
  const saveOpacity = useTransform(y, [-160, -40, 0], [1, 0, 0]);

  const cardScale = useTransform(x, [-200, 0, 200], [1.02, 1, 1.02]);

  function handleMouseMove(e: React.MouseEvent) {
    if (prefersReducedMotion || isDragging) return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    tiltY.set(dx * 6);
    tiltX.set(-dy * 6);
  }

  function handleMouseLeave() {
    tiltX.set(0);
    tiltY.set(0);
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setIsDragging(false);
    const { offset, velocity } = info;
    const swipedUp = offset.y < -SWIPE_THRESHOLD || velocity.y < -VELOCITY_THRESHOLD;
    const swipedLeft = offset.x < -SWIPE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD;
    const swipedRight = offset.x > SWIPE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD;

    if (swipedUp && Math.abs(offset.y) > Math.abs(offset.x)) {
      onSwipe('up');
      return;
    }
    if (swipedLeft) {
      onSwipe('left');
      return;
    }
    if (swipedRight) {
      onSwipe('right');
      return;
    }
  };

  const salary = formatSalary(offer.salaryMinMonthly, offer.salaryMaxMonthly);
  const scorePct = Math.round(offer.matchScore * 100);
  const isStrongMatch = scorePct >= 80;
  const hasScore = scorePct > 0;
  const remoteLabel = formatRemoteMode(offer.remoteMode);
  const publishedAgo = formatPublishedAgo(offer.publishedAt);
  const startDate = formatDateShort(offer.startDate);
  const skills = offer.requirements?.skills?.slice(0, 4) ?? [];
  const educationLevels = offer.requirements?.educationLevels ?? [];
  const languages = offer.requirements?.languages ?? [];

  return (
    <motion.article
      ref={cardRef}
      role="article"
      aria-label={`Offre ${offer.title} chez ${offer.companyName ?? 'entreprise non précisée'}`}
      className="relative select-none touch-pan-y overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.12)]"
      drag={prefersReducedMotion ? false : true}
      dragSnapToOrigin
      dragElastic={0.7}
      onDragStart={() => setIsDragging(true)}
      style={{
        x,
        y,
        rotate,
        rotateX: prefersReducedMotion ? 0 : sTiltX,
        rotateY: prefersReducedMotion ? 0 : sTiltY,
        scale: cardScale,
        transformPerspective: 1200,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onDragEnd={handleDragEnd}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24, mass: 0.8 }}
      whileTap={prefersReducedMotion ? undefined : { cursor: 'grabbing' }}
      whileDrag={{ cursor: 'grabbing' }}
    >
      {/* Bandeau accent top — sobre noir */}
      <div className="h-1 bg-neutral-900" />

      {/* Stamps géants à la Tinder */}
      <motion.div
        style={{ opacity: passOpacity }}
        className="pointer-events-none absolute inset-0 z-20 flex items-start justify-end p-8"
        aria-hidden="true"
      >
        <div
          className="rounded-2xl border-[4px] border-red-500 bg-white/95 px-6 py-3 font-[family-name:var(--font-fraunces)] text-5xl font-extrabold italic uppercase tracking-wider text-red-500 shadow-xl"
          style={{ transform: 'rotate(18deg)' }}
        >
          Nope
        </div>
      </motion.div>
      <motion.div
        style={{ opacity: applyOpacity }}
        className="pointer-events-none absolute inset-0 z-20 flex items-start justify-start p-8"
        aria-hidden="true"
      >
        <div
          className="rounded-2xl border-[4px] border-success-500 bg-white/95 px-6 py-3 font-[family-name:var(--font-fraunces)] text-5xl font-extrabold italic uppercase tracking-wider text-success-600 shadow-xl"
          style={{ transform: 'rotate(-18deg)' }}
        >
          Match
        </div>
      </motion.div>
      <motion.div
        style={{ opacity: saveOpacity }}
        className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center p-8"
        aria-hidden="true"
      >
        <div
          className="rounded-2xl border-[4px] border-primary-500 bg-white/95 px-6 py-3 font-[family-name:var(--font-fraunces)] text-5xl font-extrabold italic uppercase tracking-wider text-primary-600 shadow-xl"
          style={{ transform: 'rotate(-4deg)' }}
        >
          Favori
        </div>
      </motion.div>

      <div className="p-7">
        {/* En-tête : avatar + entreprise + score */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="ring-2 ring-neutral-900 ring-offset-2 ring-offset-white rounded-full">
              <CompanyLogo name={offer.companyName} logoUrl={offer.companyLogoUrl} size="md" />
            </div>
            <div className="min-w-0">
              <p className="text-caption font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Entreprise
              </p>
              <p className="truncate text-body-md font-semibold text-neutral-900">
                {offer.companyName ?? 'Non précisée'}
              </p>
            </div>
          </div>
          {showExplanation && hasScore ? (
            <MatchExplanationPopover score={offer.matchScore} reasons={offer.matchReasons} />
          ) : hasScore ? (
            <div
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-caption font-semibold ${
                isStrongMatch
                  ? 'bg-neutral-900 text-white'
                  : 'border border-neutral-300 bg-white text-neutral-700'
              }`}
              aria-label={`Score de matching : ${scorePct} pourcent`}
            >
              {isStrongMatch ? (
                <Sparkles className="h-3.5 w-3.5 text-primary-400" aria-hidden="true" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {scorePct}% match
            </div>
          ) : (
            <div className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-caption font-semibold text-primary-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />À découvrir
            </div>
          )}
        </div>

        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold leading-[1.1] tracking-tight text-neutral-900">
          {offer.title}
        </h2>
        {publishedAgo ? (
          <p className="mt-2 mb-5 inline-flex items-center gap-1.5 text-caption text-neutral-500">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {publishedAgo}
          </p>
        ) : (
          <div className="mb-5 mt-2" />
        )}

        {/* Chips : palette neutre + accent orange sur contrat */}
        <div className="mb-6 flex flex-wrap gap-2">
          {offer.locationCity ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-body-sm font-medium text-neutral-700">
              <MapPin className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
              {offer.locationCity}
            </span>
          ) : null}
          {remoteLabel ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-body-sm font-medium text-neutral-700">
              <Laptop className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
              {remoteLabel}
            </span>
          ) : null}
          {salary ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-body-sm font-medium text-neutral-700">
              <Euro className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
              {salary}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-neutral-200 bg-white/60 px-3 py-1.5 text-body-sm font-medium text-neutral-400">
              <Euro className="h-3.5 w-3.5" aria-hidden="true" />
              Salaire non communiqué
            </span>
          )}
          {offer.contractType ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-body-sm font-semibold text-primary-700 ring-1 ring-primary-200">
              <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
              {offer.contractType}
            </span>
          ) : null}
          {offer.duration ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-body-sm font-medium text-neutral-700">
              <Clock className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
              {offer.duration}
            </span>
          ) : null}
          {startDate ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-body-sm font-medium text-neutral-700">
              <CalendarDays className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
              Démarre le {startDate}
            </span>
          ) : null}
        </div>

        {skills.length > 0 ? (
          <div className="mb-5">
            <p className="mb-2 inline-flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[0.18em] text-neutral-500">
              <Hammer className="h-3 w-3" aria-hidden="true" />
              Compétences
            </p>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-1 text-caption font-medium text-neutral-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {(educationLevels.length > 0 || languages.length > 0) && (
          <div className="mb-5 grid grid-cols-2 gap-4">
            {educationLevels.length > 0 ? (
              <div>
                <p className="mb-2 inline-flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  <GraduationCap className="h-3 w-3" aria-hidden="true" />
                  Niveau
                </p>
                <p className="text-body-sm font-medium text-neutral-700">
                  {educationLevels.join(' · ')}
                </p>
              </div>
            ) : null}
            {languages.length > 0 ? (
              <div>
                <p className="mb-2 inline-flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  <Languages className="h-3 w-3" aria-hidden="true" />
                  Langues
                </p>
                <p className="text-body-sm font-medium text-neutral-700">{languages.join(' · ')}</p>
              </div>
            ) : null}
          </div>
        )}

        {offer.description ? (
          <div>
            <p className="mb-2 text-caption font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Description
            </p>
            <p className="line-clamp-4 text-body-sm leading-relaxed text-neutral-700">
              {offer.description}
            </p>
            <button
              type="button"
              onClick={onShowDetail}
              className="mt-2 inline-flex items-center gap-1 text-body-sm font-semibold text-neutral-900 underline-offset-4 transition-colors hover:underline"
            >
              Voir l&apos;offre complète →
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onShowDetail}
            className="inline-flex items-center gap-1 text-body-sm font-semibold text-neutral-900 underline-offset-4 transition-colors hover:underline"
          >
            Voir l&apos;offre complète →
          </button>
        )}
      </div>
    </motion.article>
  );
}

export function UndoToast({
  applicationId,
  onDismiss,
}: {
  applicationId: string;
  onDismiss: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (secondsLeft <= 0) {
      onDismiss();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, onDismiss]);

  const handleUndo = () => {
    startTransition(async () => {
      const res = await undoApplicationAction(applicationId);
      if (res.ok) {
        onDismiss();
        router.refresh();
      }
    });
  };

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ y: 100, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 100, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="fixed bottom-28 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-2xl bg-neutral-900 px-5 py-3.5 text-white shadow-2xl lg:left-[calc(50%+128px)]"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600">
        <Heart className="h-3.5 w-3.5 text-white" fill="currentColor" aria-hidden="true" />
      </span>
      <span className="text-body-sm">Candidature envoyée · annulable ({secondsLeft}s)</span>
      <button
        type="button"
        onClick={handleUndo}
        disabled={isPending}
        className="ml-2 text-caption font-semibold text-primary-300 underline-offset-2 hover:text-white hover:underline disabled:opacity-50"
      >
        Annuler
      </button>
    </motion.div>
  );
}
