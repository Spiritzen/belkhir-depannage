// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astroPlugin from 'eslint-plugin-astro';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**', 'coverage/**'],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  astroPlugin.configs['flat/recommended'],
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,astro}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    // Fichiers de test : environnement Node uniquement.
    files: ['tests/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
