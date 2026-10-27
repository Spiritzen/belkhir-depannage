/**
 * Configuration technique centrale du site.
 *
 * Toutes les valeurs sont fournies par `src/lib/site-config.ts`. Certaines
 * sont volontairement temporaires (numéros, e-mail) tant que les
 * informations réelles n'ont pas été validées par le client — voir les
 * commentaires dans ce fichier.
 */

export type PhoneRole = 'standard' | 'emergency';

/**
 * Une ligne d'appel (standard ou urgence extrême).
 *
 * `display` et `international` valent `null` tant que le numéro réel n'a pas
 * été fourni par une source validée. Dans ce cas, l'interface doit afficher
 * un libellé explicite de type « À RENSEIGNER » plutôt qu'un faux lien
 * `tel:` — voir `src/lib/phone.ts`.
 */
export interface PhoneNumberConfig {
  role: PhoneRole;
  /** Libellé court affiché sur les CTA, ex. "Standard" ou "Urgence extrême". */
  label: string;
  /** Sous-libellé explicatif, ex. "Demandes, devis et suivi". */
  subLabel: string;
  /** Valeur affichée à l'écran (ex. "03 22 XX XX XX"), ou null si non validée. */
  display: string | null;
  /** Valeur au format international (ex. "+33322XXXXXX") pour le lien tel:, ou null si non validée. */
  international: string | null;
}

export interface OpeningHoursRange {
  /** Jours concernés, ex. ["monday", "tuesday"]. Format à figer avec le futur balisage LocalBusiness. */
  days: string[];
  /** Heure d'ouverture au format 24h, ex. "08:00". */
  opens: string;
  /** Heure de fermeture au format 24h, ex. "20:00". */
  closes: string;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface SiteConfig {
  /** Nom commercial affiché (titre du site, pied de page, balisage social). */
  siteName: string;
  /** URL absolue officielle du site, sans slash final. */
  siteUrl: string;
  /** Ligne d'appel standard (demandes, devis et suivi). */
  standardPhone: PhoneNumberConfig;
  /** Ligne d'appel urgence extrême (portable d'urgence). */
  emergencyPhone: PhoneNumberConfig;
  /** Adresse e-mail de contact, ou null si non définie. */
  email: string | null;
  /** Ville de base annoncée, sans en faire l'ancrage exclusif de la landing. */
  city: string;
  /** Région d'intervention, ancrage principal de cette landing V1. */
  region: string;
  /** Horaires d'ouverture, ou null tant que le 24h/24 et 7j/7 est la seule donnée confirmée. */
  openingHours: OpeningHoursRange[] | null;
  /** Liens vers les réseaux sociaux, éventuellement vide. */
  socialLinks: SocialLink[];
  /** Titre SEO par défaut, utilisé quand une page ne fournit pas le sien. */
  defaultSeoTitle: string;
  /** Meta description par défaut. */
  defaultSeoDescription: string;
  /** Chemin ou URL de l'image Open Graph par défaut. */
  defaultOgImage: string;
  /**
   * Autorise ou non l'indexation par les moteurs de recherche.
   * Calculée à partir de la variable d'environnement ENABLE_INDEXING et de la
   * validité des deux numéros — voir `resolveAllowIndexing` dans
   * `src/lib/site-config.ts`.
   */
  allowIndexing: boolean;
  /**
   * Vrai tant que cette landing reste une maquette de prévisualisation
   * (données mock, numéros potentiellement incomplets). Sert de garde-fou
   * explicite avant tout passage en production réelle — voir section 28 du
   * prompt de mission.
   */
  isPreview: boolean;
  /** Lien officiel pour DÉPOSER un avis Google. */
  googleReviewWriteUrl: string;
  /** Lien public pour CONSULTER tous les avis, si validé. Null sinon. */
  googleReviewsUrl: string | null;
}
