import { FileText } from 'lucide-react';
import { LegalPageHeader } from '@/components/shared/LegalPageHeader';
import { LegalToc, type TocItem } from '@/components/shared/LegalToc';
import { LegalPageView } from '@/components/shared/LegalPageView';

export const metadata = {
  title: 'Conditions Générales d’Utilisation — SwipeJob',
  description: 'Conditions Générales d’Utilisation du service SwipeJob.',
};

const TOC: TocItem[] = [
  { id: 'objet', label: '1. Objet' },
  { id: 'acces', label: '2. Accès et inscription' },
  { id: 'compte', label: '3. Compte utilisateur' },
  { id: 'usage', label: '4. Usage du service' },
  { id: 'candidatures', label: '5. Candidatures' },
  { id: 'donnees', label: '6. Données personnelles' },
  { id: 'propriete', label: '7. Propriété intellectuelle' },
  { id: 'responsabilite', label: '8. Responsabilité' },
  { id: 'suspension', label: '9. Suspension et résiliation' },
  { id: 'modifications', label: '10. Modifications des CGU' },
  { id: 'loi', label: '11. Loi applicable' },
];

export default function CguPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 lg:py-16">
      <LegalPageView page="cgu" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-12 lg:gap-16">
        <article className="mx-auto w-full max-w-3xl">
          <LegalPageHeader
            icon={FileText}
            label="CGU"
            title="Conditions"
            highlightedWord="d’utilisation"
            description="Les présentes CGU régissent l'utilisation du service SwipeJob entre toi et l'éditeur."
            lastUpdated="23 mai 2026"
          />

          <Section id="objet" title="1. Objet">
            <p>
              SwipeJob est un service en ligne qui aide les jeunes (stages, alternances, premier
              emploi) à trouver des opportunités professionnelles grâce à une expérience de type
              &laquo; swipe &raquo; et un matching par intelligence artificielle.
            </p>
            <p>
              Les présentes Conditions Générales d&apos;Utilisation (CGU) ont pour objet de définir
              les modalités d&apos;utilisation du service entre l&apos;éditeur SwipeJob et toute
              personne utilisatrice (ci-après &laquo; l&apos;Utilisateur &raquo;).
            </p>
          </Section>

          <Section id="acces" title="2. Accès et inscription">
            <p>
              Le service est accessible aux personnes physiques âgées de 13 ans minimum. Pour les
              mineurs de 13 à 17 ans, le consentement d&apos;un parent ou tuteur légal est requis
              avant toute utilisation.
            </p>
            <p>
              L&apos;inscription se fait via Google (OAuth 2.0) ou par email avec validation par
              lien magique. La création d&apos;un compte implique l&apos;acceptation pleine et
              entière des présentes CGU.
            </p>
          </Section>

          <Section id="compte" title="3. Compte utilisateur">
            <p>
              L&apos;Utilisateur s&apos;engage à fournir des informations exactes et à jour. Il est
              seul responsable de la confidentialité de ses identifiants et de toute activité
              effectuée depuis son compte.
            </p>
            <p>
              Un seul compte par personne est autorisé. La création de comptes multiples ou
              frauduleux peut entraîner la suspension immédiate.
            </p>
          </Section>

          <Section id="usage" title="4. Usage du service">
            <p>
              L&apos;Utilisateur s&apos;engage à utiliser le service de bonne foi et conformément à
              sa destination, à savoir la recherche d&apos;emploi à titre personnel.
            </p>
            <p>Sont notamment interdits :</p>
            <ul>
              <li>l&apos;automatisation des actions (bots, scripts, scraping)</li>
              <li>la collecte massive de données affichées sur le service</li>
              <li>toute tentative de contourner les protections techniques</li>
              <li>la publication de contenu illégal, diffamatoire ou trompeur</li>
              <li>l&apos;utilisation commerciale ou la revente du service</li>
            </ul>
          </Section>

          <Section id="candidatures" title="5. Candidatures">
            <p>
              Lorsque l&apos;Utilisateur candidate à une offre via SwipeJob, une lettre de
              motivation est générée par intelligence artificielle à partir de son profil et envoyée
              au recruteur de l&apos;offre. L&apos;Utilisateur garde la responsabilité du contenu
              envoyé.
            </p>
            <p>
              SwipeJob ne garantit ni une réponse, ni un entretien, ni une embauche. Le service est
              un facilitateur, pas un intermédiaire de placement au sens légal.
            </p>
          </Section>

          <Section id="donnees" title="6. Données personnelles">
            <p>
              Les modalités de collecte et de traitement des données personnelles sont détaillées
              dans notre <a href="/politique-confidentialite">politique de confidentialité</a>,
              partie intégrante des présentes CGU.
            </p>
          </Section>

          <Section id="propriete" title="7. Propriété intellectuelle">
            <p>
              Le code source, le design, les algorithmes et les bases de données de SwipeJob sont la
              propriété exclusive de l&apos;éditeur.
            </p>
            <p>
              L&apos;Utilisateur conserve la propriété des contenus qu&apos;il télécharge (CV
              notamment). Il accorde à SwipeJob une licence limitée d&apos;utilisation à seule fin
              de fournir le service (parsing IA, matching).
            </p>
          </Section>

          <Section id="responsabilite" title="8. Responsabilité">
            <p>
              SwipeJob met en œuvre les moyens raisonnables pour fournir un service de qualité, mais
              ne peut être tenu responsable :
            </p>
            <ul>
              <li>de l&apos;exactitude des offres provenant de sources tierces</li>
              <li>de l&apos;issue des candidatures envoyées</li>
              <li>des interruptions ponctuelles du service liées à la maintenance</li>
              <li>des dommages indirects résultant de l&apos;utilisation du service</li>
            </ul>
          </Section>

          <Section id="suspension" title="9. Suspension et résiliation">
            <p>
              L&apos;Utilisateur peut résilier son compte à tout moment via la page{' '}
              <a href="/profil/supprimer">suppression de compte</a>. Les données sont effacées sous
              30 jours conformément au RGPD.
            </p>
            <p>
              SwipeJob se réserve le droit de suspendre ou supprimer un compte en cas de violation
              des présentes CGU, sans préavis ni indemnisation.
            </p>
          </Section>

          <Section id="modifications" title="10. Modifications des CGU">
            <p>
              SwipeJob peut modifier les présentes CGU à tout moment. Les Utilisateurs seront
              informés des modifications substantielles par email ou notification dans
              l&apos;application. La poursuite de l&apos;utilisation après modification vaut
              acceptation des nouvelles CGU.
            </p>
          </Section>

          <Section id="loi" title="11. Loi applicable et juridiction">
            <p>
              Les présentes CGU sont régies par le droit français. En cas de litige, les tribunaux
              français seront seuls compétents, sous réserve des dispositions impératives
              applicables aux consommateurs.
            </p>
            <p>
              Conformément aux articles L611-1 et suivants du Code de la consommation,
              l&apos;Utilisateur peut recourir gratuitement à un médiateur de la consommation en cas
              de litige.
            </p>
          </Section>
        </article>
        <aside>
          <LegalToc items={TOC} />
        </aside>
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
    <section id={id} className="scroll-mt-24 mb-12">
      <h2 className="mb-5 font-[family-name:var(--font-fraunces)] text-3xl font-semibold leading-tight text-neutral-900">
        {title}
      </h2>
      <div className="prose prose-neutral max-w-none text-body-md leading-relaxed text-neutral-700 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6 [&_p]:my-3 [&_a]:font-semibold [&_a]:text-orange-600 [&_a]:underline [&_a]:decoration-orange-300 [&_a]:underline-offset-2 [&_a:hover]:text-orange-700 [&_a:hover]:decoration-orange-500">
        {children}
      </div>
    </section>
  );
}
