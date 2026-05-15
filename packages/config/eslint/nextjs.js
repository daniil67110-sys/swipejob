// @ts-check
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import baseConfig from './base.js';

/** @type {import('typescript-eslint').ConfigArray} */
const nextjsConfig = tseslint.config(
  ...baseConfig,
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
    // Allow PascalCase or camelCase default exports in Next.js pages and API routes
    // (page components must be PascalCase, route handlers are camelCase like GET/POST)
    files: ['app/**/*.{ts,tsx}', 'pages/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        // Default exported functions: PascalCase (components) or camelCase (utils)
        {
          selector: 'function',
          modifiers: ['exported'],
          format: ['PascalCase', 'camelCase'],
        },
        // HTTP method handlers: UPPER_CASE (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
        {
          selector: 'function',
          modifiers: ['exported'],
          filter: { regex: '^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$', match: true },
          format: ['UPPER_CASE'],
        },
        // Variables: camelCase or UPPER_SNAKE
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        // Const variables: PascalCase allowed (for exported components as const)
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        // Types: PascalCase
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        // Enum members
        {
          selector: 'enumMember',
          format: ['UPPER_CASE', 'PascalCase'],
        },
      ],
    },
  },
);

export default nextjsConfig;
