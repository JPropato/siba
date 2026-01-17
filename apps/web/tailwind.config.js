/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Map brand to CSS variables for dynamic customization
        brand: {
          DEFAULT: 'var(--brand-color)',
          light: 'var(--brand-light)',
          dark: 'var(--brand-dark)',
        },
        slate: {
          DEFAULT: '#334155',
          light: '#64748b',
          dark: '#1e293b',
        },
        charcoal: '#2F3136',
        luxury: '#35322c',
        'surface-dark': '#1e293b',
        'bg-dark': '#0f172a',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
