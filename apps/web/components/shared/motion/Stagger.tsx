'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Children, type HTMLAttributes, type ReactNode } from 'react';

const EASE = [0.22, 1, 0.36, 1] as const;

const container = (stagger: number, initialDelay: number): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: initialDelay } },
});

const item = (y: number): Variants => ({
  hidden: { opacity: 0, y },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
});

type StaggerProps = {
  children: ReactNode;
  className?: string;
  /** Délai entre chaque enfant (en s). */
  stagger?: number;
  /** Décalage Y initial des enfants. */
  y?: number;
  /** Délai avant que le premier enfant démarre. */
  initialDelay?: number;
  /** Tag HTML du conteneur ('div' | 'ul' | 'ol'). */
  as?: 'div' | 'ul' | 'ol';
  /** Aria label si nécessaire. */
  'aria-label'?: string;
};

/**
 * Anime ses enfants directs en cascade. Chaque enfant est wrappé dans un
 * motion.div (ou motion.li si as='ul'/'ol') qui hérite des variants.
 */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  y = 14,
  initialDelay = 0,
  as = 'div',
  ...rest
}: StaggerProps) {
  const reduce = useReducedMotion();
  const items = Children.toArray(children);

  if (reduce) {
    const staticProps = { className, ...(rest as HTMLAttributes<HTMLElement>) };
    if (as === 'ul') return <ul {...staticProps}>{children}</ul>;
    if (as === 'ol') return <ol {...staticProps}>{children}</ol>;
    return <div {...staticProps}>{children}</div>;
  }

  const itemVariant = item(y);
  const containerVariant = container(stagger, initialDelay);

  if (as === 'ul') {
    return (
      <motion.ul
        className={className}
        variants={containerVariant}
        initial="hidden"
        animate="show"
        {...rest}
      >
        {items.map((child, i) => (
          <motion.li key={i} variants={itemVariant}>
            {child}
          </motion.li>
        ))}
      </motion.ul>
    );
  }
  if (as === 'ol') {
    return (
      <motion.ol
        className={className}
        variants={containerVariant}
        initial="hidden"
        animate="show"
        {...rest}
      >
        {items.map((child, i) => (
          <motion.li key={i} variants={itemVariant}>
            {child}
          </motion.li>
        ))}
      </motion.ol>
    );
  }
  return (
    <motion.div
      className={className}
      variants={containerVariant}
      initial="hidden"
      animate="show"
      {...rest}
    >
      {items.map((child, i) => (
        <motion.div key={i} variants={itemVariant}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
