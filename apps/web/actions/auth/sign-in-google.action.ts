'use server';

import { signIn } from '@/lib/auth';

/**
 * Server Action wrapping Auth.js v5 signIn('google').
 * Lance le redirect OAuth Google avec le scope email+profile.
 *
 * Tous les users (signup ou login) atterrissent sur /post-signup qui décide
 * de la destination finale (etape-1-cv pour nouveaux, deck pour returning).
 */
export async function signInWithGoogleAction(nextPath?: string): Promise<void> {
  const redirectTo = nextPath ?? '/post-signup';
  await signIn('google', { redirectTo });
}
