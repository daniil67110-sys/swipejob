'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Menu, Send, Settings, User, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const MENU_ITEMS: Array<{
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  iconBg: string;
}> = [
  {
    href: '/deck',
    label: 'Deck du jour',
    description: 'Découvre tes offres',
    icon: Layers,
    color: 'text-primary-500',
    iconBg: 'bg-primary-100',
  },
  {
    href: '/candidatures',
    label: 'Mes candidatures',
    description: 'Suis tes envois',
    icon: Send,
    color: 'text-success-500',
    iconBg: 'bg-success-100',
  },
  {
    href: '/profil',
    label: 'Mon profil',
    description: 'CV et préférences',
    icon: User,
    color: 'text-info-500',
    iconBg: 'bg-info-100',
  },
  {
    href: '/parametres',
    label: 'Réglages',
    description: 'Notifications et compte',
    icon: Settings,
    color: 'text-warning-500',
    iconBg: 'bg-warning-100',
  },
];

export function TopMenuButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-5 right-5 z-40 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Ouvrir le menu"
            className="w-11 h-11 rounded-full bg-white shadow-md ring-1 ring-neutral-200 flex items-center justify-center text-neutral-700 hover:scale-105 hover:shadow-lg hover:ring-primary-200 active:scale-95 transition-all"
          >
            <Menu className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[340px] sm:w-[400px] p-0 border-l border-neutral-100"
        >
          {/* Header gradient */}
          <div className="relative bg-gradient-to-br from-info-500 via-primary-500 to-success-500 px-6 pt-8 pb-12 text-white">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
            </button>
            <p className="text-caption font-semibold tracking-wider uppercase text-white/80 mb-2">
              SwipeJob
            </p>
            <h2 className="text-display-md font-display font-bold">Menu</h2>
          </div>

          {/* Items */}
          <nav className="px-3 py-4 -mt-6 relative">
            <ul className="space-y-1.5 bg-white rounded-2xl shadow-lg border border-neutral-100 p-2">
              {MENU_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-info-50 to-success-50 ring-1 ring-primary-100'
                          : 'hover:bg-neutral-50 hover:translate-x-1'
                      }`}
                    >
                      <span
                        className={`w-11 h-11 rounded-xl ${item.iconBg} ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-5 h-5" strokeWidth={2.25} aria-hidden="true" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-body-md font-semibold ${
                            isActive ? 'text-primary-600' : 'text-neutral-900'
                          }`}
                        >
                          {item.label}
                        </p>
                        <p className="text-caption text-neutral-500">{item.description}</p>
                      </div>
                      {isActive ? (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-gradient-to-br from-info-500 to-success-500" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 px-6 py-5 border-t border-neutral-100 bg-neutral-50">
            <p className="text-caption text-neutral-500 text-center">SwipeJob · Beta privée</p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
