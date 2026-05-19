export type InterviewPrepCardData = {
  companySummary: string;
  probableQuestions: string[];
  matchingStrengths: string[];
  interviewAt: Date | null;
};

/**
 * Story 4.7 — UI InterviewPrepCard (UX-DR13 V1).
 * Affichée dans la page candidatures pour les apps en interview_scheduled
 * dès que la prep IA a été générée par le worker.
 */
export function InterviewPrepCard({ data }: { data: InterviewPrepCardData }) {
  return (
    <section
      className="rounded-lg border border-primary-500/40 bg-primary-100/30 p-4"
      aria-labelledby="interview-prep-title"
    >
      <header className="flex items-center justify-between gap-3">
        <h3 id="interview-prep-title" className="text-sm font-semibold text-primary-600">
          Prépa entretien ✨
        </h3>
        {data.interviewAt ? (
          <span className="text-xs text-neutral-600">
            Dans {hoursUntil(data.interviewAt)}h env.
          </span>
        ) : null}
      </header>

      <div className="mt-3 space-y-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
            L’entreprise
          </p>
          <p className="mt-1 text-neutral-800">{data.companySummary}</p>
        </div>

        {data.probableQuestions.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
              Questions probables
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-neutral-800">
              {data.probableQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {data.matchingStrengths.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
              Tes points forts à mettre en avant
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-neutral-800">
              {data.matchingStrengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function hoursUntil(d: Date): number {
  const diffMs = d.getTime() - Date.now();
  return Math.max(0, Math.round(diffMs / 3_600_000));
}
