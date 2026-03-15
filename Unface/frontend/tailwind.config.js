/** @type {import('tailwindcss').Config} */
export default {
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
      },
    },
  },
  plugins: [],
};
