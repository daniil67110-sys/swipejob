'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const COLORS = ['#fb923c', '#f97316', '#fdba74', '#0f172a', '#22c55e', '#ffffff'];
const PARTICLE_COUNT = 36;

type Particle = {
  id: number;
  angle: number;
  distance: number;
  rotate: number;
  size: number;
  color: string;
  shape: 'square' | 'circle' | 'bar';
  delay: number;
};

function buildParticles(seed: number): Particle[] {
  const rand = (i: number) => {
    const x = Math.sin(seed * 9999 + i * 137) * 10000;
    return x - Math.floor(x);
  };
  return Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
    id: i,
    angle: (i / PARTICLE_COUNT) * Math.PI * 2 + rand(i) * 0.4,
    distance: 160 + rand(i + 1) * 200,
    rotate: rand(i + 2) * 720 - 360,
    size: 6 + Math.floor(rand(i + 3) * 10),
    color: COLORS[Math.floor(rand(i + 4) * COLORS.length)]!,
    shape: (['square', 'circle', 'bar'] as const)[Math.floor(rand(i + 5) * 3)]!,
    delay: rand(i + 6) * 0.1,
  }));
}

type MatchCelebrationProps = {
  triggerKey: number | null;
};

export function MatchCelebration({ triggerKey }: MatchCelebrationProps) {
  const reduce = useReducedMotion();
  const particles = useMemo(() => (triggerKey ? buildParticles(triggerKey) : []), [triggerKey]);

  return (
    <AnimatePresence>
      {triggerKey !== null && (
        <motion.div
          key={triggerKey}
          aria-hidden="true"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Particles */}
          {!reduce &&
            particles.map((p) => {
              const tx = Math.cos(p.angle) * p.distance;
              const ty = Math.sin(p.angle) * p.distance;
              const shapeClass =
                p.shape === 'circle'
                  ? 'rounded-full'
                  : p.shape === 'bar'
                    ? 'rounded-sm'
                    : 'rounded-[2px]';
              const width = p.shape === 'bar' ? p.size * 1.6 : p.size;
              const height = p.shape === 'bar' ? p.size * 0.5 : p.size;
              return (
                <motion.span
                  key={p.id}
                  className={`absolute ${shapeClass}`}
                  style={{
                    width,
                    height,
                    backgroundColor: p.color,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  }}
                  initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
                  animate={{
                    x: tx,
                    y: ty,
                    scale: [0, 1, 0.8],
                    rotate: p.rotate,
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 1.2,
                    delay: p.delay,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              );
            })}

          {/* Center burst */}
          <motion.div
            initial={reduce ? false : { scale: 0, rotate: -10, opacity: 0 }}
            animate={{ scale: [0.3, 1.15, 1], rotate: 0, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-3 rounded-3xl bg-white/95 px-8 py-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] ring-1 ring-neutral-200 backdrop-blur"
          >
            <motion.span
              animate={
                reduce
                  ? undefined
                  : {
                      rotate: [0, 12, -12, 0],
                      scale: [1, 1.15, 1],
                    }
              }
              transition={{ duration: 0.8, ease: 'easeInOut', repeat: 1 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-md"
            >
              <Sparkles className="h-7 w-7" strokeWidth={2.2} />
            </motion.span>
            <p className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold italic leading-none text-neutral-900">
              Candidature envoyée !
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
