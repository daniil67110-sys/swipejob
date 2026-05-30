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
      className="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm lg:block"
    >
      <p className="mb-4 text-caption font-semibold uppercase tracking-[0.18em] text-neutral-500">
        Sommaire
      </p>
      <ul className="space-y-1 text-body-sm">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`block rounded-xl border-l-2 px-3 py-1.5 transition-all ${
                  isActive
                    ? 'border-orange-500 bg-[#f7f5f1] font-semibold text-neutral-900'
                    : 'border-transparent text-neutral-600 hover:bg-[#f7f5f1] hover:text-neutral-900'
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
