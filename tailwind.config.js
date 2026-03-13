/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Paleta principal EmpatIA — tons de roxo/lilás do logo
        primary: {
          50: '#f5f3ff',
          100: '#ede8ff',
          200: '#dcd4fe',
          300: '#c3b5fd',
          400: '#a78bfa',
          500: '#8b6bab',
          600: '#7c6bab',
          700: '#6b5a9a',
          800: '#5a4a82',
          900: '#4a3d6b',
        },
        // Accent — tons escuros do fundo do logo
        dark: {
          900: '#0f0f1a',
          800: '#1a1a2e',
          700: '#16213e',
          600: '#0f3460',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
