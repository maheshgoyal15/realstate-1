import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

/**
 * Flat hairline-bordered surface. Hover darkens the border only — the card does
 * not lift, glow, or gain a shadow, because elevation here means "floating",
 * and a card in a grid is not floating.
 */
export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-surface-border bg-surface-raised p-6 transition-colors duration-150",
        hoverEffect && "hover:border-surface-border-strong",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
