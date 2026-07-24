// Instant skeleton shown while the /analyze route hydrates, so navigation feels
// immediate rather than blank. Mirrors the upload page's rough layout.
export default function AnalyzeLoading() {
  return (
    <div className="space-y-10 pb-12 animate-pulse" aria-hidden="true">
      <div className="space-y-3 pb-8 border-b border-surface-border">
        <div className="h-8 w-72 max-w-full rounded-lg bg-surface-sunken" />
        <div className="h-4 w-96 max-w-full rounded bg-surface-sunken" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-surface-border bg-surface-raised p-8 space-y-5">
          <div className="h-56 w-full rounded-2xl bg-surface-sunken" />
          <div className="h-4 w-40 rounded bg-surface-sunken" />
          <div className="h-11 w-full rounded-xl bg-surface-sunken" />
        </div>
        <div className="rounded-3xl border border-surface-border bg-surface-raised p-8 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 w-full rounded-xl bg-surface-sunken" />
          ))}
        </div>
      </div>
    </div>
  );
}
