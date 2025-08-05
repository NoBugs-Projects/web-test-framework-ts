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
      // Disable the problematic rule that's causing conflicts
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-unused-expressions': 'off',
      
      // Be more lenient with any types in test framework
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      
      // TypeScript ESLint recommended rules (but override some)
      ...typescriptEslint.configs.recommended.rules,
      
      // Playwright rules
      ...playwright.configs['flat/recommended'].rules,
      
      // Prettier rules
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      
      // Custom rules
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      
      // Override specific rules to be warnings
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
];
