const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-expressions': 'warn',

      // General JavaScript/TypeScript rules
      // Note: semi, quotes, indent rules are handled by Prettier
      'curly': 'warn',
      'eqeqeq': ['warn', 'always'],
      'no-redeclare': 'warn',
      'no-throw-literal': 'warn',

      // Disable rules that conflict with Prettier
      ...prettierConfig.rules,
    },
  },
  {
    ignores: [
      'node_modules/**',
      'out/**',
      '.vscode-test/**',
      '*.js',
      '!eslint.config.js',
    ],
  },
];
