import type { Metadata } from 'next';
import {
  Accessibility,
  Activity,
  Archive,
  FileDown,
  Hand,
  ScrollText,
  Send,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { KpiCard } from '@/components/admin/KpiCard';
import { getAdminKpis } from '@/lib/admin/kpis';

export const metadata: Metadata = {
  title: 'Admin · SwipeJob',
  robots: { index: false, follow: false },
};

/**
 * Story 8.2 — Dashboard admin.
 *
 * Cache 60s : compromise raisonnable entre fraîcheur et coût de query
 * (les KPIs touchent ~10 tables agrégées en Promise.all).
 */
export const revalidate = 60;

export default async function AdminHomePage() {
  const kpis = await getAdminKpis();
  const generatedAt = new Date(kpis.generatedAt);
  const formattedTime = new Intl.DateTimeFormat('fr-FR', {
    timeStyle: 'short',
    dateStyle: 'short',
    timeZone: 'Europe/Paris',
  }).format(generatedAt);

  return (
    <div className="space-y-10">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-display-sm font-display font-bold text-neutral-900">
            Tableau de bord
          </h1>
          <p className="mt-2 text-body-md text-neutral-600">
            Indicateurs santé et conformité de la plateforme.
          </p>
        </div>
        <p className="text-caption text-neutral-500" aria-live="polite">
          Mis à jour à {formattedTime} (cache 60 s)
        </p>
      </header>

      <section aria-labelledby="section-users" className="space-y-4">
        <h2
          id="section-users"
          className="text-heading-sm font-semibold text-neutral-900 uppercase tracking-wider"
        >
          Utilisateurs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total actifs"
            value={kpis.users.totalActive}
            icon={Users}
            tone="info"
            hint="Hors anonymisés et soft-deleted"
          />
          <KpiCard
            label="Signups · 7 j"
            value={kpis.users.signupsLast7d}
            icon={UserPlus}
            tone="success"
          />
          <KpiCard
            label="Anonymisés"
            value={kpis.users.anonymized}
            icon={UserMinus}
            tone="neutral"
            hint="Inactivité > 24 mois (RGPD)"
          />
          <KpiCard
            label="Suppression demandée"
            value={kpis.users.softDeletedPendingPurge}
            icon={Trash2}
            tone="warning"
            hint="En attente de purge (30 j)"
            actionRequired
          />
        </div>
      </section>

      <section aria-labelledby="section-activity" className="space-y-4">
        <h2
          id="section-activity"
          className="text-heading-sm font-semibold text-neutral-900 uppercase tracking-wider"
        >
          Activité · 7 derniers jours
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard
            label="Sessions actives · 24 h"
            value={kpis.activity.sessionsLast24h}
            icon={Activity}
            tone="info"
            hint="Utilisateurs uniques connectés"
          />
          <KpiCard
            label="Swipes · 7 j"
            value={kpis.activity.swipesLast7d}
            icon={Hand}
            tone="info"
          />
          <KpiCard
            label="Candidatures envoyées · 7 j"
            value={kpis.activity.applicationsSentLast7d}
            icon={Send}
            tone="success"
          />
        </div>
      </section>

      <section aria-labelledby="section-compliance" className="space-y-4">
        <h2
          id="section-compliance"
          className="text-heading-sm font-semibold text-neutral-900 uppercase tracking-wider"
        >
          Conformité · à traiter
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard
            label="Exports RGPD en attente"
            value={kpis.compliance.rgpdExportsPending}
            icon={FileDown}
            tone="warning"
            actionRequired
          />
          <KpiCard
            label="Signalements a11y ouverts"
            value={kpis.compliance.accessibilityReportsOpen}
            icon={Accessibility}
            tone="warning"
            hint="Status open · à acquitter"
            actionRequired
          />
          <KpiCard
            label="Audit events · 24 h"
            value={kpis.compliance.auditEventsLast24h}
            icon={ScrollText}
            tone="neutral"
            hint="Volume trace conformité"
          />
        </div>
      </section>

      <footer className="pt-4 border-t border-neutral-200">
        <p className="text-caption text-neutral-500 flex items-center gap-2">
          <Archive className="w-3.5 h-3.5" aria-hidden="true" />
          Les modules de modération (utilisateurs, signalements, audit logs) arriveront dans les
          Stories 8.3 à 8.6.
        </p>
      </footer>
    </div>
  );
}
