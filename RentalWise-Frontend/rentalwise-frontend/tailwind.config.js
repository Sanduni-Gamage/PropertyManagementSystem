/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Semantic tokens for the listing-portal look: one confident blue, near-black
      // headings, warm grey body text, and a light page wash behind white cards.
      // Named by role rather than by hue so a rebrand is a change in one file.
      colors: {
        brand: {
          50: "#EAF2FF",
          100: "#D4E5FF",
          200: "#A9CBFF",
          500: "#006AFF",
          600: "#0057D8",
          700: "#0046AE",
        },
        ink: {
          DEFAULT: "#2A2A33",
          muted: "#54545C",
          subtle: "#767680",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          page: "#F4F4F7",
          sunken: "#EDEDF2",
        },
        line: {
          DEFAULT: "#E3E3E8",
          strong: "#D2D2DA",
        },
        positive: {
          50: "#E8F5EC",
          600: "#0E7A3C",
          700: "#0A5E2E",
        },
        caution: {
          50: "#FDF3E4",
          600: "#A8600A",
        },
        critical: {
          50: "#FDECEE",
          600: "#C01722",
          700: "#99121B",
        },
      },
      boxShadow: {
        // Two-layer shadows read as depth rather than a grey halo.
        card: "0 1px 2px rgba(42,42,51,0.07), 0 2px 8px rgba(42,42,51,0.05)",
        raised: "0 2px 6px rgba(42,42,51,0.10), 0 8px 20px rgba(42,42,51,0.08)",
        pop: "0 12px 36px rgba(42,42,51,0.18)",
      },
    },
  },
  plugins: [],
}
