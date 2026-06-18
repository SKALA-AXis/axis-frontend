module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'src/types/api.ts'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // eslint 신규 도입: 기존 코드의 아래 항목은 우선 warn 으로 가시화하고
    // (CI green 유지), 리팩토링 트랙에서 점진적으로 error 승격한다.
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'no-useless-catch': 'warn',
    'no-constant-condition': ['warn', { checkLoops: false }],
  },
}
