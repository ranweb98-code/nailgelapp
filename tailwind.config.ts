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
        // רקעים כהים-חמים (noir)
        noir: {
          DEFAULT: "#171310",
          900: "#100D0B",
          800: "#171310",
          700: "#211C18",
          600: "#2C2620",
          500: "#3A332B",
        },
        // טקסט שמנת חם
        cream: {
          DEFAULT: "#F4EEE4",
          soft: "#C7BCAC",
          faint: "#8E8475",
        },
        rose: {
          DEFAULT: "#C98A93",
          200: "#E9C1C7",
          300: "#D89DA6",
          400: "#C98A93",
          500: "#B76E79",
          600: "#9E5763",
        },
        gold: {
          DEFAULT: "#C9A86A",
          light: "#E0C893",
          dark: "#A8884C",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        display: ["var(--font-display)", "var(--font-serif)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.37)",
        float: "0 10px 40px rgba(0, 0, 0, 0.45)",
        glow: "0 0 0 1px rgba(201, 168, 106, 0.25), 0 8px 30px rgba(0,0,0,0.4)",
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
