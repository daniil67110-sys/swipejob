import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { desc } from 'drizzle-orm';
import {
  BookOpen,
  ChevronRight,
  FileText,
  Pencil,
  Search,
  Shield,
  Sparkles,
  Trophy,
  User as UserIcon,
} from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { cvs, preferences, profiles, userBadges, users } from '@swipejob/db/schema';
import type { LucideIcon } from 'lucide-react';
import { BADGE_CATALOG } from '@/lib/badges';
import { FadeIn } from '@/components/shared/motion/FadeIn';
import { Stagger } from '@/components/shared/motion/Stagger';

export default async function ProfilPage() {
  const session = await requireVerifiedAuth({});
  const userId = session.user?.id;
  if (!userId) return null;

  if (!isDatabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-body-sm text-neutral-600">Service non configuré.</p>
      </div>
    );
  }

  const [userRows, profileRows, prefRows, cvRows, badgeRows] = await Promise.all([
    db
      .select({ email: users.email, name: users.name, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1),
    db.select().from(preferences).where(eq(preferences.userId, userId)).limit(1),
    db
      .select({ version: cvs.version, originalFilename: cvs.originalFilename })
      .from(cvs)
      .where(eq(cvs.userId, userId))
      .orderBy(desc(cvs.version))
      .limit(1),
    db
      .select({ badgeCode: userBadges.badgeCode })
      .from(userBadges)
      .where(eq(userBadges.userId, userId)),
  ]);

  const user = userRows[0];
  const profile = profileRows[0];
  const pref = prefRows[0];
  const cv = cvRows[0];
  const unlockedBadgeCount = badgeRows.length;
  const totalBadges = BADGE_CATALOG.length;

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 pb-24">
      {/* Header */}
      <FadeIn>
        <header className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-caption font-semibold tracking-wide text-neutral-700 ring-1 ring-neutral-200">
            <UserIcon className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
            Mon compte
          </span>
          <h1 className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold leading-[1.05] text-neutral-900 sm:text-6xl">
            Mon <span className="italic text-neutral-400">profil</span>
          </h1>
          <p className="text-body-md leading-relaxed text-neutral-600">
            Tes informations personnelles et préférences de recherche.
          </p>
        </header>
      </FadeIn>

      {/* Engagement shortcuts FitMe */}
      <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2" stagger={0.1} initialDelay={0.15}>
        <Link
          href="/profil/badges"
          style={{ backgroundColor: '#0D0D14', color: '#ffffff' }}
          className="group relative block rounded-3xl shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="flex items-center gap-3 p-5">
            <span
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            >
              <Trophy className="h-6 w-6" strokeWidth={2.25} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p
                style={{ color: 'rgba(255,255,255,0.7)' }}
                className="text-caption font-semibold uppercase tracking-[0.18em]"
              >
                Mes badges
              </p>
              <p className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold leading-tight">
                {unlockedBadgeCount}{' '}
                <span style={{ color: 'rgba(255,255,255,0.5)' }} className="italic">
                  / {totalBadges}
                </span>
              </p>
            </div>
            <ChevronRight
              style={{ color: 'rgba(255,255,255,0.6)' }}
              className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </div>
        </Link>

        <Link
          href="/profil/parrainage"
          className="group relative block rounded-3xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center gap-3 p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f7f5f1] ring-1 ring-neutral-200">
              <Sparkles className="h-6 w-6 text-orange-500" strokeWidth={2.25} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-caption font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Parrainage
              </p>
              <p className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold leading-tight text-neutral-900">
                Inviter <span className="italic text-neutral-400">mes amis</span>
              </p>
            </div>
            <ChevronRight
              className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </div>
        </Link>
      </Stagger>

      <Stagger stagger={0.08} initialDelay={0.3} className="space-y-8">
        <Section title="Identité" icon={UserIcon} editHref="/etape-1-cv/revue">
          <Row label="Email" value={user?.email} />
          <Row label="Prénom" value={profile?.firstName} />
          <Row label="Nom" value={profile?.lastName} />
          <Row label="Titre" value={profile?.headline} />
          <Row label="Bio" value={profile?.summary} />
          <Row label="Téléphone" value={profile?.phone} />
          <Row label="Ville" value={profile?.city} />
          <Row label="LinkedIn" value={profile?.linkedinUrl} />
        </Section>

        <Section title="École & niveau" icon={BookOpen} editHref="/etape-1-cv/revue">
          <Row label="École" value={profile?.currentSchool?.name} />
          <Row label="Niveau" value={profile?.educationLevel} />
        </Section>

        <Section title="Préférences de recherche" icon={Search} editHref="/etape-2-preferences">
          <Row label="Contrats" value={pref?.contractTypes?.join(', ') ?? ''} />
          <Row label="Villes" value={pref?.cities?.join(', ') ?? ''} />
          <Row label="Mode de travail" value={pref?.workModes?.join(', ') ?? ''} />
          <Row label="Secteurs" value={pref?.sectors?.join(', ') ?? ''} />
          <Row
            label="Salaire (€/mois)"
            value={
              pref?.salaryMinMonthly || pref?.salaryMaxMonthly
                ? `${pref?.salaryMinMonthly ?? '?'} – ${pref?.salaryMaxMonthly ?? '?'}`
                : ''
            }
          />
        </Section>

        <Section title="CV" icon={FileText} editHref="/etape-1-cv">
          <Row label="Version" value={cv ? `v${cv.version}` : 'Aucun CV uploadé'} />
          <Row label="Fichier" value={cv?.originalFilename} />
        </Section>

        {/* Confidentialité hub (Stories 6.2-6.4) */}
        <Link
          href="/profil/confidentialite"
          className="group relative block overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="h-1 bg-neutral-900" />
          <div className="flex items-center gap-3 p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f7f5f1] ring-1 ring-neutral-200">
              <Shield className="h-5 w-5 text-neutral-700" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-body-md font-semibold text-neutral-900">
                Confidentialité <span className="italic text-neutral-400">&amp; RGPD</span>
              </p>
              <p className="mt-0.5 text-caption text-neutral-600">
                Consentements granulaires, export de tes données, suppression de compte.
              </p>
            </div>
            <ChevronRight
              className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </div>
        </Link>
      </Stagger>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  editHref,
  children,
}: {
  title: string;
  icon: LucideIcon;
  editHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="h-1 bg-neutral-900" />
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f7f5f1] text-neutral-700 ring-1 ring-neutral-200">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-neutral-900">
              {title}
            </h2>
          </div>
          <a
            href={editHref}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#f7f5f1] px-3 py-1.5 text-caption font-semibold text-neutral-700 ring-1 ring-neutral-200 transition-all hover:bg-neutral-900 hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Modifier
          </a>
        </div>
        <dl className="space-y-2.5">{children}</dl>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-3 text-body-sm">
      <dt className="w-36 shrink-0 font-medium uppercase tracking-[0.1em] text-neutral-500 text-caption">
        {label}
      </dt>
      <dd className="flex-1 text-neutral-900">
        {value || <span className="italic text-neutral-400">Non renseigné</span>}
      </dd>
    </div>
  );
}
