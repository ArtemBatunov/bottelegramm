/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          green: '#a8e6cf',
          pink: '#ffd3e1',
          gray: '#f5f5f0',
          lavender: '#e6e6fa',
        },
        brand: {
          lime: '#8fd9a8',
          coral: '#e89b8c',
          coralDeep: '#d97a6a',
        },
        charcoal: '#2d3436',
        chat: {
          bg: '#1e2128',
          panel: '#252932',
          sidebar: '#14161c',
          incoming: '#b8e6c8',
          outgoing: '#f5c4b8',
          sendSurface: '#121f2b',
          sendIcon: '#4a89dc',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 32px rgba(45, 52, 54, 0.08)',
        'card-lg': '0 12px 40px rgba(45, 52, 54, 0.1)',
      },
    },
  },
  plugins: [],
};
