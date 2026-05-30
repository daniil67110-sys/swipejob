'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Menu, Send, Settings, User, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SwipejobLogo } from './SwipejobLogo';

const MENU_ITEMS: Array<{
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    href: '/deck',
    label: 'Deck du jour',
    description: 'Découvre tes offres',
    icon: Layers,
  },
  {
    href: '/candidatures',
    label: 'Mes candidatures',
    description: 'Suis tes envois',
    icon: Send,
  },
  {
    href: '/profil',
    label: 'Mon profil',
    description: 'CV et préférences',
    icon: User,
  },
  {
    href: '/parametres',
    label: 'Réglages',
    description: 'Notifications et compte',
    icon: Settings,
  },
];

export function TopMenuButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Ferme automatiquement la Sheet quand l'URL change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="fixed right-5 top-5 z-40 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Ouvrir le menu"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-md ring-1 ring-neutral-200 transition-all hover:scale-105 hover:shadow-lg active:scale-95"
          >
            <Menu className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[340px] border-l border-neutral-200 bg-[#f7f5f1] p-0 sm:w-[400px]"
        >
          {/* Header noir éditorial */}
          <div className="relative bg-neutral-950 px-6 pb-12 pt-8 text-white">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <X className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            </button>
            <SwipejobLogo size="sm" markOnly />
            <h2 className="mt-5 font-[family-name:var(--font-fraunces)] text-4xl font-semibold leading-tight">
              Menu
            </h2>
          </div>

          {/* Items */}
          <nav className="relative -mt-6 px-3 py-4">
            <ul className="space-y-1.5 rounded-3xl border border-neutral-200 bg-white p-2 shadow-lg">
              {MENU_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={`group flex items-center gap-3 rounded-2xl p-3 transition-all duration-200 ${
                        isActive
                          ? 'bg-[#f7f5f1] ring-1 ring-neutral-900/10'
                          : 'hover:bg-[#f7f5f1] hover:translate-x-1'
                      }`}
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                          isActive
                            ? 'bg-neutral-900 text-white'
                            : 'bg-[#f7f5f1] text-neutral-700 ring-1 ring-neutral-200'
                        }`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-body-md font-semibold ${
                            isActive ? 'text-neutral-900' : 'text-neutral-900'
                          }`}
                        >
                          {item.label}
                        </p>
                        <p className="text-caption text-neutral-500">{item.description}</p>
                      </div>
                      {isActive ? (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                      ) : null}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer : liens légaux */}
          <div className="absolute bottom-0 left-0 right-0 space-y-2 border-t border-neutral-200 bg-[#f7f5f1] px-6 py-5">
            <nav
              aria-label="Liens légaux"
              className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-neutral-500"
            >
              <Link href="/mentions-legales" className="hover:text-neutral-700 hover:underline">
                Mentions
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
            <p className="text-caption text-neutral-400 text-center">SwipeJob · Beta privée</p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
