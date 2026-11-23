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
        // ── Vertexa QR redesign palette (Sunbeam-style, 2026-11) ──────────
        ink: { DEFAULT: "#1A1A1A", soft: "#2B2B2B" },        // primary text, dark buttons
        paper: "#FAFAF9",                                     // page background
        cream: "#F8F6F4",                                     // soft surface
        stone: { DEFAULT: "#F0EEEB", dark: "#E7E4DF" },       // pills, secondary buttons, card wells
        muted: { DEFAULT: "#535353", 2: "#52525B", 3: "#71717A", 4: "#A1A1AA" },
        lime: { DEFAULT: "#DBFC74", deep: "#B9E23A" },        // signature accent
        lilac: "#E3B8FF",                                     // pastel product-frame tints
        sky: "#A9CCFF",
        mint: "#8EF0B9",
        blush: "#FFC2E2",
      },
      borderRadius: { pill: "24px", card: "24px", panel: "32px" },
      boxShadow: {
        card: "0 1px 2px rgba(26,26,26,0.04), 0 8px 24px rgba(26,26,26,0.04)",
        float: "0 20px 40px -12px rgba(26,26,26,0.18)",
      },
      keyframes: {
        "float-y": { "0%,100%": { transform: "translateY(0) rotate(var(--r,0deg))" }, "50%": { transform: "translateY(-14px) rotate(var(--r,0deg))" } },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        "float-y": "float-y 6s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        "spin-slow": "spin-slow 60s linear infinite",
      },
      fontFamily: {
        display: ["var(--font-manrope)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        arabic: ["var(--font-plex)", "system-ui", "sans-serif"],
        heading: ["var(--font-urbanist)", "system-ui", "sans-serif"],
        body: ["var(--font-jost)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
