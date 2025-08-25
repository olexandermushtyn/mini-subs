// Flat config for ESLint v9+
const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const unusedImports = require('eslint-plugin-unused-imports');
const promise = require('eslint-plugin-promise');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
  // Global ignores (instead of .eslintignore)
  {
    ignores: [
      'eslint.config.*',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/*.d.ts',
      'prisma/migrations/**',
      '**/*.js',
      '**/jest.config.ts',
      '**/global-setup.js',
      '**/global-teardown.js',
    ],
  },

  // Basic rules for JS
  js.configs.recommended,

  // TypeScript rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: false,
        tsconfigRootDir: process.cwd(),
      },
      globals: {
        ...require('globals').node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
      promise,
    },
    rules: {
      // Basic
      'no-duplicate-imports': 'error',
      'no-debugger': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // TypeScript
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-duplicate-imports': ['error', { allowTypeImports: true }],
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',

      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': ['error', { ignoreDeclarationMerge: true }],

      // Import order
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Promises
      'promise/always-return': 'off',
      'promise/no-nesting': 'off',
    },
  },

  // Prettier style
  eslintConfigPrettier,
];
