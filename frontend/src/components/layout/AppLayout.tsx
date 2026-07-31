"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { PageTransition } from "@/components/layout/PageTransition";

interface AppLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Analyze", href: "/analyze" },
  { name: "Reports", href: "/reports" },
  { name: "Contractors", href: "/contractors" },
  { name: "Settings", href: "/settings" },
];

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const mobileDrawerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(mobileDrawerRef, isMobileOpen);

  const profileRef = useRef<HTMLDivElement>(null);

  // Dismiss the account menu on outside click and on Escape, returning focus to
  // the trigger so keyboard users don't lose their place.
  useEffect(() => {
    if (!profileOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProfileOpen(false);
        profileRef.current?.querySelector("button")?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen]);

  // Close the mobile sheet whenever the route changes.
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  // The login page renders its own full-screen layout with no app chrome. This
  // check runs after all hooks above so hook order stays constant across
  // client-side navigations (this layout persists across route changes).
  if (pathname?.startsWith("/login")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-ink">
      {/* Own stacking context so the account menu's z-index stays local. */}
      <header className="sticky top-0 z-sticky isolate border-b border-surface-border bg-surface-raised">
        <div className="mx-auto flex h-16 w-full max-w-wide items-center gap-6 px-5 md:px-8">
          {/* Wordmark */}
          <a
            href="/dashboard"
            className="flex shrink-0 items-center gap-2.5 rounded-md transition-opacity duration-150 hover:opacity-70"
          >
            <span className="h-5 w-5 rounded-[3px] bg-accent-500" aria-hidden="true" />
            <span className="text-base font-semibold tracking-tight">HomeReady</span>
          </a>

          {/* Primary navigation — active state is a hairline accent rule, not a
              filled pill, so the nav stays visually quiet next to page content. */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <a
                  key={item.name}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-md px-3 py-2 text-sm transition-colors duration-150",
                    active
                      ? "font-medium text-ink"
                      : "font-normal text-ink-muted hover:text-ink"
                  )}
                >
                  {item.name}
                  {active && (
                    <span
                      className="absolute inset-x-3 -bottom-[13px] h-0.5 bg-accent-500"
                      aria-hidden="true"
                    />
                  )}
                </a>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <a
              href="/settings?tab=billing"
              className="hidden sm:inline-flex h-9 items-center rounded-pill border border-surface-border-strong px-4 text-xs font-medium text-ink-muted transition-colors duration-150 hover:border-ink hover:text-ink"
            >
              Upgrade to Pro
            </a>

            {/* Account menu */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                aria-label="Account menu"
                className="flex items-center gap-1.5 rounded-lg p-1 transition-colors duration-150 hover:bg-surface-sunken"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-2xs font-semibold text-white">
                  MP
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-ink-subtle transition-transform duration-150",
                    profileOpen && "rotate-180"
                  )}
                />
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-dropdown mt-2 w-56 animate-fade-in rounded-xl border border-surface-border bg-surface-raised p-1.5 shadow-float"
                >
                  <div className="border-b border-surface-border px-3 py-2.5">
                    <p className="text-sm font-medium text-ink">Mahesh Patel</p>
                    <p className="truncate text-xs text-ink-muted">mahesh@example.com</p>
                  </div>
                  <a
                    href="/settings"
                    role="menuitem"
                    className="mt-1.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors duration-150 hover:bg-surface-sunken hover:text-ink"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </a>
                  <button
                    role="menuitem"
                    onClick={() => {
                      window.location.href = "/api/auth/signout";
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink-muted transition-colors duration-150 hover:bg-danger-subtle hover:text-danger"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsMobileOpen(true)}
              aria-expanded={isMobileOpen}
              aria-label="Open navigation menu"
              className="md:hidden rounded-lg p-2 text-ink-muted transition-colors duration-150 hover:bg-surface-sunken hover:text-ink"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile navigation sheet */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-overlay md:hidden">
          <div
            onClick={() => setIsMobileOpen(false)}
            className="absolute inset-0 animate-fade-in bg-neutral-950/40"
            aria-hidden="true"
          />
          <div
            ref={mobileDrawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col border-l border-surface-border bg-surface-raised focus:outline-none"
          >
            <div className="flex h-16 items-center justify-end border-b border-surface-border px-4">
              <button
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close navigation menu"
                className="rounded-lg p-2 text-ink-muted transition-colors duration-150 hover:bg-surface-sunken hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col p-3" aria-label="Primary">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-lg px-3 py-3 text-sm transition-colors duration-150",
                      active
                        ? "bg-surface-sunken font-medium text-ink"
                        : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
                    )}
                  >
                    {item.name}
                  </a>
                );
              })}
            </nav>

            <a
              href="/settings?tab=billing"
              className="mt-auto m-3 flex h-11 items-center justify-center rounded-pill border border-surface-border-strong text-sm font-medium text-ink-muted transition-colors duration-150 hover:border-ink hover:text-ink"
            >
              Upgrade to Pro
            </a>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-wide flex-1 px-5 py-8 md:px-8 md:py-10">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
};
