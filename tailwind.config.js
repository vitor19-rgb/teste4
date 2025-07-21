/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'text-[#1e3a8a]',
    'dark:text-[#60A5FA]'
  ],
  theme: {
    extend: {
      colors: {
        'blue-light': '#60A5FA',
      },
    },
  },
  plugins: [],
};
