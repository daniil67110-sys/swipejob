import { AccessibilityReportStatusBadge } from './AccessibilityReportStatusBadge';
import type { ReportDetail } from '@/lib/admin/accessibility-reports';

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Europe/Paris',
});

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-caption uppercase tracking-wider text-neutral-500 font-semibold">
        {label}
      </dt>
      <dd className="mt-1 text-body-md text-neutral-900 break-words">{children}</dd>
    </div>
  );
}

export type AccessibilityReportSectionsProps = {
  report: ReportDetail;
};

export function AccessibilityReportSections({ report }: AccessibilityReportSectionsProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-heading-md font-display font-semibold text-neutral-900">
            Signalement
          </h2>
          <AccessibilityReportStatusBadge status={report.status} />
        </header>
        <dl className="grid sm:grid-cols-2 gap-4">
          <Field label="Reçu le">{dateTimeFormatter.format(report.createdAt)}</Field>
          <Field label="Dernière modification">{dateTimeFormatter.format(report.updatedAt)}</Field>
          <div className="sm:col-span-2">
            <Field label="URL signalée">
              {isHttpUrl(report.url) ? (
                <a
                  href={report.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-info-600 hover:underline"
                >
                  {report.url}
                </a>
              ) : (
                <span>{report.url}</span>
              )}
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description du défaut">
              <p className="whitespace-pre-wrap">{report.description}</p>
            </Field>
          </div>
          <Field label="Contact rapporteur">
            {report.contactEmail ? (
              <a href={`mailto:${report.contactEmail}`} className="text-info-600 hover:underline">
                {report.contactEmail}
              </a>
            ) : (
              <span className="text-neutral-400 italic">Anonyme (pas de contact laissé)</span>
            )}
          </Field>
          <Field label="IP rapporteur (hash)">
            {report.reporterIpHashed ? (
              <code className="text-body-sm font-mono text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded">
                {report.reporterIpHashed.slice(0, 16)}…
              </code>
            ) : (
              <span className="text-neutral-400 italic">—</span>
            )}
          </Field>
        </dl>
      </section>
    </div>
  );
}
