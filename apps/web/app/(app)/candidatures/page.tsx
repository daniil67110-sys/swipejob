import Link from 'next/link';
import { Briefcase, Calendar, Inbox, MapPin, PartyPopper, Send } from 'lucide-react';
import { requireVerifiedAuth } from '@/lib/auth';
import { CompanyLogo } from '@/components/shared/CompanyLogo';
import { FadeIn } from '@/components/shared/motion/FadeIn';
import { Stagger } from '@/components/shared/motion/Stagger';
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
    <div className="mx-auto max-w-4xl space-y-8 p-6 pb-24">
      {/* Header */}
      <FadeIn>
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white ring-1 ring-neutral-200 text-neutral-700">
            <Send className="w-3.5 h-3.5 text-orange-500" aria-hidden="true" />
            <span className="text-caption font-semibold tracking-wide">
              {total} candidature{total > 1 ? 's' : ''}
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold leading-[1.05] text-neutral-900 sm:text-6xl">
            Mes <span className="italic text-neutral-400">candidatures</span>
          </h1>
          <p className="text-body-md leading-relaxed text-neutral-600">
            Suis l&apos;avancée de toutes tes opportunités en un coup d&apos;œil.
          </p>
        </header>
      </FadeIn>

      {params.signed === '1' ? (
        <FadeIn delay={0.1}>
          <div
            role="status"
            aria-live="polite"
            className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm"
          >
            <div className="h-1 bg-neutral-900" />
            <div className="flex items-start gap-3 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-sm">
                <PartyPopper className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-body-md font-semibold text-neutral-900">Signature enregistrée</p>
                <p className="mt-0.5 text-body-sm text-neutral-600">
                  Bravo, prends un moment pour célébrer.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      ) : null}

      <FadeIn delay={0.15}>
        <PendingReviewSection items={pendingReviewItems} />
      </FadeIn>

      <FadeIn delay={0.2}>
        <ApplicationsFilters />
      </FadeIn>

      {items.length === 0 ? (
        <FadeIn delay={0.25}>
          <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <div className="h-1 bg-neutral-900" />
            <div className="p-12 text-center">
              <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-white">
                <Inbox className="h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <p className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold leading-tight text-neutral-900">
                Pas encore de <span className="italic text-neutral-400">candidature</span>
              </p>
              <p className="mb-6 mt-2 text-body-sm text-neutral-500">
                Swipe quelques offres dans ton deck pour commencer.
              </p>
              <Link
                href="/deck"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-neutral-900 px-6 py-2.5 text-body-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                Ouvrir mon deck
              </Link>
            </div>
          </div>
        </FadeIn>
      ) : (
        <Stagger as="ul" className="space-y-3" stagger={0.06} initialDelay={0.25}>
          {items.map((app) => (
            <div
              key={app.id}
              className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="h-1 bg-neutral-900" />
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <CompanyLogo name={app.offer.companyName} size="md" />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="mb-0.5 text-caption font-semibold uppercase tracking-[0.18em] text-neutral-500">
                          {app.offer.companyName ?? 'Entreprise non précisée'}
                        </p>
                        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold leading-tight text-neutral-900">
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

                    {/* Pills FitMe : neutres + accent orange */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {app.offer.locationCity ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f7f5f1] px-2.5 py-1 text-caption font-semibold text-neutral-700 ring-1 ring-neutral-200">
                          <MapPin className="h-3 w-3 text-neutral-500" aria-hidden="true" />
                          {app.offer.locationCity}
                        </span>
                      ) : null}
                      {app.offer.contractType ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f7f5f1] px-2.5 py-1 text-caption font-semibold text-neutral-700 ring-1 ring-neutral-200">
                          <Briefcase className="h-3 w-3 text-orange-500" aria-hidden="true" />
                          {app.offer.contractType}
                        </span>
                      ) : null}
                    </div>

                    {/* Dates */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-neutral-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" aria-hidden="true" />
                        Envoyée le {formatDateFr(app.sentAt ?? app.createdAt)}
                      </span>
                      {app.interviewAt ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-orange-600">
                          <Calendar className="h-3 w-3" aria-hidden="true" />
                          Entretien le {formatDateFr(app.interviewAt)}
                        </span>
                      ) : null}
                      {app.signedAt ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-neutral-900">
                          <PartyPopper className="h-3 w-3" aria-hidden="true" />
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
            </div>
          ))}
        </Stagger>
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
