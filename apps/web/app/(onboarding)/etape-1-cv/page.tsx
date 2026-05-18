import { desc, eq } from 'drizzle-orm';
import { requireVerifiedAuth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { cvs } from '@swipejob/db/schema';
import { CvUploader } from './CvUploader';
import { CvProcessingSkeleton } from './CvProcessingSkeleton';

export default async function EtapeCvPage() {
  const session = await requireVerifiedAuth({});
  const userName = session.user?.name ?? session.user?.email ?? 'toi';
  const userId = session.user?.id;

  let latestCv: {
    id: string;
    parsingStatus: 'pending' | 'completed' | 'failed';
    version: number;
    parsingError: string | null;
  } | null = null;

  if (isDatabaseConfigured && userId) {
    const rows = await db
      .select({
        id: cvs.id,
        parsingStatus: cvs.parsingStatus,
        version: cvs.version,
        parsingError: cvs.parsingError,
      })
      .from(cvs)
      .where(eq(cvs.userId, userId))
      .orderBy(desc(cvs.version))
      .limit(1);
    latestCv = rows[0] ?? null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-3xl font-bold">Bienvenue {userName} ! 👋</h1>
      <p className="text-neutral-600">
        On va commencer par ton CV. Téléverse-le au format PDF, on s'occupe du reste.
      </p>

      <div className="rounded-md border border-neutral-200 bg-white p-6">
        {!latestCv ? (
          <CvUploader />
        ) : latestCv.parsingStatus === 'pending' ? (
          <CvProcessingSkeleton />
        ) : latestCv.parsingStatus === 'completed' ? (
          <div className="space-y-4">
            <p className="text-sm text-success-500">
              ✓ Ton CV (version {latestCv.version}) a été analysé.
            </p>
            <a
              href="/etape-1-cv/revue"
              className="inline-flex items-center rounded-md bg-primary-500 px-4 py-3 text-sm font-medium text-white hover:bg-primary-600 min-h-[44px]"
            >
              Vérifier les infos extraites
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-error-500">
              On n'a pas pu analyser ton CV. {latestCv.parsingError ?? ''}
            </p>
            <CvUploader />
          </div>
        )}
      </div>

      <p className="text-xs text-neutral-500">
        Ton CV est stocké chiffré sur des serveurs européens. Tu peux le supprimer à tout moment
        depuis ton profil.
      </p>
    </div>
  );
}
