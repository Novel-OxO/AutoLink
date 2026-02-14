/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [require.resolve('./base')],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
  },
};
