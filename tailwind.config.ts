import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "deep-teal": { DEFAULT: "#0F5B55", light: "#3FA39A", dark: "#073d3a" },
        terracotta: { DEFAULT: "#E07A5F", light: "#EA9881", dark: "#B85F47" },
        sand: { DEFAULT: "#E9E6DF", light: "#F4F2EE", dark: "#D6D1C6" },
        charcoal: { DEFAULT: "#1B1B1D" },
        // Alias so any bare `brand` references keep resolving to deep-teal.
        brand: { DEFAULT: "#0F5B55", light: "#3FA39A", dark: "#073d3a" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        arabic: ["var(--font-cairo)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
