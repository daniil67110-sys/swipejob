'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

export function LegalPageView({ page }: { page: string }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      posthog.capture('legal.page_viewed', { page });
    } catch {
      // Posthog might not be initialized (no consent or no key). Silently skip.
    }
  }, [page]);
  return null;
}
