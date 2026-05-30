import type { LucideIcon } from 'lucide-react';

export function LegalPageHeader({
  icon: Icon,
  label,
  title,
  highlightedWord,
  description,
  lastUpdated,
}: {
  icon: LucideIcon;
  label: string;
  title: string;
  highlightedWord: string;
  description: string;
  lastUpdated: string;
}) {
  return (
    <header className="mb-10 space-y-4">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-caption font-semibold tracking-wide text-neutral-700 ring-1 ring-neutral-200">
        <Icon className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
        {label}
      </span>
      <h1 className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold leading-[1.05] text-neutral-900 sm:text-6xl">
        {title} <span className="italic text-neutral-400">{highlightedWord}</span>
      </h1>
      <p className="text-body-md leading-relaxed text-neutral-600">{description}</p>
      <p className="italic text-caption text-neutral-400">Dernière mise à jour : {lastUpdated}</p>
    </header>
  );
}
