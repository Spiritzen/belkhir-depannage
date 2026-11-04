// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

/**
 * Cible de déploiement : hébergement mutualisé LWS, domaine racine
 * `belkhir-depannage-hdf.fr` (URL canonique SANS `www`), site servi depuis
 * la racine `/` — aucun sous-chemin. Le site temporaire GitHub Pages
 * (sous-chemin du dépôt) n’est plus la cible du build.
 *
 * SOURCE UNIQUE : `site` et `base` sont l'UNIQUE endroit où l'origine et le
 * sous-chemin publics sont définis. Astro les expose à toute l'application
 * (y compris sous Vitest via getViteConfig) par `import.meta.env.SITE` et
 * `import.meta.env.BASE_URL` ; `src/lib/site-config.ts` (`resolveSiteUrl`)
 * les combine pour canonical, Open Graph, sitemap et robots.txt.
 *
 * L'indexation est pilotée par ENABLE_INDEXING (voir site-config.ts : `allowIndexing`).
 */
const SITE_ORIGIN = 'https://belkhir-depannage-hdf.fr';
// Base racine : `/` (pas de sous-chemin). `withBase()` (src/lib/url.ts) et
// les liens construits depuis `import.meta.env.BASE_URL` s'en accommodent.
const SITE_BASE = '/';

export default defineConfig({
  site: SITE_ORIGIN,
  base: SITE_BASE,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    react(),
    sitemap({
      // Le sitemap technique exclut la page d'erreur : elle ne représente pas
      // une page de contenu à indexer.
      filter: (page) => !page.replace(/\/$/, '').endsWith('/404'),
    }),
  ],
});
