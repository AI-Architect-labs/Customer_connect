import coreWebVitals from 'eslint-config-next/core-web-vitals';
import prettierConfig from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...coreWebVitals,
  prettierConfig,
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      // Product/shop images are runtime Firebase Storage URLs. Native lazy <img> keeps
      // the client-only PWA compatible with local Storage Emulator and Hosting.
      '@next/next/no-img-element': 'off',
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'build/**', 'coverage/**'],
  },
];

export default config;
