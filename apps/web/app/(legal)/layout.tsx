import type { ReactNode } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/shared/Footer';
import { SwipejobLogo } from '@/components/shared/SwipejobLogo';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f7f5f1]">
      {/* Top header */}
      <header className="sticky top-0 z-30 border-b border-neutral-200/60 bg-[#f7f5f1]/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <SwipejobLogo asLink href="/" size="md" />
          <nav className="flex items-center gap-3">
            <Link
              href="/connexion"
              className="text-body-sm font-semibold text-neutral-700 transition-colors hover:text-neutral-900"
            >
              Se connecter
            </Link>
            <Link
              href="/inscription"
              className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-body-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
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
