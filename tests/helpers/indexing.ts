/**
 * Mode d'indexation attendu par les tests qui lisent dist/ ou rendent des
 * composants. Il suit ENABLE_INDEXING, la variable avec laquelle dist/ a été
 * construit : la CI de production LWS construit ET teste avec
 * ENABLE_INDEXING=true (artefact indexable) ; sans variable, le build local
 * par défaut reste fermé (noindex, nofollow, robots Disallow).
 */
export const INDEXING_ENABLED = process.env.ENABLE_INDEXING === 'true';

export const ROBOTS_CONTENT = INDEXING_ENABLED ? 'index, follow' : 'noindex, nofollow';
export const ROBOTS_META = `<meta name="robots" content="${ROBOTS_CONTENT}">`;

/** robots.txt exact attendu pour le mode courant. */
export const ROBOTS_TXT = INDEXING_ENABLED
  ? 'User-agent: *\nAllow: /\n\nSitemap: https://belkhir-depannage-hdf.fr/sitemap-index.xml'
  : 'User-agent: *\nDisallow: /';
