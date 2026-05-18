import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
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
        <p className="text-sm text-neutral-600">Service non configuré.</p>
      </div>
    );
  }

  const rows = await db.select().from(preferences).where(eq(preferences.userId, userId)).limit(1);
  const existing = rows[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Tes préférences de recherche</h1>
        <p className="text-sm text-neutral-600">
          Tout est optionnel. Plus tu remplis, plus les offres seront pertinentes. Tu pourras
          modifier à tout moment depuis ton profil.
        </p>
      </div>

      <PreferencesForm
        initial={{
          contractTypes: existing?.contractTypes ?? [],
          durations: existing?.durations ?? [],
          citiesCsv: existing?.cities?.join(', ') ?? '',
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
  );
}
