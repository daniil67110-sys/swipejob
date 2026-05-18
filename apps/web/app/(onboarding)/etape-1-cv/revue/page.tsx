import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { requireVerifiedAuth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { profiles } from '@swipejob/db/schema';
import { ReviewCvForm } from './ReviewCvForm';

export default async function RevueCvPage() {
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

  const rows = await db
    .select({
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      headline: profiles.headline,
      summary: profiles.summary,
      phone: profiles.phone,
      city: profiles.city,
      linkedinUrl: profiles.linkedinUrl,
      experiences: profiles.experiences,
      educations: profiles.educations,
      skills: profiles.skills,
      languages: profiles.languages,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  const profile = rows[0];
  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl p-8 space-y-4">
        <h1 className="text-2xl font-bold">Pas encore de profil</h1>
        <p className="text-sm text-neutral-600">
          Ton CV n'a pas encore été analysé.{' '}
          <a className="font-medium text-primary-500 hover:underline" href="/etape-1-cv">
            Reviens en arrière
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Vérifie les infos extraites</h1>
        <p className="text-sm text-neutral-600">
          Voici ce qu'on a trouvé dans ton CV. Corrige si besoin et valide pour continuer.
        </p>
      </div>

      <ReviewCvForm
        initial={{
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          headline: profile.headline ?? '',
          summary: profile.summary ?? '',
          phone: profile.phone ?? '',
          city: profile.city ?? '',
          linkedinUrl: profile.linkedinUrl ?? '',
        }}
      />

      {/* Lecture seule V1 — édition listes en Story 1.9/1.10 */}
      {profile.experiences && profile.experiences.length > 0 ? (
        <section className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50 p-4">
          <h2 className="text-base font-semibold">Expériences</h2>
          <ul className="space-y-2 text-sm">
            {profile.experiences.map((e, i) => (
              <li key={i}>
                <strong>{e.title ?? 'Poste'}</strong> · {e.company ?? '—'}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {profile.educations && profile.educations.length > 0 ? (
        <section className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50 p-4">
          <h2 className="text-base font-semibold">Formation</h2>
          <ul className="space-y-2 text-sm">
            {profile.educations.map((e, i) => (
              <li key={i}>
                <strong>{e.school ?? 'École'}</strong> · {e.degree ?? '—'}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
