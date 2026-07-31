import type { Config } from "tailwindcss";

/**
 * Editorial-minimal design system.
 *
 * Flat near-monochrome neutrals carry all structure; a single hot orange is the
 * only chromatic accent and is spent sparingly (primary action, active nav,
 * focus ring). Elevation is expressed with hairline borders — shadows are
 * reserved for surfaces that genuinely float above the page (menu, dialog,
 * toast). Nothing here is pure #000 or a gradient.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Single neutral ramp. Everything gray in the app comes from here so
        // borders, text and dark surfaces stay hue-consistent.
        neutral: {
          50: "#f8f8f8",
          100: "#ededed",
          200: "#dedede",
          300: "#c4c4c4",
          400: "#9a9a9a",
          500: "#6b6b6b",
          600: "#4a4a4a",
          700: "#333333",
          800: "#222222",
          900: "#171717",
          950: "#0e0e0e",
        },
        accent: {
          50: "#fff3ef",
          100: "#ffe2d8",
          200: "#ffc5b1",
          300: "#ffae94",
          400: "#ff7d54",
          500: "#fa5d29",
          600: "#e04616",
          700: "#b53710",
          800: "#8a2a0c",
        },
        surface: {
          DEFAULT: "#f8f8f8",
          raised: "#ffffff",
          sunken: "#ededed",
          border: "#ededed",
          "border-strong": "#dedede",
          inverse: "#222222",
        },
        ink: {
          DEFAULT: "#222222",
          muted: "#6b6b6b",
          subtle: "#9a9a9a",
          inverse: "#f8f8f8",
        },
        // Status colors are desaturated enough to sit beside the accent without
        // competing with it. Danger is a deep red, deliberately darker than the
        // accent orange so destructive actions never read as primary ones.
        success: { DEFAULT: "#067647", subtle: "#ecfdf3", border: "#abefc6" },
        warning: { DEFAULT: "#8f6a00", subtle: "#fdf6e3", border: "#ecd9a0" },
        danger: { DEFAULT: "#b42318", subtle: "#fef3f2", border: "#fda29b" },
      },
      fontFamily: {
        sans: ["var(--font-inter-tight)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Tight editorial scale — five working steps carry the whole app.
        "2xs": ["0.6875rem", { lineHeight: "1.45", letterSpacing: "0.01em" }], // 11
        xs: ["0.75rem", { lineHeight: "1.5" }], // 12
        sm: ["0.875rem", { lineHeight: "1.6" }], // 14 — body
        base: ["1rem", { lineHeight: "1.55" }], // 16
        lg: ["1.125rem", { lineHeight: "1.45" }], // 18
        xl: ["1.375rem", { lineHeight: "1.3", letterSpacing: "-0.01em" }], // 22
        "2xl": ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }], // 28
        "3xl": ["2.25rem", { lineHeight: "1.12", letterSpacing: "-0.025em" }], // 36
        "4xl": ["3rem", { lineHeight: "1.05", letterSpacing: "-0.03em" }], // 48
        "5xl": ["4rem", { lineHeight: "1", letterSpacing: "-0.035em" }], // 64
      },
      borderRadius: {
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
        xl: "10px",
        "2xl": "12px",
        "3xl": "16px",
        pill: "72px",
      },
      boxShadow: {
        // Structure uses borders, not shadows — `card` is a whisper for the few
        // places a surface needs to lift off the page at all.
        card: "0 1px 2px rgba(34, 34, 34, 0.04)",
        "card-hover": "0 2px 4px rgba(34, 34, 34, 0.05)",
        // True floating layers only.
        float: "0 4px 8px rgba(34, 34, 34, 0.04), 0 12px 32px rgba(34, 34, 34, 0.10)",
      },
      maxWidth: {
        content: "1216px",
        wide: "1816px",
      },
      zIndex: {
        // One documented scale. Nothing in the app may invent its own value.
        dropdown: "20",
        sticky: "30",
        overlay: "40",
        modal: "50",
        toast: "60",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "zoom-in-95": {
          "0%": { opacity: "0", transform: "scale(.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-top": {
          "0%": { opacity: "0", transform: "translateY(-6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Loading feedback, not decoration — transform-only so it stays cheap.
        indeterminate: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(400%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        indeterminate: "indeterminate 1.4s ease-in-out infinite",
        "fade-in": "fade-in 160ms ease-out",
        "modal-in": "fade-in 160ms ease-out, zoom-in-95 160ms ease-out",
        "toast-in": "slide-in-top 200ms ease-out",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
    },
  },
  plugins: [],
};

export default config;
