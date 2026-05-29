'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

type CountUpProps = {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
  className?: string;
};

function defaultFormat(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}

export function CountUp({
  to,
  duration = 1.6,
  prefix = '',
  suffix = '',
  format = defaultFormat,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {format(value)}
      {suffix}
    </span>
  );
}
