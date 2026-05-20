import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ios: {
          // Light-mode blue stays #007AFF; dark-mode blue is controlled by
          // --tw-accent-rgb in index.css and resolves to #5085E0 (muted navy-blue).
          blue: 'rgb(var(--tw-accent-rgb) / <alpha-value>)',
          green: '#34C759',
          red: '#FF3B30',
          orange: '#FF9500',
          yellow: '#FFCC00',
          purple: '#AF52DE',
          gray: '#8E8E93',
          bg: '#F2F2F7',
          card: '#FFFFFF',
          // Dark-mode surface tokens — used for non-glass elements (inputs, dividers, etc.)
          'dark-bg': '#080E1C',       // page background (deep navy)
          'dark-card': '#0D1525',     // elevated surface (non-glass fallback)
          'dark-secondary': '#111D32', // slightly raised
          'dark-tertiary': '#1C2D47', // borders, separators
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        ios: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)',
        'ios-lg': '0 4px 20px rgba(0,0,0,0.10)',
        // Subtle blue glow used on active elements in dark mode
        'ios-glow': '0 0 18px rgba(80, 133, 224, 0.30)',
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
} satisfies Config;
