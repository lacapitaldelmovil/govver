/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores institucionales del Gobierno de Veracruz
        veracruz: {
          50: '#e6f7ed',
          100: '#ccefdb',
          200: '#99dfb7',
          300: '#66cf93',
          400: '#33bf6f',
          500: '#00A651', // Verde oficial de Veracruz
          600: '#008541',
          700: '#006431',
          800: '#004321',
          900: '#002210',
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
