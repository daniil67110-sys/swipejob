'use client';

import { useEffect, useState } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { getAnalyticsConsent } from '@/lib/consent';

type Props = {
  posthogKey: string | undefined;
  posthogHost: string;
  children: React.ReactNode;
};

export function PosthogProvider({ posthogKey, posthogHost, children }: Props) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!posthogKey) return;
    if (typeof window === 'undefined') return;
    if (!getAnalyticsConsent()) return;

    posthog.init(posthogKey, {
      api_host: posthogHost,
      capture_pageview: false,
      autocapture: false,
      person_profiles: 'identified_only',
      disable_session_recording: true,
      loaded: (instance) => {
        if (process.env['NODE_ENV'] === 'development') {
          instance.debug();
        }
      },
    });
    setInitialized(true);
  }, [posthogKey, posthogHost]);

  if (!posthogKey || !initialized) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
