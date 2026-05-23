'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Send, Settings, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  color: string;
  iconBg: string;
}> = [
  {
    href: '/deck',
    label: 'Deck du jour',
    icon: Layers,
    color: 'text-primary-500',
    iconBg: 'bg-primary-100',
  },
  {
    href: '/candidatures',
    label: 'Candidatures',
    icon: Send,
    color: 'text-success-500',
    iconBg: 'bg-success-100',
  },
  {
    href: '/profil',
    label: 'Profil',
    icon: User,
    color: 'text-info-500',
    iconBg: 'bg-info-100',
  },
  {
    href: '/parametres',
    label: 'Réglages',
    icon: Settings,
    color: 'text-warning-500',
    iconBg: 'bg-warning-100',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Navigation principale"
      className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-neutral-50 to-white border-r border-neutral-100 flex-col p-5 z-30"
    >
      {/* Logo */}
      <Link href="/deck" className="flex items-center gap-2.5 mb-8 group">
        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-info-500 via-primary-500 to-success-500 flex items-center justify-center text-white font-display font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
          S
        </span>
        <span className="text-heading-md font-display font-bold text-neutral-900">SwipeJob</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-info-50 to-success-50 ring-1 ring-primary-100'
                      : 'hover:bg-neutral-50 hover:translate-x-1'
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-lg ${item.iconBg} ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
                  </span>
                  <span
                    className={`text-body-sm flex-1 ${
                      isActive ? 'font-semibold text-primary-600' : 'font-medium text-neutral-700'
                    }`}
                  >
                    {item.label}
                  </span>
                  {isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-info-500 to-success-500" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer : liens légaux */}
      <div className="pt-4 mt-4 border-t border-neutral-100 space-y-2">
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
        <p className="text-caption text-neutral-400 text-center">SwipeJob · Beta privée</p>
      </div>
    </aside>
  );
}
