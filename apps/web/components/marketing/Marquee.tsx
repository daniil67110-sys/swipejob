'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

type MarqueeProps = {
  items: ReactNode[];
  durationSec?: number;
  className?: string;
  itemClassName?: string;
};

export function Marquee({ items, durationSec = 28, className, itemClassName }: MarqueeProps) {
  const reduce = useReducedMotion();
  const loop = [...items, ...items];

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent"
      />
      <motion.div
        className="flex w-max items-center gap-12"
        animate={
          reduce
            ? undefined
            : {
                x: ['0%', '-50%'],
              }
        }
        transition={{
          duration: durationSec,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        {loop.map((item, i) => (
          <div key={i} className={itemClassName}>
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
