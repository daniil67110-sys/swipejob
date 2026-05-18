import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@swipejob/db/schema';

/**
 * Page-pivot post-OAuth : décide où envoyer l'utilisateur fraîchement authentifié.
 *
 * Heuristique : si `createdAt` < 60s → nouveau signup → onboarding `/etape-1-cv`.
 * Sinon → app `/deck`. Plus rapide qu'un query `profiles` (utilise l'index PK).
 *
 * Edge case : si un user clique signup à exactement 60s+ après son signup réel
 * (improbable), il atterrit sur /deck — bénin (il peut accéder à /etape-1-cv manuellement).
 */
export default async function PostSignupPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/inscription');
  }

  const userId = session.user.id;
  const [row] = await db
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) {
    redirect('/inscription');
  }

  const ageMs = Date.now() - row.createdAt.getTime();
  if (ageMs < 60_000) {
    redirect('/etape-1-cv');
  }
  redirect('/deck');
}
