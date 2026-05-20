import 'server-only';
import { sql } from 'drizzle-orm';
import { db } from './db';

export const EDUCATION_LEVELS = [
  'Lycée',
  'BTS/DUT',
  'Licence',
  'Bachelor',
  'Master',
  "École d'ingénieur",
  'Doctorat',
] as const;

export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export function normalizeSchoolName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Échappe les wildcards ILIKE (% et _) + le backslash d'échappement.
 * Défense en profondeur : `normalizeSchoolName` les supprime déjà, mais on
 * ajoute ESCAPE '\' au cas où la regex évolue. Évite DoS scans cartographiques.
 */
function escapeIlikeWildcards(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export async function searchSchools(query: string, limit = 10) {
  const normalized = normalizeSchoolName(query);
  if (!normalized) return [];
  const ilikePattern = '%' + escapeIlikeWildcards(normalized) + '%';

  // pg_trgm similarity — threshold 0.3 par défaut, on prend les 10 meilleurs.
  // Fallback : ILIKE prefix si pg_trgm indispo.
  try {
    const rows = await db.execute(sql<{
      id: string;
      name: string;
      type: string | null;
      city: string | null;
      score: number;
    }>`
      SELECT id, name, type, city, similarity(name_normalized, ${normalized}) AS score
      FROM schools
      WHERE name_normalized % ${normalized}
        OR name_normalized ILIKE ${ilikePattern} ESCAPE '\\'
      ORDER BY score DESC NULLS LAST, name ASC
      LIMIT ${limit}
    `);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      city: r.city,
    }));
  } catch {
    const rows = await db.execute(sql<{
      id: string;
      name: string;
      type: string | null;
      city: string | null;
    }>`
      SELECT id, name, type, city
      FROM schools
      WHERE name_normalized ILIKE ${ilikePattern} ESCAPE '\\'
      ORDER BY name ASC
      LIMIT ${limit}
    `);
    return rows;
  }
}
