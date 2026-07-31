"use client";

import React, { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or password.",
  AccessDenied: "An account with this email already exists. Please sign in with your password instead.",
  Default: "Something went wrong signing you in. Please try again.",
};

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.42-.22-2.05H12v3.72h6.52c-.13 1.03-.84 2.6-2.42 3.65l-.02.15 3.51 2.68.24.02c2.24-2.02 3.66-5.01 3.66-8.17" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.05 7.94-2.86l-3.78-2.87c-1.01.68-2.36 1.16-4.16 1.16-3.18 0-5.87-2.07-6.83-4.93l-.14.01-3.66 2.78-.05.13C3.34 21.3 7.34 24 12 24" />
      <path fill="#FBBC05" d="M5.17 14.5A6.98 6.98 0 0 1 4.77 12c0-.87.16-1.71.39-2.5l-.01-.17-3.7-2.83-.12.06A11.98 11.98 0 0 0 0 12c0 1.93.47 3.76 1.32 5.37l3.85-2.87" />
      <path fill="#EA4335" d="M12 4.75c2.25 0 3.77.94 4.64 1.73l3.38-3.24C17.94 1.2 15.24 0 12 0 7.34 0 3.34 2.7 1.32 6.63l3.84 2.87C6.13 6.82 8.82 4.75 12 4.75" />
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(
    errorCode ? ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.Default : null
  );

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setSubmitting(false);

    if (result?.error) {
      setFormError(ERROR_MESSAGES.CredentialsSignin);
      return;
    }
    window.location.href = result?.url || callbackUrl;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="p-2 bg-neutral-800 rounded-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            HomeReady
          </span>
        </div>

        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-lg font-semibold text-white">Sign in to your account</h1>
            <p className="text-xs text-neutral-400">Access your properties, reports, and recommendations.</p>
          </div>

          {formError && (
            <div className="text-xs font-semibold text-danger bg-danger-subtle border border-danger-border rounded-lg px-3 py-2">
              {formError}
            </div>
          )}

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className={cn(
              "w-full flex items-center justify-center space-x-2 bg-white hover:bg-surface-sunken text-ink",
              "text-sm font-semibold py-2.5 rounded-xl transition-colors"
            )}
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-neutral-300">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-neutral-400">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-neutral-300 focus:outline-none focus:border-accent-500 transition-colors"
                placeholder="you@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-neutral-400">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-neutral-300 focus:outline-none focus:border-accent-500 transition-colors"
                placeholder="••••••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-accent-500 hover:bg-accent-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
