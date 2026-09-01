/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // DevelopmentPlan.md §11 defines an additional `rules` commit type,
    // specifically for Firestore/Storage Security Rules changes, given how
    // central rules correctness is to this project (Database.md §7.4).
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'test',
        'docs',
        'refactor',
        'chore',
        'rules',
        'style',
        'perf',
        'build',
        'ci',
        'revert',
      ],
    ],
    'subject-case': [0],
  },
};

export default config;
