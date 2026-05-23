import { Cookie } from 'lucide-react';
import { LegalPageHeader } from '@/components/shared/LegalPageHeader';
import { LegalToc, type TocItem } from '@/components/shared/LegalToc';
import { LegalPageView } from '@/components/shared/LegalPageView';
import { CookieConsentControls } from './CookieConsentControls';

export const metadata = {
  title: 'Politique cookies — SwipeJob',
  description:
    'Quels cookies utilisons-nous sur SwipeJob et comment gérer tes préférences (RGPD/CNIL).',
};

const TOC: TocItem[] = [
  { id: 'definition', label: '1. Qu’est-ce qu’un cookie ?' },
  { id: 'categories', label: '2. Catégories' },
  { id: 'preferences', label: '3. Gérer mes préférences' },
  { id: 'liste', label: '4. Liste détaillée' },
  { id: 'tiers', label: '5. Cookies tiers' },
  { id: 'navigateur', label: '6. Contrôle navigateur' },
];

type CookieEntry = {
  name: string;
  category: 'necessary' | 'analytics';
  finality: string;
  source: string;
  duration: string;
};

const COOKIES: CookieEntry[] = [
  {
    name: 'authjs.session-token',
    category: 'necessary',
    finality: 'Maintien de la session utilisateur connecté',
    source: 'SwipeJob (Auth.js)',
    duration: '30 jours',
  },
  {
    name: '__Host-authjs.csrf-token',
    category: 'necessary',
    finality: 'Protection contre les attaques CSRF (sécurité)',
    source: 'SwipeJob (Auth.js)',
    duration: 'Session',
  },
  {
    name: '__Secure-authjs.callback-url',
    category: 'necessary',
    finality: 'Redirection post-connexion (OAuth)',
    source: 'SwipeJob (Auth.js)',
    duration: 'Session',
  },
  {
    name: 'ph_*',
    category: 'analytics',
    finality: "Mesure d'audience anonymisée et compréhension de l'usage du service",
    source: 'PostHog Cloud EU',
    duration: '365 jours max',
  },
];

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:py-16">
      <LegalPageView page="cookies" />
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-12">
        <aside className="lg:order-2">
          <LegalToc items={TOC} />
        </aside>
        <article className="lg:order-1 max-w-3xl">
          <LegalPageHeader
            icon={Cookie}
            label="Cookies"
            title="Politique"
            highlightedWord="cookies"
            description="Quels cookies on utilise, pourquoi, et comment tu peux les gérer."
            lastUpdated="23 mai 2026"
          />

          <Section id="definition" title="1. Qu’est-ce qu’un cookie ?">
            <p>
              Un cookie est un petit fichier déposé sur ton navigateur lors de ta visite. Il permet
              de mémoriser certaines informations (session de connexion, préférences, statistiques
              d&apos;usage anonymisées).
            </p>
            <p>
              SwipeJob utilise un nombre limité de cookies, principalement pour faire fonctionner le
              service. Aucun cookie publicitaire tiers n&apos;est utilisé.
            </p>
          </Section>

          <Section id="categories" title="2. Catégories de cookies">
            <ul>
              <li>
                <strong>Strictement nécessaires :</strong> indispensables au fonctionnement du
                service (connexion, sécurité). Ne peuvent pas être désactivés. Ne nécessitent pas
                ton consentement (RGPD Art. 6.1.f, intérêt légitime).
              </li>
              <li>
                <strong>Mesure d&apos;audience (analytics) :</strong> nous aident à comprendre
                comment le service est utilisé pour l&apos;améliorer. Soumis à ton consentement.
              </li>
            </ul>
            <p>
              <strong>SwipeJob n&apos;utilise pas</strong> de cookies marketing, publicitaires ou de
              réseaux sociaux tiers.
            </p>
          </Section>

          <Section id="preferences" title="3. Gérer mes préférences">
            <p>
              Tu peux activer ou désactiver les cookies optionnels ci-dessous. Tes choix sont
              conservés sur ce navigateur. La gestion centralisée du consentement par finalité sera
              renforcée prochainement (voir Story 6.2).
            </p>
            <CookieConsentControls />
          </Section>

          <Section id="liste" title="4. Liste détaillée des cookies">
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-body-sm border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-2 px-2 font-semibold text-neutral-700">Nom</th>
                    <th className="text-left py-2 px-2 font-semibold text-neutral-700">
                      Catégorie
                    </th>
                    <th className="text-left py-2 px-2 font-semibold text-neutral-700">Finalité</th>
                    <th className="text-left py-2 px-2 font-semibold text-neutral-700">Durée</th>
                    <th className="text-left py-2 px-2 font-semibold text-neutral-700">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {COOKIES.map((c) => (
                    <tr key={c.name} className="border-b border-neutral-100">
                      <td className="py-2 px-2 font-mono text-caption text-neutral-700">
                        {c.name}
                      </td>
                      <td className="py-2 px-2">
                        {c.category === 'necessary' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-success-100 text-success-500 text-caption font-semibold">
                            Nécessaire
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-info-100 text-info-500 text-caption font-semibold">
                            Analytics
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-neutral-700">{c.finality}</td>
                      <td className="py-2 px-2 text-neutral-700 whitespace-nowrap">{c.duration}</td>
                      <td className="py-2 px-2 text-neutral-600 text-caption">{c.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="tiers" title="5. Cookies tiers">
            <p>
              Certains cookies sont déposés par nos sous-traitants techniques pour fournir le
              service. Ils opèrent en notre nom et ne sont pas utilisés à des fins de profilage
              publicitaire :
            </p>
            <ul>
              <li>
                <strong>Google (OAuth) :</strong> uniquement pendant le flux de connexion, pas de
                cookie persistant sur SwipeJob.
              </li>
              <li>
                <strong>PostHog Cloud EU :</strong> mesure d&apos;audience produit, anonymisée tant
                que tu n&apos;es pas identifié.
              </li>
            </ul>
          </Section>

          <Section id="navigateur" title="6. Contrôle via ton navigateur">
            <p>
              Tu peux à tout moment configurer ton navigateur pour bloquer les cookies. Attention,
              le blocage des cookies strictement nécessaires empêchera le fonctionnement du service.
            </p>
            <ul>
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noreferrer"
                >
                  Chrome
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/fr/kb/protection-renforcee-contre-pistage-firefox-ordinateur"
                  target="_blank"
                  rel="noreferrer"
                >
                  Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac"
                  target="_blank"
                  rel="noreferrer"
                >
                  Safari
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noreferrer"
                >
                  Edge
                </a>
              </li>
            </ul>
          </Section>
        </article>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 mb-10">
      <h2 className="text-heading-lg font-display font-bold text-neutral-900 mb-4">{title}</h2>
      <div className="prose prose-neutral max-w-none text-body-md text-neutral-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ul]:my-3 [&_p]:my-3 [&_a]:text-primary-500 [&_a]:font-semibold [&_a:hover]:underline">
        {children}
      </div>
    </section>
  );
}
