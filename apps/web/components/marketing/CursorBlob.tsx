'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

export function CursorBlob() {
  const reduce = useReducedMotion();
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 60, damping: 22, mass: 0.8 });
  const sy = useSpring(y, { stiffness: 60, damping: 22, mass: 0.8 });

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [reduce, x, y]);

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{
        x: sx,
        y: sy,
        translateX: '-50%',
        translateY: '-50%',
      }}
      className="pointer-events-none fixed left-0 top-0 z-0 hidden h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(251,146,60,0.28),rgba(251,146,60,0.06)_45%,transparent_70%)] blur-2xl lg:block"
    />
  );
}
