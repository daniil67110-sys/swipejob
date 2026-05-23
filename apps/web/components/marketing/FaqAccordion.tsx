'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type FaqItem = {
  question: string;
  answer: string;
};

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <ul className="space-y-3">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <li
            key={item.question}
            className="rounded-2xl border border-neutral-100 bg-white shadow-sm overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-neutral-50 transition-colors"
            >
              <span className="text-body-md font-semibold text-neutral-900">{item.question}</span>
              <ChevronDown
                className={`w-5 h-5 text-neutral-500 shrink-0 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>
            {isOpen ? (
              <div className="px-5 pb-5 text-body-sm text-neutral-700 leading-relaxed">
                {item.answer}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
