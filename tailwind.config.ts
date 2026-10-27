import type { Config } from 'tailwindcss';

// One accent colour, defined once as a CSS variable so the final brand colour is a one-line change.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0e1013',
        charcoal: { 900: '#121418', 800: '#1a1d22', 700: '#262a31', 500: '#5b616b' },
        bone: '#f4f3ef',
        accent: 'rgb(var(--accent) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
