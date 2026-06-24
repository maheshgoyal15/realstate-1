import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
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
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 active:scale-95 focus:outline-none focus:ring-3 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        {
          // Variants
          "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-500/35": variant === "primary",
          "border border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800/50 hover:text-white": variant === "secondary",
          "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 hover:shadow-red-500/35": variant === "danger",
          "bg-transparent text-slate-300 hover:bg-white/5 hover:text-white": variant === "ghost",
          // Sizes
          "px-3 py-1.5 text-xs h-8": size === "sm",
          "px-4 py-2.5 text-sm h-10": size === "md",
          "px-6 py-3.5 text-base h-12": size === "lg",
        },
        className
      )}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!isLoading && icon && <span className="mr-2 inline-flex">{icon}</span>}
      {children}
    </button>
  );
};
