import React from "react";
import { cn } from "@/lib/utils";

export type BadgeType = 
  | "roi-high" | "roi-medium" | "roi-low"
  | "time-quick" | "time-medium" | "time-long"
  | "status-complete" | "status-progress" | "status-error" | "status-pending"
  | "default";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeType;
}

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
        {
          // Default
          "bg-slate-800 border-slate-700 text-slate-300": variant === "default",
          // ROI
          "bg-emerald-500/10 border-emerald-500/30 text-emerald-400": variant === "roi-high",
          "bg-amber-500/10 border-amber-500/30 text-amber-400": variant === "roi-medium",
          "bg-red-500/10 border-red-500/30 text-red-400": variant === "roi-low",
          // Timeline
          "bg-cyan-500/10 border-cyan-500/30 text-cyan-400": variant === "time-quick",
          "bg-purple-500/10 border-purple-500/30 text-purple-400": variant === "time-medium",
          "bg-slate-700/30 border-slate-600/30 text-slate-400": variant === "time-long",
          // Status
          "bg-emerald-600 text-white border-transparent": variant === "status-complete",
          "bg-blue-600 text-white border-transparent": variant === "status-progress",
          "bg-red-600 text-white border-transparent": variant === "status-error",
          "bg-slate-600 text-white border-transparent": variant === "status-pending",
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
