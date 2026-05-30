import Link from 'next/link';
import type { ReactNode } from 'react';

type LogoProps = {
  /** Si true, lien cliquable vers `href`. */
  asLink?: boolean;
  href?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Affiche seulement le mark (badge "S"), pas le wordmark "SwipeJob". */
  markOnly?: boolean;
  className?: string;
};

const MARK_SIZES: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'h-7 w-7 text-sm',
  md: 'h-9 w-9 text-lg',
  lg: 'h-12 w-12 text-2xl',
  xl: 'h-16 w-16 text-3xl',
};

const WORDMARK_SIZES: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-4xl',
};

/**
 * Logo SwipeJob — palette éditoriale FitMe : noir + accent orange.
 * Mark = badge "S" noir avec un point orange en accent.
 * Wordmark = "SwipeJob" en Fraunces italic semibold.
 */
export function SwipejobLogo({
  asLink = false,
  href = '/',
  size = 'md',
  markOnly = false,
  className,
}: LogoProps) {
  const content = (
    <>
      <span
        className={`relative inline-flex shrink-0 items-center justify-center rounded-xl bg-neutral-900 font-[family-name:var(--font-fraunces)] font-semibold italic text-white shadow-sm ${MARK_SIZES[size]}`}
        aria-hidden="true"
      >
        S{/* Point orange accent dans le coin */}
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white" />
      </span>
      {!markOnly && (
        <span
          className={`font-[family-name:var(--font-fraunces)] font-semibold italic text-neutral-900 ${WORDMARK_SIZES[size]}`}
        >
          SwipeJob
        </span>
      )}
    </>
  );

  const baseClass = `inline-flex items-center gap-2.5 ${className ?? ''}`.trim();
  const a11yLabel = 'SwipeJob — accueil';

  if (asLink) {
    return (
      <Link href={href} aria-label={a11yLabel} className={`${baseClass} group`}>
        {content}
      </Link>
    );
  }
  return (
    <span aria-label={a11yLabel} className={baseClass}>
      {content}
    </span>
  );
}

// Sous-export utile si quelqu'un veut juste le wordmark stylé sans mark
export function SwipejobWordmark({
  size = 'md',
  children = 'SwipeJob',
}: {
  size?: NonNullable<LogoProps['size']>;
  children?: ReactNode;
}) {
  return (
    <span
      className={`font-[family-name:var(--font-fraunces)] font-semibold italic text-neutral-900 ${WORDMARK_SIZES[size]}`}
    >
      {children}
    </span>
  );
}
