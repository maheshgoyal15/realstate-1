import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef1f6",
          100: "#d7dee9",
          200: "#aebdd3",
          300: "#8399ba",
          400: "#5c7099",
          500: "#3d5480",
          600: "#28406a",
          700: "#1a2e52",
          800: "#101a2e",
          900: "#0b1220",
          950: "#070c16",
        },
        accent: {
          50: "#fdf3ee",
          100: "#fbe2d6",
          200: "#f5bda2",
          300: "#ec9770",
          400: "#e2733f",
          500: "#c05621",
          600: "#9c4419",
          700: "#7a3514",
          800: "#5c280f",
        },
        surface: {
          DEFAULT: "#faf7f2",
          raised: "#ffffff",
          sunken: "#f3ede3",
          border: "#e4dccc",
          "border-strong": "#cbbfa4",
        },
        ink: {
          DEFAULT: "#1c1f26",
          muted: "#5b6472",
          subtle: "#8891a0",
        },
        success: { DEFAULT: "#166534", subtle: "#dcfce7", border: "#86efac" },
        warning: { DEFAULT: "#92400e", subtle: "#fef3c7", border: "#fcd34d" },
        danger: { DEFAULT: "#b91c1c", subtle: "#fee2e2", border: "#fca5a5" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,31,38,0.04), 0 4px 12px rgba(28,31,38,0.06)",
        "card-hover": "0 4px 10px rgba(28,31,38,0.06), 0 12px 28px rgba(28,31,38,0.10)",
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
          "0%": { opacity: "0", transform: "scale(.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-top": {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        "fade-in": "fade-in 150ms ease-out",
        "modal-in": "fade-in 150ms ease-out, zoom-in-95 150ms ease-out",
        "toast-in": "slide-in-top 200ms ease-out",
        float: "float 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
