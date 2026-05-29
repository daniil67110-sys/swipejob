import type { Metadata } from 'next';
import { Fraunces, Inter, Sora } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { PosthogProvider } from '@/components/shared/PosthogProvider';
import './globals.css';

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

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz', 'SOFT'],
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const posthogKey = process.env['NEXT_PUBLIC_POSTHOG_KEY'];
  const posthogHost = process.env['NEXT_PUBLIC_POSTHOG_HOST'] ?? 'https://eu.i.posthog.com';

  // Story 6.7 — Loi Toubon : locale fixe `fr-FR`, messages chargés via next-intl.
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${sora.variable} ${fraunces.variable}`}
    >
      <body className="font-sans antialiased bg-neutral-50 text-neutral-900">
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Paris">
          <PosthogProvider posthogKey={posthogKey} posthogHost={posthogHost}>
            {children}
          </PosthogProvider>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
