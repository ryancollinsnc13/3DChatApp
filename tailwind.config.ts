import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#fffaf2",
        ink: "#1f2933",
        moss: "#4f7b58",
        mint: "#d8efe0",
        coral: "#ec6f66",
        tide: "#4b83a7",
        honey: "#f2b84b",
        lilac: "#9f7aea",
        "life-sky": "#bde9ff",
        skytoy: "#dff5ff",
        plaza: "#fff6cf",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(31, 41, 51, 0.12)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
