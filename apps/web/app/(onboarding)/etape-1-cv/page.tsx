import { desc, eq } from 'drizzle-orm';
import { CheckCircle2, FileText, Lock, Upload } from 'lucide-react';
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
    <div className="mx-auto max-w-2xl space-y-6 p-6 pt-10">
      <header className="space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-info-100 to-success-100 text-primary-600 text-caption font-semibold tracking-wide">
          <FileText className="w-3.5 h-3.5" aria-hidden="true" />
          Étape 1 sur 2
        </span>
        <h1 className="text-display-lg font-display font-bold text-neutral-900 leading-[1.05]">
          Bienvenue{' '}
          <span className="bg-gradient-to-r from-info-500 via-primary-500 to-success-500 bg-clip-text text-transparent">
            {userName}
          </span>{' '}
          👋
        </h1>
        <p className="text-body-md text-neutral-600">
          On va commencer par ton CV. Téléverse-le au format PDF, on s&apos;occupe du reste.
        </p>
      </header>

      <div className="relative rounded-2xl bg-white shadow-md overflow-hidden border border-neutral-100">
        <div className="h-1.5 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />
        <div className="p-6">
          {!latestCv ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-10 h-10 rounded-xl bg-primary-100 text-primary-500 flex items-center justify-center">
                  <Upload className="w-5 h-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-heading-md font-semibold text-neutral-900">Téléverse ton CV</p>
                  <p className="text-caption text-neutral-500">Format PDF · 10 Mo max</p>
                </div>
              </div>
              <CvUploader />
            </div>
          ) : latestCv.parsingStatus === 'pending' ? (
            <CvProcessingSkeleton />
          ) : latestCv.parsingStatus === 'completed' ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-success-100 text-success-500 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-heading-md font-semibold text-neutral-900">
                    CV analysé avec succès
                  </p>
                  <p className="text-body-sm text-neutral-600 mt-0.5">
                    Version {latestCv.version} · prête à être vérifiée.
                  </p>
                </div>
              </div>
              <a
                href="/etape-1-cv/revue"
                className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-info-500 to-primary-500 px-5 py-2.5 text-body-sm font-semibold text-white shadow-md hover:shadow-lg transition-shadow min-h-[44px]"
              >
                Vérifier les infos extraites →
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-error-100 bg-error-100/50 p-4">
                <p className="text-body-sm text-error-500">
                  <strong>On n&apos;a pas pu analyser ton CV.</strong>{' '}
                  {latestCv.parsingError ?? 'Réessaie avec un autre fichier.'}
                </p>
              </div>
              <CvUploader />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2.5 px-1">
        <Lock className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-caption text-neutral-500">
          Ton CV est stocké chiffré sur des serveurs européens. Tu peux le supprimer à tout moment
          depuis ton profil.
        </p>
      </div>
    </div>
  );
}
