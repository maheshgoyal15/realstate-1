"use client";

import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";

/**
 * Long-running progress view for the whole-house analysis pipeline.
 *
 * Every figure here is reported by the backend (`progress`, `stage`,
 * `stageDetail` on GET /api/v1/analyze/{id}) or measured on the client
 * (elapsed). Nothing is simulated: an earlier version of this screen drew a
 * fixed checklist that showed the same two steps complete from first paint
 * regardless of what the pipeline was doing.
 */

// Ordered to match PIPELINE_STAGES in services/multi_agent_pipeline.py. The
// backend sends the identifier only; wording lives here so copy can change
// without a backend deploy.
const STAGES: { id: string; label: string; note: string }[] = [
  { id: "ingest", label: "Reading your photos", note: "Decoding and scaling each upload" },
  { id: "perception", label: "Recognising rooms", note: "Identifying room types and merging duplicate views" },
  { id: "budget", label: "Allocating your budget", note: "Splitting your ceiling across rooms by resale priority" },
  { id: "style", label: "Locking the specification", note: "Choosing surfaces, cabinetry and fixtures" },
  { id: "render", label: "Generating room views", note: "Rendering an upgrade concept per room" },
  { id: "audit", label: "Auditing the scope", note: "Checking every line item against your budget" },
];

// Progress at which each stage above begins, mirroring PIPELINE_STAGES. Used
// only to place an unrecognised stage name (see activeIndex). `style` and
// `render` share 55 because the backend enters the render phase at the style
// mark; picking the last match therefore resolves to `render`, which is the
// right guess — `style` is near-instantaneous while `render` owns 55-90.
const STAGE_FLOORS = [0, 30, 45, 55, 55, 96];

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${String(s % 60).padStart(2, "0")}s`;
}

/**
 * Extrapolate remaining time from observed throughput. Deliberately withheld
 * until there is enough signal to be worth showing — a countdown derived from
 * 3% progress is noise — and rounded so it reads as the estimate it is.
 */
function estimateRemaining(elapsedSeconds: number, progress: number): string | null {
  if (progress < 15 || progress >= 100 || elapsedSeconds < 5) return null;
  const projectedTotal = (elapsedSeconds / progress) * 100;
  const remaining = projectedTotal - elapsedSeconds;
  if (remaining < 5) return null;
  const rounded = remaining < 60 ? Math.ceil(remaining / 5) * 5 : Math.ceil(remaining / 15) * 15;
  return formatDuration(rounded);
}

interface AnalysisProgressProps {
  progress: number;
  stage: string | null;
  stageDetail: string | null;
  /**
   * Epoch ms the run began. Sourced from the server's analysis record, not
   * page load: this screen tells the user they can close the tab, so on their
   * return the counter has to describe the pipeline's life, not this mount's.
   * Falls back to mount time until the first poll returns.
   */
  startedAt: number;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  progress,
  stage,
  stageDetail,
  startedAt,
}) => {
  const [elapsed, setElapsed] = useState(() => (Date.now() - startedAt) / 1000);

  useEffect(() => {
    const t = setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  const clamped = Math.min(100, Math.max(0, Math.round(progress)));
  const remaining = estimateRemaining(elapsed, progress);

  // An unrecognised stage (a name this build predates, or a run that failed
  // partway) must not silently mean "index 0" — that would light up the first
  // row as active while the bar sat at 90%. Fall back to whichever stage the
  // reported progress lands in, so the two halves of the screen always agree.
  const namedIndex = STAGES.findIndex((s) => s.id === stage);
  const activeIndex =
    namedIndex >= 0
      ? namedIndex
      : Math.max(0, STAGE_FLOORS.filter((floor) => clamped >= floor).length - 1);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl animate-fade-in">
        <div className="mb-4 flex items-center gap-2.5 bg-success-subtle border border-success-border text-success px-4 py-2.5 rounded-xl font-semibold text-xs shadow-sm">
          <span>✓ Successfully Uploaded Your Property Photo</span>
        </div>

        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-accent-600">
          HomeReady Architectural Studio
        </p>

        <h1 className="mt-3 text-3xl text-ink">Uploaded your photo — Designing your remodel</h1>

        {/* No agent count here on purpose: the pipeline runs five sub-agents but
            this list shows six phases (ingest is I/O, not an agent), so any
            number stated would be wrong against one of them — and would rot the
            next time a phase is added. */}
        <p className="mt-3 max-w-[58ch] text-sm text-ink-muted">
          We&apos;re working through your photos — recognising each room, dividing your budget
          across them, then rendering what the upgrades look like.
        </p>

        {typeof window !== "undefined" && localStorage.getItem("user_uploaded_property_photo") && (
          <div className="mt-6 flex items-center gap-4 bg-surface-raised border border-surface-border p-3.5 rounded-2xl">
            <img
              src={localStorage.getItem("user_uploaded_property_photo")!}
              alt="Uploaded property photo preview"
              className="w-16 h-16 rounded-xl object-cover shrink-0 border border-surface-border"
            />
            <div className="text-left">
              <span className="text-xs font-semibold text-ink block">Uploaded Photo Confirmed</span>
              <span className="text-[11px] text-ink-muted leading-tight">Our AI agents are analyzing your room surfaces & generating photorealistic remodel options.</span>
            </div>
          </div>
        )}

        {/* The one element allowed to be big. At squint distance the completion
            figure is the only thing competing for attention. */}
        <div className="mt-10 flex items-baseline gap-2">
          <span className="text-5xl text-ink" data-numeric>
            {clamped}
          </span>
          <span className="text-lg text-ink-subtle">%</span>

          <span className="ml-auto text-2xs uppercase tracking-[0.1em] text-ink-subtle" data-numeric>
            {formatDuration(elapsed)} elapsed
            {remaining && <> · about {remaining} left</>}
          </span>
        </div>

        <ProgressBar
          value={clamped}
          size="sm"
          className="mt-4"
          ariaLabel="Whole-house analysis progress"
        />

        <ol className="mt-10 space-y-px border-t border-surface-border">
          {STAGES.map((s, i) => {
            const done = i < activeIndex;
            const active = i === activeIndex;

            return (
              <li
                key={s.id}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex gap-3 border-b border-surface-border py-3",
                  active && "py-4"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                    done && "bg-success-subtle text-success",
                    active && "bg-accent-500",
                    !done && !active && "border border-surface-border-strong"
                  )}
                >
                  {done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm",
                      active && "font-semibold text-ink",
                      done && "text-ink-muted",
                      !done && !active && "text-ink-subtle"
                    )}
                  >
                    {s.label}
                  </p>

                  {/* Only the running stage explains itself — expanding every
                      row is what made the previous version read as six
                      identical grey blocks. */}
                  {active && (
                    <p className="mt-1 text-xs text-ink-muted">
                      {stageDetail ?? s.note}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <p className="mt-8 text-xs text-ink-subtle">
          This usually takes a couple of minutes. You can close this tab — the analysis keeps
          running and will be waiting on your dashboard.
        </p>
      </div>
    </div>
  );
};
