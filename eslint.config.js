import js from '@eslint/js'
import prettier from 'eslint-config-prettier/flat'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/*
 * Prettier owns layout, ESLint owns correctness. `prettier` sits last on purpose:
 * it switches off every stylistic rule ESLint would otherwise fight Prettier over,
 * so `npm run lint` and `npm run format` can never disagree about the same file.
 */
export default defineConfig([
  globalIgnores(['dist', 'coverage', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['*.config.ts', 'e2e/**/*.ts', 'src/test/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  prettier,
])
