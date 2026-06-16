import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Flat config for the whole workspace. The point of this gate is correctness —
// above all `no-floating-promises` (a dropped promise is the class of bug behind
// M4). Type-aware rules use the TS project service, which auto-discovers each
// package's tsconfig. Stylistic noise is kept off so the gate stays meaningful.
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.expo/**',
      '**/node_modules/**',
      '**/coverage/**',
      'packages/db/migrations/**',
      '**/*.config.{js,mjs,cjs,ts}',
      '**/babel.config.js',
      '**/metro.config.js',
      '**/next-env.d.ts', // Next-generated; uses a triple-slash reference by design
      'apps/api/scripts/**', // one-off dev scripts, outside the tsconfig project
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.node },
    },
    rules: {
      // The durable gate: never silently drop a promise.
      '@typescript-eslint/no-floating-promises': 'error',
      // `_foo` is the intentional "deliberately unused" convention.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
);
