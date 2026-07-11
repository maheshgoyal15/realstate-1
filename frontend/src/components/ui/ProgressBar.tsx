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
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
          {label && <span className="text-ink-muted">{label}</span>}
          {subLabel && <span className="text-accent-600">{subLabel}</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel ?? label}
        className={cn(
          "w-full bg-surface-sunken rounded-full overflow-hidden shadow-inner",
          {
            "h-1": size === "sm",
            "h-2.5": size === "md",
            "h-4": size === "lg",
          }
        )}
      >
        <div
          className="bg-accent-500 h-full rounded-full transition-[width] duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
