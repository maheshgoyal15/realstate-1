import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "bg-slate-900 border border-white/10 w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]",
          {
            "max-w-md": size === "sm",
            "max-w-xl": size === "md",
            "max-w-3xl": size === "lg",
            "max-w-5xl": size === "xl",
          }
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 id="modal-title" className="text-lg font-bold text-white leading-none">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-300 text-sm leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-white/10 bg-slate-950/40 flex items-center justify-end space-x-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
