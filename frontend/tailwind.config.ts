import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: "#f5f6fa",
        clay: "#e7e9f0",
        slate: "#202437",
        ink: "#151725",
        aurora: "#4361ee",
        coral: "#f96d80",
        willow: "#52b788",
        gold: "#f4a261",
        dusk: "#274060",
      },
      backgroundImage: {
        "orchid-noise":
          "linear-gradient(135deg, rgba(67,97,238,0.12), rgba(244,162,97,0.06)), radial-gradient(circle at 20% 20%, rgba(82,183,136,0.12), transparent 45%), radial-gradient(circle at 80% 0%, rgba(249,109,128,0.08), transparent 50%)",
        "grid-faint":
          "linear-gradient(90deg, rgba(39,64,96,0.05) 1px, transparent 1px), linear-gradient(180deg, rgba(39,64,96,0.05) 1px, transparent 1px)",
      },
      boxShadow: {
        "lift-lg": "0 28px 80px rgba(21, 23, 37, 0.12)",
        "lift-md": "0 16px 40px rgba(21, 23, 37, 0.1)",
        "glow-aurora": "0 0 30px rgba(67,97,238,0.35)",
      },
      borderRadius: {
        "3xl": "1.75rem",
        "4xl": "2.5rem",
      },
    },
  },
  plugins: [],
};

export default config;

