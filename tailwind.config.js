/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5',       // Indigo-600
        background: '#0f172a',    // Zinc-900
        accent: '#6366f1',        // Indigo-500
      },
    },
  },
  plugins: [],
}
