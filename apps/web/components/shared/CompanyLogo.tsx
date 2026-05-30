'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';

function guessDomain(name: string, tld: string = 'com'): string {
  const clean = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\b(sa|sas|sarl|eurl|sasu|scp|snc|gie|sci|spa|ag|gmbh|inc|corp|ltd|llc|plc)\b/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
  return `${clean}.${tld}`;
}

function getCompanyInitial(name: string | null | undefined): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  return trimmed.charAt(0).toUpperCase();
}

const SIZE_CLASSES = {
  sm: 'w-9 h-9 text-base',
  md: 'w-12 h-12 text-lg',
  lg: 'w-16 h-16 text-2xl',
} as const;

const ICON_SIZES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
} as const;

export function CompanyLogo({
  name,
  logoUrl,
  size = 'md',
  className = '',
}: {
  name: string | null | undefined;
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const [attempt, setAttempt] = useState(0);

  const initial = getCompanyInitial(name);
  const sizeClass = SIZE_CLASSES[size];
  const iconClass = ICON_SIZES[size];

  // Clearbit Logo API a fermé (HubSpot rachat). On utilise Google Favicon API
  // qui est public et fiable. Fallback en cascade : logoUrl explicite → .com →
  // .fr → placeholder éditorial noir+initiale.
  const candidates: string[] = [];
  if (logoUrl) candidates.push(logoUrl);
  if (name) {
    candidates.push(`https://www.google.com/s2/favicons?domain=${guessDomain(name, 'com')}&sz=128`);
    candidates.push(`https://www.google.com/s2/favicons?domain=${guessDomain(name, 'fr')}&sz=128`);
  }

  const currentUrl = candidates[attempt];

  if (!currentUrl) {
    return (
      <div
        className={`${sizeClass} flex shrink-0 items-center justify-center rounded-xl bg-neutral-900 font-[family-name:var(--font-fraunces)] font-semibold italic text-white shadow-sm ${className}`}
        aria-hidden="true"
      >
        {initial ?? <Building2 className={iconClass} strokeWidth={1.75} />}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} shrink-0 overflow-hidden rounded-xl bg-white p-1.5 ring-1 ring-neutral-200 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={currentUrl}
        src={currentUrl}
        alt={name ?? ''}
        className="h-full w-full object-contain"
        onError={() => setAttempt((a) => a + 1)}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
