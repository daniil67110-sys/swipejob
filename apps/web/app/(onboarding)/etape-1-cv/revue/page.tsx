import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Briefcase, CheckSquare, GraduationCap, ScanLine } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { profiles } from '@swipejob/db/schema';
import { ReviewCvForm } from './ReviewCvForm';
import { SchoolEducationSection } from './SchoolEducationSection';

export default async function RevueCvPage() {
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
      currentSchool: profiles.currentSchool,
      educationLevel: profiles.educationLevel,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  const profile = rows[0];
  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl p-6 pt-10">
        <div className="relative rounded-2xl bg-white shadow-md overflow-hidden border border-warning-100">
          <div className="h-1.5 bg-gradient-to-r from-warning-500 to-error-500" />
          <div className="p-8 space-y-3">
            <h1 className="text-display-md font-display font-bold text-neutral-900">
              Pas encore de profil
            </h1>
            <p className="text-body-sm text-neutral-600">
              Ton CV n&apos;a pas encore été analysé.{' '}
              <a
                className="font-semibold text-primary-500 hover:text-primary-600 hover:underline"
                href="/etape-1-cv"
              >
                Reviens en arrière →
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6 pt-10 space-y-6 pb-12">
      <header className="space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-info-100 to-success-100 text-primary-600 text-caption font-semibold tracking-wide">
          <ScanLine className="w-3.5 h-3.5" aria-hidden="true" />
          Vérification CV
        </span>
        <h1 className="text-display-lg font-display font-bold text-neutral-900 leading-[1.05]">
          Vérifie les{' '}
          <span className="bg-gradient-to-r from-info-500 via-primary-500 to-success-500 bg-clip-text text-transparent">
            infos extraites
          </span>
        </h1>
        <p className="text-body-md text-neutral-600">
          Voici ce qu&apos;on a trouvé dans ton CV. Corrige si besoin et valide pour continuer.
        </p>
      </header>

      <div className="relative rounded-2xl bg-white shadow-sm overflow-hidden border border-neutral-100">
        <div className="h-1.5 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-10 h-10 rounded-xl bg-info-100 text-info-500 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" aria-hidden="true" />
            </span>
            <h2 className="text-heading-md font-semibold text-neutral-900">Identité</h2>
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
        </div>
      </div>

      <div className="relative rounded-2xl bg-white shadow-sm overflow-hidden border border-neutral-100">
        <div className="h-1.5 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-10 h-10 rounded-xl bg-primary-100 text-primary-500 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" aria-hidden="true" />
            </span>
            <h2 className="text-heading-md font-semibold text-neutral-900">École & niveau</h2>
          </div>
          <SchoolEducationSection
            initialSchool={profile.currentSchool}
            initialLevel={profile.educationLevel}
          />
        </div>
      </div>

      {profile.experiences && profile.experiences.length > 0 ? (
        <div className="relative rounded-2xl bg-white shadow-sm overflow-hidden border border-neutral-100">
          <div className="h-1.5 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-xl bg-success-100 text-success-500 flex items-center justify-center">
                <Briefcase className="w-5 h-5" aria-hidden="true" />
              </span>
              <h2 className="text-heading-md font-semibold text-neutral-900">Expériences</h2>
            </div>
            <ul className="space-y-2 text-body-sm">
              {profile.experiences.map((e, i) => (
                <li key={i} className="text-neutral-700">
                  <strong className="text-neutral-900">{e.title ?? 'Poste'}</strong> ·{' '}
                  {e.company ?? '—'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {profile.educations && profile.educations.length > 0 ? (
        <div className="relative rounded-2xl bg-white shadow-sm overflow-hidden border border-neutral-100">
          <div className="h-1.5 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-xl bg-warning-100 text-warning-500 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" aria-hidden="true" />
              </span>
              <h2 className="text-heading-md font-semibold text-neutral-900">Formation</h2>
            </div>
            <ul className="space-y-2 text-body-sm">
              {profile.educations.map((e, i) => (
                <li key={i} className="text-neutral-700">
                  <strong className="text-neutral-900">{e.school ?? 'École'}</strong> ·{' '}
                  {e.degree ?? '—'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
