import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: 'var(--vault-bg)',
          card: 'var(--vault-card)',
          'card-hover': 'var(--vault-card-hover)',
          border: 'var(--vault-border)',
          'border-hover': 'var(--vault-border-hover)',
          accent: 'var(--vault-accent)',
          'accent-hover': 'var(--vault-accent-hover)',
          gold: 'var(--vault-gold)',
          text: 'var(--vault-text)',
          muted: 'var(--vault-muted)',
          success: 'var(--vault-success)',
          warning: 'var(--vault-warning)',
          danger: 'var(--vault-danger)',
          physical: 'var(--vault-physical)',
          dropship: 'var(--vault-dropship)',
          tooltip: 'var(--vault-tooltip)',
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
