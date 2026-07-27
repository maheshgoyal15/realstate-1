"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Wraps route content in a smooth fade/slide transition keyed by pathname so
 * navigating between top-level pages ( / -> /analyze -> /analyze/[id] -> /reports
 * -> /contractors ) feels fluid rather than a hard swap. Enter animations play on
 * every client-side navigation; `mode="wait"` sequences the swap cleanly.
 */
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
