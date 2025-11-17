/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f172a',      // slate-900
          surface: '#1e293b',  // slate-800
          primary: '#3b82f6',  // blue-500
          text: '#f1f5f9',     // slate-100
          'text-secondary': '#94a3b8', // slate-400
          border: '#334155',   // slate-700
          accent: '#60a5fa',   // blue-400
        }
      },
      transitionProperty: {
        'colors': 'background-color, border-color, color, fill, stroke',
      }
    },
  },
  plugins: [],
}
