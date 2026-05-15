import baseConfig from '@swipejob/config/eslint/base';

export default [
  ...baseConfig,
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
