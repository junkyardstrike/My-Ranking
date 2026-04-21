/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#050505', // Pitch Black
        surface: '#111111', // Very Dark Gray
        'surface-light': '#222222', // Dark Charcoal
        accent: '#D4AF37', // Metallic Gold
      }
    },
  },
  plugins: [],
}
