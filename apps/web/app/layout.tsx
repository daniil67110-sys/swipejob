import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';

/**
 * Fonts — Inter pour le corps de texte, Sora comme display font.
 * Décision: Cabinet Grotesk (licence commerciale requise) → fallback Sora (Google Fonts, libre).
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SwipeJob — Trouve ton job en swipant',
    template: '%s | SwipeJob',
  },
  description:
    "SwipeJob — La plateforme de recherche d'emploi qui utilise l'IA pour matcher les candidats avec les offres. Swipe, postule, décroche ton job.",
  metadataBase: new URL(process.env['SITE_URL'] ?? 'http://localhost:3000'),
  keywords: ['emploi', 'job', 'recrutement', 'IA', 'matching', 'swipe', 'candidature'],
  authors: [{ name: 'SwipeJob' }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'SwipeJob',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${inter.variable} ${sora.variable}`}>
      <body className="font-sans antialiased bg-neutral-50 text-neutral-900">{children}</body>
    </html>
  );
}
