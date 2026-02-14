module.exports = {
  extends: [require.resolve('@autolink/eslint-config/base')],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
