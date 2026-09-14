import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "380px",
      },
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        raised: "rgb(var(--raised) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        faint: "rgb(var(--faint) / <alpha-value>)",
        amber: "rgb(var(--amber) / <alpha-value>)",
        blue: "rgb(var(--blue) / <alpha-value>)",
        win: "rgb(var(--win) / <alpha-value>)",
        draw: "rgb(var(--draw) / <alpha-value>)",
        loss: "rgb(var(--loss) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        score: ["var(--font-condensed)", "Impact", "sans-serif"],
      },
      borderRadius: {
        board: "6px",
        card: "14px",
      },
      boxShadow: {
        lift: "0 1px 2px rgb(0 0 0 / 0.04), 0 12px 32px -12px rgb(8 10 24 / 0.28)",
        glow: "0 0 0 1px rgb(var(--amber) / 0.35), 0 8px 30px -10px rgb(var(--amber) / 0.45)",
      },
      keyframes: {
        grow: {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        rise: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "45%": { transform: "scale(1.14)" },
          "100%": { transform: "scale(1)" },
        },
        sheet: {
          from: { opacity: "0", transform: "translateY(18px) scale(0.99)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        grow: "grow 700ms cubic-bezier(0.22, 1, 0.36, 1) both",
        rise: "rise 320ms cubic-bezier(0.22, 1, 0.36, 1) both",
        pop: "pop 260ms ease-out",
        sheet: "sheet 220ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
