'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitBirthDateAction } from './actions';

const MONTHS_FR = [
  'Janv',
  'Févr',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sept',
  'Oct',
  'Nov',
  'Déc',
];
const ITEM_HEIGHT = 40;

type WheelProps = {
  ariaLabel: string;
  items: { label: string; value: number }[];
  selectedIndex: number;
  onIndexChange: (idx: number) => void;
};

function Wheel({ ariaLabel, items, selectedIndex, onIndexChange }: WheelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lastIdxRef = useRef(selectedIndex);
  const rafIdRef = useRef<number | null>(null);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyStyles = useCallback((centerIdx: number) => {
    for (let i = 0; i < itemRefs.current.length; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;
      const dist = Math.abs(i - centerIdx);
      if (dist === 0) {
        el.style.transform = 'scale(1.5)';
        el.style.opacity = '1';
        el.style.color = '#171717';
        el.style.fontWeight = '700';
      } else if (dist === 1) {
        el.style.transform = 'scale(1.15)';
        el.style.opacity = '0.7';
        el.style.color = '#737373';
        el.style.fontWeight = '600';
      } else if (dist === 2) {
        el.style.transform = 'scale(0.95)';
        el.style.opacity = '0.4';
        el.style.color = '#a3a3a3';
        el.style.fontWeight = '500';
      } else {
        el.style.transform = 'scale(0.85)';
        el.style.opacity = '0.2';
        el.style.color = '#a3a3a3';
        el.style.fontWeight = '500';
      }
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = selectedIndex * ITEM_HEIGHT;
    lastIdxRef.current = selectedIndex;
    applyStyles(selectedIndex);
  }, [selectedIndex, applyStyles]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    };
  }, []);

  const handleScroll = () => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      const el = containerRef.current;
      if (!el) return;
      const raw = el.scrollTop / ITEM_HEIGHT;
      const idx = Math.max(0, Math.min(items.length - 1, Math.round(raw)));
      if (idx !== lastIdxRef.current) {
        lastIdxRef.current = idx;
        applyStyles(idx);
      }
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = setTimeout(() => {
        if (idx !== selectedIndex) onIndexChange(idx);
      }, 150);
    });
  };

  const scrollTo = (idx: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
    }
  };

  return (
    <div
      ref={containerRef}
      role="listbox"
      aria-label={ariaLabel}
      tabIndex={0}
      onScroll={handleScroll}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown' && lastIdxRef.current < items.length - 1) {
          e.preventDefault();
          scrollTo(lastIdxRef.current + 1);
        } else if (e.key === 'ArrowUp' && lastIdxRef.current > 0) {
          e.preventDefault();
          scrollTo(lastIdxRef.current - 1);
        }
      }}
      className="wheel-scroll relative overflow-y-scroll rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
      style={{
        scrollSnapType: 'y mandatory',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
        maskImage:
          'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
      }}
    >
      <div style={{ height: ITEM_HEIGHT * 2 }} aria-hidden="true" />
      {items.map((it, i) => (
        <button
          key={it.value}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          type="button"
          role="option"
          aria-selected={i === selectedIndex}
          tabIndex={-1}
          onClick={() => scrollTo(i)}
          style={{
            height: ITEM_HEIGHT,
            scrollSnapAlign: 'center',
            transform: 'scale(1)',
            transformOrigin: 'center',
            transition: 'transform 90ms ease-out, opacity 90ms ease-out, color 90ms ease-out',
            willChange: 'transform, opacity',
          }}
          className="flex w-full items-center justify-center tabular-nums"
        >
          {it.label}
        </button>
      ))}
      <div style={{ height: ITEM_HEIGHT * 2 }} aria-hidden="true" />
    </div>
  );
}

export function BirthDateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const thisYear = new Date().getFullYear();
  const [day, setDay] = useState(15);
  const [month, setMonth] = useState(5);
  const [year, setYear] = useState(thisYear - 22);

  const days = Array.from({ length: 31 }, (_, i) => ({
    label: String(i + 1).padStart(2, '0'),
    value: i + 1,
  }));
  const months = MONTHS_FR.map((m, i) => ({ label: m, value: i }));
  const years = Array.from({ length: 100 }, (_, i) => ({
    label: String(thisYear - i),
    value: thisYear - i,
  }));

  const birth = new Date(year, month, day);
  const dateIsValid =
    birth.getDate() === day && birth.getMonth() === month && birth.getFullYear() === year;
  let age: number | null = null;
  if (dateIsValid) {
    const today = new Date();
    let a = today.getFullYear() - birth.getFullYear();
    const mDiff = today.getMonth() - birth.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) a--;
    age = a;
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!dateIsValid) {
      setServerError('Date invalide');
      return;
    }
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    startTransition(async () => {
      const res = await submitBirthDateAction({ birthDate: iso });
      if (res.ok) {
        router.push(res.data.redirectTo);
      } else {
        setServerError(res.error.message);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <style jsx global>{`
        .wheel-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-900">Date de naissance</label>
        <div className="relative rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div
            className="pointer-events-none absolute left-4 right-4 top-1/2 h-10 -translate-y-1/2 rounded-xl bg-[#f7f5f1] ring-1 ring-neutral-200"
            aria-hidden="true"
          />
          <div className="relative grid h-[200px] grid-cols-3 gap-2">
            <Wheel
              ariaLabel="Jour"
              items={days}
              selectedIndex={day - 1}
              onIndexChange={(idx) => setDay(idx + 1)}
            />
            <Wheel
              ariaLabel="Mois"
              items={months}
              selectedIndex={month}
              onIndexChange={(idx) => setMonth(idx)}
            />
            <Wheel
              ariaLabel="Année"
              items={years}
              selectedIndex={thisYear - year}
              onIndexChange={(idx) => setYear(thisYear - idx)}
            />
          </div>
        </div>
        {dateIsValid && age !== null ? (
          <p className="text-center text-xs font-semibold text-orange-600">
            ✓ {age} ans · {String(day).padStart(2, '0')} {MONTHS_FR[month]} {year}
          </p>
        ) : (
          <p className="text-center text-xs text-red-600">Date invalide</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || !dateIsValid}
        className="flex min-h-[44px] w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {isPending ? 'Validation…' : 'Continuer'}
      </button>

      {serverError ? (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {serverError}
        </div>
      ) : null}
    </form>
  );
}
