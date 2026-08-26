/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F6F4EF",
        ink: "#1C1E1B",
        moss: {
          50: "#F1F4EE",
          100: "#E1E8DA",
          300: "#AFC29C",
          500: "#5F7A4A",
          600: "#4C6339",
          700: "#3A4C2C",
          900: "#20291A",
        },
        rust: "#B4552E",
        line: "#DAD5C8",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
