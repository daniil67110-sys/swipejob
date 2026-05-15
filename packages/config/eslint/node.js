// @ts-check
import tseslint from 'typescript-eslint';
import baseConfig from './base.js';

/** @type {import('typescript-eslint').ConfigArray} */
const nodeConfig = tseslint.config(...baseConfig, {
  rules: {
    // Node.js specific: allow process.exit in scripts
    'unicorn/no-process-exit': 'off',
  },
});

export default nodeConfig;
