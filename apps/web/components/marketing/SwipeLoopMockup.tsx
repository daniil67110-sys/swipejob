'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Briefcase, Heart, MapPin, Sparkles } from 'lucide-react';

type DemoOffer = {
  id: string;
  title: string;
  company: string;
  city: string;
  contract: string;
  match: number;
  accent: string;
};

const OFFERS: DemoOffer[] = [
  {
    id: 'a',
    title: 'Développeur fullstack',
    company: 'Doctolib',
    city: 'Paris',
    contract: 'Alternance',
    match: 94,
    accent: 'from-primary-400 to-primary-600',
  },
  {
    id: 'b',
    title: 'Data analyst junior',
    company: 'BlaBlaCar',
    city: 'Paris',
    contract: 'Stage 6 mois',
    match: 88,
    accent: 'from-info-400 to-info-600',
  },
  {
    id: 'c',
    title: 'Product designer',
    company: 'Alan',
    city: 'Lyon',
    contract: 'Alternance',
    match: 91,
    accent: 'from-success-400 to-success-600',
  },
  {
    id: 'd',
    title: 'Chargé marketing',
    company: 'Back Market',
    city: 'Paris',
    contract: 'Alternance',
    match: 86,
    accent: 'from-primary-500 to-info-500',
  },
];

const ROTATE_MS = 3200;

export function SwipeLoopMockup() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const tick = setInterval(() => {
      setShowMatch(true);
      setTimeout(() => setShowMatch(false), 700);
      setIndex((i) => (i + 1) % OFFERS.length);
    }, ROTATE_MS);
    return () => clearInterval(tick);
  }, [reduce]);

  const visibleCards = [0, 1, 2].map((offset) => {
    const offer = OFFERS[(index + offset) % OFFERS.length]!;
    return { offer, offset };
  });

  return (
    <div className="relative mx-auto w-[260px] sm:w-[280px]">
      {/* Phone frame */}
      <div className="relative aspect-[9/19] w-full rounded-[44px] bg-neutral-950 p-2.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)] ring-1 ring-neutral-800">
        {/* Notch */}
        <div className="absolute left-1/2 top-3 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-neutral-950" />
        {/* Screen */}
        <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-gradient-to-b from-neutral-50 to-neutral-100">
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-3 text-[10px] font-semibold text-neutral-700">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
            </span>
          </div>

          {/* App header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <span className="text-[11px] font-bold tracking-tight text-neutral-900">SwipeJob</span>
            <span className="text-[9px] font-medium text-neutral-500">12 / 15</span>
          </div>

          {/* Card stack */}
          <div className="relative mx-3 mt-2 h-[68%]">
            <AnimatePresence initial={false}>
              {visibleCards.map(({ offer, offset }) => {
                const isTop = offset === 0;
                const z = 10 - offset;
                const scale = 1 - offset * 0.05;
                const y = offset * 10;

                return (
                  <motion.div
                    key={`${offer.id}-${index}-${offset}`}
                    initial={isTop ? { x: 0, rotate: 0, opacity: 1 } : { y: y + 10, opacity: 0 }}
                    animate={{ y, scale, opacity: 1, x: 0, rotate: 0 }}
                    exit={
                      isTop
                        ? {
                            x: 320,
                            rotate: 18,
                            opacity: 0,
                            transition: { duration: 0.55, ease: [0.5, 0, 0.75, 0] },
                          }
                        : undefined
                    }
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    style={{ zIndex: z }}
                    className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgb(0,0,0,0.08)] ring-1 ring-neutral-100"
                  >
                    {/* Top visual band */}
                    <div className={`relative h-20 bg-gradient-to-br ${offer.accent}`}>
                      <div className="absolute right-3 top-3 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-bold text-neutral-900">
                        {offer.match}% match
                      </div>
                      <div className="absolute -bottom-5 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[11px] font-bold text-neutral-900 shadow-sm ring-1 ring-neutral-100">
                        {offer.company[0]}
                      </div>
                    </div>
                    <div className="flex-1 p-3 pt-7">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                        {offer.company}
                      </p>
                      <h3 className="mt-0.5 text-[13px] font-bold leading-tight text-neutral-900">
                        {offer.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] text-neutral-600">
                        <span className="inline-flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          {offer.city}
                        </span>
                        <span className="inline-flex items-center gap-0.5">
                          <Briefcase className="h-2.5 w-2.5" />
                          {offer.contract}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5 text-primary-500" />
                        <p className="text-[9px] text-neutral-500">
                          Matche ton CV sur 3 compétences clés
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Match badge overlay */}
            <AnimatePresence>
              {showMatch && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0, rotate: -12 }}
                  animate={{ scale: 1, opacity: 1, rotate: -12 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="pointer-events-none absolute right-3 top-12 z-20 rounded-xl border-2 border-success-500 bg-white px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-success-600 shadow-md"
                >
                  Match
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action bar */}
          <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-neutral-100"
            >
              <span className="text-base font-bold text-neutral-400">×</span>
            </button>
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg ring-1 ring-primary-700/30"
            >
              <Heart className="h-5 w-5 fill-white text-white" />
            </button>
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-neutral-100"
            >
              <span className="text-sm">★</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
