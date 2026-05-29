import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { AccessibilityReportAdminActions } from '@/components/admin/AccessibilityReportAdminActions';
import { AccessibilityReportSections } from '@/components/admin/AccessibilityReportSections';
import { getReportById } from '@/lib/admin/accessibility-reports';

export const metadata: Metadata = {
  title: 'Détail signalement · Admin SwipeJob',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminAccessibilityReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReportById(id);
  if (!report) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/signalements"
        className="inline-flex items-center gap-1 text-body-sm text-neutral-500 hover:text-neutral-900"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Retour à la liste
      </Link>

      <header>
        <h1 className="text-display-sm font-display font-bold text-neutral-900">
          Signalement #{report.id.slice(0, 8)}
        </h1>
      </header>

      <AccessibilityReportSections report={report} />

      <AccessibilityReportAdminActions
        reportId={report.id}
        currentStatus={report.status}
        currentNotes={report.adminNotes}
      />
    </div>
  );
}
