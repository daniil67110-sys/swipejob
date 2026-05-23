import Link from 'next/link';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  FileText,
  Heart,
  Layers,
  Lock,
  PenLine,
  Send,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Footer } from '@/components/shared/Footer';
import { FaqAccordion } from '@/components/marketing/FaqAccordion';
import { LandingPageView } from '@/components/marketing/LandingPageView';

export const metadata = {
  title: 'SwipeJob — Trouve ton job en swipant',
  description:
    "La recherche d'emploi pour la Gen Z. Upload ton CV, swipe les offres qui te plaisent, candidate en 1 geste. L'IA fait le matching, toi tu te concentres sur ce qui compte.",
  openGraph: {
    title: 'SwipeJob — Trouve ton job en swipant',
    description:
      "La recherche d'emploi pour la Gen Z. Upload ton CV, swipe les offres, candidate en 1 geste.",
    type: 'website',
    locale: 'fr_FR',
    siteName: 'SwipeJob',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SwipeJob — Trouve ton job en swipant',
    description:
      "La recherche d'emploi pour la Gen Z. Upload ton CV, swipe les offres, candidate en 1 geste.",
  },
  alternates: {
    canonical: '/',
  },
};

const FEATURES = [
  {
    icon: Zap,
    iconBg: 'bg-info-100',
    iconColor: 'text-info-500',
    title: 'Swipe rapide',
    description:
      'Une carte par offre, 3 gestes simples : passer, sauver, candidater. Comme tu sais déjà faire.',
  },
  {
    icon: Brain,
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-500',
    title: 'Matching IA',
    description:
      'Notre algo compare ton profil à des milliers d’offres pour te proposer le top 15 chaque jour.',
  },
  {
    icon: PenLine,
    iconBg: 'bg-success-100',
    iconColor: 'text-success-500',
    title: 'Lettre auto',
    description:
      "L'IA rédige une lettre de motivation personnalisée pour chaque candidature. Tu valides, on envoie.",
  },
];

const STEPS = [
  {
    icon: FileText,
    title: 'Upload ton CV',
    description:
      "Téléverse ton CV en PDF. L'IA extrait ton profil, ton parcours, tes compétences en quelques secondes.",
  },
  {
    icon: Layers,
    title: 'Swipe ton deck du jour',
    description:
      '15 offres triées sur le volet chaque jour. Tu swipes en 5 minutes, tu reprends ta vie.',
  },
  {
    icon: Send,
    title: 'Candidate en 1 geste',
    description:
      'Un swipe à droite suffit. On génère la lettre, on envoie la candidature, on suit la réponse.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Léa, 21 ans',
    role: 'BTS Communication, en recherche d’alternance',
    quote:
      "J'avais postulé à 40 offres en 3 mois sans réponse. Sur SwipeJob j'ai trouvé une alternance en 2 semaines. Les offres collent vraiment à mon profil.",
    initial: 'L',
    gradient: 'from-info-500 to-primary-500',
  },
  {
    name: 'Tom, 23 ans',
    role: 'Étudiant en école d’ingé, cherche un stage de fin d’études',
    quote:
      "Le swipe c'est addictif au bon sens. Je me force plus à chercher chaque soir, l'app me pousse mon deck. Et la lettre IA est mieux que ce que j'aurais écrit.",
    initial: 'T',
    gradient: 'from-primary-500 to-success-500',
  },
  {
    name: 'Yasmine, 24 ans',
    role: 'Jeune diplômée école de commerce, premier CDI',
    quote:
      "J'avais peur que l'IA standardise mes candidatures. En fait elle adapte vraiment au profil de chaque entreprise. J'ai eu 4 entretiens en 3 semaines.",
    initial: 'Y',
    gradient: 'from-success-500 to-info-500',
  },
];

const FAQ = [
  {
    question: 'C’est vraiment gratuit ?',
    answer:
      'Oui. SwipeJob est gratuit pour les candidats. On se rémunère côté entreprises sur les recrutements aboutis. Pas de paywall, pas de premium, pas de pub.',
  },
  {
    question: 'Pour quel niveau d’expérience ?',
    answer:
      'On est conçus pour les 18-25 ans : stages, alternances, premier emploi, jeune diplômé. Si tu cherches un poste senior, on n’est pas la bonne plateforme.',
  },
  {
    question: 'D’où viennent les offres ?',
    answer:
      'On agrège les offres de France Travail (ex-Pôle Emploi) et Adzuna, des sources officielles couvrant la majorité du marché français. Plus de 5000 offres actives en permanence.',
  },
  {
    question: 'Comment fonctionne le matching IA ?',
    answer:
      'Notre IA compare ton CV (compétences, expériences, formation) aux offres pour calculer un score de pertinence. Tu vois pourquoi chaque offre matche dans la carte. Aucun critère discriminatoire (âge, genre, origine) n’est utilisé.',
  },
  {
    question: 'Mes données sont-elles protégées ?',
    answer:
      'Toutes tes données sont hébergées en UE (Frankfurt) et chiffrées. Conforme RGPD avec hébergeurs certifiés. Tu peux exporter ou supprimer tes données à tout moment depuis ton profil.',
  },
  {
    question: 'Combien de temps ça prend par jour ?',
    answer:
      "5 minutes pour swiper ton deck du jour. Tu peux y passer plus si tu veux explorer les détails, mais c'est calibré pour rester ultra-rapide.",
  },
];

export default function MarketingHomePage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'SwipeJob',
        url: 'https://swipejob.fr',
        logo: 'https://swipejob.fr/icon-512.png',
        sameAs: [],
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'contact@swipejob.fr',
          contactType: 'customer support',
          areaServed: 'FR',
          availableLanguage: ['French'],
        },
      },
      {
        '@type': 'WebSite',
        url: 'https://swipejob.fr',
        name: 'SwipeJob',
        description:
          "La recherche d'emploi pour la Gen Z. Swipe, candidate, décroche ton job en alternance, stage ou premier emploi.",
        inLanguage: 'fr-FR',
      },
    ],
  };

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50">
      <LandingPageView />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-neutral-100">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-info-500 via-primary-500 to-success-500 flex items-center justify-center text-white font-display font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              S
            </span>
            <span className="text-heading-md font-display font-bold text-neutral-900">
              SwipeJob
            </span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/connexion"
              className="hidden sm:inline text-body-sm font-medium text-neutral-600 hover:text-primary-500"
            >
              Se connecter
            </Link>
            <Link
              href="/inscription"
              className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-info-500 to-primary-500 px-4 py-2 text-body-sm font-semibold text-white shadow-sm hover:shadow-md transition-shadow"
            >
              S&apos;inscrire
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-info-500/10 blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-success-500/10 blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-20 lg:pt-24 lg:pb-32 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-info-100 to-success-100 text-primary-600 text-caption font-semibold tracking-wide mb-6">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Beta privée ouverte
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-neutral-900 leading-[1.05] mb-6 max-w-3xl mx-auto">
              Trouve ton job en{' '}
              <span className="bg-gradient-to-r from-info-500 via-primary-500 to-success-500 bg-clip-text text-transparent">
                swipant
              </span>
            </h1>
            <p className="text-body-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              La recherche d&apos;emploi pour la Gen Z. Upload ton CV, swipe les offres qui te
              plaisent, candidate en 1 geste. L&apos;IA fait le matching, toi tu te concentres sur
              ce qui compte.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-info-500 via-primary-500 to-success-500 px-6 py-3.5 text-body-md font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all min-h-[52px]"
              >
                S&apos;inscrire gratuitement
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                href="/connexion"
                className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-6 py-3.5 text-body-md font-semibold text-neutral-700 hover:bg-neutral-50 min-h-[52px]"
              >
                J&apos;ai déjà un compte
              </Link>
            </div>
            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-caption text-neutral-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-success-500" aria-hidden="true" />
                100 % gratuit
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-info-500" aria-hidden="true" />
                Données en UE · RGPD
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary-500" aria-hidden="true" />
                Sans CB, sans CV public
              </span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 lg:py-24 bg-white border-y border-neutral-100">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-12">
              <p className="text-caption tracking-wider text-neutral-500 uppercase font-semibold mb-3">
                Pourquoi SwipeJob ?
              </p>
              <h2 className="text-display-lg font-display font-bold text-neutral-900 max-w-2xl mx-auto leading-tight">
                La recherche d&apos;emploi qui{' '}
                <span className="bg-gradient-to-r from-info-500 via-primary-500 to-success-500 bg-clip-text text-transparent">
                  swipe avec toi
                </span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="relative rounded-2xl bg-white shadow-sm border border-neutral-100 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="h-1 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />
                    <div className="p-6">
                      <div
                        className={`w-12 h-12 rounded-xl ${f.iconBg} ${f.iconColor} flex items-center justify-center mb-4`}
                      >
                        <Icon className="w-6 h-6" aria-hidden="true" />
                      </div>
                      <h3 className="text-heading-md font-semibold text-neutral-900 mb-2">
                        {f.title}
                      </h3>
                      <p className="text-body-sm text-neutral-600 leading-relaxed">
                        {f.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-12">
              <p className="text-caption tracking-wider text-neutral-500 uppercase font-semibold mb-3">
                Comment ça marche
              </p>
              <h2 className="text-display-lg font-display font-bold text-neutral-900 max-w-2xl mx-auto leading-tight">
                3 étapes,{' '}
                <span className="bg-gradient-to-r from-info-500 via-primary-500 to-success-500 bg-clip-text text-transparent">
                  5 minutes par jour
                </span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="relative text-center md:text-left">
                    <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                      <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-info-500 to-primary-500 text-white font-display font-bold flex items-center justify-center shadow-sm">
                        {i + 1}
                      </span>
                      <Icon className="w-6 h-6 text-neutral-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-heading-md font-semibold text-neutral-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-body-sm text-neutral-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Témoignages personas */}
        <section className="py-16 lg:py-24 bg-white border-y border-neutral-100">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-12">
              <p className="text-caption tracking-wider text-neutral-500 uppercase font-semibold mb-3">
                Ils ont swipé leur job
              </p>
              <h2 className="text-display-lg font-display font-bold text-neutral-900 max-w-2xl mx-auto leading-tight">
                Pensé pour{' '}
                <span className="bg-gradient-to-r from-info-500 via-primary-500 to-success-500 bg-clip-text text-transparent">
                  les jeunes
                </span>
              </h2>
              <p className="text-body-md text-neutral-500 mt-4 max-w-xl mx-auto italic">
                Personas inspirées de nos utilisateurs cibles — beta privée en cours.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t) => (
                <figure
                  key={t.name}
                  className="rounded-2xl bg-white shadow-sm border border-neutral-100 p-6 flex flex-col"
                >
                  <Heart
                    className="w-6 h-6 text-success-500 mb-3"
                    fill="currentColor"
                    aria-hidden="true"
                  />
                  <blockquote className="flex-1 text-body-md text-neutral-700 leading-relaxed mb-5">
                    « {t.quote} »
                  </blockquote>
                  <figcaption className="flex items-center gap-3 pt-4 border-t border-neutral-100">
                    <span
                      className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.gradient} text-white font-display font-bold flex items-center justify-center shadow-sm`}
                    >
                      {t.initial}
                    </span>
                    <div>
                      <p className="text-body-sm font-semibold text-neutral-900">{t.name}</p>
                      <p className="text-caption text-neutral-500">{t.role}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Sources d'offres */}
        <section className="py-12 bg-neutral-50">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <p className="text-caption tracking-wider text-neutral-500 uppercase font-semibold mb-6">
              Offres agrégées depuis
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              <span className="text-heading-lg font-display font-bold text-neutral-500">
                France Travail
              </span>
              <span className="text-heading-lg font-display font-bold text-neutral-500">
                Adzuna
              </span>
              <span className="text-body-sm text-neutral-400 italic">
                · plus de 5000 offres actives en permanence
              </span>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 lg:py-24 bg-white border-t border-neutral-100">
          <div className="mx-auto max-w-3xl px-6">
            <div className="text-center mb-10">
              <p className="text-caption tracking-wider text-neutral-500 uppercase font-semibold mb-3">
                FAQ
              </p>
              <h2 className="text-display-lg font-display font-bold text-neutral-900 leading-tight">
                Tu te demandes...
              </h2>
            </div>
            <FaqAccordion items={FAQ} />
          </div>
        </section>

        {/* CTA final */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-info-500 via-primary-500 to-success-500 text-white">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-display-lg sm:text-display-xl font-display font-bold leading-tight mb-4">
              Prêt à swiper ton job ?
            </h2>
            <p className="text-body-lg text-white/90 max-w-xl mx-auto mb-8">
              Crée ton compte en 30 secondes. Pas de carte bancaire, pas d&apos;engagement, juste
              ton CV.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-body-md font-semibold text-primary-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all min-h-[52px]"
              >
                S&apos;inscrire gratuitement
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
            <p className="text-caption text-white/70 mt-6 flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              Données stockées en UE · Conforme RGPD
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
