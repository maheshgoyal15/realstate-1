import React, { useEffect } from "react";
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
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      role="alert"
      className={cn(
        "fixed top-4 right-4 z-50 flex items-center space-x-3 bg-slate-900 border rounded-xl p-4 shadow-2xl animate-in slide-in-from-top-4 duration-300 max-w-sm w-full",
        {
          "border-emerald-500/40 text-emerald-400": type === "success",
          "border-red-500/40 text-red-400": type === "error",
          "border-blue-500/40 text-blue-400": type === "info",
          "border-amber-500/40 text-amber-400": type === "warning",
        }
      )}
    >
      <div className="flex-1 text-sm font-semibold">{message}</div>
      <button
        onClick={onClose}
        className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
