import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: '#09090b',
          card: '#111113',
          border: '#1f1f23',
          accent: '#7c3aed',
          gold: '#c9a84c',
          text: '#f4f4f5',
          muted: '#71717a',
          success: '#4ade80',
          warning: '#fbbf24',
          danger: '#f87171',
          physical: '#1e293b',
          dropship: '#14532d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        vault: '10px',
      },
    },
  },
  plugins: [],
};

export default config;
