'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth';
import { captureServer, hashUserId } from '@/lib/analytics';

const trackSchema = z.object({
  channel: z.enum(['copy', 'native', 'whatsapp', 'sms', 'email']),
  code: z.string().min(4).max(12),
});

/** Story 5.3 — événement Posthog `referral.sent` (analytics seulement). */
export async function trackReferralShareAction(input: {
  channel: 'copy' | 'native' | 'whatsapp' | 'sms' | 'email';
  code: string;
}): Promise<{ ok: true } | { ok: false }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };
  const parsed = trackSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  captureServer('referral.sent', hashUserId(session.user.id), {
    channel: parsed.data.channel,
  });
  return { ok: true };
}
