import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh flex items-center justify-center bg-neutral-50 p-6 overflow-hidden">
      {/* Gradient blobs décoratifs */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full bg-info-500/15 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-success-500/15 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary-500/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md space-y-8">
        {/* Logo + brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-info-500 via-primary-500 to-success-500 text-white font-display font-bold text-3xl shadow-lg">
            S
          </div>
          <h1 className="text-display-lg font-display font-bold text-neutral-900">
            Swipe
            <span className="bg-gradient-to-r from-info-500 via-primary-500 to-success-500 bg-clip-text text-transparent">
              Job
            </span>
          </h1>
          <p className="text-body-md text-neutral-600">Trouve ton job en swipant.</p>
        </div>

        {children}

        {/* Liens légaux discrets */}
        <nav
          aria-label="Liens légaux"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-caption text-neutral-400"
        >
          <Link href="/mentions-legales" className="hover:text-neutral-600 hover:underline">
            Mentions légales
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/cgu" className="hover:text-neutral-600 hover:underline">
            CGU
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            href="/politique-confidentialite"
            className="hover:text-neutral-600 hover:underline"
          >
            Confidentialité
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/cookies" className="hover:text-neutral-600 hover:underline">
            Cookies
          </Link>
        </nav>
      </div>
    </div>
  );
}
