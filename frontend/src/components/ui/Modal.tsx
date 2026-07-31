import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, isOpen);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-modal isolate flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 animate-fade-in bg-neutral-950/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container — a genuinely floating surface, so it earns a shadow. */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={cn(
          "relative z-10 flex max-h-[90vh] w-full animate-modal-in flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-raised shadow-float focus:outline-none",
          {
            "max-w-md": size === "sm",
            "max-w-xl": size === "md",
            "max-w-3xl": size === "lg",
            "max-w-5xl": size === "xl",
          }
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
          <h3 id="modal-title" className="text-lg font-semibold leading-none text-ink">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-ink-muted transition-colors duration-150 hover:bg-surface-sunken hover:text-ink"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-ink-muted">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-surface-border bg-surface px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
