import 'server-only';

export type AgeCategory = 'under_13' | 'minor' | 'adult';

/**
 * Calcule l'âge en années pleines à partir d'une date de naissance.
 * Gère correctement les anniversaires (la personne a son âge plein le jour
 * de son anniversaire, pas la veille).
 *
 * Toutes les comparaisons sont faites sur la timezone locale du serveur ;
 * acceptable pour V1 (les utilisateurs sont en France, le serveur est EU).
 */
export function computeAge(birthDate: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

export function categorizeAge(age: number): AgeCategory {
  if (age < 13) return 'under_13';
  if (age < 18) return 'minor';
  return 'adult';
}
