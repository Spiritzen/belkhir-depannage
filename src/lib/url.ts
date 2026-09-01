/**
 * Utilitaires de construction d'URL canoniques absolues.
 */

/**
 * Retire le ou les slashs finaux d'une URL de base et vérifie qu'elle est
 * absolue (http:// ou https://). Lève une erreur sinon.
 */
export function normalizeBaseUrl(baseUrl: string): string {
  if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
    throw new Error(
      `URL de base invalide : "${baseUrl}". Une URL absolue (http:// ou https://) est requise.`,
    );
  }

  return baseUrl.replace(/\/+$/, '');
}

/**
 * Construit une URL canonique absolue à partir d'une URL de base et d'un
 * chemin de page. Le chemin racine ("/") conserve son slash final ; les
 * autres chemins n'en ont pas.
 */
export function buildCanonicalUrl(baseUrl: string, pathname: string): string {
  const base = normalizeBaseUrl(baseUrl);
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;

  return normalizedPath === '/' ? `${base}/` : `${base}${normalizedPath}`;
}

/**
 * Combine le sous-chemin de base Astro (`import.meta.env.BASE_URL`, ex.
 * "/belkhir-depannage" ou "/belkhir-depannage/") et un chemin de fichier
 * relatif à `public/` (ex. "favicon.svg") en un chemin absolu correct,
 * ex. "/belkhir-depannage/favicon.svg" — correctif PREPUB-002, 01/09/2026.
 *
 * Gère indifféremment la présence ou l'absence d'un slash final sur `base`
 * ou d'un slash initial sur `assetPath`, pour ne jamais dépendre d'un détail
 * de normalisation interne d'Astro. Réservé aux assets servis tels quels
 * depuis `public/` et référencés par une chaîne littérale (favicons) —
 * `astro:assets` gère déjà `base` automatiquement pour les images importées.
 */
export function withBase(base: string, assetPath: string): string {
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const trimmedAsset = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;

  return `${trimmedBase}/${trimmedAsset}`;
}
