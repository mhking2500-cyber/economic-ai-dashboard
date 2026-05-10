import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b0f14",
        panel: "#121922",
        border: "#1f2a37",
        up: "#ef4444",
        down: "#3b82f6",
        accent: "#f59e0b"
      }
    }
  },
  plugins: []
};

export default config;
