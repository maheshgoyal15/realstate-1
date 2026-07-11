import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  onClose,
  duration = 5000,
}) => {
  const remainingRef = useRef(duration);
  const startRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    startRef.current = Date.now();
    timerRef.current = setTimeout(onClose, remainingRef.current);
  };

  const pause = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    remainingRef.current -= Date.now() - startRef.current;
  };

  useEffect(() => {
    start();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  return (
    <div
      role="alert"
      onMouseEnter={pause}
      onMouseLeave={start}
      onFocus={pause}
      onBlur={start}
      className={cn(
        "fixed top-4 right-4 z-50 flex items-center space-x-3 bg-surface-raised border rounded-xl p-4 shadow-card-hover animate-toast-in max-w-sm w-full",
        {
          "border-success-border text-success": type === "success",
          "border-danger-border text-danger": type === "error",
          "border-navy-200 text-navy-700": type === "info",
          "border-warning-border text-warning": type === "warning",
        }
      )}
    >
      <div className="flex-1 text-sm font-semibold text-ink">{message}</div>
      <button
        onClick={onClose}
        className="p-1.5 hover:bg-surface-sunken rounded-lg text-ink-muted hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
