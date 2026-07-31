import React, { useState, useRef, useEffect, useId } from "react";
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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const typeaheadRef = useRef<{ buffer: string; timeout: ReturnType<typeof setTimeout> | null }>({
    buffer: "",
    timeout: null,
  });

  const generatedId = useId();
  const dropdownId = id ?? generatedId;
  const listboxId = `${dropdownId}-listbox`;

  const selectedOption = options.find((opt) => opt.value === selectedValue);
  const selectedIndex = options.findIndex((opt) => opt.value === selectedValue);

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

  const openAt = (index: number) => {
    setIsOpen(true);
    setHighlightedIndex(index);
  };

  const commitSelection = (index: number) => {
    const opt = options[index];
    if (opt) {
      onChange(opt.value);
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        openAt(isOpen ? Math.min(highlightedIndex + 1, options.length - 1) : Math.max(selectedIndex, 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        openAt(isOpen ? Math.max(highlightedIndex - 1, 0) : Math.max(selectedIndex, 0));
        break;
      case "Home":
        e.preventDefault();
        openAt(0);
        break;
      case "End":
        e.preventDefault();
        openAt(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          commitSelection(highlightedIndex);
        } else {
          openAt(Math.max(selectedIndex, 0));
        }
        break;
      case "Escape":
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
        }
        break;
      default:
        if (e.key.length === 1) {
          const buf = typeaheadRef.current;
          buf.buffer += e.key.toLowerCase();
          if (buf.timeout) clearTimeout(buf.timeout);
          buf.timeout = setTimeout(() => {
            buf.buffer = "";
          }, 500);
          const match = options.findIndex((opt) => opt.label.toLowerCase().startsWith(buf.buffer));
          if (match >= 0) openAt(match);
        }
    }
  };

  return (
    <div ref={containerRef} className="w-full space-y-1.5 relative">
      {label && (
        <span className="block text-2xs font-medium text-ink-muted uppercase tracking-[0.1em]">
          {label}
        </span>
      )}
      <button
        ref={triggerRef}
        id={dropdownId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen && highlightedIndex >= 0 ? `${dropdownId}-option-${highlightedIndex}` : undefined}
        onClick={() => (isOpen ? setIsOpen(false) : openAt(Math.max(selectedIndex, 0)))}
        onKeyDown={handleTriggerKeyDown}
        className="flex h-12 w-full items-center justify-between rounded-lg border border-surface-border-strong bg-surface-raised px-4 text-left text-sm text-ink transition-colors duration-150 hover:border-ink-subtle"
      >
        <span className={cn({ "text-ink-subtle": !selectedOption })}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={cn("w-4 h-4 text-ink-muted transition-transform duration-200", {
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
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={label ? dropdownId : undefined}
          tabIndex={-1}
          onKeyDown={handleTriggerKeyDown}
          className="absolute z-dropdown left-0 right-0 mt-2 bg-surface-raised border border-surface-border rounded-xl shadow-float max-h-60 overflow-y-auto divide-y divide-surface-border py-1"
        >
          {options.map((opt, index) => (
            <li key={opt.value}>
              <button
                id={`${dropdownId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={opt.value === selectedValue}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => commitSelection(index)}
                className={cn(
                  "w-full text-left px-4 py-3 text-sm font-medium transition-colors",
                  opt.value === selectedValue ? "text-accent-600 bg-accent-50" : "text-ink",
                  index === highlightedIndex && opt.value !== selectedValue ? "bg-surface-sunken" : ""
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
