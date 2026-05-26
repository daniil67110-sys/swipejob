'use client';

import { useEffect, useState, useTransition } from 'react';
import { Flame, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { getMyStreakAction, trackStreakViewedAction } from '@/app/(app)/engagement-actions';
import type { StreakData } from '@/lib/streaks';

const HEATMAP_WEEKS = 12;
const HEATMAP_DAYS = HEATMAP_WEEKS * 7;
const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const NEXT_MILESTONES = [
  { threshold: 7, label: 'Streak 7 jours' },
  { threshold: 30, label: 'Streak 30 jours' },
  { threshold: 100, label: 'Streak 100 jours' },
];

type Props = {
  initial?: StreakData | null;
};

export function DailyStreak({ initial }: Props) {
  const [data, setData] = useState<StreakData | null>(initial ?? null);
  const [open, setOpen] = useState(false);
  const [, startLoad] = useTransition();

  useEffect(() => {
    if (data) return;
    startLoad(async () => {
      const res = await getMyStreakAction();
      if (res.ok) setData(res.data);
    });
  }, [data]);

  if (!data || data.current === 0) return null;

  const tone = data.current >= 30 ? 'high' : data.current >= 7 ? 'mid' : 'low';
  const chipClasses =
    tone === 'high'
      ? 'bg-gradient-to-r from-primary-500 to-info-500 text-white shadow-md shadow-primary-500/30 animate-pulse'
      : tone === 'mid'
        ? 'bg-gradient-to-r from-accent-500 to-warning-500 text-white shadow-sm'
        : 'bg-neutral-100 text-neutral-700';

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          void trackStreakViewedAction({ current: data.current });
        }
      }}
    >
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={`Streak ${data.current} jours`}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-caption transition-transform hover:scale-105 active:scale-95 ${chipClasses}`}
        >
          <Flame className="w-3.5 h-3.5" aria-hidden="true" strokeWidth={2.5} />
          <span className="tabular-nums">{data.current}j</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl p-0 border-t border-neutral-100">
        <StreakSheetContent data={data} onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

function StreakSheetContent({ data, onClose }: { data: StreakData; onClose: () => void }) {
  const cells = buildHeatmapCells(data);
  const nextMilestone = NEXT_MILESTONES.find((m) => m.threshold > data.current);
  const remaining = nextMilestone ? nextMilestone.threshold - data.current : 0;

  return (
    <div className="space-y-5 pb-2">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-accent-500 via-primary-500 to-info-500 px-6 pt-6 pb-8 text-white rounded-t-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
        </button>
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6" strokeWidth={2.25} aria-hidden="true" />
          </span>
          <div>
            <SheetTitle asChild>
              <p className="text-display-md font-display font-bold leading-none">
                {data.current} jour{data.current > 1 ? 's' : ''}
              </p>
            </SheetTitle>
            <p className="text-body-sm text-white/85 mt-0.5">
              {data.current >= 30
                ? 'Tu es en feu, continue comme ça.'
                : data.current >= 7
                  ? 'Belle régularité — on s’accroche.'
                  : 'Reviens demain pour faire grandir ton streak.'}
            </p>
          </div>
        </div>

        {nextMilestone ? (
          <div className="mt-5 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
            <span className="text-caption text-white/85 font-medium">
              Prochain jalon : {nextMilestone.label}
            </span>
            <span className="text-body-sm font-bold tabular-nums">J-{remaining}</span>
          </div>
        ) : null}
      </div>

      {/* Heatmap */}
      <div className="px-6 space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-heading-sm font-semibold text-neutral-900">
            Activité — {HEATMAP_WEEKS} dernières semaines
          </h3>
          <span className="text-caption text-neutral-500 tabular-nums">
            Record : {data.longest}j
          </span>
        </div>
        <div className="flex gap-1.5">
          {/* Day labels */}
          <div className="flex flex-col justify-between text-[10px] text-neutral-400 font-medium pt-1 pb-1">
            {DAY_LABELS.map((d, i) => (
              <span key={i} aria-hidden="true">
                {d}
              </span>
            ))}
          </div>
          {/* Grid columns by week */}
          <div className="flex-1 grid grid-flow-col gap-1" style={{ gridAutoColumns: '1fr' }}>
            {Array.from({ length: HEATMAP_WEEKS }).map((_, weekIdx) => (
              <div key={weekIdx} className="grid grid-rows-7 gap-1">
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const cell = cells[weekIdx * 7 + dayIdx];
                  if (!cell)
                    return <div key={dayIdx} aria-hidden="true" className="aspect-square" />;
                  return (
                    <div
                      key={dayIdx}
                      title={`${cell.date} — ${cell.active ? 'Actif' : 'Inactif'}`}
                      aria-label={`${cell.date} ${cell.active ? 'Actif' : 'Inactif'}`}
                      className={`aspect-square rounded-[3px] ${
                        cell.active
                          ? 'bg-gradient-to-br from-accent-500 to-primary-500 shadow-sm'
                          : 'bg-neutral-100'
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 text-[10px] text-neutral-400 font-medium">
          <span>Inactif</span>
          <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-100" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-gradient-to-br from-accent-500 to-primary-500" />
          <span>Actif</span>
        </div>
      </div>
    </div>
  );
}

type HeatmapCell = { date: string; active: boolean };

function buildHeatmapCells(data: StreakData): Array<HeatmapCell | null> {
  const activeSet = new Set(data.activeDays);
  const cells: Array<HeatmapCell | null> = [];
  const start = parseISODate(data.windowStart);
  const end = parseISODate(data.windowEnd);
  // On affiche du jour le plus ancien (semaine la plus à gauche, lundi top)
  // jusqu'au jour le plus récent (semaine de droite, jour en cours en bas).
  // Pour aligner sur lundi = top : on ajuste le démarrage au lundi précédent.
  const startMondayOffset = (start.getUTCDay() + 6) % 7; // 0 = lundi
  const gridStart = addDays(start, -startMondayOffset);
  for (let i = 0; i < HEATMAP_DAYS; i++) {
    const d = addDays(gridStart, i);
    const iso = toISO(d);
    if (d < start) {
      cells.push(null);
      continue;
    }
    if (d > end) {
      cells.push(null);
      continue;
    }
    cells.push({ date: iso, active: activeSet.has(iso) });
  }
  return cells;
}

function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + n);
  return next;
}

function toISO(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
