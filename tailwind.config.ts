import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // רקעים כהים-חמים (noir) — גוון עדין ורדרד ליישור עם הסרטון
        noir: {
          DEFAULT: "#1A1416",
          900: "#110C0D",
          800: "#1A1416",
          700: "#241C1F",
          600: "#2E2428",
          500: "#3D3236",
        },
        // טקסט / משטחים בהירים — שמנת-ורוד, לא צהוב
        cream: {
          DEFAULT: "#F7F1EE",
          soft: "#C9BAB4",
          faint: "#8F817C",
        },
        rose: {
          DEFAULT: "#C98A93",
          200: "#E9C1C7",
          300: "#D89DA6",
          400: "#C98A93",
          500: "#B76E79",
          600: "#9E5763",
        },
        // מבטא ראשי — ורוד-אפרפר / rose-gold (במקום זהב צהוב)
        gold: {
          DEFAULT: "#C4908A",
          light: "#E4C4C0",
          dark: "#9E5E63",
        },
        blush: {
          DEFAULT: "#FAF5F3",
          card: "#FFFCFA",
          muted: "#F3E8E4",
          border: "#E8DAD4",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        display: ["var(--font-display)", "var(--font-serif)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(17, 12, 13, 0.32)",
        float: "0 10px 40px rgba(17, 12, 13, 0.38)",
        glow: "0 0 0 1px rgba(196, 144, 138, 0.35), 0 8px 30px rgba(17, 12, 13, 0.4)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.5s ease-out both",
        "scale-in": "scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
