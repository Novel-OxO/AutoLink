module.exports = {
  extends: [require.resolve('@autolink/eslint-config/nestjs')],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
