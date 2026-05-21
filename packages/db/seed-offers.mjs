/**
 * Seed dev — 50 offres fictives + match_scores pour tous les users existants.
 * Pour tester le flow swipe → application → lettre IA sans dépendre de
 * France Travail / Adzuna.
 *
 * Run : `cd packages/db && node seed-offers.mjs`
 */
import { config } from 'dotenv';
import postgres from 'postgres';
import { createId } from '@paralleldrive/cuid2';

config({ path: '../../.env.local' });

const sql = postgres(process.env.DATABASE_URL, { max: 5 });

const TITLES = [
  'Développeur Frontend React (alternance)',
  'Data Analyst (stage)',
  'Chef de projet digital junior',
  'Assistant marketing communication',
  'Data Scientist (stage M2)',
  'UX/UI Designer (alternance)',
  'Développeur Backend Node.js',
  'Ingénieur DevOps junior',
  'Analyste financier (stage)',
  'Consultant SAP (alternance)',
  'Community Manager (stage)',
  'Chargé de recrutement (alternance)',
  'Auditeur junior (stage Big 4)',
  'Développeur Mobile iOS (stage)',
  'Product Manager assistant',
  'Growth Hacker (stage)',
  'Data Engineer (alternance)',
  'Business Analyst (stage)',
  'Ingénieur cybersécurité (alternance)',
  'Chargé SEO (stage)',
  'Développeur Fullstack TypeScript',
  'Assistant chef de produit',
  'Ingénieur QA automatisation (stage)',
  'Data Analyst marketing (stage)',
  'Scrum Master junior (alternance)',
  'Développeur Python ML (stage)',
  'Architecte cloud junior (alternance)',
  'Designer 3D / motion (stage)',
  'Chargé de partenariats (alternance)',
  'Consultant business intelligence',
  'Ingénieur full-stack (alternance)',
  'Assistant DPO RGPD (stage)',
  'Chargé événementiel (alternance)',
  'Analyste data marketing (stage)',
  'Développeur Vue.js (alternance)',
  'Lead generation B2B (stage)',
  'Chargé contenu éditorial (alternance)',
  'Auditeur RSE (stage)',
  'Ingénieur réseau (alternance)',
  'Développeur Go microservices (stage)',
  'Consultant transformation digitale',
  'Account Manager junior (stage)',
  'Ingénieur traitement signal (stage)',
  'Chargé acquisition payante (alternance)',
  'Développeur Rust embedded (stage)',
  'Brand Manager assistant (alternance)',
  'Chargé de mission ESG (stage)',
  'Tech lead junior fullstack',
  'Data Steward (alternance)',
  "Chargé d'études marketing (stage)",
];

const COMPANIES = [
  'Doctolib',
  'Qonto',
  'Alan',
  'Mirakl',
  'BlaBlaCar',
  'Back Market',
  'Algolia',
  'OVHcloud',
  'Dataiku',
  'Contentsquare',
  'PayFit',
  'Swile',
  'Mistral AI',
  'Hugging Face',
  'Sorare',
  'Klaxoon',
  'Voodoo',
  'Spendesk',
  'Pennylane',
  'Vestiaire Collective',
  'BNP Paribas',
  'Crédit Agricole',
  'AXA',
  'TotalEnergies',
  'Renault',
];

const CITIES = [
  ['Paris', 48.8566, 2.3522],
  ['Lyon', 45.7578, 4.832],
  ['Bordeaux', 44.8378, -0.5792],
  ['Toulouse', 43.6047, 1.4442],
  ['Nantes', 47.2184, -1.5536],
  ['Lille', 50.6292, 3.0573],
  ['Marseille', 43.2965, 5.3698],
  ['Strasbourg', 48.5734, 7.7521],
  ['Montpellier', 43.6108, 3.8767],
  ['Rennes', 48.1173, -1.6778],
];

const SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Python',
  'SQL',
  'Excel',
  'Tableau',
  'PowerBI',
  'Git',
  'Docker',
  'Kubernetes',
  'AWS',
  'Figma',
  'Photoshop',
  'GA4',
  'HubSpot',
  'Salesforce',
  'Notion',
  'PostgreSQL',
];

const CONTRACTS = ['stage', 'alternance'];
const MODES = ['on-site', 'hybrid', 'remote'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickN(arr, n) {
  const c = [...arr];
  const out = [];
  for (let i = 0; i < Math.min(n, arr.length); i++) {
    const idx = Math.floor(Math.random() * c.length);
    out.push(c.splice(idx, 1)[0]);
  }
  return out;
}

try {
  // 1. Source seed
  let sourceId;
  const existing = await sql`SELECT id FROM offer_sources WHERE name = 'seed-dev' LIMIT 1`;
  if (existing[0]) {
    sourceId = existing[0].id;
    console.log('Source "seed-dev" déjà existante:', sourceId);
  } else {
    sourceId = createId();
    await sql`INSERT INTO offer_sources (id, name, enabled, last_sync_at) VALUES (${sourceId}, 'seed-dev', true, NOW())`;
    console.log('Source "seed-dev" créée:', sourceId);
  }

  // 2. Offers
  const offers = [];
  const now = new Date();
  for (let i = 0; i < TITLES.length; i++) {
    const title = TITLES[i];
    const city = pick(CITIES);
    const contractType = pick(CONTRACTS);
    const remoteMode = pick(MODES);
    const skills = pickN(SKILLS, 3 + Math.floor(Math.random() * 3));
    const salaryMin = contractType === 'stage' ? 600 + Math.floor(Math.random() * 400) : 1200 + Math.floor(Math.random() * 600);
    const salaryMax = salaryMin + 200 + Math.floor(Math.random() * 500);
    offers.push({
      id: createId(),
      sourceId,
      externalId: `seed-${i}`,
      title,
      description: `Nous recherchons un·e ${title.toLowerCase()} motivé·e pour rejoindre notre équipe. Compétences attendues : ${skills.join(', ')}. Environnement bienveillant et formateur.`,
      companyName: pick(COMPANIES),
      contractType,
      locationCity: city[0],
      locationLat: city[1],
      locationLng: city[2],
      remoteMode,
      salaryMinMonthly: salaryMin,
      salaryMaxMonthly: salaryMax,
      requirements: JSON.stringify({ skills }),
      sourceUrl: `https://exemple.fr/offre/seed-${i}`,
      contactEmail: `recrutement+seed${i}@example.test`,
      qualityScore: 0.7 + Math.random() * 0.3,
      publishedAt: new Date(now.getTime() - Math.random() * 7 * 86400000),
      normalizedAt: now,
      dedupedAt: now,
    });
  }

  // Insert + ON CONFLICT (source_id, external_id) DO NOTHING
  let inserted = 0;
  for (const o of offers) {
    const res = await sql`
      INSERT INTO offers (
        id, source_id, external_id, title, description, company_name,
        contract_type, location_city, location_lat, location_lng, remote_mode,
        salary_min_monthly, salary_max_monthly, requirements,
        source_url, contact_email, quality_score, published_at,
        normalized_at, deduped_at, status, is_active, created_at, updated_at
      ) VALUES (
        ${o.id}, ${o.sourceId}, ${o.externalId}, ${o.title}, ${o.description}, ${o.companyName},
        ${o.contractType}, ${o.locationCity}, ${o.locationLat}, ${o.locationLng}, ${o.remoteMode},
        ${o.salaryMinMonthly}, ${o.salaryMaxMonthly}, ${o.requirements}::jsonb,
        ${o.sourceUrl}, ${o.contactEmail}, ${o.qualityScore}, ${o.publishedAt},
        ${o.normalizedAt}, ${o.dedupedAt}, 'active', true, NOW(), NOW()
      )
      ON CONFLICT (source_id, external_id) DO NOTHING
      RETURNING id
    `;
    if (res.length > 0) inserted++;
  }
  console.log(`✅ ${inserted} offres insérées (${TITLES.length - inserted} déjà existantes)`);

  // 3. Match scores pour tous les users existants
  const users = await sql`SELECT id, email FROM users WHERE deleted_at IS NULL`;
  console.log(`Users actifs: ${users.length}`);

  const allOffers = await sql`SELECT id FROM offers WHERE source_id = ${sourceId}`;

  let matchInserted = 0;
  for (const u of users) {
    for (const o of allOffers) {
      const score = Math.round((0.55 + Math.random() * 0.4) * 100); // 55-95 (échelle 0-100, alignée sur compositeScore())
      const explanation = JSON.stringify({
        contributingFactors: [
          { factor: 'pref_contract_type', weight: 0.25, value: true },
          { factor: 'pref_city', weight: 0.2, value: true },
          { factor: 'cosine_skills', weight: 0.5, value: score - 0.1 },
        ],
        modelVersion: 'seed-dev',
      });
      const res = await sql`
        INSERT INTO match_scores (id, user_id, offer_id, score, explanation, computed_at)
        VALUES (${createId()}, ${u.id}, ${o.id}, ${score}, ${explanation}::jsonb, NOW())
        ON CONFLICT (user_id, offer_id) DO UPDATE SET score = EXCLUDED.score, computed_at = NOW()
        RETURNING id
      `;
      if (res.length > 0) matchInserted++;
    }
    console.log(`  - ${u.email}: ${allOffers.length} matches`);
  }
  console.log(`✅ ${matchInserted} match_scores upserted`);
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exit(1);
} finally {
  await sql.end();
}
