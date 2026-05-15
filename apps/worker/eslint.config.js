import nodeConfig from '@swipejob/config/eslint/node';

/** @type {import('typescript-eslint').ConfigArray} */
export default [
  ...nodeConfig,
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
