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
      <div className="w-full space-y-2">
        {label && (
          <label htmlFor={inputId} className="block text-2xs font-medium uppercase tracking-[0.1em] text-ink-muted">
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
            "h-12 w-full rounded-lg border border-surface-border-strong bg-surface-raised px-4 text-sm text-ink transition-colors duration-150 hover:border-ink-subtle focus:border-ink focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-subtle",
            error && "border-danger hover:border-danger focus:border-danger",
            className
          )}
          {...props}
        />
        {error && (
          <p id={descriptionId} className="text-xs text-danger">
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
