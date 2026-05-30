'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Send, Settings, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SwipejobLogo } from './SwipejobLogo';

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
}> = [
  { href: '/deck', label: 'Deck du jour', icon: Layers },
  { href: '/candidatures', label: 'Candidatures', icon: Send },
  { href: '/profil', label: 'Profil', icon: User },
  { href: '/parametres', label: 'Réglages', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Navigation principale"
      className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-neutral-200/60 bg-[#f7f5f1] p-5 lg:flex"
    >
      {/* Logo */}
      <div className="mb-8">
        <SwipejobLogo asLink href="/deck" size="md" />
      </div>

      {/* Nav */}
      <nav className="flex-1">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200 ${
                    isActive
                      ? 'bg-white ring-1 ring-neutral-900/10 shadow-sm'
                      : 'hover:bg-white/60 hover:translate-x-1'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                      isActive
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white text-neutral-700 ring-1 ring-neutral-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                  </span>
                  <span
                    className={`flex-1 text-body-sm ${
                      isActive ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-700'
                    }`}
                  >
                    {item.label}
                  </span>
                  {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> : null}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer : liens légaux */}
      <div className="mt-4 space-y-2 border-t border-neutral-200/60 pt-4">
        <nav aria-label="Liens légaux" className="flex flex-wrap gap-x-2 gap-y-1">
          <Link
            href="/mentions-legales"
            className="text-[11px] text-neutral-400 hover:text-neutral-700 hover:underline"
          >
            Mentions
          </Link>
          <span className="text-[11px] text-neutral-300" aria-hidden="true">
            ·
          </span>
          <Link
            href="/cgu"
            className="text-[11px] text-neutral-400 hover:text-neutral-700 hover:underline"
          >
            CGU
          </Link>
          <span className="text-[11px] text-neutral-300" aria-hidden="true">
            ·
          </span>
          <Link
            href="/politique-confidentialite"
            className="text-[11px] text-neutral-400 hover:text-neutral-700 hover:underline"
          >
            Confidentialité
          </Link>
          <span className="text-[11px] text-neutral-300" aria-hidden="true">
            ·
          </span>
          <Link
            href="/cookies"
            className="text-[11px] text-neutral-400 hover:text-neutral-700 hover:underline"
          >
            Cookies
          </Link>
        </nav>
        <p className="text-center text-caption text-neutral-400">SwipeJob · Beta privée</p>
      </div>
    </aside>
  );
}
