import React from "react";
import { cn } from "@/lib/utils";

export type BadgeType =
  | "roi-high" | "roi-medium" | "roi-low"
  | "time-quick" | "time-medium" | "time-long"
  | "status-complete" | "status-progress" | "status-error" | "status-pending"
  | "verified"
  | "accent"
  | "default";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeType;
}

/**
 * Badges are quiet by default — tinted fill with a matching hairline. Only
 * terminal statuses (complete / error) get a solid fill, so a scan of the page
 * surfaces the handful of rows that actually need attention.
 */
const VARIANT_CLASSES: Record<BadgeType, string> = {
  default: "bg-surface-sunken border-surface-border-strong text-ink-muted",
  accent: "bg-accent-50 border-accent-200 text-accent-700",
  "roi-high": "bg-success-subtle border-success-border text-success",
  "roi-medium": "bg-warning-subtle border-warning-border text-warning",
  "roi-low": "bg-surface-sunken border-surface-border-strong text-ink-muted",
  "time-quick": "bg-surface-sunken border-surface-border-strong text-ink",
  "time-medium": "bg-accent-50 border-accent-200 text-accent-700",
  "time-long": "bg-surface-sunken border-surface-border text-ink-subtle",
  "status-complete": "bg-success-subtle border-success-border text-success",
  "status-progress": "bg-accent-50 border-accent-200 text-accent-700",
  "status-error": "bg-danger text-white border-transparent",
  "status-pending": "bg-surface-sunken border-surface-border-strong text-ink-subtle",
  verified: "bg-success-subtle border-success-border text-success",
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = "default",
  ...props
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-pill border px-2.5 py-1 text-2xs font-medium uppercase tracking-[0.08em]",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
