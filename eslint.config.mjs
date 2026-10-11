import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextCoreWebVitals,
  {
    ignores: ['.next/**', 'coverage/**', 'public/**', 'ShopifyTheme/**', 'node_modules/**', 'reports/**', 'dist/**', 'scripts/.*.tmp.mjs'],
  },
  {
    rules: {
      // Product/UI copy contains apostrophes and quotes; JSX escaping them hurts readability.
      'react/no-unescaped-entities': 'off',
    },
  },
];

export default config;
