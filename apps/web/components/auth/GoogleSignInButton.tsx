'use client';

import { useTransition } from 'react';
import { signInWithGoogleAction } from '@/actions/auth/sign-in-google.action';

type Props = {
  disabled?: boolean;
  nextPath?: string;
};

export function GoogleSignInButton({ disabled, nextPath }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await signInWithGoogleAction(nextPath);
    });
  };

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        aria-label="S'inscrire avec Google (non disponible)"
        className="flex w-full items-center justify-center gap-3 rounded-md border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-500 min-h-[44px] cursor-not-allowed"
      >
        <GoogleLogo />
        <span>Continuer avec Google (indisponible)</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label="S'inscrire ou se connecter avec Google"
      className="flex w-full items-center justify-center gap-3 rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60 min-h-[44px]"
    >
      <GoogleLogo />
      <span>{isPending ? 'Connexion en cours…' : 'Continuer avec Google'}</span>
    </button>
  );
}

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M19.6 10.23c0-.66-.06-1.32-.18-1.97H10v3.73h5.39a4.65 4.65 0 0 1-2 3.06v2.55h3.24c1.9-1.74 3-4.32 3-7.37z"
      />
      <path
        fill="#34A853"
        d="M10 20c2.7 0 4.96-.9 6.62-2.4l-3.24-2.55c-.9.6-2.05.95-3.38.95-2.6 0-4.81-1.76-5.6-4.12H1.06v2.6A10 10 0 0 0 10 20z"
      />
      <path
        fill="#FBBC04"
        d="M4.4 11.88a6.04 6.04 0 0 1 0-3.76V5.51H1.06a10 10 0 0 0 0 8.97L4.4 11.88z"
      />
      <path
        fill="#EA4335"
        d="M10 3.96c1.47 0 2.79.5 3.83 1.5l2.86-2.86A10 10 0 0 0 1.06 5.51L4.4 8.12c.79-2.37 3-4.16 5.6-4.16z"
      />
    </svg>
  );
}
