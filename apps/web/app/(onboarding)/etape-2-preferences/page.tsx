import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Settings2 } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { preferences } from '@swipejob/db/schema';
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
    <div className="mx-auto max-w-2xl space-y-6 p-6 pt-10 pb-12">
      <header className="space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-info-100 to-success-100 text-primary-600 text-caption font-semibold tracking-wide">
          <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
          Étape 2 sur 2
        </span>
        <h1 className="text-display-lg font-display font-bold text-neutral-900 leading-[1.05]">
          Tes{' '}
          <span className="bg-gradient-to-r from-info-500 via-primary-500 to-success-500 bg-clip-text text-transparent">
            préférences
          </span>
        </h1>
        <p className="text-body-md text-neutral-600">
          Tout est optionnel. Plus tu remplis, plus les offres seront pertinentes. Tu pourras
          modifier à tout moment depuis ton profil.
        </p>
      </header>

      <div className="relative rounded-2xl bg-white shadow-md overflow-hidden border border-neutral-100">
        <div className="h-1.5 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />
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
    </div>
  );
}
