'use client';

import { motion, useReducedMotion } from 'framer-motion';

type Segment = {
  text: string;
  emphasis?: boolean;
};

type AnimatedWordsProps = {
  segments: Segment[];
  className?: string;
  emphasisClassName?: string;
  mutedClassName?: string;
  delay?: number;
};

export function AnimatedWords({
  segments,
  className,
  emphasisClassName = 'text-neutral-900',
  mutedClassName = 'text-neutral-400',
  delay = 0,
}: AnimatedWordsProps) {
  const reduce = useReducedMotion();

  const words: { text: string; emphasis: boolean; key: string }[] = [];
  segments.forEach((seg, sIdx) => {
    seg.text.split(/\s+/).forEach((w, wIdx) => {
      if (!w) return;
      words.push({ text: w, emphasis: !!seg.emphasis, key: `${sIdx}-${wIdx}` });
    });
  });

  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={w.key}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: delay + i * 0.06,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={`inline-block ${w.emphasis ? emphasisClassName : mutedClassName}`}
        >
          {w.text}
          {i < words.length - 1 && <>&nbsp;</>}
        </motion.span>
      ))}
    </span>
  );
}

export type AnimatedWordsSegment = Segment;
