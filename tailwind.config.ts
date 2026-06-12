import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/styles/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/store/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "var(--color-bg-base)",
          surface: "var(--color-bg-surface)",
          elevated: "var(--color-bg-elevated)",
          overlay: "var(--color-bg-overlay)",
          highlight: "var(--color-bg-highlight)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
          inverse: "var(--color-text-inverse)",
        },
        border: {
          subtle: "var(--color-border-subtle)",
          default: "var(--color-border-default)",
          strong: "var(--color-border-strong)",
        },
        btc: {
          50: "var(--color-btc-50)",
          100: "var(--color-btc-100)",
          200: "var(--color-btc-200)",
          300: "var(--color-btc-300)",
          400: "var(--color-btc-400)",
          500: "var(--color-btc-500)",
          600: "var(--color-btc-600)",
          700: "var(--color-btc-700)",
          glow: "var(--color-btc-glow)",
        },
        sol: {
          50: "var(--color-sol-50)",
          100: "var(--color-sol-100)",
          500: "var(--color-sol-500)",
          600: "var(--color-sol-600)",
          700: "var(--color-sol-700)",
          purple: "var(--color-sol-purple)",
          teal: "var(--color-sol-teal)",
          glow: "var(--color-sol-glow)",
        },
        semantic: {
          success: "var(--color-success)",
          successBg: "var(--color-success-bg)",
          warning: "var(--color-warning)",
          warningBg: "var(--color-warning-bg)",
          error: "var(--color-error)",
          errorBg: "var(--color-error-bg)",
          info: "var(--color-info)",
          infoBg: "var(--color-info-bg)",
        }
      },
      backgroundImage: {
        'gradient-sol': 'var(--gradient-sol)',
        'gradient-sol-subtle': 'var(--gradient-sol-subtle)',
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-space-grotesk)", "sans-serif"],
        headings: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      spacing: {
        1: "0.25rem",
        2: "0.5rem",
        3: "0.75rem",
        4: "1rem",
        5: "1.25rem",
        6: "1.5rem",
        8: "2rem",
        10: "2.5rem",
        12: "3rem",
        16: "4rem",
        20: "5rem",
        24: "6rem",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
        full: "9999px",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        btc: "var(--shadow-btc)",
        sol: "var(--shadow-sol)",
      },
    },
  },
  plugins: [],
};
export default config;
