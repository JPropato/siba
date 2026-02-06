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
        gold: {
          DEFAULT: '#bd8e3d',
          light: '#e6c489',
          muted: '#C5A36A',
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
      fontSize: {
        // Fluid typography con clamp() - escala suavemente entre breakpoints
        // Formato: clamp(min, preferred, max)
        'fluid-xs': ['clamp(0.625rem, 0.6rem + 0.15vw, 0.75rem)', { lineHeight: '1.5' }], // 10px-12px
        'fluid-sm': ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.5' }], // 12px-14px
        'fluid-base': ['clamp(0.875rem, 0.8rem + 0.35vw, 1rem)', { lineHeight: '1.6' }], // 14px-16px
        'fluid-lg': ['clamp(1rem, 0.9rem + 0.5vw, 1.125rem)', { lineHeight: '1.5' }], // 16px-18px
        'fluid-xl': ['clamp(1.125rem, 1rem + 0.6vw, 1.25rem)', { lineHeight: '1.4' }], // 18px-20px
        'fluid-2xl': ['clamp(1.25rem, 1.1rem + 0.8vw, 1.5rem)', { lineHeight: '1.3' }], // 20px-24px
        'fluid-3xl': ['clamp(1.5rem, 1.2rem + 1.5vw, 1.875rem)', { lineHeight: '1.25' }], // 24px-30px
        'fluid-4xl': ['clamp(1.875rem, 1.5rem + 2vw, 2.25rem)', { lineHeight: '1.2' }], // 30px-36px
        'fluid-5xl': ['clamp(2.25rem, 1.8rem + 2.5vw, 3rem)', { lineHeight: '1.1' }], // 36px-48px
      },
    },
  },
  plugins: [],
};
