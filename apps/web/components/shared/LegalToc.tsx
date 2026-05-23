'use client';

import { useEffect, useState } from 'react';

export type TocItem = {
  id: string;
  label: string;
};

export function LegalToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const first = visible[0];
          if (first) setActiveId(first.target.id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Sommaire"
      className="hidden lg:block sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto"
    >
      <p className="text-caption tracking-wider text-neutral-500 uppercase font-semibold mb-3">
        Sommaire
      </p>
      <ul className="space-y-1.5 text-body-sm">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`block py-1 px-2 rounded-md border-l-2 transition-colors ${
                  isActive
                    ? 'border-primary-500 bg-primary-50 text-primary-600 font-semibold'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
