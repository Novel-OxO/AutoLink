module.exports = {
  extends: [require.resolve('@autolink/eslint-config/hono')],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
