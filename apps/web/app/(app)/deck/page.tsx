import { requireAuth } from '@/lib/auth';

export default async function DeckPage() {
  const session = await requireAuth();
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-3xl font-bold">Ton deck quotidien 🎴</h1>
      <p className="text-neutral-600">
        Tu es connecté en tant que <strong>{session.user?.email}</strong>. Le système de
        recommandations (Story 2.x + 3.x) générera ici tes 10 offres du jour à swiper.
      </p>
      <div className="rounded-md border border-neutral-200 bg-white p-6">
        <p className="text-sm text-neutral-500">Placeholder deck — Story 3.x.</p>
      </div>
    </div>
  );
}
