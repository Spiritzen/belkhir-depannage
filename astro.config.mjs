// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

/**
 * Cible officielle de déploiement : GitHub Pages en site de PROJET (pas un
 * site utilisateur à la racine du compte) — correctif PREPUB-001/PREPUB-006,
 * 01/09/2026 (docs/RAPPORT_AUDIT_PREPUBLICATION_GITHUB_PAGES.txt).
 *
 * `site` = l'origine du compte GitHub Pages ; `base` = le sous-chemin propre
 * au dépôt. Sémantique officielle Astro pour ce type de déploiement.
 *
 * SOURCE UNIQUE : ces deux valeurs sont l'UNIQUE endroit où l'URL/le
 * sous-chemin publics du site sont définis en dur. Astro les expose ensuite
 * à toute l'application, y compris sous Vitest (voir vitest.config.ts →
 * getViteConfig), via `import.meta.env.SITE` et `import.meta.env.BASE_URL` —
 * voir `src/lib/site-config.ts` (`resolveSiteUrl`), qui les combine plutôt
 * que de redéfinir une seconde constante. Modifier UNIQUEMENT ce fichier
 * suffit donc à faire évoluer l'URL/le sous-chemin publics partout (canonical,
 * sitemap, Open Graph, favicons, polices) sans jamais pouvoir diverger.
 *
 * Un nom de domaine personnalisé futur reste possible via la variable
 * d'environnement optionnelle SITE_URL (voir site-config.ts) pour les
 * métadonnées de contenu (canonical/OG/sitemap-robots) ; un vrai domaine
 * personnalisé GitHub Pages sert en revanche généralement depuis la racine,
 * ce qui impliquerait alors de remettre `base` à `/` ici — décision
 * volontairement laissée à ce moment-là, non anticipée par du code
 * spéculatif.
 */
const GITHUB_PAGES_ORIGIN = 'https://spiritzen.github.io';
// Slash final volontaire : sans lui, @astrojs/sitemap calcule deux URLs
// distinctes pour la page racine (avec et sans slash final) et les liste en
// double dans le sitemap — vérifié empiriquement en comparant les deux
// formes lors de ce sprint. Astro accepte les deux formes pour `base` ;
// `withBase()` (src/lib/url.ts) gère de toute façon les deux indifféremment.
const GITHUB_PAGES_BASE = '/belkhir-depannage/';

export default defineConfig({
  site: GITHUB_PAGES_ORIGIN,
  base: GITHUB_PAGES_BASE,
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
