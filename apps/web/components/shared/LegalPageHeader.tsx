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
    <header className="space-y-4 mb-8">
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-info-100 to-success-100 text-primary-600 text-caption font-semibold tracking-wide">
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        {label}
      </span>
      <h1 className="text-display-lg font-display font-bold text-neutral-900 leading-[1.05]">
        {title}{' '}
        <span className="bg-gradient-to-r from-info-500 via-primary-500 to-success-500 bg-clip-text text-transparent">
          {highlightedWord}
        </span>
      </h1>
      <p className="text-body-md text-neutral-600">{description}</p>
      <p className="text-caption text-neutral-400">Dernière mise à jour : {lastUpdated}</p>
    </header>
  );
}
