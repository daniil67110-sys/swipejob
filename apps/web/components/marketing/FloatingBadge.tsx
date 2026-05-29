'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

type FloatingBadgeProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  floatDelay?: number;
  floatAmplitude?: number;
};

export function FloatingBadge({
  children,
  className,
  delay = 0,
  floatDelay = 0,
  floatAmplitude = 8,
}: FloatingBadgeProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduce ? undefined : { y: -4, scale: 1.03 }}
      className={className}
    >
      <motion.div
        animate={
          reduce
            ? undefined
            : {
                y: [0, -floatAmplitude, 0],
              }
        }
        transition={{
          duration: 4,
          delay: floatDelay,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-neutral-100"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
