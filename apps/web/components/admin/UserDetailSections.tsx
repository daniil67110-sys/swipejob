import { CheckCircle2, XCircle } from 'lucide-react';
import type {
  UserConsentRow,
  UserDetailActivity,
  UserDetailAuditEntry,
  UserDetailIdentity,
  UserDetailProfile,
  UserDetailRgpdStatus,
} from '@/lib/admin/user-detail';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeZone: 'Europe/Paris',
});

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Europe/Paris',
});

function formatDate(d: Date | null | undefined): string {
  if (!d) return '—';
  return dateFormatter.format(d);
}

function formatDateTime(d: Date | null | undefined): string {
  if (!d) return '—';
  return dateTimeFormatter.format(d);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-caption uppercase tracking-wider text-neutral-500 font-semibold">
        {label}
      </dt>
      <dd className="mt-1 text-body-sm text-neutral-900">{children}</dd>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-heading-sm font-semibold text-neutral-900 uppercase tracking-wider">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function UserIdentitySection({
  identity,
  profile,
}: {
  identity: UserDetailIdentity;
  profile: UserDetailProfile;
}) {
  return (
    <SectionCard title="Identité">
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="Email">
          <span className="break-all">{identity.email}</span>
        </Field>
        <Field label="Nom">{identity.name ?? '—'}</Field>
        <Field label="Rôle">
          <span
            className={
              identity.role === 'ADMIN'
                ? 'inline-block px-2 py-0.5 rounded-md bg-warning-100 text-warning-700 font-semibold uppercase tracking-wider text-[11px]'
                : 'text-neutral-700'
            }
          >
            {identity.role}
          </span>
        </Field>
        <Field label="Source auth">{identity.source}</Field>
        <Field label="Locale">{identity.locale}</Field>
        <Field label="Date de naissance">{formatDate(identity.birthDate)}</Field>
        <Field label="Statut consentement">{identity.consentStatus}</Field>
        <Field label="Email vérifié le">{formatDateTime(identity.emailVerified)}</Field>
        <Field label="Inscrit le">{formatDateTime(identity.createdAt)}</Field>
        {profile ? (
          <>
            <Field label="Prénom (profil)">{profile.firstName ?? '—'}</Field>
            <Field label="Nom (profil)">{profile.lastName ?? '—'}</Field>
            <Field label="Ville">{profile.city ?? '—'}</Field>
          </>
        ) : null}
      </dl>
    </SectionCard>
  );
}

export function UserRgpdSection({ status }: { status: UserDetailRgpdStatus }) {
  return (
    <SectionCard title="Statut RGPD">
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="Suppression demandée">{formatDateTime(status.deletedAt)}</Field>
        <Field label="Anonymisé le">{formatDateTime(status.anonymizedAt)}</Field>
        <Field label="Purgé le">{formatDateTime(status.purgedAt)}</Field>
        <Field label="Notifié inactivité">{formatDateTime(status.inactivityNotifiedAt)}</Field>
      </dl>
    </SectionCard>
  );
}

export function UserActivitySection({ activity }: { activity: UserDetailActivity }) {
  return (
    <SectionCard title="Activité">
      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <Field label="Sessions actives">{activity.activeSessions}</Field>
        <Field label="Swipes totaux">{activity.totalSwipes}</Field>
        <Field label="Candidatures totales">{activity.totalApplications}</Field>
        <Field label="Candidatures envoyées">{activity.applicationsSent}</Field>
        <Field label="CVs">{activity.cvCount}</Field>
        <Field label="Exports RGPD">{activity.rgpdExportsCount}</Field>
        <Field label="Dernière session">{formatDateTime(activity.lastSeenAt)}</Field>
        <Field label="Dernier swipe">{formatDateTime(activity.lastSwipeAt)}</Field>
        <Field label="Dernière candidature">{formatDateTime(activity.lastApplicationAt)}</Field>
      </dl>
    </SectionCard>
  );
}

export function UserAuditSection({ entries }: { entries: UserDetailAuditEntry[] }) {
  return (
    <SectionCard title="Audit logs · 10 derniers events">
      {entries.length === 0 ? (
        <p className="text-body-sm text-neutral-500">Aucun event d&apos;audit pour ce user.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {entries.map((entry) => (
            <li key={entry.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-body-sm font-mono font-medium text-neutral-900">
                    {entry.event}
                  </p>
                  <p className="text-caption text-neutral-500">
                    {formatDateTime(entry.createdAt)} ·{' '}
                    <span className="uppercase tracking-wider">{entry.actorType}</span>
                  </p>
                </div>
                {entry.metadata ? (
                  <code className="text-[11px] font-mono text-neutral-600 bg-neutral-50 px-2 py-1 rounded-md max-w-xs truncate">
                    {JSON.stringify(entry.metadata)}
                  </code>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export function UserConsentsSection({ consents }: { consents: UserConsentRow[] }) {
  if (consents.length === 0) return null;
  return (
    <SectionCard title="Consentements · 10 derniers events">
      <ul className="divide-y divide-neutral-100">
        {consents.map((c) => (
          <li key={c.id} className="py-2 first:pt-0 last:pb-0 flex items-center gap-3">
            {c.granted ? (
              <CheckCircle2 className="w-4 h-4 text-success-600" aria-label="Accordé" />
            ) : (
              <XCircle className="w-4 h-4 text-danger-600" aria-label="Refusé" />
            )}
            <span className="text-body-sm font-mono text-neutral-900">{c.purpose}</span>
            <span className="text-caption text-neutral-500 ml-auto">
              {formatDateTime(c.createdAt)}
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
