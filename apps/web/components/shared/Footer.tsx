import Link from 'next/link';
import { SwipejobLogo } from './SwipejobLogo';

const LEGAL_LINKS: Array<{ href: string; label: string }> = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/cgu', label: 'CGU' },
  { href: '/politique-confidentialite', label: 'Confidentialité' },
  { href: '/cookies', label: 'Cookies' },
  { href: '/declaration-accessibilite', label: 'Accessibilité' },
];

const SUPPORT_LINKS: Array<{ href: string; label: string }> = [
  { href: '/connexion', label: 'Se connecter' },
  { href: '/inscription', label: 'Créer un compte' },
];

export function Footer() {
  return (
    <footer className="border-t border-neutral-200/60 bg-[#f7f5f1]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <SwipejobLogo asLink href="/" size="md" />
            <p className="mt-4 text-body-sm leading-relaxed text-neutral-600">
              La recherche d&apos;emploi qui{' '}
              <span className="font-[family-name:var(--font-fraunces)] italic text-neutral-900">
                swipe avec toi
              </span>
              .
            </p>
          </div>

          {/* Légal */}
          <div>
            <p className="mb-4 text-caption font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Légal
            </p>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-neutral-700 transition-colors hover:text-neutral-900 hover:underline hover:decoration-orange-400 hover:underline-offset-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Compte */}
          <div>
            <p className="mb-4 text-caption font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Compte
            </p>
            <ul className="space-y-2.5">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-neutral-700 transition-colors hover:text-neutral-900 hover:underline hover:decoration-orange-400 hover:underline-offset-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="mailto:contact@swipejob.fr"
                  className="text-body-sm text-neutral-700 transition-colors hover:text-neutral-900 hover:underline hover:decoration-orange-400 hover:underline-offset-2"
                >
                  Nous contacter
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-neutral-200/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption text-neutral-500">
            © {new Date().getFullYear()} SwipeJob ·{' '}
            <span className="italic">Tous droits réservés</span>
          </p>
          <p className="text-caption italic text-neutral-400">Beta privée · France</p>
        </div>
      </div>
    </footer>
  );
}
