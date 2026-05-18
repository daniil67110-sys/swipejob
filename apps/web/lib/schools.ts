import 'server-only';
import { sql } from 'drizzle-orm';
import { db } from './db';

export const EDUCATION_LEVELS = [
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

export async function searchSchools(query: string, limit = 10) {
  const normalized = normalizeSchoolName(query);
  if (!normalized) return [];

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
        OR name_normalized ILIKE ${'%' + normalized + '%'}
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
    // Fallback simple ILIKE si pg_trgm indispo
    const rows = await db.execute(sql<{
      id: string;
      name: string;
      type: string | null;
      city: string | null;
    }>`
      SELECT id, name, type, city
      FROM schools
      WHERE name_normalized ILIKE ${'%' + normalized + '%'}
      ORDER BY name ASC
      LIMIT ${limit}
    `);
    return rows;
  }
}
