import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { and, eq, isNull } from 'drizzle-orm';
import { ArrowRight, Briefcase, Calendar, ExternalLink, MapPin, Sparkles } from 'lucide-react';
import { db, isDatabaseConfigured } from '@/lib/db';
import { offers } from '@swipejob/db/schema';
import { CompanyLogo } from '@/components/shared/CompanyLogo';
import { Footer } from '@/components/shared/Footer';
import { SwipejobLogo } from '@/components/shared/SwipejobLogo';
import { env } from '@/lib/env';
import { buildOfferSlug, extractOfferId } from '@/lib/offer-slug';

/**
 * Story 5.4 (+ amorce 7.3) — Page publique de partage d'offre.
 *
 * Accessible sans auth. CTA "Inscris-toi pour postuler" pour convertir
 * les visiteurs qui arrivent via un lien partagé.
 */

type Props = {
  params: Promise<{ slug: string }>;
};

async function fetchOfferFromSlug(slug: string) {
  if (!isDatabaseConfigured) return null;
  const id = extractOfferId(slug);
  if (!id) return null;
  const rows = await db
    .select({
      id: offers.id,
      title: offers.title,
      description: offers.description,
      companyName: offers.companyName,
      companyLogoUrl: offers.companyLogoUrl,
      locationCity: offers.locationCity,
      contractType: offers.contractType,
      remoteMode: offers.remoteMode,
      salaryMinMonthly: offers.salaryMinMonthly,
      salaryMaxMonthly: offers.salaryMaxMonthly,
      startDate: offers.startDate,
      duration: offers.duration,
      sourceUrl: offers.sourceUrl,
      status: offers.status,
      canonicalId: offers.canonicalId,
    })
    .from(offers)
    .where(and(eq(offers.id, id), isNull(offers.canonicalId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const offer = await fetchOfferFromSlug(slug);
  if (!offer) {
    return { title: 'Offre introuvable' };
  }
  const company = offer.companyName ?? 'Entreprise';
  const title = `${offer.title} — ${company}`;
  const description =
    offer.description?.slice(0, 160) ??
    `Offre ${offer.contractType ?? ''} chez ${company}${
      offer.locationCity ? ` à ${offer.locationCity}` : ''
    } sur SwipeJob.`;
  const canonical = `${env.SITE_URL.replace(/\/$/, '')}/offres/${buildOfferSlug(offer.title, offer.id)}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  if (min && max) return `${min} - ${max} €/mois`;
  return `${min ?? max} €/mois`;
}

function formatDateFr(d: string | null): string | null {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date);
}

export default async function PublicOfferPage({ params }: Props) {
  const { slug } = await params;
  const offer = await fetchOfferFromSlug(slug);
  if (!offer || offer.status !== 'active') {
    notFound();
  }

  const salary = formatSalary(offer.salaryMinMonthly, offer.salaryMaxMonthly);
  const start = formatDateFr(offer.startDate);

  return (
    <div className="flex min-h-dvh flex-col bg-[#f7f5f1]">
      <header className="sticky top-0 z-30 border-b border-neutral-200/60 bg-[#f7f5f1]/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <SwipejobLogo asLink href="/" size="md" />
          <nav className="flex items-center gap-3">
            <Link
              href="/connexion"
              className="hidden text-body-sm font-semibold text-neutral-700 transition-colors hover:text-neutral-900 sm:inline"
            >
              Se connecter
            </Link>
            <Link
              href="/inscription"
              className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-body-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              S&apos;inscrire
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-10 space-y-6">
          {/* Hero */}
          <section className="relative rounded-2xl bg-white shadow-md overflow-hidden border border-neutral-100">
            <div className="h-1.5 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <CompanyLogo name={offer.companyName} logoUrl={offer.companyLogoUrl} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="text-caption uppercase tracking-wider font-semibold text-neutral-500">
                    {offer.companyName ?? 'Entreprise non précisée'}
                  </p>
                  <h1 className="text-display-md font-display font-bold text-neutral-900 leading-tight">
                    {offer.title}
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {offer.locationCity ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-info-100 text-info-500 text-caption font-semibold">
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    {offer.locationCity}
                  </span>
                ) : null}
                {offer.contractType ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-500 text-caption font-semibold">
                    <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
                    {offer.contractType}
                  </span>
                ) : null}
                {offer.remoteMode ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-100 text-accent-500 text-caption font-semibold">
                    {offer.remoteMode}
                  </span>
                ) : null}
                {offer.duration ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-caption font-semibold">
                    {offer.duration}
                  </span>
                ) : null}
                {start ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-100 text-success-500 text-caption font-semibold">
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    {start}
                  </span>
                ) : null}
                {salary ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-100 text-warning-500 text-caption font-semibold">
                    {salary}
                  </span>
                ) : null}
              </div>
            </div>
          </section>

          {/* Description */}
          {offer.description ? (
            <section className="relative rounded-2xl bg-white shadow-sm overflow-hidden border border-neutral-100">
              <div className="p-6">
                <h2 className="text-heading-sm font-semibold text-neutral-900 mb-3">
                  Description du poste
                </h2>
                <div className="text-body-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
                  {offer.description}
                </div>
              </div>
            </section>
          ) : null}

          {/* CTA */}
          <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-info-500 via-primary-500 to-success-500 text-white p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <span className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" strokeWidth={2.25} aria-hidden="true" />
              </span>
              <div className="flex-1">
                <h2 className="text-heading-md font-semibold leading-tight">
                  Postule en swipant avec SwipeJob
                </h2>
                <p className="text-body-sm text-white/90 mt-1">
                  Inscris-toi en 30 secondes : on génère ta lettre, on envoie ta candidature, tu
                  suis tout depuis ton dashboard.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/inscription"
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-body-sm font-semibold text-primary-600 shadow-md hover:shadow-lg active:scale-95 transition-all min-h-[44px]"
                  >
                    Créer mon compte gratuit
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                  {offer.sourceUrl ? (
                    <a
                      href={offer.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-white/15 backdrop-blur-sm px-4 py-2.5 text-body-sm font-semibold text-white hover:bg-white/25 transition-all min-h-[44px]"
                    >
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      Voir l&apos;offre source
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
