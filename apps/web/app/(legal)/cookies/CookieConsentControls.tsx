'use client';

import { useEffect, useState } from 'react';
import { Check, Lock, X } from 'lucide-react';

const STORAGE_KEY = 'swipejob_cookie_consent';

type Consent = {
  analytics: boolean;
};

function readConsent(): Consent {
  if (typeof window === 'undefined') return { analytics: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { analytics: false };
    const parsed = JSON.parse(raw) as Partial<Consent>;
    return { analytics: Boolean(parsed.analytics) };
  } catch {
    return { analytics: false };
  }
}

function writeConsent(consent: Consent) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  } catch {
    // ignore quota exceeded
  }
}

export function CookieConsentControls() {
  const [mounted, setMounted] = useState(false);
  const [consent, setConsent] = useState<Consent>({ analytics: false });
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setConsent(readConsent());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const update = (next: Consent) => {
    setConsent(next);
    writeConsent(next);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  };

  return (
    <div className="space-y-3 my-4">
      {/* Strictement nécessaires - always on */}
      <div className="flex items-start justify-between gap-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-lg bg-success-100 text-success-500 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-body-md font-semibold text-neutral-900">Strictement nécessaires</p>
            <p className="text-body-sm text-neutral-600 mt-0.5">
              Cookies indispensables au fonctionnement du service (session, sécurité).
            </p>
          </div>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-success-100 text-success-500 text-caption font-semibold">
          <Check className="w-3.5 h-3.5" aria-hidden="true" />
          Toujours actif
        </span>
      </div>

      {/* Analytics - toggle */}
      <div className="flex items-start justify-between gap-4 rounded-xl border border-neutral-100 bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-lg bg-info-100 text-info-500 flex items-center justify-center shrink-0">
            {consent.analytics ? (
              <Check className="w-4 h-4" aria-hidden="true" />
            ) : (
              <X className="w-4 h-4" aria-hidden="true" />
            )}
          </span>
          <div>
            <p className="text-body-md font-semibold text-neutral-900">Mesure d&apos;audience</p>
            <p className="text-body-sm text-neutral-600 mt-0.5">
              Statistiques d&apos;usage anonymisées pour améliorer le service (PostHog Cloud EU).
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={consent.analytics}
          onClick={() => update({ ...consent, analytics: !consent.analytics })}
          className={`shrink-0 relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
            consent.analytics ? 'bg-gradient-to-r from-info-500 to-primary-500' : 'bg-neutral-200'
          }`}
        >
          <span className="sr-only">Activer la mesure d&apos;audience</span>
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
              consent.analytics ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button
          type="button"
          onClick={() => update({ analytics: true })}
          className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-info-500 to-primary-500 px-4 py-2 text-body-sm font-semibold text-white shadow-sm hover:shadow-md transition-shadow"
        >
          Tout accepter
        </button>
        <button
          type="button"
          onClick={() => update({ analytics: false })}
          className="inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-4 py-2 text-body-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Tout refuser
        </button>
        {savedAt ? (
          <span
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success-100 text-success-500 text-caption font-semibold"
          >
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            Préférences enregistrées
          </span>
        ) : null}
      </div>
    </div>
  );
}
