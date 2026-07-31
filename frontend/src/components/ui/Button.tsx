import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * `primary` is the workhorse solid-ink button. `accent` is the hot orange and
   * should appear at most once per view — it is the page's single loudest
   * action. Reaching for it twice on one screen flattens the hierarchy.
   */
  variant?: "primary" | "accent" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  isLoading,
  icon,
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40",
        {
          "bg-neutral-800 text-white hover:bg-neutral-700 active:bg-neutral-900":
            variant === "primary",
          "bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700":
            variant === "accent",
          "border border-surface-border-strong bg-surface-raised text-ink hover:border-ink active:bg-surface-sunken":
            variant === "secondary",
          "bg-danger text-white hover:bg-[#96190f] active:bg-[#7d150c]":
            variant === "danger",
          "bg-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink active:bg-surface-border-strong":
            variant === "ghost",
          "h-8 px-3 text-xs": size === "sm",
          "h-10 px-4 text-sm": size === "md",
          "h-12 px-6 text-sm": size === "lg",
        },
        className
      )}
      {...props}
    >
      {isLoading && (
        <svg className="h-4 w-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!isLoading && icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
