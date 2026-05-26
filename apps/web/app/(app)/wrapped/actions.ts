'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth';
import { captureServer, hashUserId } from '@/lib/analytics';

const trackSchema = z.object({
  channel: z.enum(['instagram', 'linkedin', 'invite', 'dashboard', 'download']),
  applicationId: z.string().min(1).max(40),
});

/** Story 5.5 — Posthog `wrapped.shared {channel}`. */
export async function trackWrappedShareAction(input: {
  channel: 'instagram' | 'linkedin' | 'invite' | 'dashboard' | 'download';
  applicationId: string;
}): Promise<{ ok: true } | { ok: false }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };
  const parsed = trackSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  captureServer('wrapped.shared', hashUserId(session.user.id), {
    channel: parsed.data.channel,
  });
  return { ok: true };
}
