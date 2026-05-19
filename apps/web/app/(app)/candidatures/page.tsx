import Link from 'next/link';
import { requireVerifiedAuth } from '@/lib/auth';
import { listApplicationsAction } from './actions';
import { ApplicationsFilters } from './ApplicationsFilters';
import { ApplicationStatusMenu } from './ApplicationStatusMenu';
import { InterviewPrepCard } from './InterviewPrepCard';
import { StatusBadge } from './StatusBadge';
import { formatDateFr, type ApplicationStatus } from './lib';

export default async function CandidaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ statuses?: string; sort?: string; signed?: string }>;
}) {
  await requireVerifiedAuth({});
  const params = await searchParams;
  const statuses = params.statuses
    ? (params.statuses.split(',') as ApplicationStatus[])
    : undefined;
  const sort =
    params.sort === 'sent_desc' ||
    params.sort === 'sent_asc' ||
    params.sort === 'last_activity_desc'
      ? params.sort
      : 'last_activity_desc';

  const res = await listApplicationsAction({ statuses, sort });
  if (!res.ok) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <p className="text-sm text-error-500">{res.error.message}</p>
      </div>
    );
  }
  const { items, total } = res.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Mes candidatures</h1>
        <p className="text-sm text-neutral-600">
          {total} candidature{total > 1 ? 's' : ''} suivie{total > 1 ? 's' : ''}.
        </p>
      </header>

      {params.signed === '1' ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-md border border-primary-500/40 bg-primary-100/40 p-4 text-sm"
        >
          🎉 Bravo, signature enregistrée ! Prends un moment pour célébrer.
        </div>
      ) : null}

      <ApplicationsFilters />

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-0 p-10 text-center">
          <p className="text-4xl">📭</p>
          <p className="mt-3 text-base font-medium">Pas encore de candidature.</p>
          <p className="mt-1 text-sm text-neutral-600">
            File swiper quelques offres dans ton deck pour commencer.
          </p>
          <Link
            href="/deck"
            className="mt-4 inline-block rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-neutral-0 hover:bg-primary-600"
          >
            Ouvrir mon deck
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((app) => (
            <li
              key={app.id}
              className="rounded-lg border border-neutral-200 bg-neutral-0 p-4 hover:border-primary-500/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-semibold">{app.offer.title}</p>
                  <p className="truncate text-xs text-neutral-600">
                    {app.offer.companyName ?? '—'}
                    {app.offer.locationCity ? ` · ${app.offer.locationCity}` : ''}
                    {app.offer.contractType ? ` · ${app.offer.contractType}` : ''}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Envoyée le {formatDateFr(app.sentAt ?? app.createdAt)}
                    {app.interviewAt ? ` · Entretien le ${formatDateFr(app.interviewAt)}` : ''}
                    {app.signedAt ? ` · Signature le ${formatDateFr(app.signedAt)}` : ''}
                  </p>
                </div>
                <div className="shrink-0">
                  {isManualTransitionAllowed(app.status) ? (
                    <ApplicationStatusMenu applicationId={app.id} status={app.status} />
                  ) : (
                    <StatusBadge status={app.status} />
                  )}
                </div>
              </div>
              {app.status === 'interview_scheduled' && app.interviewPrep ? (
                <div className="mt-3">
                  <InterviewPrepCard
                    data={{
                      companySummary: app.interviewPrep.companySummary,
                      probableQuestions: app.interviewPrep.probableQuestions,
                      matchingStrengths: app.interviewPrep.matchingStrengths,
                      interviewAt: app.interviewAt,
                    }}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function isManualTransitionAllowed(status: ApplicationStatus): boolean {
  return (
    status === 'sent' ||
    status === 'read' ||
    status === 'replied' ||
    status === 'interview_scheduled' ||
    status === 'rejected'
  );
}
