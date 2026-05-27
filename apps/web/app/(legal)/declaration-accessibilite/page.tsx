import { Accessibility } from 'lucide-react';
import { LegalPageHeader } from '@/components/shared/LegalPageHeader';
import { LegalToc, type TocItem } from '@/components/shared/LegalToc';
import { ReportForm } from './ReportForm';

export const metadata = {
  title: "Déclaration d'accessibilité — SwipeJob",
  description:
    "Déclaration d'accessibilité publique SwipeJob et formulaire de signalement d'un défaut d'accessibilité.",
};

const TOC: TocItem[] = [
  { id: 'engagement', label: '1. Engagement' },
  { id: 'conformite', label: '2. État de conformité' },
  { id: 'perimetre', label: '3. Périmètre audité' },
  { id: 'non-conformites', label: '4. Non-conformités connues' },
  { id: 'audit', label: '5. Audit' },
  { id: 'signalement', label: '6. Signaler un défaut' },
  { id: 'voies-recours', label: '7. Voies de recours' },
];

const LAST_AUDIT_DATE = '27 mai 2026';
const NEXT_AUDIT_PLANNED = '27 mai 2027';

export default function DeclarationAccessibilitePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-12">
        <aside className="lg:order-2">
          <LegalToc items={TOC} />
        </aside>
        <article className="lg:order-1 max-w-3xl">
          <LegalPageHeader
            icon={Accessibility}
            label="Accessibilité"
            title="Déclaration"
            highlightedWord="d'accessibilité"
            description="SwipeJob s'engage à rendre son service accessible aux personnes en situation de handicap, conformément au RGAA et aux WCAG 2.1 AA."
            lastUpdated={LAST_AUDIT_DATE}
          />

          <Section id="engagement" title="1. Engagement">
            <p>
              SwipeJob s'engage à rendre son service en ligne accessible au plus grand nombre,
              conformément à l'article 47 de la loi n° 2005-102 du 11 février 2005 et au Référentiel
              Général d'Amélioration de l'Accessibilité (RGAA 4.1).
            </p>
            <p>
              Cette déclaration s'applique au site et à l'application web{' '}
              <strong>swipejob.fr</strong>.
            </p>
          </Section>

          <Section id="conformite" title="2. État de conformité">
            <p>
              SwipeJob vise une conformité <strong>WCAG 2.1 niveau AA</strong>. L'application est en
              phase de validation marché ; un audit interne axe-core tourne en CI à chaque
              déploiement et bloque les violations critiques (NFR-A8).
            </p>
            <p>
              Statut actuel : <strong>conformité partielle</strong> — voir les non-conformités
              connues ci-dessous.
            </p>
          </Section>

          <Section id="perimetre" title="3. Périmètre audité">
            <ul>
              <li>
                Pages publiques : accueil, inscription, connexion, légal (CGU, confidentialité,
                cookies, mentions, accessibilité).
              </li>
              <li>Parcours d'inscription : âge, CV, préférences, validation email.</li>
              <li>Application principale connectée : deck, candidatures, profil, paramètres.</li>
              <li>Pages RGPD self-service : consentements, export, suppression.</li>
            </ul>
          </Section>

          <Section id="non-conformites" title="4. Non-conformités connues">
            <p>
              À date du <strong>{LAST_AUDIT_DATE}</strong>, les non-conformités identifiées en V1
              sont les suivantes :
            </p>
            <ul>
              <li>
                Le geste de <em>swipe</em> sur le deck n'est pas remplaçable au clavier sur desktop
                pour tous les navigateurs. Une alternative bouton existe et reste accessible — ce
                comportement est documenté et amélioré en continu.
              </li>
              <li>
                Certaines animations ne respectent pas systématiquement{' '}
                <code>prefers-reduced-motion</code>. Correctif en cours sur les composants
                concernés.
              </li>
              <li>
                Le contraste de certains badges secondaires peut être inférieur à 4.5:1 dans
                certains états. Revue en cours.
              </li>
            </ul>
          </Section>

          <Section id="audit" title="5. Audit">
            <p>
              <strong>Audit interne automatisé</strong> : axe-core (Playwright) sur les routes
              publiques à chaque pull-request, bloque les violations <em>serious</em> et{' '}
              <em>critical</em> (NFR-A8).
            </p>
            <p>
              <strong>Audit externe</strong> : un audit RGAA externe est planifié annuellement.
              Prochain audit prévu : <strong>{NEXT_AUDIT_PLANNED}</strong>. Le rapport sera publié
              ici dès sa finalisation.
            </p>
          </Section>

          <Section id="signalement" title="6. Signaler un défaut">
            <p>
              Tu rencontres un obstacle d'accessibilité sur SwipeJob ? Le formulaire ci-dessous
              permet de nous le signaler. Notre équipe consulte ces tickets régulièrement et te
              recontactera si tu laisses un email.
            </p>
            <ReportForm />
          </Section>

          <Section id="voies-recours" title="7. Voies de recours">
            <p>
              Si tu constates un défaut d'accessibilité t'empêchant d'accéder à un contenu ou une
              fonctionnalité du site, et que tu ne parviens pas à obtenir une réponse satisfaisante
              de notre part, tu peux signaler le problème :
            </p>
            <ul>
              <li>
                Au <strong>Défenseur des droits</strong> :{' '}
                <a
                  href="https://formulaire.defenseurdesdroits.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 underline"
                >
                  formulaire.defenseurdesdroits.fr
                </a>
                .
              </li>
              <li>
                Par courrier postal : Défenseur des droits, Libre réponse 71120, 75342 Paris CEDEX
                07.
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
    <section id={id} className="mt-10 first:mt-6 scroll-mt-24">
      <h2 className="text-heading-md font-display font-semibold text-neutral-900 mb-3">{title}</h2>
      <div className="prose prose-neutral max-w-none text-body-md text-neutral-700 leading-relaxed [&_a]:text-primary-600 [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1 [&_p]:my-3">
        {children}
      </div>
    </section>
  );
}
