/**
 * Données de contenu de la landing V1 (page d'accueil uniquement).
 *
 * Toute donnée marquée `isMock: true` est une démonstration visuelle
 * explicitement identifiée comme telle dans le code — voir section 28 du
 * prompt de mission. Aucune de ces données ne doit être présentée comme
 * réelle dans la documentation, ni générer de balisage JSON-LD tant qu'elle
 * n'a pas été validée par le client.
 */

export interface NavLink {
  label: string;
  href: string;
}

// « Contact » a été retiré (micro-retouche suppression FinalCta,
// 01/09/2026) : la section #contact qu'il ciblait n'existe plus et aucune
// page Contact dédiée n'existe encore — mieux vaut aucun lien qu'une ancre
// morte (les deux lignes d'appel restent visibles en permanence dans la
// navbar et le footer).
//
// Micro-correction « navigation depuis les pages métiers » (03/09/2026) :
// ces ancres appartiennent toutes à la landing page. Depuis une page métier
// comme /plomberie/ (créée au micro-sprint précédent), une simple ancre
// locale (`#depannages`) ne ciblerait aucune section existante sur CETTE
// page — elle doit pointer vers la landing elle-même. Chaque `href` est
// donc préfixé par `import.meta.env.BASE_URL` (toujours terminé par un
// slash, valeur littérale de `base` dans astro.config.mjs), pointant ainsi
// vers la racine de la landing suivie de l'ancre réelle. Ce même préfixe
// fonctionne aussi bien EN RESTANT sur la landing : un navigateur reconnaît
// une URL qui ne diffère de la page courante que par son fragment comme une
// navigation dans le même document (pas de rechargement), et continue donc
// d'appliquer le défilement fluide existant (`scroll-behavior: smooth`,
// voir src/styles/global.css) — le comportement sur la landing reste donc
// identique à avant. Les ancres ci-dessous ont toutes été vérifiées comme
// réellement présentes sur la landing : #top (<body>, BaseLayout.astro),
// #depannages (EmergencySelector.astro), #interventions-recentes
// (LatestInterventions.astro), #zones-couvertes (Coverage.astro), #avis
// (Reviews.astro).
/**
 * Destination du logo de marque (navbar et footer) : même ancre
 * « Accueil » que `navLinks[0]` ci-dessous, mais le logo n'est pas
 * construit à partir de `navLinks` (balisage `<img>` + nom de marque
 * distinct du reste de la navigation) — exportée séparément plutôt que
 * dupliquée en dur dans chaque composant.
 *
 * CORRECTION P0 (DOUBLE CORRECTION P0 — DIALOG FERMÉ ET RETOUR RÉEL EN HAUT
 * DE PAGE, 04/09/2026) : ciblait `#accueil` (id du Hero de la landing) —
 * ce Hero est positionné SOUS le bandeau de disponibilité et la navbar
 * sticky, donc un retour à l'accueil laissait ce bandeau hors champ
 * (`scrollY` > 0, page apparemment décalée d'une trentaine de pixels).
 * Cible désormais `#top`, porté par <body> dans BaseLayout.astro — le
 * sommet absolu réel du document, disponible sur chaque page. Seule cette
 * constante est modifiée : Navbar (logo + lien « Accueil »), MobileDrawer
 * (même lien, réutilisé via `navLinks`), Footer et les liens « Retour à
 * l'accueil » des deux pages juridiques en héritent tous automatiquement,
 * sans duplication.
 */
export const homeHref = `${import.meta.env.BASE_URL}#top`;

// PAGE « ZONES D'INTERVENTION » / RADAR DE COMMUNES (04/09/2026,
// PROMPT_CLAUDE_CODE_PAGE_ZONES_INTERVENTION_RADAR.txt, section 12) : «
// Zones couvertes » cible désormais la page dédiée réelle plutôt que
// l'ancre `#zones-couvertes` de la landing — celle-ci reste néanmoins en
// place, inchangée, sur la landing (section conservée telle quelle, jamais
// supprimée). Cette seule constante alimente Navbar (desktop), MobileDrawer
// (hamburger) ET la colonne « Navigation » du Footer (tous trois
// consomment `navLinks`) : aucune duplication de logique.
export const navLinks: NavLink[] = [
  { label: 'Accueil', href: homeHref },
  { label: 'Dépannages', href: `${import.meta.env.BASE_URL}#depannages` },
  { label: 'Interventions', href: `${import.meta.env.BASE_URL}#interventions-recentes` },
  { label: 'Zones couvertes', href: `${import.meta.env.BASE_URL}zones-intervention/` },
  { label: 'Avis', href: `${import.meta.env.BASE_URL}#avis` },
];

/**
 * Destination de la preuve Google des Hero (landing et cinq pages métiers) :
 * lien INTERNE vers la section Avis de la landing, navigation dans le même
 * onglet. Distinct de `siteConfig.googleReviewsUrl` (fiche Google externe,
 * réservée aux cartes d'avis) : le badge Hero ne doit jamais expulser le
 * visiteur du site. Construit avec BASE_URL pour fonctionner en local comme
 * sous le sous-chemin GitHub Pages, depuis n'importe quelle page.
 */
export const googleProofHref = `${import.meta.env.BASE_URL}#avis`;

export interface HeroPill {
  label: string;
}

/** Pills métiers affichées sous l'accroche du hero (réponse à « Traite-t-il mon problème ? »). */
export const heroPills: HeroPill[] = [
  { label: 'Plomberie' },
  { label: 'Chauffage' },
  { label: 'Serrurerie' },
  { label: 'Vitrerie' },
  { label: 'Rideaux métalliques' },
];

export type UrgencyCategory =
  'fuite-eau' | 'chauffage-panne' | 'porte-bloquee' | 'vitre-cassee' | 'rideau-bloque' | 'autre';

export interface UrgencyType {
  id: UrgencyCategory;
  label: string;
  /**
   * Description courte affichée sur la carte (section 12 du prompt de
   * refonte « wahou », 01/09/2026) : remplace l'ancienne phrase générique
   * par un texte concret expliquant ce que le clic apporte.
   */
  description: string;
  /**
   * Conseil de prudence générique — jamais un diagnostic technique. Donnée
   * préparatoire pour les futures pages « premiers gestes » dédiées
   * (section 24 du prompt) ; non affichée sur la carte dans ce sprint.
   */
  safetyTip: string;
  /** Texte alternatif décrivant la photographie associée à la situation. */
  imageAlt: string;
  /**
   * Ancre vers le panneau métier correspondant dans l'accordéon — destination
   * réelle et valide tant que la page dédiée `futureRoute` n'existe pas
   * encore (section 14 du prompt). `null` pour « Autre urgence », qui ne
   * correspond à aucun métier précis : depuis la suppression de FinalCta
   * (micro-retouche du 01/09/2026), aucune destination générique réelle
   * n'existe plus pour ce cas — la carte reste non cliquable plutôt que de
   * pointer vers une ancre inventée (le conseil de sécurité déjà affiché
   * suffit).
   */
  relatedServiceAnchor: string | null;
  /**
   * Future route dédiée « premiers gestes » prévue pour cette situation.
   * Centralisée ici pour le sprint suivant, jamais exposée comme `href`
   * tant qu'elle produirait un 404 (section 14 du prompt).
   */
  futureRoute: string;
}

/** Sélecteur « Quelle est votre urgence ? » (section 10 du prompt initial ; refonte « wahou » 01/09/2026). */
export const urgencyTypes: UrgencyType[] = [
  {
    id: 'fuite-eau',
    label: 'Fuite d’eau',
    description:
      'Écoulement visible, infiltration ou plafond humide : identifiez les premiers gestes pour vous éloigner du risque et limiter les dégâts sans vous exposer.',
    safetyTip:
      'Si vous pouvez le faire sans risque, coupez l’arrivée d’eau générale, puis appelez-nous. Ne restez pas en contact avec l’eau près d’une prise électrique.',
    imageAlt: 'Homme au téléphone sous une fuite d’eau au plafond, recueillie dans un seau.',
    relatedServiceAnchor: '#service-fuites-anomalies',
    futureRoute: '/urgences/fuite-eau',
  },
  {
    id: 'chauffage-panne',
    label: 'Chauffage en panne',
    description:
      'Radiateurs froids, chaudière arrêtée ou chaleur irrégulière : repérez les signaux qui exigent de ne rien manipuler et de demander de l’aide.',
    safetyTip:
      'Ne manipulez pas les organes de sécurité de votre chaudière vous-même. Aérez la pièce si vous sentez une odeur inhabituelle et appelez-nous.',
    imageAlt: 'Homme au téléphone devant une chaudière murale dont le voyant signale une panne.',
    relatedServiceAnchor: '#service-chauffage',
    futureRoute: '/urgences/chauffage-en-panne',
  },
  {
    id: 'porte-bloquee',
    label: 'Porte bloquée',
    description:
      'Porte claquée, clé cassée ou serrure bloquée : vérifiez les risques avant d’insister, de forcer ou d’endommager davantage l’accès.',
    safetyTip:
      'Ne forcez pas la serrure ni la porte : vous risqueriez d’aggraver le blocage ou d’endommager l’encadrement.',
    imageAlt:
      'Femme au téléphone devant une porte d’entrée dont la clé reste bloquée dans la serrure.',
    relatedServiceAnchor: '#service-serrurerie',
    futureRoute: '/urgences/porte-bloquee',
  },
  {
    id: 'vitre-cassee',
    label: 'Vitre cassée',
    description:
      'Vitre fissurée ou brisée : éloignez les personnes et sécurisez la zone sans toucher les éclats ni vous exposer aux coupures.',
    safetyTip:
      'Écartez-vous du verre brisé et protégez la zone si possible, sans manipuler les débris à mains nues.',
    imageAlt: 'Homme au téléphone face à une porte-fenêtre dont la vitre est fissurée et brisée.',
    relatedServiceAnchor: '#service-vitrerie',
    futureRoute: '/urgences/vitre-cassee',
  },
  {
    id: 'rideau-bloque',
    label: 'Rideau métallique bloqué',
    description:
      'Rideau coincé, moteur silencieux ou tablier désaxé : ne passez jamais dessous et ne forcez pas le mécanisme.',
    safetyTip:
      'Ne forcez pas le mécanisme, manuel ou électrique : cela peut l’endommager davantage ou représenter un risque.',
    imageAlt: 'Homme au téléphone devant le rideau métallique à moitié relevé d’une boutique.',
    relatedServiceAnchor: '#service-rideaux-metalliques',
    futureRoute: '/urgences/rideau-metallique-bloque',
  },
  {
    id: 'autre',
    label: 'Autre urgence',
    description:
      'Votre situation ne correspond pas aux cas précédents ? Identifiez la bonne orientation sans manipuler un équipement que vous ne connaissez pas.',
    safetyTip:
      'Décrivez votre situation à notre équipe au téléphone : nous vous orientons vers la solution adaptée.',
    imageAlt: 'Homme au téléphone dans un couloir, à distance d’un boîtier technique fermé.',
    // Micro-retouche suppression FinalCta (01/09/2026) : pointait vers
    // #contact (FinalCta.astro), désormais supprimé. Aucune destination
    // générique réelle ne le remplace ; plutôt que d'inventer une ancre ou
    // de rediriger vers une section sans rapport, la carte reste non
    // cliquable (voir EmergencySelector.astro) — le conseil de sécurité
    // déjà affiché sur la carte suffit.
    relatedServiceAnchor: null,
    futureRoute: '/urgences/autre-urgence',
  },
];

export type ServiceId =
  | 'plomberie'
  | 'fuites-anomalies'
  | 'chauffage'
  | 'serrurerie'
  | 'vitrerie'
  | 'rideaux-metalliques';

export interface ServicePanel {
  id: ServiceId;
  anchor: string;
  title: string;
  /**
   * Description riche affichée au survol/focus/actif de la carte (refonte
   * « Nos domaines d'intervention », 01/09/2026). Remplace l'ancienne liste
   * à puces courte.
   */
  description: string;
  /** Texte alternatif décrivant la photographie associée au métier. */
  imageAlt: string;
  /**
   * Future route dédiée prévue pour ce métier. Centralisée ici pour le
   * sprint suivant, jamais exposée comme `href` tant qu'elle produirait un
   * 404. Aucune de ces pages n'existe encore (micro-retouche suppression
   * FinalCta, 01/09/2026) : les cartes n'ont donc plus de champ `href` —
   * elles restent non cliquables plutôt que de pointer vers l'ancienne
   * section de contact supprimée (voir ServicesAccordion.astro).
   */
  futureRoute: string;
}

/**
 * Grille des domaines d'intervention (section 12 du prompt initial ; refonte
 * « Nos domaines d'intervention » du 01/09/2026 — six photographies
 * immersives, description riche au survol/focus, lien « Découvrir ce
 * service »).
 */
export const services: ServicePanel[] = [
  {
    id: 'plomberie',
    anchor: 'service-plomberie',
    title: 'Plomberie',
    description:
      'Fuite, canalisation bouchée, robinetterie défectueuse ou équipement sanitaire en panne : notre équipe recherche l’origine du problème, sécurise l’installation et réalise la réparation adaptée.',
    imageAlt: 'Clé serrée sur un siphon de plomberie lors d’une réparation.',
    futureRoute: '/services/plomberie',
  },
  {
    id: 'fuites-anomalies',
    anchor: 'service-fuites-anomalies',
    title: 'Fuites et anomalies',
    description:
      'Infiltration, humidité inhabituelle, baisse de pression ou consommation inexpliquée : nous identifions les signes visibles de l’anomalie afin de limiter les dégâts et d’orienter la réparation.',
    imageAlt: 'Technicien réalisant un diagnostic de fuite sous un évier.',
    futureRoute: '/services/fuites-et-anomalies',
  },
  {
    id: 'chauffage',
    anchor: 'service-chauffage',
    title: 'Chauffage',
    description:
      'Chaudière en panne, radiateur froid ou installation qui ne chauffe plus correctement : nous analysons le dysfonctionnement et intervenons sur les équipements compatibles avec notre expertise.',
    imageAlt: 'Intervention sur un collecteur de chauffage, gants de protection rouges.',
    futureRoute: '/services/chauffage',
  },
  {
    id: 'serrurerie',
    anchor: 'service-serrurerie',
    title: 'Serrurerie',
    description:
      'Porte claquée ou bloquée, clé cassée, serrure endommagée ou accès à sécuriser : nous recherchons une ouverture maîtrisée et proposons la remise en sécurité appropriée.',
    imageAlt:
      'Jeu de clés et mallette à outils devant une porte lors d’une intervention de serrurerie.',
    futureRoute: '/services/serrurerie',
  },
  {
    id: 'vitrerie',
    anchor: 'service-vitrerie',
    title: 'Vitrerie',
    description:
      'Vitre cassée, fissurée ou fermeture devenue dangereuse : nous sécurisons la zone, limitons les risques de coupure ou d’intrusion et préparons la solution de remplacement adaptée.',
    imageAlt: 'Pose d’un châssis vitré à la perceuse.',
    futureRoute: '/services/vitrerie',
  },
  {
    id: 'rideaux-metalliques',
    anchor: 'service-rideaux-metalliques',
    title: 'Rideaux métalliques',
    description:
      'Rideau bloqué, tablier désaxé, mécanisme grippé ou motorisation silencieuse : nous diagnostiquons la panne et mettons l’accès du commerce en sécurité sans forcer inutilement l’installation.',
    imageAlt: 'Rideau métallique de commerce à moitié relevé, mécanisme à vérifier.',
    futureRoute: '/services/rideaux-metalliques',
  },
];

export type ProcessIcon = 'phone' | 'search' | 'clipboard-check' | 'shield-check';

export interface ProcessStep {
  step: number;
  /** Petit label d'étape affiché au-dessus du titre (refonte « wahou », 01/09/2026). */
  label: string;
  title: string;
  description: string;
  /** Exactement deux badges de réassurance par étape. */
  badges: [string, string];
  icon: ProcessIcon;
}

/**
 * Processus d'intervention (section 14 du prompt de mission initial).
 *
 * Refonte « wahou » (01/09/2026,
 * PROMPT_CLAUDE_CODE_PROCESSUS_PRISE_EN_CHARGE_WAHOU.txt) : quatre étapes
 * enrichies (label, badges, icône) pour la timeline premium. Textes utilisés
 * mot pour mot depuis la section 9 du prompt — aucune promesse de délai
 * (« dans l'heure »), de garantie ou de résultat absolu.
 */
export const processSteps: ProcessStep[] = [
  {
    step: 1,
    label: 'PREMIER CONTACT',
    title: 'Vous contactez la ligne adaptée',
    description:
      'Le standard est destiné aux demandes courantes, aux devis et au suivi. La ligne d’urgence est réservée aux situations qui ne peuvent pas attendre. Les deux contacts restent visibles dans la navigation, sans avoir à les rechercher.',
    badges: ['STANDARD', 'URGENCE IMMÉDIATE'],
    icon: 'phone',
  },
  {
    step: 2,
    label: 'QUALIFICATION',
    title: 'Nous comprenons avant de nous déplacer',
    description:
      'Nature de la panne, signes visibles, niveau de danger, localisation et accès : l’équipe pose les questions utiles et peut vous demander des photographies. Cette qualification permet de préparer la réponse sans vous pousser à manipuler une installation dangereuse.',
    badges: ['QUESTIONS CIBLÉES', 'PHOTOS UTILES'],
    icon: 'search',
  },
  {
    step: 3,
    label: 'EXPLICATION',
    title: 'La réponse proposée est expliquée',
    description:
      'À partir des informations disponibles, nous vous indiquons la priorité, la solution envisageable et les conditions de prise en charge. Vous pouvez poser vos questions avant que l’intervention ne commence.',
    badges: ['SOLUTION EXPLIQUÉE', 'AVANT INTERVENTION'],
    icon: 'clipboard-check',
  },
  {
    step: 4,
    label: 'INTERVENTION & CONTRÔLE',
    title: 'L’intervention est réalisée puis contrôlée',
    description:
      'Le technicien sécurise, répare ou remet l’équipement en état selon la situation. Avant de terminer, il contrôle le résultat et vous explique ce qui a été réalisé ainsi que les éventuelles suites à prévoir.',
    badges: ['CONTRÔLE FINAL', 'EXPLICATIONS'],
    icon: 'shield-check',
  },
];

export interface WhyUsValue {
  title: string;
  description: string;
}

/** Bloc « Pourquoi choisir Belkhir Dépannage » (section 15 du prompt). */
export const whyUsValues: WhyUsValue[] = [
  {
    title: 'Réponse 24h/24 et 7j/7',
    description: 'Une ligne standard et une ligne d’urgence extrême, joignables à toute heure.',
  },
  {
    title: 'Plusieurs métiers d’urgence',
    description:
      'Plomberie, chauffage, serrurerie, vitrerie et rideaux métalliques, un seul contact.',
  },
  {
    title: 'Couverture Hauts-de-France',
    description: 'Une équipe mobile qui se déplace selon votre secteur et la situation.',
  },
  {
    title: 'Explications claires',
    description: 'La solution et les conditions vous sont présentées avant toute intervention.',
  },
  {
    title: 'Intervention orientée résolution',
    description:
      'Notre équipe cherche à traiter réellement le problème, pas seulement à le contenir.',
  },
  {
    title: 'Suivi du besoin',
    description: 'Un point est fait avec vous une fois l’intervention réalisée.',
  },
];

export interface WhyUsStat {
  /** Valeur cible entière atteinte par l'animation de comptage. */
  target: number;
  /** Toujours accolé au chiffre (jamais seul en fin de ligne). */
  suffix: string;
  label: string;
  /** Nom accessible stable, porté par le bloc plutôt que par le chiffre animé. */
  accessibleLabel: string;
}

/**
 * Compteurs de preuve affichés sous la photographie de « Pourquoi choisir
 * Belkhir Dépannage ? » (micro-sprint animations/compteurs). Chiffres
 * confirmés par le client.
 */
export const whyUsStats: WhyUsStat[] = [
  {
    target: 20,
    suffix: '+',
    label: 'Années d’expérience métier',
    accessibleLabel: 'Plus de 20 années d’expérience métier',
  },
  {
    target: 500,
    suffix: '+',
    label: 'Interventions réalisées',
    accessibleLabel: 'Plus de 500 interventions réalisées',
  },
  {
    target: 98,
    // Espace insécable avant « % », convention typographique française.
    suffix: ' %',
    label: 'Clients satisfaits',
    accessibleLabel: '98 pour cent de clients satisfaits',
  },
];

export interface CoverageZone {
  code: string;
  name: string;
}

/** Départements des Hauts-de-France affichés dans la section couverture (section 16 du prompt). */
export const coverageZones: CoverageZone[] = [
  { code: '80', name: 'Somme' },
  { code: '59', name: 'Nord' },
  { code: '62', name: 'Pas-de-Calais' },
  { code: '60', name: 'Oise' },
  { code: '02', name: 'Aisne' },
];

export interface Intervention {
  id: string;
  serviceLabel: string;
  title: string;
  zoneMention: string;
  description: string;
  imageId: 'vitrerie' | 'chauffage' | 'plomberie';
  imageAlt: string;
  ctaLabel: string;
  /** Page métier de destination (avec BASE_URL). */
  href: string;
}

/** Section « Nos interventions sur le terrain » : trois cartes vers les pages métiers. */
export const interventions: Intervention[] = [
  {
    id: 'vitrerie',
    serviceLabel: 'Vitrerie',
    title: 'Remplacement complet d’une vitrine commerciale',
    zoneMention: 'Hauts-de-France',
    description:
      'Dépose et remplacement de l’ensemble des vitrages pour redonner à la façade transparence, luminosité et une finition soignée.',
    imageId: 'vitrerie',
    imageAlt: 'Chantier de remplacement complet des vitrages d’une vitrine commerciale',
    ctaLabel: 'Découvrir la vitrerie',
    href: `${import.meta.env.BASE_URL}vitrerie/`,
  },
  {
    id: 'chauffage',
    serviceLabel: 'Chauffage',
    title: 'Remise en service d’une chaudière',
    zoneMention: 'Hauts-de-France',
    description:
      'Diagnostic ciblé, contrôle de sécurité et remise en fonctionnement pour retrouver rapidement confort et eau chaude.',
    imageId: 'chauffage',
    imageAlt: 'Chaudière murale et ses raccordements en cuivre',
    ctaLabel: 'Découvrir le chauffage',
    href: `${import.meta.env.BASE_URL}chauffage/`,
  },
  {
    id: 'plomberie',
    serviceLabel: 'Plomberie',
    title: 'Réparation d’une fuite sur tuyauterie',
    zoneMention: 'Hauts-de-France',
    description:
      'Recherche de l’origine, limitation des dégâts et réparation adaptée pour sécuriser durablement l’installation.',
    imageId: 'plomberie',
    imageAlt: 'Tuyauterie en cuivre d’une installation de chauffage',
    ctaLabel: 'Découvrir la plomberie',
    href: `${import.meta.env.BASE_URL}plomberie/`,
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

/** FAQ (section 19 du prompt). */
export const faqItems: FaqItem[] = [
  {
    question: 'Quels dépannages prenez-vous en charge ?',
    answer:
      'Notre équipe intervient en plomberie, chauffage, serrurerie, vitrerie et rideaux métalliques. Décrivez votre situation par téléphone pour confirmer la prise en charge.',
  },
  {
    question: 'Intervenez-vous 24h/24 et 7j/7 ?',
    answer:
      'Oui, une ligne standard et une ligne d’urgence extrême sont joignables à toute heure, tous les jours de la semaine.',
  },
  {
    question: 'Dans quelles zones intervenez-vous ?',
    answer:
      'Notre équipe se déplace dans les Hauts-de-France (Somme, Nord, Pas-de-Calais, Oise, Aisne), selon votre secteur et la situation.',
  },
  {
    question: 'Quel numéro dois-je appeler ?',
    answer:
      'Le standard pour une demande, un devis ou un suivi. Le portable d’urgence extrême pour une situation qui ne peut vraiment pas attendre.',
  },
  {
    question: 'Puis-je envoyer des photos du problème ?',
    answer:
      'Décrivez votre situation par téléphone dans un premier temps ; notre équipe vous indique la marche à suivre.',
  },
  {
    question: 'Comment se déroule la prise en charge ?',
    answer:
      'Vous appelez, notre équipe qualifie la situation, vous explique la solution et les conditions, puis intervient et contrôle le résultat.',
  },
];

/** Preuves Google : source unique dans src/data/google-reviews.ts. */
export { googleReviewSummary, googleReviews } from './google-reviews';
export type { GoogleReviewSummary, GoogleReview } from './google-reviews';
