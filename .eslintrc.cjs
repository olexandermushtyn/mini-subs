/* eslint-disable @typescript-eslint/no-unused-vars */
module.exports = {
  root: true,
  ignorePatterns: [
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/node_modules/**',
    '**/*.d.ts',
  ],
  env: {
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import', 'simple-import-sort', 'unused-imports', 'promise'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:promise/recommended',
    'prettier',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: ['./tsconfig.base.json'],
      },
    },
  },
  rules: {
    // ===== basic =====
    'no-duplicate-imports': 'error',
    'no-debugger': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // ===== typescript =====
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
    ],

    // ===== import order =====
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          // std libs, node builtins
          ['^node:', `^(${require('module').builtinModules.join('|')})(/|$)`],
          // packages
          ['^@?\\w'],
          // internal alias packages (monorepo)
          ['^@minisubs/'],
          // absolute imports
          ['^src(/|$)'],
          // relative
          ['^\\u0000', '^\\.\\.(?!/?$)', '^\\.\\./?$'],
          ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
          // styles / assets
          ['^.+\\.s?css$', '^.+\\.(png|jpg|jpeg|svg|gif|webp)$'],
        ],
      },
    ],
    'simple-import-sort/exports': 'error',

    // ===== promises =====
    'promise/always-return': 'off',
    'promise/no-nesting': 'off',
  },
  overrides: [
    {
      files: ['**/*.spec.ts', '**/*.test.ts'],
      env: { jest: true, node: true },
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
