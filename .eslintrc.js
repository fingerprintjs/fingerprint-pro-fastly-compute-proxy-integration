/** @type {import('eslint').Linter.Config} */
module.exports = {
  $schema: 'https://json.schemastore.org/eslintrc',
  extends: ['@fingerprintjs/eslint-config-dx-team'],
  ignorePatterns: ['dist/*'],
  overrides: [
    {
      files: ['**/*.ts'],
      parserOptions: {
        project: './tsconfig.json',
      },
      rules: {
        // https://typescript-eslint.io/rules/strict-boolean-expressions/
        '@typescript-eslint/strict-boolean-expressions': [
          'error',
          {
            allowNullableString: true,
          },
        ],
      },
    },
  ],
}
