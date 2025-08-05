import typescriptParser from '@typescript-eslint/parser';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    files: ['**/*.ts'], // Apply to all TypeScript files
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: './',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      playwright: playwright,
      prettier: prettier,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules, // TypeScript ESLint rules
      ...playwright.configs['flat/recommended'].rules, // Playwright rules
      ...prettierConfig.rules, // Disable conflicting ESLint rules
      'prettier/prettier': 'error', // Prettier rule as an error
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
    },
  },
];
