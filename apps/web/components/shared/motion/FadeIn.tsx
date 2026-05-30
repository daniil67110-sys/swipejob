'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

const EASE = [0.22, 1, 0.36, 1] as const;

type FadeInProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  role?: string;
  delay?: number;
  y?: number;
  duration?: number;
  'aria-label'?: string;
};

export function FadeIn({
  children,
  className,
  id,
  role,
  delay = 0,
  y = 16,
  duration = 0.55,
  ...aria
}: FadeInProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <div className={className} id={id} role={role} {...aria}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      className={className}
      id={id}
      role={role}
      {...aria}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
