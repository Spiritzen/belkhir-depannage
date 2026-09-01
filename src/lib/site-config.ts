import type { PhoneNumberConfig, PhoneRole, SiteConfig } from '../types/site';
import { normalizeBaseUrl } from './url';

/**
 * Configuration centrale du site.
 *
 * IMPORTANT : plusieurs valeurs ci-dessous sont volontairement temporaires
 * (numéro standard, e-mail, avis Google) tant que les informations réelles
 * n'ont pas été validées avec le client. Elles sont signalées par des
 * commentaires « À CONFIRMER ». Ne pas les présenter comme définitives.
 */

/**
 * Ligne d'urgence extrême — numéro officiel confirmé par le client (sprint
 * d'activation, 01/09/2026 ; correctif d'architecture du même jour).
 *
 * Donnée PUBLIQUE du site (affichée en clair sur chaque page), pas un
 * secret : elle est donc versionnée ici, directement dans le code, plutôt
 * que lue depuis un `.env` local. Un `.env` n'est chargé dans `process.env`
 * que par certains pipelines (`astro build`/`astro preview` dans cet
 * environnement) et pas par d'autres (`astro dev`) — une précédente version
 * de cette configuration en dépendait pour ce numéro et n'apparaissait donc
 * pas sous `npm run dev`, malgré un `.env` local correctement renseigné.
 * En codant la valeur ici, le rendu est strictement identique dans tous les
 * environnements (dev, build, preview, après déploiement), sans dépendre
 * d'aucune variable d'environnement pour CE numéro précis.
 *
 * Le numéro standard, lui, reste provisoire et continue de dépendre de
 * `STANDARD_PHONE_DISPLAY`/`STANDARD_PHONE_INTERNATIONAL` dans `.env` (voir
 * plus bas) : il n'a pas encore été confirmé par le client.
 */
const EMERGENCY_PHONE_DISPLAY = '06 49 62 16 19';
const EMERGENCY_PHONE_INTERNATIONAL = '+33649621619';

/**
 * Combine une origine (ex. "https://spiritzen.github.io") et un sous-chemin
 * de base Astro (ex. "/belkhir-depannage/") en une URL publique absolue sans
 * slash final, ex. "https://spiritzen.github.io/belkhir-depannage".
 */
export function combineSiteAndBase(site: string, base: string): string {
  const origin = site.replace(/\/+$/, '');
  const path = base.replace(/^\/+|\/+$/g, '');

  return path ? `${origin}/${path}` : origin;
}

/**
 * Résout l'URL publique complète du site — correctif PREPUB-001/PREPUB-006,
 * 01/09/2026 (docs/RAPPORT_AUDIT_PREPUBLICATION_GITHUB_PAGES.txt).
 *
 * SOURCE PREMIÈRE : `import.meta.env.SITE`/`import.meta.env.BASE_URL`,
 * dérivés une seule fois de `site`/`base` dans astro.config.mjs (exposés par
 * Astro/Vite, y compris sous Vitest via `getViteConfig` dans
 * vitest.config.ts) — jamais une seconde constante codée en dur ici. Changer
 * la cible de déploiement ne demande donc de modifier qu'astro.config.mjs.
 *
 * `SITE_URL` reste une SURCHARGE OPTIONNELLE, pour le jour où un nom de
 * domaine officiel personnalisé serait mis en place devant ce même
 * déploiement (métadonnées de contenu uniquement : canonical, Open Graph,
 * mention du sitemap dans robots.txt). Elle est normalisée (slash final
 * retiré, protocole absolu obligatoire) via `normalizeBaseUrl`. Un vrai
 * domaine personnalisé GitHub Pages sert généralement depuis la racine, sans
 * le sous-chemin `/belkhir-depannage` : le jour venu, mettre aussi à jour
 * `base` dans astro.config.mjs — cette fonction ne devine pas cette
 * intention à la place de l'équipe, elle se contente de normaliser la
 * valeur fournie.
 *
 * Sans `.env` ni `SITE_URL`, le build produit directement et correctement
 * la cible GitHub Pages officielle.
 */
export function resolveSiteUrl(
  env: Record<string, string | undefined> = process.env,
  site: string | undefined = import.meta.env.SITE,
  base: string = import.meta.env.BASE_URL,
): string {
  const override = env.SITE_URL?.trim();
  if (override) {
    return normalizeBaseUrl(override);
  }

  return combineSiteAndBase(site ?? '', base);
}

/**
 * Résout une ligne d'appel (standard ou urgence) à partir de deux variables
 * d'environnement. Les deux valeurs (affichage + international) doivent
 * être renseignées ensemble pour que la ligne soit considérée comme réelle ;
 * sinon elle reste explicitement vide (voir `src/lib/phone.ts`).
 */
export function resolvePhoneNumber(
  role: PhoneRole,
  label: string,
  subLabel: string,
  env: Record<string, string | undefined>,
  displayKey: string,
  internationalKey: string,
): PhoneNumberConfig {
  const display = env[displayKey]?.trim() || '';
  const international = env[internationalKey]?.trim() || '';
  const isComplete = display.length > 0 && international.length > 0;

  return {
    role,
    label,
    subLabel,
    display: isComplete ? display : null,
    international: isComplete ? international : null,
  };
}

/**
 * Détermine si l'indexation par les moteurs de recherche doit être
 * autorisée. L'indexation reste bloquée tant que :
 *  - elle n'a pas été explicitement demandée via ENABLE_INDEXING=true, ET
 *  - les deux lignes d'appel (standard et urgence extrême) ne sont pas
 *    toutes les deux réellement renseignées.
 *
 * Cette double condition évite qu'un simple oubli de variable d'environnement
 * ne fasse indexer un site encore doté de coordonnées provisoires.
 */
export function resolveAllowIndexing(
  requestedByEnv: boolean,
  standardPhone: PhoneNumberConfig,
  emergencyPhone: PhoneNumberConfig,
): boolean {
  const hasBothRealPhones =
    Boolean(standardPhone.display && standardPhone.international) &&
    Boolean(emergencyPhone.display && emergencyPhone.international);

  return requestedByEnv && hasBothRealPhones;
}

const env = process.env;
const requestedByEnv = env.ENABLE_INDEXING === 'true';

const standardPhone = resolvePhoneNumber(
  'standard',
  'Standard',
  'Demandes, devis et suivi',
  env,
  'STANDARD_PHONE_DISPLAY',
  'STANDARD_PHONE_INTERNATIONAL',
);

// Construit directement (pas via `resolvePhoneNumber`) : ce numéro est une
// donnée publique versionnée, jamais dépendante de `process.env` (voir le
// commentaire sur `EMERGENCY_PHONE_DISPLAY` ci-dessus).
const emergencyPhone: PhoneNumberConfig = {
  role: 'emergency',
  label: 'Urgence extrême',
  subLabel: 'Portable d’urgence',
  display: EMERGENCY_PHONE_DISPLAY,
  international: EMERGENCY_PHONE_INTERNATIONAL,
};

const siteUrl = resolveSiteUrl(env);

/**
 * Image Open Graph/Twitter par défaut — URL ABSOLUE complète, jamais un
 * chemin relatif à la racine du domaine (correctif PREPUB-002/PREPUB-009,
 * 01/09/2026) : les moteurs de partage social exigent une URL absolue, et un
 * chemin racine `/og-default.svg` casserait sous le sous-chemin GitHub Pages
 * (il viserait à tort `spiritzen.github.io/og-default.svg`). Construite via
 * `URL`, jamais par concaténation manuelle de chaînes, pour ne jamais
 * produire de double slash. `og-default.svg` reste servi tel quel depuis
 * `public/` (fichier inchangé dans ce sprint).
 */
const defaultOgImage = new URL('og-default.svg', `${siteUrl}/`).toString();

export const siteConfig: SiteConfig = {
  // Nom commercial confirmé (voir CONTEXT.md section 4.1).
  siteName: 'Belkhir Dépannage',
  siteUrl,
  standardPhone,
  emergencyPhone,
  email: null,
  // Base de vie confirmée, sans en faire l'ancrage exclusif de cette landing V1.
  city: 'Amiens',
  region: 'Hauts-de-France',
  // Le 24h/24 et 7j/7 est une volonté commerciale confirmée par le client
  // (voir prompt de mission, section 1) : elle est affichée comme engagement
  // de disponibilité, jamais comme un délai d'intervention garanti.
  openingHours: null,
  socialLinks: [],
  defaultSeoTitle: 'Dépannage d’urgence 24h/24 et 7j/7 en Hauts-de-France — Belkhir Dépannage',
  defaultSeoDescription:
    'Belkhir Dépannage intervient 24h/24 et 7j/7 dans les Hauts-de-France : plomberie, chauffage, ' +
    'serrurerie, vitrerie et rideaux métalliques. Maquette de prévisualisation, non indexée.',
  defaultOgImage,
  allowIndexing: resolveAllowIndexing(requestedByEnv, standardPhone, emergencyPhone),
  isPreview: true,
  // À CONFIRMER : URL de la fiche Google avis, une fois validée par le client.
  googleReviewsUrl: null,
};
