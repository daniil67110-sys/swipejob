/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Types autorisés (AC7)
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'chore',
        'docs',
        'refactor',
        'test',
        'perf',
        'ci',
        'build',
        'revert',
        'style',
      ],
    ],
    // Longueur max du sujet
    'subject-max-length': [2, 'always', 100],
    // Header (type + scope + subject) max 120 chars
    'header-max-length': [2, 'always', 120],
  },
};

export default config;
