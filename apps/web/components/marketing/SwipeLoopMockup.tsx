'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Briefcase, Heart, MapPin, Sparkles, X } from 'lucide-react';

type DemoOffer = {
  id: string;
  title: string;
  company: string;
  city: string;
  contract: string;
  match: number;
  accent: string;
  logo: string;
  banner: string;
};

const OFFERS: DemoOffer[] = [
  {
    id: 'doctolib',
    title: 'Développeur fullstack',
    company: 'Doctolib',
    city: 'Paris',
    contract: 'Alternance',
    match: 94,
    accent: 'from-[#0072FF] to-[#0048b3]',
    logo: '/logos/doctolib.png',
    banner: '/banners/doctolib.jpg',
  },
  {
    id: 'blablacar',
    title: 'Data analyst junior',
    company: 'BlaBlaCar',
    city: 'Paris',
    contract: 'Stage 6 mois',
    match: 88,
    accent: 'from-[#00aff5] to-[#0073a8]',
    logo: '/logos/blablacar.png',
    banner: '/banners/blablacar.jpg',
  },
  {
    id: 'alan',
    title: 'Product designer',
    company: 'Alan',
    city: 'Lyon',
    contract: 'Alternance',
    match: 91,
    accent: 'from-[#7b6bff] to-[#5040cc]',
    logo: '/logos/alan.png',
    banner: '/banners/alan.jpg',
  },
  {
    id: 'backmarket',
    title: 'Chargé marketing',
    company: 'Back Market',
    city: 'Paris',
    contract: 'Alternance',
    match: 86,
    accent: 'from-[#76d59b] to-[#3aa66e]',
    logo: '/logos/backmarket.png',
    banner: '/banners/backmarket.jpg',
  },
  {
    id: 'qonto',
    title: 'Customer Success Officer',
    company: 'Qonto',
    city: 'Paris',
    contract: 'CDI Junior',
    match: 89,
    accent: 'from-neutral-700 to-neutral-900',
    logo: '/logos/qonto.png',
    banner: '/banners/qonto.jpg',
  },
];

const ROTATE_MS = 3400;

type SwipeDir = 'right' | 'left';

export function SwipeLoopMockup() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<SwipeDir>('right');
  const [stampVisible, setStampVisible] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const tick = setInterval(() => {
      // Match 75% of the time → mostly LIKE (right), occasional NOPE (left)
      const nextDir: SwipeDir = Math.random() < 0.75 ? 'right' : 'left';
      setDir(nextDir);
      setStampVisible(true);
      setTimeout(() => setStampVisible(false), 800);
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
                const targetScale = 1 - offset * 0.05;
                const targetY = offset * 10;

                const exitX = dir === 'right' ? 360 : -360;
                const exitRotate = dir === 'right' ? 25 : -25;

                return (
                  <motion.div
                    key={`${offer.id}-${index}-${offset}`}
                    initial={
                      isTop
                        ? { x: 0, rotate: 0, opacity: 1 }
                        : { y: targetY + 14, scale: targetScale - 0.04, opacity: 0 }
                    }
                    animate={{
                      y: targetY,
                      scale: targetScale,
                      opacity: 1,
                      x: 0,
                      rotate: 0,
                    }}
                    exit={
                      isTop
                        ? {
                            x: exitX,
                            y: 70,
                            rotate: exitRotate,
                            opacity: 0,
                            transition: {
                              duration: 0.65,
                              ease: [0.45, 0, 0.7, 0],
                            },
                          }
                        : undefined
                    }
                    transition={
                      isTop
                        ? {
                            type: 'spring',
                            stiffness: 200,
                            damping: 18,
                            mass: 0.8,
                          }
                        : {
                            type: 'spring',
                            stiffness: 220,
                            damping: 24,
                            mass: 0.75,
                          }
                    }
                    style={{ zIndex: z }}
                    className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgb(0,0,0,0.10)] ring-1 ring-neutral-100"
                  >
                    {/* Top visual band — banner photo + tinted gradient overlay */}
                    <div className="relative h-20 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={offer.banner}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      {/* Subtle brand-color tint to keep contrast on Match badge */}
                      <div
                        aria-hidden="true"
                        className={`absolute inset-0 bg-gradient-to-br ${offer.accent} mix-blend-multiply opacity-30`}
                      />
                      {/* Darken bottom-right for badge readability */}
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-bl from-black/30 via-transparent to-transparent"
                      />
                      <div className="absolute right-3 top-3 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-bold text-neutral-900 shadow-sm backdrop-blur-sm">
                        {offer.match}% match
                      </div>
                      <div className="absolute -bottom-5 left-3 flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-neutral-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={offer.logo}
                          alt={`${offer.company} logo`}
                          width={36}
                          height={36}
                          className="h-9 w-9 object-contain"
                          loading="lazy"
                          decoding="async"
                        />
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

            {/* Big LIKE / NOPE stamp à la Tinder */}
            <AnimatePresence>
              {stampVisible && (
                <motion.div
                  key={`stamp-${index}-${dir}`}
                  initial={{ scale: 0.3, opacity: 0, rotate: dir === 'right' ? -30 : 30 }}
                  animate={{ scale: [0.3, 1.18, 1], opacity: 1 }}
                  exit={{ scale: 1.3, opacity: 0 }}
                  transition={{ duration: 0.42, ease: [0.34, 1.56, 0.64, 1] }}
                  className={`pointer-events-none absolute top-8 z-30 -translate-y-1 ${
                    dir === 'right' ? 'left-3' : 'right-3'
                  }`}
                >
                  <div
                    className={`rounded-xl border-[3px] px-3 py-1 font-[family-name:var(--font-fraunces)] text-[22px] font-extrabold italic uppercase tracking-wider ${
                      dir === 'right'
                        ? 'border-success-500 text-success-600'
                        : 'border-red-500 text-red-600'
                    }`}
                    style={{
                      transform: `rotate(${dir === 'right' ? -18 : 18}deg)`,
                    }}
                  >
                    {dir === 'right' ? 'Match' : 'Nope'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action bar */}
          <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-4">
            <motion.button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              animate={
                stampVisible && dir === 'left'
                  ? { scale: [1, 1.25, 1], boxShadow: '0 6px 20px rgba(239,68,68,0.4)' }
                  : { scale: 1 }
              }
              transition={{ duration: 0.45 }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-neutral-100"
            >
              <X className="h-4 w-4 text-neutral-400" strokeWidth={2.5} />
            </motion.button>
            <motion.button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              animate={
                stampVisible && dir === 'right'
                  ? { scale: [1, 1.18, 1], boxShadow: '0 8px 24px rgba(251,146,60,0.5)' }
                  : { scale: 1 }
              }
              transition={{ duration: 0.5 }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg ring-1 ring-primary-700/30"
            >
              <Heart className="h-5 w-5 fill-white text-white" />
            </motion.button>
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
