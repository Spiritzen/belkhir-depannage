/**
 * Manifeste des médias repris depuis l'ancien site (belkhir-depannage80.fr).
 *
 * Règles (section 4 du prompt de mission) :
 *  - chaque média utilisé dans la landing V1 doit être téléchargé une seule
 *    fois, stocké localement dans `src/assets/legacy/` et jamais hotlinké ;
 *  - ce manifeste trace, pour chaque fichier, son URL source exacte, son
 *    chemin local et son usage réel (ou la raison de son exclusion) ;
 *  - un identifiant "non-utilisee-*" documente un média téléchargé pendant
 *    l'audit mais volontairement écarté (voir la colonne `usage`).
 *
 * Tous les fichiers listés ici ont été vérifiés visuellement avant
 * association à un métier — voir la colonne `usage` pour le résultat de cet
 * audit (section 12 : « ne jamais présenter une photo de rénovation comme
 * une intervention de serrurerie »).
 */

export interface LegacyAsset {
  id: string;
  /** URL exacte constatée sur l'ancien site au moment de l'audit (31/08/2026). */
  sourceUrl: string;
  /** Chemin local relatif à la racine du dépôt. */
  localPath: string;
  /** Usage réel dans la landing V1, ou raison de l'exclusion. */
  usage: string;
  /** Faux si le média a été téléchargé mais n'est finalement pas utilisé. */
  used: boolean;
}

const LEGACY_BASE_URL = 'https://belkhir-depannage80.fr/wp-content/uploads';

export const legacyAssets: LegacyAsset[] = [
  {
    id: 'logo',
    sourceUrl: `${LEGACY_BASE_URL}/2025/03/belkhir-depannage-logo-e1689189748770-1.png`,
    localPath: 'src/assets/legacy/logo-belkhir-depannage.png',
    usage:
      'Logo dans la navbar, le footer et favicon temporaire. Conservé tel quel, non redessiné.',
    used: true,
  },
  {
    id: 'hero-background',
    sourceUrl: `${LEGACY_BASE_URL}/2025/03/2151015241.jpg`,
    localPath: 'src/assets/legacy/hero-intervention-urgence.jpg',
    usage: 'Image de fond du hero (obligatoire, section 8 du prompt).',
    used: true,
  },
  {
    id: 'accordion-plomberie',
    sourceUrl: `${LEGACY_BASE_URL}/2025/03/27146.jpg`,
    localPath: 'src/assets/legacy/accordeon-plomberie.jpg',
    usage:
      'Accordéon photographique — panneau Plomberie (clé sur siphon, sujet vérifié visuellement).',
    used: true,
  },
  {
    id: 'accordion-chauffage',
    sourceUrl: `${LEGACY_BASE_URL}/2025/03/261.webp`,
    localPath: 'src/assets/legacy/accordeon-chauffage.webp',
    usage:
      'Accordéon photographique — panneau Chauffage (collecteur de chauffage, gants rouges). ' +
      'Réattribué depuis « fuites et anomalies » après vérification visuelle : le sujet réel est ' +
      'une intervention chauffage, pas une fuite.',
    used: true,
  },
  {
    id: 'accordion-serrurerie',
    sourceUrl: `${LEGACY_BASE_URL}/2025/03/1826.webp`,
    localPath: 'src/assets/legacy/accordeon-serrurerie.webp',
    usage: 'Accordéon photographique — panneau Serrurerie (clés, porte, mallette à outils).',
    used: true,
  },
  {
    id: 'accordion-vitrerie',
    sourceUrl: `${LEGACY_BASE_URL}/2025/03/17302.webp`,
    localPath: 'src/assets/legacy/accordeon-vitrerie.webp',
    usage:
      'Accordéon photographique — panneau Vitrerie (pose d’un châssis vitré à la perceuse). ' +
      'Réattribué depuis « chauffage » après vérification visuelle : le sujet réel est une pose ' +
      'de vitrage, pas une intervention chauffage.',
    used: true,
  },
  {
    id: 'fuites-anomalies-photo',
    sourceUrl: `${LEGACY_BASE_URL}/2025/03/58265.jpg`,
    localPath: 'src/assets/legacy/technicien-intervention-2.jpg',
    usage:
      'Accordéon photographique — panneau Fuites et anomalies (diagnostic sous évier). Réattribuée ' +
      'depuis le pool "photographies métier" générique, car aucun média dédié aux fuites n’a été ' +
      'trouvé sur l’ancien site.',
    used: true,
  },
  {
    id: 'why-us-photo',
    sourceUrl: `${LEGACY_BASE_URL}/2025/03/53082.jpg`,
    localPath: 'src/assets/legacy/technicien-intervention-1.jpg',
    usage:
      'Section « Pourquoi choisir » — photographie technicien (collecteur de chauffage), pas de portrait individuel.',
    used: true,
  },
  {
    id: 'latest-1',
    sourceUrl: `${LEGACY_BASE_URL}/2025/10/image-1-1024x576.jpg`,
    localPath: 'src/assets/legacy/activite-recente-2.jpg',
    usage: 'Dernières interventions — carte 1 (intervention chauffage, tuyauterie cuivre).',
    used: true,
  },
  {
    id: 'latest-2',
    sourceUrl: `${LEGACY_BASE_URL}/2025/10/image-1024x576.jpg`,
    localPath: 'src/assets/legacy/activite-recente-3.jpg',
    usage: 'Dernières interventions — carte 2 (installation chaudière murale).',
    used: true,
  },
  {
    id: 'latest-3',
    sourceUrl: `${LEGACY_BASE_URL}/2025/09/photo-1-1024x768.jpg`,
    localPath: 'src/assets/legacy/activite-recente-5.jpg',
    usage: 'Dernières interventions — carte 3 (intervention chauffage/plomberie, tuyauterie).',
    used: true,
  },
  {
    id: 'mobile-team-illustration',
    sourceUrl: `${LEGACY_BASE_URL}/2025/03/ChatGPT-Image-28-mars-2025-15_23_04-e1743173277121.png`,
    localPath: 'src/assets/legacy/illustration-equipe.png',
    usage:
      'Illustration « équipe mobile » (véhicule floqué Belkhir Dépannage) réutilisée dans la section ' +
      'Couverture Hauts-de-France et le CTA final. Asset déjà présent sur l’ancien site (non régénéré ' +
      'par cette mission) ; ne représente aucune personne, cohérent avec la consigne « équipe, pas Fouad ».',
    used: true,
  },

  // --- Médias téléchargés pendant l'audit puis volontairement écartés ---
  {
    id: 'excluded-kitchen-renovation',
    sourceUrl: `${LEGACY_BASE_URL}/2025/03/2870.webp`,
    localPath: 'src/assets/legacy/non-utilisee-cuisine-renovee.webp',
    usage:
      'ÉCARTÉ : sujet réel = cuisine rénovée (rénovation intérieure), interdite dans la landing V1 ' +
      '« dépannage d’urgence » (section 12 du prompt). Initialement pressenti pour Vitrerie, corrigé après audit visuel.',
    used: false,
  },
  {
    id: 'excluded-facade-work',
    sourceUrl: `${LEGACY_BASE_URL}/2025/03/1805.webp`,
    localPath: 'src/assets/legacy/non-utilisee-facade-ravalement.webp',
    usage:
      'ÉCARTÉ : sujet réel = ravalement de façade sur nacelle, explicitement exclu de la landing V1 ' +
      '(section 12 du prompt). Initialement pressenti pour Rideaux métalliques, corrigé après audit visuel.',
    used: false,
  },
  {
    id: 'excluded-broken-source-image',
    sourceUrl: `${LEGACY_BASE_URL}/2025/10/image-3-1024x579.jpg`,
    localPath: 'src/assets/legacy/non-utilisee-image-cassee-source.jpg',
    usage:
      'ÉCARTÉ : le fichier récupéré est lui-même un visuel « Image à remplacer » côté ancien site ' +
      '(média cassé chez le prestataire précédent), pas une photographie d’intervention.',
    used: false,
  },
  {
    id: 'excluded-third-party-storefront',
    sourceUrl: `${LEGACY_BASE_URL}/2025/09/photo-2-1024x768.jpg`,
    localPath: 'src/assets/legacy/non-utilisee-vitrine-tiers.jpg',
    usage:
      'ÉCARTÉ : la photo montre une vitrine de commerce tiers (enseigne Orange) et une affiche publicitaire ' +
      'avec des personnes non identifiées, sans lien confirmé avec Belkhir Dépannage.',
    used: false,
  },
  {
    id: 'excluded-bathroom-renovation',
    sourceUrl: `${LEGACY_BASE_URL}/2025/09/photo-1024x768.jpg`,
    localPath: 'src/assets/legacy/non-utilisee-renovation-sdb.jpg',
    usage:
      'ÉCARTÉ : sujet réel = rénovation de salle de bains en cours (placo brut), rénovation intérieure ' +
      'exclue de la landing V1 « dépannage d’urgence » (section 12 du prompt).',
    used: false,
  },

  // --- Médias explicitement hors périmètre (tiers, jamais téléchargés) ---
  {
    id: 'excluded-mindset-logo',
    sourceUrl: `${LEGACY_BASE_URL}/2024/09/logo_mindset_blanc.png`,
    localPath: 'non téléchargé',
    usage:
      'HORS PÉRIMÈTRE : logo du prestataire tiers Mindset, explicitement interdit (section 4 du prompt).',
    used: false,
  },
];

/** Sous-ensemble des médias effectivement utilisés dans la landing V1. */
export const usedLegacyAssets = legacyAssets.filter((asset) => asset.used);
