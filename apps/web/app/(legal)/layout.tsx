import type { ReactNode } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/shared/Footer';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-neutral-50 flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-neutral-100">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-info-500 via-primary-500 to-success-500 flex items-center justify-center text-white font-display font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              S
            </span>
            <span className="text-heading-md font-display font-bold text-neutral-900">
              SwipeJob
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/connexion"
              className="text-body-sm font-medium text-neutral-600 hover:text-primary-500"
            >
              Se connecter
            </Link>
            <Link
              href="/inscription"
              className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-info-500 to-primary-500 px-4 py-2 text-body-sm font-semibold text-white shadow-sm hover:shadow-md transition-shadow"
            >
              S&apos;inscrire
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}
