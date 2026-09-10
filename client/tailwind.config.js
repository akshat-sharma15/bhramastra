/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: "#fff8ec",
          100: "#ffefcf",
          400: "#ff9f40",
          500: "#f97316",
          600: "#e05f0f",
          700: "#b8480c",
        },
      },
    },
  },
  plugins: [],
};
