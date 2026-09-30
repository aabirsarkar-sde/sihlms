import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecf7f0",
          100: "#d2ecdc",
          200: "#a6d9ba",
          300: "#6fbf91",
          400: "#3f9f6a",
          500: "#23824f",
          600: "#17693f",
          700: "#135434",
          800: "#11432b",
          900: "#0d3322",
        },
        saffron: {
          50: "#fff6ea",
          100: "#ffe9cc",
          300: "#ffc27a",
          400: "#ffa94a",
          500: "#f48c1f",
          600: "#d47212",
          700: "#a8570f",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-noto)",
          "var(--font-noto-deva)",
          "Noto Sans",
          "Noto Sans Devanagari",
          "system-ui",
          "sans-serif",
        ],
      },
      minHeight: { touch: "44px" },
      minWidth: { touch: "44px" },
    },
  },
  plugins: [],
};
export default config;
