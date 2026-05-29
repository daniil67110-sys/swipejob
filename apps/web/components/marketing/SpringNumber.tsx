'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

type SpringNumberProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export function SpringNumber({ children, delay = 0, className }: SpringNumberProps) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      initial={reduce ? false : { scale: 0, rotate: -30, opacity: 0 }}
      whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 14,
        mass: 0.9,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.span>
  );
}
