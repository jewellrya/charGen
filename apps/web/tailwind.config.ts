import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}", "./app/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: { extend: {} },
  // DaisyUI is enabled via @plugin "daisyui" in globals.css (Tailwind v4 CSS-first).
  plugins: [],
} satisfies Config;
