/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        primary: {
          DEFAULT: '#6366F1', // Indigo accent
          hover: '#4F46E5',
          glow: 'rgba(99, 102, 241, 0.35)',
        },
        secondary: {
          DEFAULT: '#06B6D4', // Cyan accent
          hover: '#0891B2',
        },
        accent: {
          DEFAULT: '#10B981', // Emerald green
        },
        dark: {
          900: '#0B0F17',
          800: '#111827',
          700: '#1F2937',
          600: '#374151',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        wave: 'wave 1.5s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(99, 102, 241, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
