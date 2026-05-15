import nodeConfig from '@swipejob/config/eslint/node';

export default [
  ...nodeConfig,
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
