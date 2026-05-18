import { requireVerifiedAuth } from '@/lib/auth';
import { DeletionForm } from './DeletionForm';

export default async function SupprimerPage() {
  const session = await requireVerifiedAuth({});
  const email = session.user?.email ?? '';

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Supprimer mon compte</h1>
        <p className="text-sm text-neutral-600">
          Cette page te permet de demander la suppression de ton compte SwipeJob et de toutes tes
          données personnelles, conformément au RGPD.
        </p>
      </div>
      <DeletionForm userEmail={email} />
    </div>
  );
}
