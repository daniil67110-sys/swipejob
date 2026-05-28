import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { UserAdminActions } from '@/components/admin/UserAdminActions';
import {
  UserActivitySection,
  UserAuditSection,
  UserConsentsSection,
  UserIdentitySection,
  UserRgpdSection,
} from '@/components/admin/UserDetailSections';
import { UserStatusBadge } from '@/components/admin/UserStatusBadge';
import { auth } from '@/lib/auth';
import { getUserDetail } from '@/lib/admin/user-detail';

export const metadata: Metadata = {
  title: 'Détail utilisateur · Admin SwipeJob',
  robots: { index: false, follow: false },
};

/**
 * Story 8.4 — Détail utilisateur admin.
 *
 * `dynamic = 'force-dynamic'` : on veut toujours les données fraîches
 * (un soft-delete ou changement de rôle déclenché juste avant doit
 * apparaître immédiatement). Le layout admin a déjà appliqué `requireAdmin`.
 */
export const dynamic = 'force-dynamic';

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getUserDetail(id);
  if (!detail) notFound();

  // requireAdmin est déjà appliqué côté layout — on récupère juste l'id
  // pour passer la garde self-action.
  const session = await auth();
  const adminId = session?.user?.id ?? '';
  const isSelf = adminId === detail.identity.id;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Link
          href="/admin/utilisateurs"
          className="inline-flex items-center gap-1 text-body-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Retour à la liste
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-display-sm font-display font-bold text-neutral-900 break-all">
              {detail.identity.email}
            </h1>
            <p className="mt-1 text-caption font-mono text-neutral-500 break-all">
              ID : {detail.identity.id}
            </p>
          </div>
          <UserStatusBadge user={detail.rgpdStatus} />
        </div>
      </header>

      <UserIdentitySection identity={detail.identity} profile={detail.profile} />
      <UserRgpdSection status={detail.rgpdStatus} />
      <UserActivitySection activity={detail.activity} />
      <UserAuditSection entries={detail.auditLogs} />
      <UserConsentsSection consents={detail.consents} />

      <UserAdminActions
        userId={detail.identity.id}
        currentRole={detail.identity.role}
        isSelf={isSelf}
        isAnonymized={Boolean(detail.rgpdStatus.anonymizedAt)}
        isPurged={Boolean(detail.rgpdStatus.purgedAt)}
      />
    </div>
  );
}
