import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta tomada del logo de Lady Barbershop
        navy: {
          DEFAULT: '#1E2B45',
          deep: '#141D30',
          soft: '#2C3B5C',
        },
        barber: {
          DEFAULT: '#A63A3F',
          dark: '#842C31',
          light: '#C9656A',
        },
        paper: {
          DEFAULT: '#F6F1E7',
          dark: '#ECE4D3',
        },
        hummingbird: '#2E9C95',
        ink: '#222632',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        heading: ['var(--font-heading)', 'Arial Narrow', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        stripes:
          'repeating-linear-gradient(0deg, rgba(166,58,63,0.22) 0px, rgba(166,58,63,0.22) 2px, transparent 2px, transparent 7px)',
        'barber-pole':
          'repeating-linear-gradient(45deg, #A63A3F 0 14px, #F6F1E7 14px 28px, #1E2B45 28px 42px, #F6F1E7 42px 56px)',
      },
      keyframes: {
        pole: { '0%': { backgroundPosition: '0 0' }, '100%': { backgroundPosition: '0 79px' } },
      },
      animation: { pole: 'pole 2.5s linear infinite' },
    },
  },
  plugins: [],
}

export default config
