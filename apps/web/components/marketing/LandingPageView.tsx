'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

export function LandingPageView() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      posthog.capture('landing.viewed');
    } catch {
      // Posthog might not be initialized yet — ignore.
    }
  }, []);
  return null;
}
