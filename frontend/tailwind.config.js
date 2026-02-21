/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores institucionales del Gobierno de Veracruz (guinda/burgundy)
        veracruz: {
          50: '#fdf2f4',
          100: '#f9e0e5',
          200: '#f3c1cb',
          300: '#e99aaa',
          400: '#d9687f',
          500: '#722F37', // Guinda oficial
          600: '#63282F',
          700: '#542128',
          800: '#451A20',
          900: '#361318',
        },
        rojo: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ED1C24', // Rojo oficial de Veracruz
          600: '#be1620',
          700: '#8f1118',
          800: '#600b10',
          900: '#310608',
        },
        dorado: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#d4a012',
          600: '#b8860b',
          700: '#92710c',
          800: '#78590f',
          900: '#644813',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
