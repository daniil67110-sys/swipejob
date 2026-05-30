import { Shield } from 'lucide-react';
import { LegalPageHeader } from '@/components/shared/LegalPageHeader';
import { LegalToc, type TocItem } from '@/components/shared/LegalToc';
import { LegalPageView } from '@/components/shared/LegalPageView';

export const metadata = {
  title: 'Politique de confidentialité — SwipeJob',
  description:
    'Comment SwipeJob collecte, utilise et protège tes données personnelles, conformément au RGPD.',
};

const TOC: TocItem[] = [
  { id: 'responsable', label: '1. Responsable de traitement' },
  { id: 'donnees-collectees', label: '2. Données collectées' },
  { id: 'finalites', label: '3. Finalités' },
  { id: 'bases-legales', label: '4. Bases légales' },
  { id: 'destinataires', label: '5. Destinataires' },
  { id: 'transferts', label: '6. Transferts hors UE' },
  { id: 'duree', label: '7. Durée de conservation' },
  { id: 'droits', label: '8. Tes droits' },
  { id: 'mineurs', label: '9. Mineurs' },
  { id: 'securite', label: '10. Sécurité' },
  { id: 'dpo', label: '11. Contact DPO' },
  { id: 'cnil', label: '12. CNIL' },
];

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 lg:py-16">
      <LegalPageView page="politique-confidentialite" />
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12">
        <article className="mx-auto w-full max-w-3xl">
          <LegalPageHeader
            icon={Shield}
            label="RGPD"
            title="Politique de"
            highlightedWord="confidentialité"
            description="On t'explique en clair ce qu'on collecte, pourquoi, combien de temps, et quels sont tes droits."
            lastUpdated="23 mai 2026"
          />

          <Section id="responsable" title="1. Responsable de traitement">
            <p>
              Le responsable de traitement de tes données personnelles est <strong>SwipeJob</strong>
              , dont les coordonnées figurent dans les{' '}
              <a href="/mentions-legales">mentions légales</a>.
            </p>
          </Section>

          <Section id="donnees-collectees" title="2. Données collectées">
            <p>SwipeJob collecte les catégories de données suivantes :</p>
            <ul>
              <li>
                <strong>Identification :</strong> email, prénom, nom, photo de profil (si Google
                OAuth).
              </li>
              <li>
                <strong>Données de vérification :</strong> date de naissance (pour la vérification
                d&apos;âge), consentement parental le cas échéant.
              </li>
              <li>
                <strong>Données professionnelles :</strong> CV (PDF), expériences, formations,
                compétences, langues, école actuelle, niveau d&apos;études.
              </li>
              <li>
                <strong>Préférences de recherche :</strong> types de contrats, villes, rayon
                géographique, télétravail, secteurs, salaire souhaité.
              </li>
              <li>
                <strong>Activité sur le service :</strong> offres swipées, candidatures envoyées,
                statuts d&apos;application.
              </li>
              <li>
                <strong>Données techniques :</strong> adresse IP (pseudonymisée), user agent,
                horodatage des connexions, identifiants de session.
              </li>
              <li>
                <strong>Communications :</strong> emails reçus/envoyés par notre intermédiaire,
                préférences de notifications.
              </li>
            </ul>
          </Section>

          <Section id="finalites" title="3. Finalités du traitement">
            <p>Tes données sont utilisées pour :</p>
            <ul>
              <li>créer et gérer ton compte utilisateur</li>
              <li>analyser ton CV par IA pour extraire ton profil professionnel</li>
              <li>calculer le matching IA entre ton profil et les offres disponibles</li>
              <li>envoyer tes candidatures aux recruteurs via email</li>
              <li>te notifier (push, email) selon tes préférences</li>
              <li>améliorer le service via des statistiques d&apos;usage anonymisées</li>
              <li>assurer la sécurité du service et prévenir la fraude</li>
              <li>respecter nos obligations légales (vérification d&apos;âge, audit logs)</li>
            </ul>
          </Section>

          <Section id="bases-legales" title="4. Bases légales (RGPD Art. 6)">
            <ul>
              <li>
                <strong>Exécution du contrat (Art. 6.1.b) :</strong> fourniture du service, gestion
                de compte, candidatures.
              </li>
              <li>
                <strong>Consentement (Art. 6.1.a) :</strong> notifications push, emails marketing,
                cookies analytiques.
              </li>
              <li>
                <strong>Obligation légale (Art. 6.1.c) :</strong> vérification d&apos;âge des
                mineurs, conservation des logs d&apos;audit.
              </li>
              <li>
                <strong>Intérêt légitime (Art. 6.1.f) :</strong> sécurité du service, matching IA,
                prévention de l&apos;abus.
              </li>
            </ul>
          </Section>

          <Section id="destinataires" title="5. Destinataires des données">
            <p>Tes données sont accessibles uniquement aux personnes habilitées de SwipeJob.</p>
            <p>
              Elles peuvent être traitées par les sous-traitants suivants, choisis pour leur niveau
              de garanties RGPD (Annexe DPA signé) :
            </p>
            <ul>
              <li>
                <strong>Supabase</strong> (hébergement base de données — UE Frankfurt)
              </li>
              <li>
                <strong>Vercel</strong> (hébergement application web — UE)
              </li>
              <li>
                <strong>Railway</strong> (hébergement worker — UE)
              </li>
              <li>
                <strong>Cloudflare</strong> (stockage CV via R2 — juridiction EU)
              </li>
              <li>
                <strong>Upstash</strong> (cache et files d&apos;attente — UE Frankfurt)
              </li>
              <li>
                <strong>Google</strong> (OAuth d&apos;authentification — données minimales)
              </li>
              <li>
                <strong>Mistral AI</strong> (analyse IA de ton CV et matching — France)
              </li>
              <li>
                <strong>PostHog</strong> (analytics produit — Frankfurt EU)
              </li>
              <li>
                <strong>Sentry</strong> (suivi des erreurs techniques — Allemagne)
              </li>
              <li>
                <strong>France Travail / Adzuna</strong> (sources d&apos;offres — données publiques
                d&apos;entreprise uniquement, pas tes données personnelles)
              </li>
            </ul>
            <p>
              Lorsque tu candidates à une offre, ton email et ton CV sont communiqués au recruteur
              destinataire de la candidature.
            </p>
          </Section>

          <Section id="transferts" title="6. Transferts hors Union Européenne">
            <p>
              <strong>Nous ne réalisons aucun transfert volontaire de tes données hors UE.</strong>{' '}
              Tous nos sous-traitants principaux opèrent depuis l&apos;Union Européenne, et nous
              imposons des clauses contractuelles types (SCC) à tout prestataire dont l&apos;entité
              mère se trouve hors UE.
            </p>
          </Section>

          <Section id="duree" title="7. Durée de conservation">
            <ul>
              <li>
                <strong>Compte actif :</strong> tant que tu utilises le service.
              </li>
              <li>
                <strong>Compte inactif :</strong> anonymisation automatique après 24 mois sans
                connexion.
              </li>
              <li>
                <strong>Suppression demandée :</strong> effacement définitif sous 30 jours maximum.
              </li>
              <li>
                <strong>Logs d&apos;audit (sécurité, RGPD) :</strong> 13 mois.
              </li>
              <li>
                <strong>Cookies analytiques :</strong> 13 mois maximum (recommandation CNIL).
              </li>
              <li>
                <strong>Données nécessaires aux obligations légales :</strong> selon les durées
                imposées par la loi (jusqu&apos;à 5 ans pour certains documents).
              </li>
            </ul>
          </Section>

          <Section id="droits" title="8. Tes droits">
            <p>Conformément au RGPD, tu disposes des droits suivants sur tes données :</p>
            <ul>
              <li>
                <strong>Droit d&apos;accès (Art. 15) :</strong> obtenir une copie des données te
                concernant.
              </li>
              <li>
                <strong>Droit de rectification (Art. 16) :</strong> corriger des données inexactes.
              </li>
              <li>
                <strong>Droit à l&apos;effacement (Art. 17) :</strong> demander la suppression de
                tes données.
              </li>
              <li>
                <strong>Droit à la limitation (Art. 18) :</strong> demander la limitation du
                traitement.
              </li>
              <li>
                <strong>Droit à la portabilité (Art. 20) :</strong> récupérer tes données dans un
                format structuré.
              </li>
              <li>
                <strong>Droit d&apos;opposition (Art. 21) :</strong> t&apos;opposer au traitement
                pour des motifs légitimes.
              </li>
              <li>
                <strong>Droit de retirer ton consentement</strong> à tout moment (analytics,
                notifications).
              </li>
            </ul>
            <p>
              Pour exercer ces droits, contacte-nous à{' '}
              <a href="mailto:dpo@swipejob.fr">dpo@swipejob.fr</a> ou utilise les fonctionnalités
              self-service dans <a href="/profil">ton profil</a>.
            </p>
          </Section>

          <Section id="mineurs" title="9. Protection des mineurs">
            <p>
              SwipeJob n&apos;est pas accessible aux enfants de moins de 13 ans. Pour les mineurs
              âgés de 13 à 17 ans, le consentement préalable d&apos;un parent ou tuteur légal est
              obligatoirement recueilli avant toute utilisation du service.
            </p>
            <p>
              Le parent peut à tout moment exercer les droits du mineur en nous contactant à{' '}
              <a href="mailto:dpo@swipejob.fr">dpo@swipejob.fr</a>.
            </p>
          </Section>

          <Section id="securite" title="10. Sécurité">
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour
              protéger tes données :
            </p>
            <ul>
              <li>chiffrement en transit (TLS 1.3) et au repos (AES-256)</li>
              <li>contrôles d&apos;accès stricts et journalisation des accès</li>
              <li>tests de sécurité réguliers et veille des vulnérabilités</li>
              <li>séparation des environnements (production / développement)</li>
              <li>pseudonymisation des identifiants utilisateur dans les logs</li>
            </ul>
          </Section>

          <Section id="dpo" title="11. Contact Délégué à la Protection des Données">
            <p>
              Pour toute question relative à tes données personnelles :{' '}
              <a href="mailto:dpo@swipejob.fr">dpo@swipejob.fr</a>
            </p>
          </Section>

          <Section id="cnil" title="12. Réclamation auprès de la CNIL">
            <p>
              Si tu estimes que tes droits ne sont pas respectés, tu peux introduire une réclamation
              auprès de la Commission Nationale de l&apos;Informatique et des Libertés (CNIL) :
            </p>
            <ul>
              <li>
                Site web :{' '}
                <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noreferrer">
                  cnil.fr/fr/plaintes
                </a>
              </li>
              <li>Adresse : 3 Place de Fontenoy, TSA 80715, 75334 PARIS CEDEX 07</li>
            </ul>
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
