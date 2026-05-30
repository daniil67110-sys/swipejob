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
    <div className="my-6 space-y-3">
      {/* Strictement nécessaires - always on */}
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-neutral-200 bg-[#f7f5f1] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-white">
            <Lock className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-body-md font-semibold text-neutral-900">Strictement nécessaires</p>
            <p className="mt-0.5 text-body-sm text-neutral-600">
              Cookies indispensables au fonctionnement du service (session, sécurité).
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-caption font-semibold text-neutral-700 ring-1 ring-neutral-200">
          <Check className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
          Toujours actif
        </span>
      </div>

      {/* Analytics - toggle */}
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-colors ${
              consent.analytics
                ? 'bg-neutral-900 text-white'
                : 'bg-[#f7f5f1] text-neutral-500 ring-1 ring-neutral-200'
            }`}
          >
            {consent.analytics ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <X className="h-4 w-4" aria-hidden="true" />
            )}
          </span>
          <div>
            <p className="text-body-md font-semibold text-neutral-900">Mesure d&apos;audience</p>
            <p className="mt-0.5 text-body-sm text-neutral-600">
              Statistiques d&apos;usage anonymisées pour améliorer le service (PostHog Cloud EU).
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={consent.analytics}
          onClick={() => update({ ...consent, analytics: !consent.analytics })}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
            consent.analytics ? 'bg-orange-500' : 'bg-neutral-200'
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
          className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2 text-body-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          Tout accepter
        </button>
        <button
          type="button"
          onClick={() => update({ analytics: false })}
          className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-5 py-2 text-body-sm font-semibold text-neutral-700 transition-colors hover:bg-[#f7f5f1]"
        >
          Tout refuser
        </button>
        {savedAt ? (
          <span
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-1 rounded-full bg-[#f7f5f1] px-3 py-1 text-caption font-semibold italic text-neutral-600 ring-1 ring-neutral-200"
          >
            <Check className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
            Préférences enregistrées
          </span>
        ) : null}
      </div>
    </div>
  );
}
