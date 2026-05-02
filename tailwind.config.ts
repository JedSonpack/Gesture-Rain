import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'Rajdhani', 'ui-sans-serif', 'system-ui'],
        body: ['Rajdhani', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        void: '#050710',
        cyanGlow: '#22d3ee',
        magentaGlow: '#f472b6',
        acid: '#a3e635',
      },
      boxShadow: {
        neon: '0 0 18px rgba(34, 211, 238, 0.55), 0 0 42px rgba(244, 114, 182, 0.22)',
        glass: '0 18px 80px rgba(0, 0, 0, 0.45)',
      },
      animation: {
        scan: 'scan 5s linear infinite',
        pulseGlow: 'pulseGlow 2.4s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
