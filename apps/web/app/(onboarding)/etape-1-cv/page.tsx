import { requireVerifiedAuth } from '@/lib/auth';

export default async function EtapeCvPage() {
  // Onboarding layout skip consent checks ; on les exige ici (étape 1 du flow utile).
  const session = await requireVerifiedAuth({});
  const userName = session.user?.name ?? session.user?.email ?? 'toi';

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-3xl font-bold">Bienvenue {userName} ! 👋</h1>
      <p className="text-neutral-600">
        Première étape : on va lire ton CV pour découvrir tes compétences. Cette fonctionnalité sera
        disponible en Story 1.6 (upload PDF) et Story 1.7 (parsing IA).
      </p>
      <div className="rounded-md border border-neutral-200 bg-white p-6">
        <p className="text-sm text-neutral-500">Placeholder onboarding — Story 1.6/1.7.</p>
      </div>
    </div>
  );
}
