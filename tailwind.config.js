/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        vitanic: {
          olive: '#808000',
          'light-olive': '#A2A228',
          'pale-olive': '#E8E8D0',
          'dark-olive': '#4A4A00',
          black: '#000000',
        }
      },
      fontFamily: {
        sans: ['Quicksand', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};