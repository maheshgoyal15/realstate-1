import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
  placeholder?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  selectedValue,
  onChange,
  label,
  id,
  placeholder = "Select option",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full space-y-1.5 relative">
      {label && (
        <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
          {label}
        </span>
      )}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left text-slate-100 font-medium text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all flex items-center justify-between"
      >
        <span className={cn({ "text-slate-500": !selectedOption })}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={cn("w-4 h-4 text-indigo-400 transition-transform duration-200", {
            "transform rotate-180": isOpen,
          })}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <ul className="absolute z-30 left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-white/5 py-1">
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-white/5",
                  opt.value === selectedValue ? "text-blue-400 bg-blue-500/10" : "text-slate-300"
                )}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
