export function CvProcessingSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <p className="text-sm text-neutral-700">On analyse ton CV, ça prend environ 8 secondes…</p>
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-neutral-200" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-neutral-200" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-neutral-200" />
      </div>
      <p className="text-xs text-neutral-500">
        Tu peux fermer cette page, on te préviendra par email.
      </p>
    </div>
  );
}
