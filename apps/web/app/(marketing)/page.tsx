import Link from 'next/link';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  FileText,
  Layers,
  Lock,
  PenLine,
  Send,
  Zap,
} from 'lucide-react';
import { Footer } from '@/components/shared/Footer';
import { FaqAccordion } from '@/components/marketing/FaqAccordion';
import { LandingPageView } from '@/components/marketing/LandingPageView';
import { LandingHero } from '@/components/marketing/LandingHero';
import { Marquee } from '@/components/marketing/Marquee';
import { ScrollProgressBar } from '@/components/marketing/ScrollProgressBar';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';
import { SpringNumber } from '@/components/marketing/SpringNumber';

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
    title: 'Swipe rapide',
    description:
      'Une carte par offre, 3 gestes simples : passer, sauver, candidater. Comme tu sais déjà faire.',
  },
  {
    icon: Brain,
    title: 'Matching IA',
    description:
      'Notre algo compare ton profil à des milliers d’offres pour te proposer le top 15 chaque jour.',
  },
  {
    icon: PenLine,
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
  },
  {
    name: 'Tom, 23 ans',
    role: 'Étudiant en école d’ingé, cherche un stage de fin d’études',
    quote:
      "Le swipe c'est addictif au bon sens. Je me force plus à chercher chaque soir, l'app me pousse mon deck. Et la lettre IA est mieux que ce que j'aurais écrit.",
    initial: 'T',
  },
  {
    name: 'Yasmine, 24 ans',
    role: 'Jeune diplômée école de commerce, premier CDI',
    quote:
      "J'avais peur que l'IA standardise mes candidatures. En fait elle adapte vraiment au profil de chaque entreprise. J'ai eu 4 entretiens en 3 semaines.",
    initial: 'Y',
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
    <div className="flex min-h-dvh flex-col bg-[#f7f5f1] text-neutral-900">
      <ScrollProgressBar />
      <LandingPageView />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-neutral-200/60 bg-[#f7f5f1]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="group flex items-center gap-2">
            <span className="font-[family-name:var(--font-fraunces)] text-2xl font-bold italic text-neutral-900">
              SwipeJob
            </span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/connexion"
              className="hidden text-body-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 sm:inline"
            >
              Se connecter
            </Link>
            <Link
              href="/inscription"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-body-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              S&apos;inscrire
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero animé */}
        <LandingHero />

        {/* Features — Bento style */}
        <section className="border-y border-neutral-200/60 bg-white py-20 lg:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <ScrollReveal>
              <p className="text-center text-caption font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Pourquoi SwipeJob ?
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="mx-auto mt-4 max-w-3xl text-center font-[family-name:var(--font-fraunces)] text-4xl leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
                <span className="font-semibold">La recherche d&apos;emploi</span>{' '}
                <span className="font-light italic text-neutral-400">qui swipe avec toi</span>
              </h2>
            </ScrollReveal>

            <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <ScrollReveal key={f.title} delay={0.1 + i * 0.1}>
                    <article className="group relative h-full overflow-hidden rounded-3xl border border-neutral-200 bg-[#f7f5f1] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-[0_20px_50px_-20px_rgb(0,0,0,0.15)]">
                      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                        <Icon className="h-6 w-6" aria-hidden="true" strokeWidth={2.25} />
                      </div>
                      <h3 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-neutral-900">
                        {f.title}
                      </h3>
                      <p className="mt-2 text-body-md leading-relaxed text-neutral-600">
                        {f.description}
                      </p>
                      <span
                        aria-hidden="true"
                        className="absolute right-5 top-5 text-7xl font-[family-name:var(--font-fraunces)] font-light italic text-neutral-200/70"
                      >
                        0{i + 1}
                      </span>
                    </article>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Comment ça marche — editorial vertical */}
        <section className="py-20 lg:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5">
                <ScrollReveal>
                  <p className="text-caption font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    Comment ça marche
                  </p>
                </ScrollReveal>
                <ScrollReveal delay={0.1}>
                  <h2 className="mt-4 font-[family-name:var(--font-fraunces)] text-4xl leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
                    <span className="font-semibold">3 étapes,</span>
                    <br />
                    <span className="font-light italic text-neutral-400">5 minutes par jour</span>
                  </h2>
                </ScrollReveal>
                <ScrollReveal delay={0.2}>
                  <p className="mt-6 max-w-md text-body-lg leading-relaxed text-neutral-600">
                    Pas besoin de passer ta soirée à éplucher LinkedIn. On condense ta recherche
                    quotidienne en quelques swipes.
                  </p>
                </ScrollReveal>
                <ScrollReveal delay={0.3}>
                  <Link
                    href="/inscription"
                    className="mt-8 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-body-md font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Commencer maintenant
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </ScrollReveal>
              </div>

              <ol className="space-y-4 lg:col-span-7">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <ScrollReveal key={step.title} delay={0.15 + i * 0.1}>
                      <li className="group relative flex gap-5 rounded-2xl border border-neutral-200/70 bg-white p-6 transition-all duration-300 hover:border-neutral-300 hover:shadow-[0_10px_30px_-15px_rgb(0,0,0,0.15)]">
                        <SpringNumber
                          delay={0.2 + i * 0.1}
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-900 font-[family-name:var(--font-fraunces)] text-xl font-bold text-white"
                        >
                          {i + 1}
                        </SpringNumber>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-neutral-900">
                              {step.title}
                            </h3>
                            <Icon
                              className="h-5 w-5 text-neutral-400 transition-colors group-hover:text-orange-500"
                              aria-hidden="true"
                              strokeWidth={2}
                            />
                          </div>
                          <p className="mt-2 text-body-md leading-relaxed text-neutral-600">
                            {step.description}
                          </p>
                        </div>
                      </li>
                    </ScrollReveal>
                  );
                })}
              </ol>
            </div>
          </div>
        </section>

        {/* Personas */}
        <section className="border-y border-neutral-200/60 bg-white py-20 lg:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <ScrollReveal>
              <p className="text-center text-caption font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Ils ont swipé leur job
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="mx-auto mt-4 max-w-3xl text-center font-[family-name:var(--font-fraunces)] text-4xl leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
                <span className="font-semibold">Pensé pour</span>{' '}
                <span className="font-light italic text-neutral-400">les jeunes</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="mx-auto mt-4 max-w-xl text-center text-body-md italic text-neutral-500">
                Personas inspirées de nos utilisateurs cibles — beta privée en cours.
              </p>
            </ScrollReveal>

            <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <ScrollReveal key={t.name} delay={0.1 + i * 0.1}>
                  <figure className="flex h-full flex-col rounded-3xl border border-neutral-200 bg-[#f7f5f1] p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgb(0,0,0,0.12)]">
                    <span
                      aria-hidden="true"
                      className="mb-3 font-[family-name:var(--font-fraunces)] text-6xl font-light italic leading-none text-neutral-300"
                    >
                      “
                    </span>
                    <blockquote className="flex-1 text-body-md leading-relaxed text-neutral-700">
                      {t.quote}
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3 border-t border-neutral-200 pt-5">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 font-[family-name:var(--font-fraunces)] font-bold text-white">
                        {t.initial}
                      </span>
                      <div>
                        <p className="text-body-sm font-semibold text-neutral-900">{t.name}</p>
                        <p className="text-caption text-neutral-500">{t.role}</p>
                      </div>
                    </figcaption>
                  </figure>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Sources d'offres — marquee infini */}
        <section className="py-14">
          <div className="mx-auto max-w-7xl px-6">
            <ScrollReveal>
              <div className="rounded-3xl border border-neutral-200 bg-white p-8 lg:p-12">
                <p className="mb-6 text-center text-caption font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Offres agrégées depuis
                </p>
                <Marquee
                  durationSec={32}
                  items={[
                    <span className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold italic text-neutral-700">
                      France Travail
                    </span>,
                    <span aria-hidden="true" className="text-neutral-300">
                      ✦
                    </span>,
                    <span className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold italic text-neutral-700">
                      Adzuna
                    </span>,
                    <span aria-hidden="true" className="text-neutral-300">
                      ✦
                    </span>,
                    <span className="text-body-md text-neutral-500">
                      Plus de 5 000 offres actives
                    </span>,
                    <span aria-hidden="true" className="text-neutral-300">
                      ✦
                    </span>,
                    <span className="text-body-md text-neutral-500">Hébergé en UE</span>,
                    <span aria-hidden="true" className="text-neutral-300">
                      ✦
                    </span>,
                    <span className="text-body-md text-neutral-500">
                      Mises à jour quotidiennes
                    </span>,
                    <span aria-hidden="true" className="text-neutral-300">
                      ✦
                    </span>,
                    <span className="text-body-md text-neutral-500">RGPD conforme</span>,
                  ]}
                />
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-neutral-200/60 bg-white py-20 lg:py-32">
          <div className="mx-auto max-w-3xl px-6">
            <ScrollReveal>
              <p className="text-center text-caption font-semibold uppercase tracking-[0.2em] text-neutral-500">
                FAQ
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="mt-4 text-center font-[family-name:var(--font-fraunces)] text-4xl leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
                <span className="font-semibold">Tu te</span>{' '}
                <span className="font-light italic text-neutral-400">demandes...</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="mt-12">
                <FaqAccordion items={FAQ} />
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* CTA final — éditorial dark */}
        <section className="relative overflow-hidden bg-neutral-950 py-24 lg:py-36 text-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(251,146,60,0.18),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(99,102,241,0.12),transparent_55%)]"
          />
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <ScrollReveal>
              <p className="text-caption font-semibold uppercase tracking-[0.25em] text-neutral-400">
                Prêt à swiper ton job ?
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="mt-6 font-[family-name:var(--font-fraunces)] text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                <span className="font-semibold">Ton job idéal</span>
                <br />
                <span className="font-light italic text-neutral-400">est à un swipe.</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="mx-auto mt-6 max-w-xl text-body-lg leading-relaxed text-neutral-300">
                Crée ton compte en 30 secondes. Pas de carte bancaire, pas d&apos;engagement, juste
                ton CV.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/inscription"
                  className="group inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-body-md font-semibold text-neutral-900 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.4)]"
                >
                  S&apos;inscrire gratuitement
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
                <Link
                  href="/connexion"
                  className="inline-flex min-h-[56px] items-center justify-center rounded-full border border-neutral-700 bg-transparent px-7 py-4 text-body-md font-semibold text-white transition-colors hover:bg-white/5"
                >
                  J&apos;ai déjà un compte
                </Link>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.4}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-caption text-neutral-400">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
                  100 % gratuit
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  Données UE · RGPD
                </span>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
