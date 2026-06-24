import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  subLabel?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  subLabel,
  size = "md",
  className,
}) => {
  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {(label || subLabel) && (
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
          {label && <span className="text-slate-300">{label}</span>}
          {subLabel && <span className="text-blue-400">{subLabel}</span>}
        </div>
      )}
      <div 
        className={cn(
          "w-full bg-slate-800 rounded-full overflow-hidden shadow-inner",
          {
            "h-1": size === "sm",
            "h-2.5": size === "md",
            "h-4": size === "lg",
          }
        )}
      >
        <div
          className="bg-gradient-to-r from-blue-500 to-indigo-400 h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
};
