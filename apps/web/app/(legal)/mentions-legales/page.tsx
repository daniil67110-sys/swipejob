import { Building2 } from 'lucide-react';
import { LegalPageHeader } from '@/components/shared/LegalPageHeader';
import { LegalToc, type TocItem } from '@/components/shared/LegalToc';
import { LegalPageView } from '@/components/shared/LegalPageView';

export const metadata = {
  title: 'Mentions légales — SwipeJob',
  description: 'Mentions légales du site SwipeJob.',
};

const TOC: TocItem[] = [
  { id: 'editeur', label: '1. Éditeur du site' },
  { id: 'directeur', label: '2. Directeur de la publication' },
  { id: 'hebergeurs', label: '3. Hébergeurs' },
  { id: 'propriete', label: '4. Propriété intellectuelle' },
  { id: 'contact', label: '5. Contact' },
];

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 lg:py-16">
      <LegalPageView page="mentions-legales" />
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_220px] lg:gap-16">
        <article className="prose-content mx-auto w-full max-w-3xl">
          <LegalPageHeader
            icon={Building2}
            label="Information légale"
            title="Mentions"
            highlightedWord="légales"
            description="Informations légales obligatoires concernant l'éditeur du site SwipeJob."
            lastUpdated="23 mai 2026"
          />

          <Section id="editeur" title="1. Éditeur du site">
            <p>Le présent site est édité par :</p>
            <ul>
              <li>
                <strong>Nom commercial :</strong> SwipeJob
              </li>
              <li>
                <strong>Forme juridique :</strong> SAS en cours de constitution
              </li>
              <li>
                <strong>Siège social :</strong> À renseigner avant ouverture publique
              </li>
              <li>
                <strong>SIRET :</strong> En cours d&apos;immatriculation
              </li>
              <li>
                <strong>Email de contact :</strong>{' '}
                <a href="mailto:contact@swipejob.fr">contact@swipejob.fr</a>
              </li>
            </ul>
            <p className="text-caption text-neutral-500 italic">
              Note de transparence : SwipeJob est en phase de validation marché. La constitution
              juridique sera finalisée avant l&apos;ouverture publique du service.
            </p>
          </Section>

          <Section id="directeur" title="2. Directeur de la publication">
            <p>
              Le directeur de la publication est la personne représentante légale de la société.
              Toute demande relative au contenu du site peut être adressée à{' '}
              <a href="mailto:contact@swipejob.fr">contact@swipejob.fr</a>.
            </p>
          </Section>

          <Section id="hebergeurs" title="3. Hébergeurs">
            <p>Les services SwipeJob sont hébergés par les prestataires suivants :</p>
            <ul>
              <li>
                <strong>Application web :</strong> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA
                91723, USA (région de déploiement : Europe).
              </li>
              <li>
                <strong>Base de données :</strong> Supabase Inc. (région UE — Frankfurt, AWS
                eu-central-1).
              </li>
              <li>
                <strong>Cache & queues :</strong> Upstash Inc. (région UE — Frankfurt).
              </li>
              <li>
                <strong>Stockage de fichiers :</strong> Cloudflare R2, Cloudflare Inc. (juridiction
                EU).
              </li>
              <li>
                <strong>Worker d&apos;arrière-plan :</strong> Railway Corp. (région UE).
              </li>
            </ul>
          </Section>

          <Section id="propriete" title="4. Propriété intellectuelle">
            <p>
              L&apos;ensemble des éléments composant le site SwipeJob (textes, logos, graphismes,
              icônes, code source) est la propriété exclusive de SwipeJob ou de ses partenaires.
            </p>
            <p>
              Toute reproduction, représentation, modification, publication, transmission ou
              dénaturation, totale ou partielle, du site ou de son contenu, par quelque procédé que
              ce soit et sur quelque support que ce soit est interdite sans autorisation préalable
              écrite de SwipeJob.
            </p>
            <p>
              Les offres d&apos;emploi affichées proviennent de sources tierces (France Travail,
              Adzuna, etc.) et restent la propriété de leurs émetteurs respectifs. SwipeJob agit
              uniquement comme agrégateur conformément aux conditions d&apos;utilisation de chaque
              source.
            </p>
          </Section>

          <Section id="contact" title="5. Contact">
            <p>
              Pour toute question relative au site ou à son contenu, vous pouvez nous contacter à
              l&apos;adresse <a href="mailto:contact@swipejob.fr">contact@swipejob.fr</a>.
            </p>
            <p>
              Pour toute demande spécifique liée à la protection des données personnelles, voir
              notre <a href="/politique-confidentialite">politique de confidentialité</a>.
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
