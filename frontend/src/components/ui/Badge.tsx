import React from "react";
import { cn } from "@/lib/utils";

export type BadgeType =
  | "roi-high" | "roi-medium" | "roi-low"
  | "time-quick" | "time-medium" | "time-long"
  | "status-complete" | "status-progress" | "status-error" | "status-pending"
  | "verified"
  | "default";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeType;
}

const VARIANT_CLASSES: Record<BadgeType, string> = {
  default: "bg-surface-sunken border-surface-border text-ink-muted",
  "roi-high": "bg-success-subtle border-success-border text-success",
  "roi-medium": "bg-warning-subtle border-warning-border text-warning",
  "roi-low": "bg-danger-subtle border-danger-border text-danger",
  "time-quick": "bg-navy-50 border-navy-200 text-navy-700",
  "time-medium": "bg-accent-50 border-accent-200 text-accent-600",
  "time-long": "bg-surface-sunken border-surface-border text-ink-subtle",
  "status-complete": "bg-success text-white border-transparent",
  "status-progress": "bg-navy-700 text-white border-transparent",
  "status-error": "bg-danger text-white border-transparent",
  "status-pending": "bg-ink-subtle text-white border-transparent",
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
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase border",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
