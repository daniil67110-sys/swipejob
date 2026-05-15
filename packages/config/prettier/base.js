/**
 * SwipeJob — Prettier base config
 * Conventions: semi true, singleQuote, trailingComma all, printWidth 100
 */

/** @type {import('prettier').Config} */
const prettierBase = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  endOfLine: 'lf',
};

export default prettierBase;
