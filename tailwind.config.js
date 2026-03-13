/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f6f3fb',
          100: '#ede8f7',
          200: '#ddd4f0',
          300: '#c4b3e3',
          400: '#a594d0',
          500: '#9181bf',
          600: '#7b6bab',
          700: '#6b5b95',
          800: '#5a4c7d',
          900: '#4b4068',
          950: '#2d2b3a',
        },
        warm: {
          50: '#faf8f6',
          100: '#f5f1ed',
          200: '#ede7e0',
          300: '#ddd4ca',
          400: '#c4b5a8',
          500: '#a99889',
          600: '#8c7a6b',
          700: '#6d5f53',
          800: '#4a4039',
          900: '#2d2b3a',
        },
        emotion: {
          strength: '#4ade80',
          hope: '#60a5fa',
          alert: '#fbbf24',
          tired: '#fb923c',
          overwhelm: '#f87171',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 1px 3px 0 rgba(107,91,149,0.06), 0 1px 2px -1px rgba(107,91,149,0.06)',
        'warm': '0 4px 12px -1px rgba(107,91,149,0.08), 0 2px 6px -2px rgba(107,91,149,0.05)',
        'warm-lg': '0 10px 30px -3px rgba(107,91,149,0.10), 0 4px 12px -4px rgba(107,91,149,0.06)',
        'glow': '0 0 20px rgba(165,148,208,0.25)',
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
