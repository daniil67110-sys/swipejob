import type { ReactNode } from 'react';
import Link from 'next/link';
import { SwipejobLogo } from '@/components/shared/SwipejobLogo';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#f7f5f1] p-6">
      {/* Halo orange subtil unique au centre — vibe FitMe */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-orange-500/8 blur-3xl"
      />

      <div className="relative w-full max-w-md space-y-8">
        {/* Logo + brand */}
        <div className="text-center">
          <SwipejobLogo asLink size="xl" markOnly className="justify-center" />
          <h1 className="mt-5 font-[family-name:var(--font-fraunces)] text-5xl font-semibold tracking-tight text-neutral-900">
            Swipe<span className="italic font-light text-neutral-400">Job</span>
          </h1>
          <p className="mt-3 text-body-md text-neutral-600">Trouve ton job en swipant.</p>
        </div>

        {children}

        {/* Liens légaux discrets */}
        <nav
          aria-label="Liens légaux"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-caption text-neutral-400"
        >
          <Link href="/mentions-legales" className="hover:text-neutral-700 hover:underline">
            Mentions légales
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/cgu" className="hover:text-neutral-700 hover:underline">
            CGU
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            href="/politique-confidentialite"
            className="hover:text-neutral-700 hover:underline"
          >
            Confidentialité
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/cookies" className="hover:text-neutral-700 hover:underline">
            Cookies
          </Link>
        </nav>
      </div>
    </div>
  );
}
