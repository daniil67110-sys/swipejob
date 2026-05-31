import { desc, eq } from 'drizzle-orm';
import { CheckCircle2, FileText, Lock, Upload } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { cvs } from '@swipejob/db/schema';
import { FadeIn } from '@/components/shared/motion/FadeIn';
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
    <div className="mx-auto max-w-2xl space-y-6 p-6 pt-10 pb-16">
      <FadeIn>
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-caption font-semibold text-neutral-700 ring-1 ring-neutral-200">
            <FileText className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
            Étape 1 sur 2
          </span>
          <h1 className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold leading-[1.05] text-neutral-900 sm:text-6xl">
            Bienvenue <span className="italic text-neutral-400">{userName}</span>
          </h1>
          <p className="text-body-md leading-relaxed text-neutral-600">
            On va commencer par ton CV. Téléverse-le au format PDF, on s&apos;occupe du reste.
          </p>
        </header>
      </FadeIn>

      <FadeIn delay={0.15}>
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="h-1 bg-neutral-900" />
          <div className="p-6">
            {!latestCv ? (
              <div className="space-y-4">
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-sm">
                    <Upload className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-heading-md font-semibold text-neutral-900">
                      Téléverse ton CV
                    </p>
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
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-sm">
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-heading-md font-semibold text-neutral-900">
                      CV analysé avec succès
                    </p>
                    <p className="mt-0.5 text-body-sm text-neutral-600">
                      Version {latestCv.version} · prête à être vérifiée.
                    </p>
                  </div>
                </div>
                <a
                  href="/etape-1-cv/revue"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-neutral-900 px-6 py-2.5 text-body-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  Vérifier les infos extraites →
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-body-sm text-red-700">
                    <strong>On n&apos;a pas pu analyser ton CV.</strong>{' '}
                    {latestCv.parsingError ?? 'Réessaie avec un autre fichier.'}
                  </p>
                </div>
                <CvUploader />
              </div>
            )}
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.25}>
        <div className="flex items-start gap-2.5 px-1">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden="true" />
          <p className="text-caption text-neutral-500">
            Ton CV est stocké chiffré sur des serveurs européens. Tu peux le supprimer à tout moment
            depuis ton profil.
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
