import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, helperText, error, id, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          id={id}
          className={cn(
            "glass-input w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 font-medium text-sm transition-all focus:outline-none focus:border-blue-500 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20",
            {
              "border-red-500 focus:border-red-500 focus:ring-red-500/20": error,
            },
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
