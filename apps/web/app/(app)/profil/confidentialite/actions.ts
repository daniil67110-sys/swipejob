'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth';
import { updateConsent, type ConsentPurpose } from '@/lib/consents';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

const updateSchema = z.object({
  purpose: z.enum(['matching_ai', 'analytics_product', 'marketing_emails', 'email_scanning']),
  granted: z.boolean(),
});

/** Story 6.2 — toggle d'une finalité de consentement. */
export async function updateConsentAction(input: {
  purpose: ConsentPurpose;
  granted: boolean;
}): Promise<ActionResult<{ granted: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Paramètres invalides.' } };
  }
  const result = await updateConsent({
    userId: session.user.id,
    purpose: parsed.data.purpose,
    granted: parsed.data.granted,
  });
  if (!result.ok) {
    return { ok: false, error: { code: 'UPDATE_FAILED', message: result.error } };
  }
  return { ok: true, data: { granted: result.granted } };
}
