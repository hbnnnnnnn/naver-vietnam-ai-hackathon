/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)", // Pure white
        foreground: "var(--color-foreground)", // Deep charcoal
        border: "var(--color-border)", // Light gray
        input: "var(--color-input)", // White
        ring: "var(--color-ring)", // Warm pink
        card: {
          DEFAULT: "var(--color-card)", // Clean white
          foreground: "var(--color-card-foreground)", // Deep charcoal
        },
        popover: {
          DEFAULT: "var(--color-popover)", // White
          foreground: "var(--color-popover-foreground)", // Deep charcoal
        },
        muted: {
          DEFAULT: "var(--color-muted)", // Very light gray
          foreground: "var(--color-muted-foreground)", // Medium gray
        },
        primary: {
          DEFAULT: "var(--color-primary)", // Warm pink
          foreground: "var(--color-primary-foreground)", // White
        },
        secondary: {
          DEFAULT: "var(--color-secondary)", // Cool teal
          foreground: "var(--color-secondary-foreground)", // White
        },
        accent: {
          DEFAULT: "var(--color-accent)", // Neutral cream
          foreground: "var(--color-accent-foreground)", // Deep charcoal
        },
        success: {
          DEFAULT: "var(--color-success)", // Fresh green
          foreground: "var(--color-success-foreground)", // White
        },
        warning: {
          DEFAULT: "var(--color-warning)", // Warm amber
          foreground: "var(--color-warning-foreground)", // White
        },
        error: {
          DEFAULT: "var(--color-error)", // Clear red
          foreground: "var(--color-error-foreground)", // White
        },
        destructive: {
          DEFAULT: "var(--color-destructive)", // Clear red
          foreground: "var(--color-destructive-foreground)", // White
        },
      },
      fontFamily: {
        heading: ["Inter", "sans-serif"],
        body: ["Source Sans 3", "sans-serif"],
        caption: ["Nunito Sans", "sans-serif"],
        data: ["JetBrains Mono", "monospace"],
        sans: ["Source Sans 3", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
      },
      fontWeight: {
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      backdropBlur: {
        glass: "12px",
        xs: "2px",
      },
      boxShadow: {
        glass:
          "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        "glass-lg":
          "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)",
        "glass-xl":
          "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)",
      },
      animation: {
        "glass-float": "glass-float 0.2s ease-in-out",
        "content-expand": "content-expand 0.3s ease-in-out",
        "skeleton-glass": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "glass-float": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.05)" },
        },
        "content-expand": {
          "0%": { height: "0", opacity: "0" },
          "100%": { height: "auto", opacity: "1" },
        },
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #ff90bb 0%, #8accd5 100%)",
        "gradient-accent": "linear-gradient(135deg, #ff90bb 0%, #8accd5 100%)",
        "gradient-glass":
          "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      zIndex: {
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("tailwindcss-animate"),
  ],
};
