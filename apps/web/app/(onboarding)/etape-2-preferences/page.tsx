import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Settings2 } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { preferences } from '@swipejob/db/schema';
import { FadeIn } from '@/components/shared/motion/FadeIn';
import { PreferencesForm } from './PreferencesForm';

export default async function EtapePreferencesPage() {
  const session = await requireVerifiedAuth({});
  const userId = session.user?.id;
  if (!userId) redirect('/inscription');

  if (!isDatabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-body-sm text-neutral-600">Service non configuré.</p>
      </div>
    );
  }

  const rows = await db.select().from(preferences).where(eq(preferences.userId, userId)).limit(1);
  const existing = rows[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 pt-10 pb-16">
      <FadeIn>
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-caption font-semibold text-neutral-700 ring-1 ring-neutral-200">
            <Settings2 className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
            Étape 2 sur 2
          </span>
          <h1 className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold leading-[1.05] text-neutral-900 sm:text-6xl">
            Tes <span className="italic text-neutral-400">préférences</span>
          </h1>
          <p className="text-body-md leading-relaxed text-neutral-600">
            Tout est optionnel. Plus tu remplis, plus les offres seront pertinentes. Tu pourras
            modifier à tout moment depuis ton profil.
          </p>
        </header>
      </FadeIn>

      <FadeIn delay={0.15}>
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="h-1 bg-neutral-900" />
          <div className="p-6">
            <PreferencesForm
              initial={{
                contractTypes: existing?.contractTypes ?? [],
                durations: existing?.durations ?? [],
                citiesGeo: existing?.citiesGeo ?? [],
                geoRadiusKm: existing?.geoRadiusKm ?? 50,
                workModes: existing?.workModes ?? [],
                sectors: existing?.sectors ?? [],
                companySizes: existing?.companySizes ?? [],
                salaryMinMonthly: existing?.salaryMinMonthly ?? undefined,
                salaryMaxMonthly: existing?.salaryMaxMonthly ?? undefined,
                desiredStartDate: existing?.desiredStartDate ?? '',
              }}
            />
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
