import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        "bg-surface-raised border border-surface-border rounded-2xl p-6 shadow-card transition-[transform,box-shadow,border-color] duration-200",
        {
          "hover:border-accent-200 hover:shadow-card-hover hover:-translate-y-0.5": hoverEffect,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
