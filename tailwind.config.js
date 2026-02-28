/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1A237E", // Royal Blue
        secondary: "#C5A022", // Royal Gold
        accent: "#800000", // Royal Crimson
        slatebg: "#0B1220",
        gold: {
          light: "#D4AF37",
          DEFAULT: "#C5A022",
          dark: "#996515"
        }
      },
      fontFamily: {
        heading: ["Playfair Display", "Poppins", "sans-serif"],
        body: ["Inter", "Nunito", "sans-serif"]
      }
    }
  },
  plugins: []
};
