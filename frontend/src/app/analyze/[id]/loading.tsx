// Instant skeleton for the results route, matching its two-column layout so the
// jump from the analyze page to a result feels seamless while data streams in.
export default function AnalysisResultsLoading() {
  return (
    <div className="space-y-10 pb-12 animate-pulse" aria-hidden="true">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-surface-border gap-4">
        <div className="space-y-3">
          <div className="h-8 w-80 max-w-full rounded-lg bg-surface-sunken" />
          <div className="h-4 w-64 max-w-full rounded bg-surface-sunken" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-36 rounded-xl bg-surface-sunken" />
          <div className="h-10 w-44 rounded-xl bg-surface-sunken" />
        </div>
      </div>

      {/* Budget dial placeholder */}
      <div className="h-24 w-full rounded-2xl bg-surface-sunken" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column */}
        <div className="lg:col-span-4">
          <div className="rounded-3xl border border-surface-border bg-surface-raised p-6 space-y-6">
            <div className="h-48 w-full rounded-xl bg-surface-sunken" />
            <div className="h-20 w-full rounded-xl bg-surface-sunken" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 w-full rounded-xl bg-surface-sunken" />
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="h-7 w-64 rounded-lg bg-surface-sunken" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-surface-border bg-surface-raised p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-52 rounded bg-surface-sunken" />
                  <div className="h-3 w-full rounded bg-surface-sunken" />
                  <div className="h-3 w-4/5 rounded bg-surface-sunken" />
                  <div className="h-20 w-full rounded-xl bg-surface-sunken" />
                </div>
                <div className="w-full md:w-44 h-28 rounded-xl bg-surface-sunken shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
