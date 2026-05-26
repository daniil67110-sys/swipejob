'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { BadgeUnlockToast } from './BadgeUnlockToast';
import type { BadgeDef } from '@/lib/badges';

type BadgeUnlockContextValue = {
  /** Appelé par les composants après une server action qui peut débloquer des badges. */
  trigger: (badges: BadgeDef[]) => void;
};

const BadgeUnlockContext = createContext<BadgeUnlockContextValue | null>(null);

export function BadgeUnlockProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<BadgeDef[]>([]);

  const trigger = useCallback((badges: BadgeDef[]) => {
    if (!badges || badges.length === 0) return;
    setPending((prev) => [...prev, ...badges]);
  }, []);

  const handleDone = useCallback(() => {
    setPending([]);
  }, []);

  const value = useMemo(() => ({ trigger }), [trigger]);

  return (
    <BadgeUnlockContext.Provider value={value}>
      {children}
      <BadgeUnlockToast badges={pending} onDone={handleDone} />
    </BadgeUnlockContext.Provider>
  );
}

export function useBadgeUnlock() {
  const ctx = useContext(BadgeUnlockContext);
  if (!ctx) {
    // Côté serveur ou hors-provider — no-op safe pour usages anticipés.
    return { trigger: () => {} };
  }
  return ctx;
}
