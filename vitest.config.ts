/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// `getViteConfig` permet aux tests d'importer et de rendre des composants
// `.astro` via l'Astro Container API (voir tests/landing-content.test.ts),
// tout en conservant le comportement des tests unitaires classiques.
export default getViteConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
