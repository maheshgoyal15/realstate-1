import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, helperText, error, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descriptionId = error || helperText ? `${inputId}-description` : undefined;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-ink-muted uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={descriptionId}
          className={cn(
            "w-full bg-surface-sunken border border-surface-border-strong rounded-xl px-4 py-3 text-ink placeholder:text-ink-subtle font-medium text-sm transition-colors focus:outline-none focus:border-accent-500 focus:bg-white focus:ring-2 focus:ring-accent-500/30",
            {
              "border-danger focus:border-danger focus:ring-danger/20": error,
            },
            className
          )}
          {...props}
        />
        {error && (
          <p id={descriptionId} className="text-xs text-danger font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={descriptionId} className="text-xs text-ink-subtle">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
