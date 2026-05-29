'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Accessibility, FileText, LayoutDashboard, ScrollText, Shield, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  comingSoon?: boolean;
};

const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
  { href: '/admin/signalements', label: 'Signalements a11y', icon: Accessibility },
  { href: '/admin/audit', label: 'Journal audit', icon: ScrollText, comingSoon: true },
  { href: '/admin/rgpd', label: 'Exports RGPD', icon: FileText, comingSoon: true },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside
      aria-label="Navigation back-office administrateur"
      className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-neutral-900 text-neutral-100 flex-col p-5 z-30"
    >
      <Link href="/admin" className="flex items-center gap-2.5 mb-8 group">
        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-warning-500 to-warning-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
          <Shield className="w-5 h-5" strokeWidth={2.25} aria-hidden="true" />
        </span>
        <div className="leading-tight">
          <span className="block text-heading-md font-display font-bold">Admin</span>
          <span className="block text-caption text-neutral-400">SwipeJob back-office</span>
        </div>
      </Link>

      <nav className="flex-1">
        <ul className="space-y-1">
          {ADMIN_NAV.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                {item.comingSoon ? (
                  <span
                    aria-disabled="true"
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-500 cursor-not-allowed"
                  >
                    <span className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
                    </span>
                    <span className="text-body-sm flex-1 font-medium">{item.label}</span>
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                      bientôt
                    </span>
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-neutral-800 ring-1 ring-warning-500/40'
                        : 'hover:bg-neutral-800 hover:translate-x-1'
                    }`}
                  >
                    <span
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                        isActive
                          ? 'bg-warning-500/20 text-warning-400'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
                    </span>
                    <span
                      className={`text-body-sm flex-1 ${
                        isActive ? 'font-semibold text-white' : 'font-medium text-neutral-200'
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="pt-4 mt-4 border-t border-neutral-800">
        <Link
          href="/deck"
          className="block text-caption text-neutral-400 hover:text-neutral-100 hover:underline"
        >
          ← Retour à l&apos;app
        </Link>
        <p className="mt-2 text-caption text-neutral-500">Zone restreinte · accès administrateur</p>
      </div>
    </aside>
  );
}
