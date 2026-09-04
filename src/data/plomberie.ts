/**
 * Contenu éditorial propre à la page `/plomberie/` — micro-sprint 2
 * (PROMPT_CLAUDE_CODE_MICRO_SPRINT_2_CONSTRUCTION_SECTIONS_PLOMBERIE.txt,
 * 04/09/2026).
 *
 * Séparé des composants pour une vraie réutilisation par les futures pages
 * métiers (Chauffage, Serrurerie, Vitrerie, Rideaux métalliques), qui
 * fourniront chacune leur propre fichier `src/data/<metier>.ts` avec la
 * même forme. Les données déjà partagées (note Google, numéro d'urgence,
 * départements couverts) restent lues depuis `src/data/landing.ts` /
 * `src/lib/site-config.ts` — jamais recopiées ici (section « ne pas
 * copier-coller une deuxième source de vérité » du prompt de mission).
 */
import type { FaqItem, ProcessStep } from './landing';

export interface SafetyTip {
  id: string;
  /** Situation facilement reconnaissable par le visiteur. */
  situation: string;
  /** Premier geste sûr, réalisable sans compétence technique. */
  advice: string;
  /** Ce qu'il ne faut surtout pas faire. */
  avoid: string;
  /** Phrase rassurante expliquant l'intérêt de l'appel — jamais un diagnostic. */
  reassurance: string;
  icon: 'droplet' | 'alert-triangle' | 'shield' | 'search';
}

/**
 * Section 1 — « Que faire face à une urgence plomberie ? ». Chaque bloc
 * respecte la règle métier obligatoire du prompt de mission : reconnaître,
 * geste concret, interdit clair, réassurance sans minimiser ni promettre.
 */
export const plomberieSafetyTips: SafetyTip[] = [
  {
    id: 'fuite-visible',
    situation: 'Fuite d’eau visible',
    advice:
      'Si le robinet d’arrêt est accessible sans danger, coupez l’arrivée d’eau concernée ou l’arrivée générale. Éloignez les objets sensibles et recueillez l’eau sans toucher à une installation électrique.',
    avoid:
      'Ne démontez pas un raccord sous pression et n’intervenez pas près d’un équipement électrique humide.',
    reassurance:
      'Même un écoulement limité peut avoir une origine différente du point visible. Décrire son emplacement et son débit lors de l’appel aide à évaluer la situation.',
    icon: 'droplet',
  },
  {
    id: 'evier-lavabo-wc-bouche',
    situation: 'Évier, lavabo ou WC bouché',
    advice:
      'Cessez d’utiliser l’équipement et évitez de refaire couler de l’eau ou de tirer plusieurs fois la chasse.',
    avoid:
      'Ne mélangez jamais plusieurs produits déboucheurs et n’utilisez pas de produit agressif si vous ignorez l’état des canalisations.',
    reassurance:
      'Arrêter l’utilisation permet souvent d’éviter un débordement supplémentaire. Les signes observés permettent ensuite de mieux qualifier la nature du bouchon.',
    icon: 'alert-triangle',
  },
  {
    id: 'fuite-chauffe-eau',
    situation: 'Fuite sur un chauffe-eau',
    advice:
      'Si vous pouvez le faire sans vous exposer, fermez son arrivée d’eau. En présence d’eau près d’un branchement électrique, restez à distance et signalez-le dès l’appel.',
    avoid: 'N’ouvrez aucun capot et ne tentez aucune réparation électrique.',
    reassurance:
      'Une fuite ne signifie pas automatiquement que tout l’appareil doit être remplacé. L’emplacement de l’eau et le comportement de l’équipement permettent d’orienter le contrôle.',
    icon: 'shield',
  },
  {
    id: 'infiltration-difficile',
    situation: 'Infiltration ou fuite difficile à localiser',
    advice:
      'Déplacez les objets fragiles, protégez la zone et observez l’endroit où l’eau apparaît afin de pouvoir le décrire.',
    avoid: 'Ne percez pas un mur ou un plafond et ne manipulez pas une canalisation encastrée.',
    reassurance:
      'Le point où l’eau apparaît n’est pas toujours son point de départ. Vous n’avez pas besoin d’en connaître la cause exacte avant d’appeler.',
    icon: 'search',
  },
];

export const plomberieSafetyNote =
  'Ces conseils sont généraux. Si la situation présente un danger pour les personnes ou les biens, éloignez-vous de la zone et contactez le service adapté.';

export interface ReassurancePoint {
  title: string;
  description: string;
}

/** Section 2 — trois repères rassurants avant le CTA d'appel. */
export const plomberieReassurancePoints: ReassurancePoint[] = [
  {
    title: 'Un interlocuteur unique',
    description:
      'Vous expliquez la situation une seule fois afin d’orienter correctement la demande.',
  },
  {
    title: 'Des consignes compréhensibles',
    description:
      'Les premiers gestes sont adaptés à ce que vous pouvez réellement observer, sans démontage hasardeux.',
  },
  {
    title: 'Une intervention expliquée',
    description:
      'La situation constatée et les actions envisagées vous sont présentées clairement.',
  },
];

/**
 * Section 3 — processus spécifique plomberie, même forme que
 * `processSteps` (src/data/landing.ts) pour être passé tel quel au
 * composant `Process.astro` rendu paramétrable par ce micro-sprint. Labels
 * et badges sont une micro-copie de soutien cohérente avec le langage
 * visuel existant (jamais un délai, une garantie ou une certification).
 */
export const plomberieProcessSteps: ProcessStep[] = [
  {
    step: 1,
    label: 'PRISE DE CONTACT',
    title: 'Votre appel',
    description:
      'Vous indiquez l’équipement concerné, l’endroit où l’eau apparaît et les éventuels risques immédiats.',
    badges: ['SITUATION DÉCRITE', 'RISQUES SIGNALÉS'],
    icon: 'phone',
  },
  {
    step: 2,
    label: 'SÉCURITÉ IMMÉDIATE',
    title: 'Les premiers gestes',
    description:
      'Nous vous aidons à limiter l’écoulement ou l’utilisation de l’équipement sans vous exposer à une manipulation dangereuse.',
    badges: ['GESTES GUIDÉS', 'SANS DANGER'],
    icon: 'shield-check',
  },
  {
    step: 3,
    label: 'DIAGNOSTIC SUR PLACE',
    title: 'La recherche de la cause',
    description:
      'Sur place, l’installation accessible est contrôlée afin d’identifier l’origine probable de la fuite, du bouchon ou du dysfonctionnement.',
    badges: ['CONTRÔLE VISUEL', 'ORIGINE RECHERCHÉE'],
    icon: 'search',
  },
  {
    step: 4,
    label: 'AVANT INTERVENTION',
    title: 'La solution expliquée',
    description:
      'Les actions adaptées à la situation constatée vous sont présentées avant la poursuite de l’intervention.',
    badges: ['SOLUTION EXPLIQUÉE', 'CONDITIONS CLAIRES'],
    icon: 'clipboard-check',
  },
];

/** Section 4 — texte d'introduction de la zone desservie plomberie. */
export const plomberieCoverageIntro =
  'Belkhir Dépannage étudie les demandes de plomberie dans la Somme, le Nord, le Pas-de-Calais, l’Oise et l’Aisne. La possibilité d’intervention dépend du secteur, de la situation décrite et de la disponibilité au moment de l’appel.';

/**
 * Section 6 — FAQ plomberie, même forme que `FaqItem` (src/data/landing.ts)
 * pour être passée telle quelle au composant `Faq.astro` rendu
 * paramétrable, et servir aussi de source unique au balisage JSON-LD
 * FAQPage (jamais des données structurées différentes du contenu affiché).
 */
export const plomberieFaqItems: FaqItem[] = [
  {
    question: 'Que faire en premier lorsqu’une fuite d’eau apparaît ?',
    answer:
      'Si l’arrivée d’eau est accessible sans danger, fermez-la puis éloignez les objets sensibles. En présence d’eau près d’une installation électrique, restez à distance et signalez immédiatement la situation lors de l’appel.',
  },
  {
    question: 'Intervenez-vous pour une canalisation ou des WC bouchés ?',
    answer:
      'La demande peut être qualifiée par téléphone selon l’équipement concerné, les signes observés et l’étendue du problème. Évitez d’utiliser de nouveau l’équipement ou de mélanger des produits déboucheurs avant cet échange.',
  },
  {
    question: 'Dois-je connaître l’origine exacte de la fuite avant d’appeler ?',
    answer:
      'Non. Indiquez simplement où l’eau apparaît, depuis quand et quels équipements semblent concernés. Ces informations permettent déjà d’orienter la prise en charge.',
  },
  {
    question: 'La plomberie est-elle prise en charge partout dans les Hauts-de-France ?',
    answer:
      'Les demandes sont étudiées dans la Somme, le Nord, le Pas-de-Calais, l’Oise et l’Aisne. La disponibilité réelle dépend du secteur et de la situation au moment de l’appel.',
  },
  {
    question: 'Pouvez-vous intervenir la nuit ou le week-end ?',
    answer:
      'La ligne d’urgence est accessible 24h/24 et 7j/7. La possibilité et les conditions d’intervention sont confirmées selon la situation, le secteur et la disponibilité réelle.',
  },
];
