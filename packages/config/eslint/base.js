// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import unicorn from 'eslint-plugin-unicorn';

/** @type {import('typescript-eslint').ConfigArray} */
const baseConfig = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      unicorn,
    },
    rules: {
      // No console.log — use structured logger (Pino)
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // Disallow explicit `any`
      '@typescript-eslint/no-explicit-any': 'error',

      // Unused variables — allow underscore-prefixed
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Naming conventions
      '@typescript-eslint/naming-convention': [
        'error',
        // Variables: camelCase or UPPER_SNAKE (not PascalCase for variables)
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        // Const variables: camelCase, UPPER_SNAKE, or PascalCase (for component consts)
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        // Functions: camelCase or PascalCase (React components)
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        // React hooks: use<PascalCase>
        {
          selector: 'function',
          filter: { regex: '^use[A-Z]', match: true },
          format: ['camelCase'],
        },
        // Types and interfaces: PascalCase
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        // Enum members: UPPER_SNAKE_CASE or PascalCase
        {
          selector: 'enumMember',
          format: ['UPPER_CASE', 'PascalCase'],
        },
      ],

      // Prefer modern JS features
      'unicorn/prefer-module': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',
    },
  },
  // Fichiers .tsx — composants React: PascalCase
  {
    files: ['**/*.tsx'],
    rules: {
      'unicorn/filename-case': [
        'error',
        {
          case: 'pascalCase',
          // Exceptions pour les conventions Next.js (route files, special files)
          ignore: [
            /^page\./,
            /^layout\./,
            /^loading\./,
            /^error\./,
            /^not-found\./,
            /^route\./,
            /^template\./,
            /^default\./,
            /^opengraph-image\./,
            /^twitter-image\./,
            /^sitemap\./,
            /^robots\./,
            /^manifest\./,
            /^icon\./,
            /^apple-icon\./,
            /^favicon\./,
            /^instrumentation\./,
            /^middleware\./,
            /^globals\./,
          ],
        },
      ],
    },
  },
  // Fichiers .ts — utilitaires: kebab-case
  {
    files: ['**/*.ts'],
    rules: {
      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase',
          // Exceptions pour les fichiers de configuration et conventions
          ignore: [
            /^[A-Z]/, // Fichiers PascalCase explicites
            /\.config\./, // *.config.ts
            /\.test\./, // *.test.ts
            /\.spec\./, // *.spec.ts
            /\.d\./, // *.d.ts
            /^next-env/, // next-env.d.ts
          ],
        },
      ],
    },
  },
);

export default baseConfig;
