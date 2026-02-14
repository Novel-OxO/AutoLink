module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['server', 'web', 'app', 'shared', 'config', 'docs', 'deps', 'ci']],
  },
};
