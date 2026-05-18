import { eq } from 'drizzle-orm';
import { requireVerifiedAuth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { cvs, preferences, profiles, users } from '@swipejob/db/schema';
import { desc } from 'drizzle-orm';

export default async function ProfilPage() {
  const session = await requireVerifiedAuth({});
  const userId = session.user?.id;
  if (!userId) return null;

  if (!isDatabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-sm text-neutral-600">Service non configuré.</p>
      </div>
    );
  }

  const [userRows, profileRows, prefRows, cvRows] = await Promise.all([
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
  ]);

  const user = userRows[0];
  const profile = profileRows[0];
  const pref = prefRows[0];
  const cv = cvRows[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-3xl font-bold">Mon profil</h1>

      <Section title="Identité" editHref="/etape-1-cv/revue">
        <Row label="Email" value={user?.email} />
        <Row label="Prénom" value={profile?.firstName} />
        <Row label="Nom" value={profile?.lastName} />
        <Row label="Titre" value={profile?.headline} />
        <Row label="Bio" value={profile?.summary} />
        <Row label="Téléphone" value={profile?.phone} />
        <Row label="Ville" value={profile?.city} />
        <Row label="LinkedIn" value={profile?.linkedinUrl} />
      </Section>

      <Section title="École & niveau" editHref="/etape-1-cv/revue">
        <Row label="École" value={profile?.currentSchool?.name} />
        <Row label="Niveau" value={profile?.educationLevel} />
      </Section>

      <Section title="Préférences de recherche" editHref="/etape-2-preferences">
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

      <Section title="CV" editHref="/etape-1-cv">
        <Row label="Version" value={cv ? `v${cv.version}` : 'Aucun CV uploadé'} />
        <Row label="Fichier" value={cv?.originalFilename} />
      </Section>

      <section className="space-y-3 rounded-md border border-error-500/40 bg-error-100/30 p-4">
        <h2 className="text-base font-semibold">Zone dangereuse</h2>
        <p className="text-sm text-neutral-800">
          Supprimer définitivement ton compte. Tes données seront effacées sous 30 jours
          conformément au RGPD.
        </p>
        <a
          href="/profil/supprimer"
          className="inline-block rounded-md border border-error-500 px-4 py-3 text-sm font-medium text-error-500 hover:bg-error-100 min-h-[44px]"
        >
          Supprimer mon compte
        </a>
      </section>
    </div>
  );
}

function Section({
  title,
  editHref,
  children,
}: {
  title: string;
  editHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-md border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
        <a href={editHref} className="text-sm font-medium text-primary-500 hover:underline">
          Modifier
        </a>
      </div>
      <dl className="space-y-1 text-sm">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 text-neutral-500">{label}</dt>
      <dd className="flex-1 text-neutral-900">
        {value || <span className="text-neutral-400">—</span>}
      </dd>
    </div>
  );
}
