import React from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
}) => {
  return (
    <nav 
      className={cn(
        "flex items-center space-x-1 border-b border-white/10 pb-px overflow-x-auto",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-5 py-3 font-semibold text-sm transition-all flex items-center space-x-2 shrink-0 border-b-2 -mb-px focus:outline-none focus:text-white",
              isActive
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20"
            )}
          >
            {tab.icon && <span className={cn(isActive ? "text-blue-400" : "text-slate-400")}>{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
