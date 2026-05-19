import { eq } from 'drizzle-orm';
import { requireVerifiedAuth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { env } from '@/lib/env';
import { preferences } from '@swipejob/db/schema';
import { NotificationsForm, type NotificationSettings } from './NotificationsForm';
import { PushOptIn } from './PushOptIn';

export const metadata = {
  title: 'Paramètres — SwipeJob',
};

const DEFAULTS: NotificationSettings = {
  pushEnabled: false,
  pushTime: '08:00',
  emailMarketingEnabled: false,
  emailDigestEnabled: false,
  emailDigestFrequency: 'weekly',
  reviewBeforeSend: false,
};

export default async function ParametresPage() {
  const session = await requireVerifiedAuth({});
  const userId = session.user?.id;
  if (!userId) return null;

  let initial = DEFAULTS;
  if (isDatabaseConfigured) {
    const rows = await db.select().from(preferences).where(eq(preferences.userId, userId)).limit(1);
    const p = rows[0];
    if (p) {
      initial = {
        pushEnabled: p.pushEnabled,
        pushTime: p.pushTime,
        emailMarketingEnabled: p.emailMarketingEnabled,
        emailDigestEnabled: p.emailDigestEnabled,
        emailDigestFrequency: (p.emailDigestFrequency as 'weekly' | 'never') ?? 'weekly',
        reviewBeforeSend: p.reviewBeforeSend,
      };
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-sm text-neutral-600">
          Gère tes notifications, emails et préférences de candidature.
        </p>
      </header>
      <NotificationsForm initial={initial} />
      <section className="rounded-lg border border-neutral-200 bg-neutral-0 p-4">
        <h2 className="mb-3 text-sm font-semibold">Notifications navigateur</h2>
        <PushOptIn vapidPublicKey={env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY} />
      </section>
    </div>
  );
}
