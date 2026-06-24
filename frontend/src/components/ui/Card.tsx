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
        "bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 transition-all duration-300",
        {
          "hover:border-white/20 hover:bg-slate-900/70 hover:scale-[1.01] hover:shadow-xl shadow-slate-950/50": hoverEffect,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
