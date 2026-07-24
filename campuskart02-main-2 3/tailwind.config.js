/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'gradient-move': 'gradient-move 11s ease infinite',
        'core-move': 'core-move 12s ease-in-out infinite',
      },
      keyframes: {
        'gradient-move': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'core-move': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(24px, -32px)' },
          '50%': { transform: 'translate(-28px, 18px)' },
          '75%': { transform: 'translate(18px, 28px)' },
        },
      },
    },
  },
  plugins: [],
};
