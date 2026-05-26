import Link from 'next/link';
import { Briefcase, Calendar, Inbox, MapPin, PartyPopper, Send } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { CompanyLogo } from '@/components/shared/CompanyLogo';
import { listApplicationsAction, listPendingReviewAction } from './actions';
import { ApplicationsFilters } from './ApplicationsFilters';
import { ApplicationStatusMenu } from './ApplicationStatusMenu';
import { InterviewPrepCard } from './InterviewPrepCard';
import { PendingReviewSection } from './PendingReviewSection';
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

  const [res, pendingRes] = await Promise.all([
    listApplicationsAction({ statuses, sort }),
    listPendingReviewAction(),
  ]);
  if (!res.ok) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <p className="text-body-sm text-error-500">{res.error.message}</p>
      </div>
    );
  }
  const { items, total } = res.data;
  const pendingReviewItems = pendingRes.ok ? pendingRes.data.items : [];

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Header */}
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-info-100 to-success-100 text-primary-600">
          <Send className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="text-caption font-semibold tracking-wide">
            {total} candidature{total > 1 ? 's' : ''}
          </span>
        </div>
        <h1 className="text-display-lg font-display font-bold text-neutral-900">
          Mes candidatures
        </h1>
        <p className="text-body-md text-neutral-600">
          Suis l&apos;avancée de toutes tes opportunités en un coup d&apos;œil.
        </p>
      </header>

      {params.signed === '1' ? (
        <div
          role="status"
          aria-live="polite"
          className="relative rounded-2xl bg-white shadow-md overflow-hidden border border-success-100"
        >
          <div className="h-1.5 bg-gradient-to-r from-success-500 to-info-500" />
          <div className="p-5 flex items-start gap-3">
            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-success-500 to-info-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <PartyPopper className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-body-md font-semibold text-neutral-900">Signature enregistrée</p>
              <p className="text-body-sm text-neutral-600 mt-0.5">
                Bravo, prends un moment pour célébrer.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <PendingReviewSection items={pendingReviewItems} />

      <ApplicationsFilters />

      {items.length === 0 ? (
        <div className="relative rounded-2xl bg-white shadow-md overflow-hidden border border-neutral-100">
          <div className="h-1.5 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />
          <div className="p-12 text-center">
            <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-info-100 to-success-100 text-info-500 inline-flex items-center justify-center mb-4">
              <Inbox className="w-7 h-7" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <p className="text-heading-md font-semibold text-neutral-900 mb-1">
              Pas encore de candidature
            </p>
            <p className="text-body-sm text-neutral-500 mb-5">
              Swipe quelques offres dans ton deck pour commencer.
            </p>
            <Link
              href="/deck"
              className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-info-500 to-primary-500 px-5 py-2.5 text-body-sm font-semibold text-white shadow-md hover:shadow-lg transition-shadow min-h-[44px]"
            >
              Ouvrir mon deck
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((app) => (
            <li
              key={app.id}
              className="relative rounded-2xl bg-white shadow-sm overflow-hidden border border-neutral-100 hover:shadow-md hover:border-neutral-200 transition-all"
            >
              <div className="h-1 bg-gradient-to-r from-info-500 via-primary-500 to-success-500" />
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <CompanyLogo name={app.offer.companyName} size="md" />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-caption tracking-wider text-neutral-500 uppercase font-semibold mb-0.5">
                          {app.offer.companyName ?? 'Entreprise non précisée'}
                        </p>
                        <h2 className="text-heading-md font-semibold text-neutral-900 leading-tight">
                          {app.offer.title}
                        </h2>
                      </div>
                      <div className="shrink-0">
                        {isManualTransitionAllowed(app.status) ? (
                          <ApplicationStatusMenu applicationId={app.id} status={app.status} />
                        ) : (
                          <StatusBadge status={app.status} />
                        )}
                      </div>
                    </div>

                    {/* Pills colorées */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {app.offer.locationCity ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-info-100 text-info-500 text-caption font-semibold">
                          <MapPin className="w-3 h-3" aria-hidden="true" />
                          {app.offer.locationCity}
                        </span>
                      ) : null}
                      {app.offer.contractType ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-100 text-primary-500 text-caption font-semibold">
                          <Briefcase className="w-3 h-3" aria-hidden="true" />
                          {app.offer.contractType}
                        </span>
                      ) : null}
                    </div>

                    {/* Dates */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-neutral-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" aria-hidden="true" />
                        Envoyée le {formatDateFr(app.sentAt ?? app.createdAt)}
                      </span>
                      {app.interviewAt ? (
                        <span className="inline-flex items-center gap-1.5 text-primary-500 font-medium">
                          <Calendar className="w-3 h-3" aria-hidden="true" />
                          Entretien le {formatDateFr(app.interviewAt)}
                        </span>
                      ) : null}
                      {app.signedAt ? (
                        <span className="inline-flex items-center gap-1.5 text-success-500 font-medium">
                          <PartyPopper className="w-3 h-3" aria-hidden="true" />
                          Signée le {formatDateFr(app.signedAt)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {app.status === 'interview_scheduled' && app.interviewPrep ? (
                  <div className="mt-4">
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
              </div>
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
