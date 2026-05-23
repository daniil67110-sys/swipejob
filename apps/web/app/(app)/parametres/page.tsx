import { eq } from 'drizzle-orm';
import { Bell, Settings as SettingsIcon } from 'lucide-react';
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
    <div className="mx-auto max-w-2xl space-y-8 p-6 pb-24">
      <header className="space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-info-100 to-success-100 text-primary-600 text-caption font-semibold tracking-wide">
          <SettingsIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Réglages
        </span>
        <h1 className="text-display-lg font-display font-bold text-neutral-900 leading-[1.05]">
          Mes{' '}
          <span className="bg-gradient-to-r from-info-500 via-primary-500 to-success-500 bg-clip-text text-transparent">
            paramètres
          </span>
        </h1>
        <p className="text-body-md text-neutral-600">
          Gère tes notifications, emails et préférences de candidature.
        </p>
      </header>

      <section className="relative rounded-2xl bg-white shadow-sm overflow-hidden border border-neutral-100">
        <div className="h-1 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />
        <div className="p-6">
          <NotificationsForm initial={initial} />
        </div>
      </section>

      <section className="relative rounded-2xl bg-white shadow-sm overflow-hidden border border-neutral-100">
        <div className="h-1 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 rounded-xl bg-info-100 text-info-500 flex items-center justify-center">
              <Bell className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-heading-md font-semibold text-neutral-900">
                Notifications navigateur
              </h2>
              <p className="text-caption text-neutral-500 mt-0.5">
                Recevoir des notifications même quand l&apos;app est fermée.
              </p>
            </div>
          </div>
          <PushOptIn vapidPublicKey={env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY} />
        </div>
      </section>
    </div>
  );
}
