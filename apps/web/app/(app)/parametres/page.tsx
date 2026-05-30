import { eq } from 'drizzle-orm';
import { Bell, Settings as SettingsIcon } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { env } from '@/lib/env';
import { preferences } from '@swipejob/db/schema';
import { FadeIn } from '@/components/shared/motion/FadeIn';
import { Stagger } from '@/components/shared/motion/Stagger';
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
      <FadeIn>
        <header className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-caption font-semibold tracking-wide text-neutral-700 ring-1 ring-neutral-200">
            <SettingsIcon className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
            Réglages
          </span>
          <h1 className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold leading-[1.05] text-neutral-900 sm:text-6xl">
            Mes <span className="italic text-neutral-400">paramètres</span>
          </h1>
          <p className="text-body-md leading-relaxed text-neutral-600">
            Gère tes notifications, emails et préférences de candidature.
          </p>
        </header>
      </FadeIn>

      <Stagger stagger={0.1} initialDelay={0.15} className="space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="h-1 bg-neutral-900" />
          <div className="p-6">
            <NotificationsForm initial={initial} />
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="h-1 bg-neutral-900" />
          <div className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f7f5f1] text-neutral-700 ring-1 ring-neutral-200">
                <Bell className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-neutral-900">
                  Notifications navigateur
                </h2>
                <p className="mt-0.5 text-caption text-neutral-500">
                  Recevoir des notifications même quand l&apos;app est fermée.
                </p>
              </div>
            </div>
            <PushOptIn vapidPublicKey={env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY} />
          </div>
        </section>
      </Stagger>
    </div>
  );
}
