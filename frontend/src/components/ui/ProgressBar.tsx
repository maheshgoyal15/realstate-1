import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  subLabel?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  subLabel,
  size = "md",
  className,
  ariaLabel,
}) => {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {(label || subLabel) && (
        <div className="flex items-center justify-between text-2xs font-medium uppercase tracking-[0.1em]">
          {label && <span className="text-ink-subtle">{label}</span>}
          {subLabel && <span className="text-ink" data-numeric>{subLabel}</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel ?? label}
        className={cn(
          "w-full overflow-hidden rounded-pill bg-surface-sunken",
          {
            "h-1": size === "sm",
            "h-2": size === "md",
            "h-3": size === "lg",
          }
        )}
      >
        <div
          className="h-full rounded-pill bg-accent-500 transition-[width] duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
