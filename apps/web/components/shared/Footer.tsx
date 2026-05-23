import Link from 'next/link';

const LEGAL_LINKS: Array<{ href: string; label: string }> = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/cgu', label: 'CGU' },
  { href: '/politique-confidentialite', label: 'Confidentialité' },
  { href: '/cookies', label: 'Cookies' },
];

const SUPPORT_LINKS: Array<{ href: string; label: string }> = [
  { href: '/connexion', label: 'Se connecter' },
  { href: '/inscription', label: 'Créer un compte' },
];

export function Footer() {
  return (
    <footer className="border-t border-neutral-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-info-500 via-primary-500 to-success-500 flex items-center justify-center text-white font-display font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                S
              </span>
              <span className="text-heading-md font-display font-bold text-neutral-900">
                SwipeJob
              </span>
            </Link>
            <p className="mt-3 text-body-sm text-neutral-600">
              La recherche d&apos;emploi qui swipe avec toi.
            </p>
          </div>

          {/* Légal */}
          <div>
            <p className="text-caption tracking-wider text-neutral-500 uppercase font-semibold mb-3">
              Légal
            </p>
            <ul className="space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-neutral-700 hover:text-primary-500 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Compte */}
          <div>
            <p className="text-caption tracking-wider text-neutral-500 uppercase font-semibold mb-3">
              Compte
            </p>
            <ul className="space-y-2">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-neutral-700 hover:text-primary-500 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="mailto:contact@swipejob.fr"
                  className="text-body-sm text-neutral-700 hover:text-primary-500 hover:underline"
                >
                  Nous contacter
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-caption text-neutral-500">
            © {new Date().getFullYear()} SwipeJob · Tous droits réservés
          </p>
          <p className="text-caption text-neutral-400">Beta privée · France</p>
        </div>
      </div>
    </footer>
  );
}
