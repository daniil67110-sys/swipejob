import { notFound } from 'next/navigation';
import { requireVerifiedAuth } from '@/lib/auth';
import { captureServer, hashUserId } from '@/lib/analytics';
import { getWrappedData } from '@/lib/wrapped';
import { WrappedShareView } from './WrappedShareView';

/**
 * Story 5.5 — Écran Wrapped à la signature.
 *
 * Accessible uniquement au propriétaire de l'application. Si l'app n'est pas
 * en status 'signed' (ou n'existe pas) → 404.
 */

export const dynamic = 'force-dynamic';
export const metadata = {
  title: "C'est signé ! — SwipeJob",
};

type Props = {
  params: Promise<{ applicationId: string }>;
};

export default async function WrappedPage({ params }: Props) {
  const session = await requireVerifiedAuth({});
  const userId = session.user?.id;
  if (!userId) return null;

  const { applicationId } = await params;
  const data = await getWrappedData({ applicationId, userId });
  if (!data) notFound();

  captureServer('wrapped.viewed', hashUserId(userId), { applicationId });

  return <WrappedShareView data={data} />;
}
