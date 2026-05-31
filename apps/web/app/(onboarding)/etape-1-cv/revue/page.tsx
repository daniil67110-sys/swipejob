import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Briefcase, CheckSquare, GraduationCap, ScanLine } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { profiles } from '@swipejob/db/schema';
import { FadeIn } from '@/components/shared/motion/FadeIn';
import { Stagger } from '@/components/shared/motion/Stagger';
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
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl border border-orange-200 bg-white shadow-sm">
            <div className="h-1 bg-orange-500" />
            <div className="space-y-3 p-8">
              <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold leading-tight text-neutral-900">
                Pas encore de <span className="italic text-neutral-400">profil</span>
              </h1>
              <p className="text-body-sm text-neutral-600">
                Ton CV n&apos;a pas encore été analysé.{' '}
                <a
                  className="font-semibold text-orange-600 underline decoration-orange-300 underline-offset-2 hover:decoration-orange-500"
                  href="/etape-1-cv"
                >
                  Reviens en arrière →
                </a>
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 pt-10 pb-16">
      <FadeIn>
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-caption font-semibold text-neutral-700 ring-1 ring-neutral-200">
            <ScanLine className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
            Vérification CV
          </span>
          <h1 className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold leading-[1.05] text-neutral-900 sm:text-6xl">
            Vérifie les <span className="italic text-neutral-400">infos extraites</span>
          </h1>
          <p className="text-body-md leading-relaxed text-neutral-600">
            Voici ce qu&apos;on a trouvé dans ton CV. Corrige si besoin et valide pour continuer.
          </p>
        </header>
      </FadeIn>

      <Stagger className="space-y-6" stagger={0.08} initialDelay={0.15}>
        <SectionCard icon={CheckSquare} title="Identité">
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
        </SectionCard>

        <SectionCard icon={GraduationCap} title="École & niveau">
          <SchoolEducationSection
            initialSchool={profile.currentSchool}
            initialLevel={profile.educationLevel}
          />
        </SectionCard>

        {profile.experiences && profile.experiences.length > 0 ? (
          <SectionCard icon={Briefcase} title="Expériences">
            <ul className="space-y-2 text-body-sm">
              {profile.experiences.map((e, i) => (
                <li key={i} className="text-neutral-700">
                  <strong className="text-neutral-900">{e.title ?? 'Poste'}</strong> ·{' '}
                  {e.company ?? '—'}
                </li>
              ))}
            </ul>
          </SectionCard>
        ) : null}

        {profile.educations && profile.educations.length > 0 ? (
          <SectionCard icon={GraduationCap} title="Formation">
            <ul className="space-y-2 text-body-sm">
              {profile.educations.map((e, i) => (
                <li key={i} className="text-neutral-700">
                  <strong className="text-neutral-900">{e.school ?? 'École'}</strong> ·{' '}
                  {e.degree ?? '—'}
                </li>
              ))}
            </ul>
          </SectionCard>
        ) : null}
      </Stagger>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
      <div className="h-1 bg-neutral-900" />
      <div className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-sm">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-neutral-900">
            {title}
          </h2>
        </div>
        {children}
      </div>
    </div>
  );
}
