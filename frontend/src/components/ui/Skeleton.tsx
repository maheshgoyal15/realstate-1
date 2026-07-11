import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div
    className={cn("rounded-lg skeleton-shimmer animate-shimmer", className)}
    aria-hidden="true"
  />
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className,
}) => (
  <div className={cn("space-y-2", className)} aria-hidden="true">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")} />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn("card-surface p-6 space-y-4", className)}
    aria-hidden="true"
  >
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    <SkeletonText lines={2} />
    <Skeleton className="h-9 w-24 rounded-lg" />
  </div>
);

export const SkeletonAvatar: React.FC<{ className?: string }> = ({ className }) => (
  <Skeleton className={cn("h-12 w-12 rounded-full shrink-0", className)} />
);

export const SkeletonLoader: React.FC<{ children: React.ReactNode; label?: string }> = ({
  children,
  label = "Loading",
}) => (
  <div role="status" aria-label={label}>
    <span className="sr-only">{label}</span>
    {children}
  </div>
);
