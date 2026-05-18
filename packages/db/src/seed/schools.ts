/**
 * Seed minimal Story 1.9 : ~30 écoles FR connues.
 * D-1.9-001 : extension à 500+ en V2 (CSV import depuis ONISEP / data.gouv).
 *
 * Exécution : `pnpm --filter @swipejob/db tsx src/seed/schools.ts`
 * (nécessite DATABASE_URL).
 */
import { db } from '../client.js';
import { schools } from '../schema/schools.js';

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SEED: Array<{ name: string; acronym?: string; type: string; city: string }> = [
  // Ingénieurs
  { name: 'École Polytechnique', acronym: 'X', type: 'ingénieur', city: 'Palaiseau' },
  { name: 'CentraleSupélec', acronym: 'CS', type: 'ingénieur', city: 'Gif-sur-Yvette' },
  { name: 'Mines Paris - PSL', acronym: 'Mines', type: 'ingénieur', city: 'Paris' },
  {
    name: 'École des Ponts ParisTech',
    acronym: 'ENPC',
    type: 'ingénieur',
    city: 'Champs-sur-Marne',
  },
  { name: 'Télécom Paris', type: 'ingénieur', city: 'Palaiseau' },
  { name: 'INSA Lyon', type: 'ingénieur', city: 'Villeurbanne' },
  { name: 'École Centrale de Nantes', type: 'ingénieur', city: 'Nantes' },
  { name: 'École Centrale de Lille', type: 'ingénieur', city: "Villeneuve-d'Ascq" },
  { name: 'INSA Toulouse', type: 'ingénieur', city: 'Toulouse' },
  { name: 'Arts et Métiers ParisTech', acronym: 'ENSAM', type: 'ingénieur', city: 'Paris' },
  { name: 'EPITA', type: 'ingénieur', city: 'Le Kremlin-Bicêtre' },
  { name: 'EPITECH', type: 'ingénieur', city: 'Paris' },
  // Commerce
  { name: 'HEC Paris', type: 'commerce', city: 'Jouy-en-Josas' },
  { name: 'ESSEC Business School', type: 'commerce', city: 'Cergy' },
  { name: 'ESCP Business School', type: 'commerce', city: 'Paris' },
  { name: 'EM Lyon Business School', type: 'commerce', city: 'Écully' },
  { name: 'EDHEC Business School', type: 'commerce', city: 'Roubaix' },
  { name: 'SKEMA Business School', type: 'commerce', city: 'Sophia Antipolis' },
  { name: 'NEOMA Business School', type: 'commerce', city: 'Reims' },
  { name: 'Audencia Business School', type: 'commerce', city: 'Nantes' },
  // Universités
  { name: 'Université Paris-Saclay', type: 'université', city: 'Orsay' },
  { name: 'Université Paris 1 Panthéon-Sorbonne', type: 'université', city: 'Paris' },
  { name: 'Sorbonne Université', type: 'université', city: 'Paris' },
  { name: 'Université Paris-Dauphine - PSL', type: 'université', city: 'Paris' },
  { name: 'Université de Lyon', type: 'université', city: 'Lyon' },
  { name: 'Université de Toulouse', type: 'université', city: 'Toulouse' },
  { name: 'Aix-Marseille Université', type: 'université', city: 'Marseille' },
  { name: 'Université de Bordeaux', type: 'université', city: 'Bordeaux' },
  // Spécialisées
  { name: 'Sciences Po Paris', type: 'spécialisée', city: 'Paris' },
  { name: 'Sciences Po Lille', type: 'spécialisée', city: 'Lille' },
];

async function main() {
  for (const s of SEED) {
    const row = {
      name: s.name,
      nameNormalized: normalize(s.name + (s.acronym ? ' ' + s.acronym : '')),
      acronym: s.acronym ?? null,
      type: s.type,
      city: s.city,
    };
    await db.insert(schools).values(row).onConflictDoNothing();
  }
  // eslint-disable-next-line no-console
  console.warn(`[seed] ${SEED.length} schools inserted.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
