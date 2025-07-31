/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'tetris-bg': '#0a0a0a',
        'tetris-border': '#2a2a2a',
        'tetris-grid': '#1a1a1a',
      },
    },
  },
  plugins: [],
};