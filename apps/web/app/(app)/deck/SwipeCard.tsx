'use client';

import { useEffect, useState, useTransition } from 'react';
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

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);

  const passOpacity = useTransform(x, [-160, -40, 0], [1, 0, 0]);
  const applyOpacity = useTransform(x, [0, 40, 160], [0, 0, 1]);
  const saveOpacity = useTransform(y, [-160, -40, 0], [1, 0, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
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
      role="article"
      aria-label={`Offre ${offer.title} chez ${offer.companyName ?? 'entreprise non précisée'}`}
      className="relative rounded-2xl bg-white shadow-lg overflow-hidden border border-neutral-100 touch-pan-y select-none"
      drag={prefersReducedMotion ? false : true}
      dragSnapToOrigin
      dragElastic={0.7}
      style={{ x, y, rotate }}
      onDragEnd={handleDragEnd}
      whileTap={prefersReducedMotion ? undefined : { cursor: 'grabbing' }}
      whileDrag={{ cursor: 'grabbing' }}
    >
      {/* Bandeau gradient top */}
      <div className="h-1.5 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />

      {/* Overlays de feedback geste */}
      <motion.div
        style={{ opacity: passOpacity }}
        className="absolute inset-0 z-20 flex items-center justify-center bg-error-500/15 pointer-events-none"
        aria-hidden="true"
      >
        <div className="rounded-2xl border-4 border-error-500 bg-white/95 px-6 py-3 -rotate-12 shadow-xl">
          <span className="text-display-md font-display font-bold text-error-500 tracking-wider">
            PASSER
          </span>
        </div>
      </motion.div>
      <motion.div
        style={{ opacity: applyOpacity }}
        className="absolute inset-0 z-20 flex items-center justify-center bg-success-500/15 pointer-events-none"
        aria-hidden="true"
      >
        <div className="rounded-2xl border-4 border-success-500 bg-white/95 px-6 py-3 rotate-12 shadow-xl">
          <span className="text-display-md font-display font-bold text-success-500 tracking-wider">
            CANDIDATER
          </span>
        </div>
      </motion.div>
      <motion.div
        style={{ opacity: saveOpacity }}
        className="absolute inset-0 z-20 flex items-start justify-center pt-12 bg-info-500/15 pointer-events-none"
        aria-hidden="true"
      >
        <div className="rounded-2xl border-4 border-info-500 bg-white/95 px-6 py-3 shadow-xl">
          <span className="text-display-md font-display font-bold text-info-500 tracking-wider">
            FAVORIS
          </span>
        </div>
      </motion.div>

      <div className="p-7">
        {/* En-tête : avatar + entreprise + score */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <CompanyLogo name={offer.companyName} logoUrl={offer.companyLogoUrl} size="md" />
            <div className="min-w-0">
              <p className="text-caption tracking-wider text-neutral-500 uppercase font-semibold">
                Entreprise
              </p>
              <p className="text-body-md font-semibold text-neutral-900 truncate">
                {offer.companyName ?? 'Non précisée'}
              </p>
            </div>
          </div>
          {showExplanation && hasScore ? (
            <MatchExplanationPopover score={offer.matchScore} reasons={offer.matchReasons} />
          ) : hasScore ? (
            <div
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-caption ${
                isStrongMatch ? 'bg-success-100 text-success-500' : 'bg-info-100 text-info-500'
              }`}
              aria-label={`Score de matching : ${scorePct} pourcent`}
            >
              {isStrongMatch ? (
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {scorePct}% match
            </div>
          ) : (
            <div className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-info-100 to-success-100 text-primary-600 font-semibold text-caption">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />À découvrir
            </div>
          )}
        </div>

        <h2 className="text-display-md font-display font-bold text-neutral-900 leading-tight mb-2">
          {offer.title}
        </h2>
        {publishedAgo ? (
          <p className="text-caption text-neutral-400 mb-5 inline-flex items-center gap-1.5">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {publishedAgo}
          </p>
        ) : (
          <div className="mb-5" />
        )}

        <div className="flex flex-wrap gap-2 mb-5">
          {offer.locationCity ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-info-100 text-info-500 text-body-sm font-semibold">
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
              {offer.locationCity}
            </span>
          ) : null}
          {remoteLabel ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-info-100 text-info-500 text-body-sm font-semibold">
              <Laptop className="w-3.5 h-3.5" aria-hidden="true" />
              {remoteLabel}
            </span>
          ) : null}
          {salary ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-100 text-success-500 text-body-sm font-semibold">
              <Euro className="w-3.5 h-3.5" aria-hidden="true" />
              {salary}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-500 text-body-sm font-medium">
              <Euro className="w-3.5 h-3.5" aria-hidden="true" />
              Salaire non communiqué
            </span>
          )}
          {offer.contractType ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-100 text-primary-500 text-body-sm font-semibold">
              <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
              {offer.contractType}
            </span>
          ) : null}
          {offer.duration ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning-100 text-warning-500 text-body-sm font-semibold">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {offer.duration}
            </span>
          ) : null}
          {startDate ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning-100 text-warning-500 text-body-sm font-semibold">
              <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
              Démarre le {startDate}
            </span>
          ) : null}
        </div>

        {skills.length > 0 ? (
          <div className="mb-5">
            <p className="text-caption tracking-wider text-neutral-500 uppercase font-semibold mb-2 inline-flex items-center gap-1.5">
              <Hammer className="w-3 h-3" aria-hidden="true" />
              Compétences
            </p>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 text-caption font-medium"
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
                <p className="text-caption tracking-wider text-neutral-500 uppercase font-semibold mb-2 inline-flex items-center gap-1.5">
                  <GraduationCap className="w-3 h-3" aria-hidden="true" />
                  Niveau
                </p>
                <p className="text-body-sm text-neutral-700 font-medium">
                  {educationLevels.join(' · ')}
                </p>
              </div>
            ) : null}
            {languages.length > 0 ? (
              <div>
                <p className="text-caption tracking-wider text-neutral-500 uppercase font-semibold mb-2 inline-flex items-center gap-1.5">
                  <Languages className="w-3 h-3" aria-hidden="true" />
                  Langues
                </p>
                <p className="text-body-sm text-neutral-700 font-medium">{languages.join(' · ')}</p>
              </div>
            ) : null}
          </div>
        )}

        {offer.description ? (
          <div>
            <p className="text-caption tracking-wider text-neutral-500 uppercase font-semibold mb-2">
              Description
            </p>
            <p className="text-body-sm text-neutral-700 leading-relaxed line-clamp-4">
              {offer.description}
            </p>
            <button
              type="button"
              onClick={onShowDetail}
              className="text-body-sm font-semibold text-primary-500 hover:text-primary-600 hover:underline mt-2 block"
            >
              Voir l&apos;offre complète →
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onShowDetail}
            className="text-body-sm font-semibold text-primary-500 hover:text-primary-600 hover:underline block"
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
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-28 left-1/2 -translate-x-1/2 lg:left-[calc(50%+128px)] rounded-xl bg-neutral-900 text-white px-5 py-3.5 shadow-xl flex items-center gap-4 z-50"
    >
      <span className="w-7 h-7 rounded-full bg-gradient-to-br from-success-500 to-info-500 flex items-center justify-center shrink-0">
        <Heart className="w-3.5 h-3.5 text-white" fill="currentColor" aria-hidden="true" />
      </span>
      <span className="text-body-sm">Candidature envoyée · annulable ({secondsLeft}s)</span>
      <button
        type="button"
        onClick={handleUndo}
        disabled={isPending}
        className="text-caption font-semibold text-info-100 hover:text-white hover:underline disabled:opacity-50 ml-2"
      >
        Annuler
      </button>
    </div>
  );
}
