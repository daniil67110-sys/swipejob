import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { desc } from 'drizzle-orm';
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  FileText,
  Pencil,
  Search,
  Sparkles,
  Trophy,
  User as UserIcon,
} from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { cvs, preferences, profiles, userBadges, users } from '@swipejob/db/schema';
import type { LucideIcon } from 'lucide-react';
import { BADGE_CATALOG } from '@/lib/badges';

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
      <header className="space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-info-100 to-success-100 text-primary-600 text-caption font-semibold tracking-wide">
          <UserIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Mon compte
        </span>
        <h1 className="text-display-lg font-display font-bold text-neutral-900 leading-[1.05]">
          Mon{' '}
          <span className="bg-gradient-to-r from-info-500 via-primary-500 to-success-500 bg-clip-text text-transparent">
            profil
          </span>
        </h1>
        <p className="text-body-md text-neutral-600">
          Tes informations personnelles et préférences de recherche.
        </p>
      </header>

      {/* Engagement shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/profil/badges"
          className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-accent-500 via-primary-500 to-info-500 text-white shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="p-5 flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6" strokeWidth={2.25} aria-hidden="true" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-caption uppercase tracking-wider font-semibold text-white/85">
                Mes badges
              </p>
              <p className="text-heading-md font-semibold leading-tight">
                {unlockedBadgeCount} / {totalBadges} débloqué{unlockedBadgeCount > 1 ? 's' : ''}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/85 shrink-0" aria-hidden="true" />
          </div>
        </Link>

        <Link
          href="/profil/parrainage"
          className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-info-500 via-primary-500 to-success-500 text-white shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="p-5 flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" strokeWidth={2.25} aria-hidden="true" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-caption uppercase tracking-wider font-semibold text-white/85">
                Parrainage
              </p>
              <p className="text-heading-md font-semibold leading-tight">Inviter mes amis</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/85 shrink-0" aria-hidden="true" />
          </div>
        </Link>
      </div>

      <Section
        title="Identité"
        icon={UserIcon}
        iconBg="bg-info-100"
        iconColor="text-info-500"
        editHref="/etape-1-cv/revue"
      >
        <Row label="Email" value={user?.email} />
        <Row label="Prénom" value={profile?.firstName} />
        <Row label="Nom" value={profile?.lastName} />
        <Row label="Titre" value={profile?.headline} />
        <Row label="Bio" value={profile?.summary} />
        <Row label="Téléphone" value={profile?.phone} />
        <Row label="Ville" value={profile?.city} />
        <Row label="LinkedIn" value={profile?.linkedinUrl} />
      </Section>

      <Section
        title="École & niveau"
        icon={BookOpen}
        iconBg="bg-primary-100"
        iconColor="text-primary-500"
        editHref="/etape-1-cv/revue"
      >
        <Row label="École" value={profile?.currentSchool?.name} />
        <Row label="Niveau" value={profile?.educationLevel} />
      </Section>

      <Section
        title="Préférences de recherche"
        icon={Search}
        iconBg="bg-success-100"
        iconColor="text-success-500"
        editHref="/etape-2-preferences"
      >
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

      <Section
        title="CV"
        icon={FileText}
        iconBg="bg-warning-100"
        iconColor="text-warning-500"
        editHref="/etape-1-cv"
      >
        <Row label="Version" value={cv ? `v${cv.version}` : 'Aucun CV uploadé'} />
        <Row label="Fichier" value={cv?.originalFilename} />
      </Section>

      {/* Zone dangereuse */}
      <section className="relative rounded-2xl bg-white shadow-sm overflow-hidden border border-error-100">
        <div className="h-1 bg-gradient-to-r from-error-500 to-warning-500" />
        <div className="p-6">
          <div className="flex items-start gap-3 mb-3">
            <span className="w-10 h-10 rounded-xl bg-error-100 text-error-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-heading-md font-semibold text-neutral-900">Zone dangereuse</h2>
              <p className="text-body-sm text-neutral-600 mt-1">
                Supprimer définitivement ton compte. Tes données seront effacées sous 30 jours
                conformément au RGPD.
              </p>
            </div>
          </div>
          <a
            href="/profil/supprimer"
            className="inline-flex items-center justify-center rounded-md border border-error-500 px-4 py-2.5 text-body-sm font-semibold text-error-500 hover:bg-error-100/50 transition-colors min-h-[44px]"
          >
            Supprimer mon compte
          </a>
        </div>
      </section>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  iconBg,
  iconColor,
  editHref,
  children,
}: {
  title: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  editHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative rounded-2xl bg-white shadow-sm overflow-hidden border border-neutral-100 hover:shadow-md transition-shadow">
      <div className="h-1 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span
              className={`w-10 h-10 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
            </span>
            <h2 className="text-heading-md font-semibold text-neutral-900">{title}</h2>
          </div>
          <a
            href={editHref}
            className="inline-flex items-center gap-1.5 text-caption font-semibold text-primary-500 hover:text-primary-600 hover:underline"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
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
      <dt className="w-36 text-neutral-500 font-medium shrink-0">{label}</dt>
      <dd className="flex-1 text-neutral-900">
        {value || <span className="text-neutral-400 italic">Non renseigné</span>}
      </dd>
    </div>
  );
}
