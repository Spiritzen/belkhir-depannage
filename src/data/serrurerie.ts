/**
 * Contenu éditorial propre à la page `/serrurerie/` — réplication du
 * pattern validé de `/plomberie/` et `/chauffage/`
 * (PROMPT_CLAUDE_CODE_PAGE_SERRURERIE_PATTERN_COMPLET.txt, 04/09/2026).
 * Même forme que `src/data/plomberie.ts`/`src/data/chauffage.ts` : les
 * données déjà partagées (note Google, numéro d'urgence, départements
 * couverts) restent lues depuis `src/data/landing.ts` /
 * `src/lib/site-config.ts` — jamais recopiées ici.
 *
 * Règle métier obligatoire (prompt de mission) : jamais d'instruction
 * détaillée permettant d'ouvrir, crocheter, percer ou contourner une
 * serrure — le contenu aide à protéger la porte et les personnes, il ne
 * forme pas le visiteur à intervenir sur le mécanisme.
 */
import type { FaqItem, ProcessStep } from './landing';
import type { SafetyTip } from '../components/sections/SafetyTips.astro';
import type { SafetyContact } from '../components/sections/SafetyAlert.astro';

/**
 * Section 1 — « Que faire face à une porte ou une serrure bloquée ? ».
 * Chaque bloc respecte la règle métier obligatoire du prompt de mission :
 * signe observé, premier geste sûr, interdit clair, réassurance sans
 * minimiser ni promettre.
 */
export const serrurerieSafetyTips: SafetyTip[] = [
  {
    id: 'porte-claquee',
    situation: 'Porte claquée',
    advice:
      'Vérifiez calmement si un autre accès autorisé est disponible et gardez à portée de main un justificatif permettant d’établir votre droit d’accès au logement.',
    avoid: 'N’utilisez pas d’objet improvisé, ne forcez pas la poignée et ne frappez pas la porte.',
    reassurance:
      'Une porte simplement claquée et une porte verrouillée ne demandent pas la même prise en charge. Décrire la position de la porte et des clés aide à orienter l’intervention.',
    icon: 'key',
  },
  {
    id: 'cle-cassee',
    situation: 'Clé cassée dans la serrure',
    advice:
      'Cessez immédiatement de tourner ou de pousser la clé et laissez le mécanisme dans son état actuel.',
    avoid:
      'N’appliquez pas de colle, ne poussez pas le fragment plus profondément et n’introduisez pas d’outil métallique improvisé.',
    reassurance:
      'Un fragment visible ne signifie pas nécessairement que toute la serrure doit être remplacée. Sa position et l’état du mécanisme permettent de déterminer la suite adaptée.',
    icon: 'alert-triangle',
  },
  {
    id: 'serrure-bloquee',
    situation: 'Serrure bloquée ou clé qui ne tourne plus',
    advice:
      'Arrêtez dès qu’une résistance inhabituelle apparaît et observez si la porte semble exercer une pression sur son cadre.',
    avoid:
      'Ne forcez pas la clé, ne multipliez pas les essais et n’utilisez pas un lubrifiant non adapté.',
    reassurance:
      'Le blocage peut venir de plusieurs éléments et pas uniquement du cylindre. Décrire le mouvement de la clé et de la poignée évite les manipulations inutiles.',
    icon: 'search',
  },
  {
    id: 'cles-perdues',
    situation: 'Clés perdues ou volées',
    advice:
      'Vérifiez les autres accès, informez les personnes concernées et rassemblez les éléments permettant de confirmer votre droit d’accès.',
    avoid:
      'Ne laissez pas un double dans un endroit visible et ne publiez pas votre adresse ou des informations précises sur la perte.',
    reassurance:
      'Perdre une clé ne signifie pas toujours que la porte elle-même est endommagée. L’échange permet d’évaluer la solution de sécurisation adaptée à votre situation.',
    icon: 'shield',
  },
];

export const serrurerieSafetyNote =
  'Ces conseils sont généraux. Si la situation présente un danger pour les personnes ou les biens, éloignez-vous de la zone et contactez le service adapté.';

/**
 * Encart de sécurité effraction / personne en danger (section 1,
 * obligatoire) : sémantiquement distinct des CTA commerciaux, jamais
 * présenté comme un substitut aux forces de l'ordre. Numéros réels,
 * cliquables, non inventés.
 */
export const serrurerieSafetyAlertContacts: SafetyContact[] = [
  { label: 'Police / Gendarmerie', displayNumber: '17', tel: 'tel:17' },
  { label: 'Urgence européenne', displayNumber: '112', tel: 'tel:112' },
];

export const serrurerieSafetyAlertTitle =
  'Traces d’effraction ou danger immédiat : appelez d’abord les services compétents';

export const serrurerieSafetyAlertText =
  'Si vous découvrez une porte forcée ou pensez qu’une personne peut encore se trouver à l’intérieur, ne pénétrez pas dans les lieux, éloignez-vous et appelez immédiatement la police ou la gendarmerie au 17, ou le 112.';

export const serrurerieSafetyAlertAdditionalText =
  'Ne nettoyez pas, ne rangez pas et ne manipulez pas la porte avant les constatations. La sécurisation par un serrurier intervient après les consignes des forces de l’ordre.';

export const serrurerieSafetyAlertDisclaimer =
  'Belkhir Dépannage n’intervient jamais en substitut des forces de l’ordre — la sécurisation vient après leurs consignes.';

/** Section 2 — trois repères rassurants avant le CTA d'appel. */
export const serrurerieReassurancePoints = [
  {
    title: 'Une demande qualifiée',
    description:
      'Vous décrivez la porte, la position des clés et les signes observés sans manipuler davantage le mécanisme.',
  },
  {
    title: 'Une intervention autorisée',
    description:
      'Les éléments permettant d’établir votre droit d’accès peuvent être vérifiés avant ou lors de l’intervention.',
  },
  {
    title: 'Une solution expliquée',
    description:
      'L’état visible de la porte et les actions envisagées vous sont présentés avant la poursuite de l’intervention.',
  },
];

/**
 * Section 3 — processus spécifique serrurerie, même forme que
 * `processSteps` pour être passé tel quel au composant `Process.astro`
 * paramétrable. Aucun outil ni méthode d'ouverture détaillé.
 */
export const serrurerieProcessSteps: ProcessStep[] = [
  {
    step: 1,
    label: 'PRISE DE CONTACT',
    title: 'Votre appel',
    description:
      'Vous indiquez le type de porte, la position des clés, le comportement de la poignée ou de la serrure et l’existence éventuelle de dégâts visibles.',
    badges: ['PORTE DÉCRITE', 'CLÉS LOCALISÉES'],
    icon: 'phone',
  },
  {
    step: 2,
    label: 'SÉCURITÉ IMMÉDIATE',
    title: 'Les premières précautions',
    description:
      'Nous vous aidons à éviter les gestes susceptibles d’aggraver le blocage et à distinguer une demande de serrurerie d’une situation relevant d’abord des secours ou des forces de l’ordre.',
    badges: ['GESTES GUIDÉS', 'SANS DANGER'],
    icon: 'shield-check',
  },
  {
    step: 3,
    label: 'DIAGNOSTIC SUR PLACE',
    title: 'Le contrôle de l’accès',
    description:
      'Sur place, la porte et les éléments accessibles sont examinés afin de déterminer une intervention adaptée et autorisée.',
    badges: ['CONTRÔLE VISUEL', 'ACCÈS VÉRIFIÉ'],
    icon: 'search',
  },
  {
    step: 4,
    label: 'AVANT INTERVENTION',
    title: 'La solution expliquée',
    description:
      'Les constats, les limites éventuelles et les actions envisagées vous sont présentés avant la poursuite de l’intervention.',
    badges: ['SOLUTION EXPLIQUÉE', 'CONDITIONS CLAIRES'],
    icon: 'clipboard-check',
  },
];

/** Section 4 — texte d'introduction de la zone desservie serrurerie. */
export const serrurerieCoverageIntro =
  'Belkhir Dépannage étudie les demandes de serrurerie dans la Somme, le Nord, le Pas-de-Calais, l’Oise et l’Aisne. La possibilité d’intervention dépend du secteur, de la situation décrite et de la disponibilité au moment de l’appel.';

/**
 * Section 6 — FAQ serrurerie, même forme que `FaqItem` pour être passée
 * telle quelle au composant `Faq.astro` paramétrable, et servir aussi de
 * source unique au balisage JSON-LD FAQPage (jamais des données
 * structurées différentes du contenu affiché).
 */
export const serrurerieFaqItems: FaqItem[] = [
  {
    question: 'Que faire lorsque ma porte vient de claquer ?',
    answer:
      'Évitez de forcer la poignée ou d’utiliser un objet improvisé. Vérifiez seulement si un autre accès autorisé existe, puis décrivez la porte et la position des clés lors de l’appel.',
  },
  {
    question: 'Une porte peut-elle toujours être ouverte sans dommage ?',
    answer:
      'Cela dépend du type de porte, de son verrouillage et de l’état du mécanisme. Aucune absence de dommage ne doit être promise avant le contrôle ; les actions envisageables doivent être expliquées selon la situation.',
  },
  {
    question: 'Que faire si ma clé s’est cassée dans la serrure ?',
    answer:
      'Cessez de manipuler le mécanisme, n’utilisez pas de colle et ne poussez pas le fragment. Indiquez simplement si une partie de la clé reste visible.',
  },
  {
    question: 'Que préparer avant une intervention sur mon logement ?',
    answer:
      'Préparez les éléments permettant de confirmer votre identité et votre droit d’accès au logement. Les justificatifs pertinents dépendent de la situation.',
  },
  {
    question: 'Que faire après une tentative d’effraction ?',
    answer:
      'Ne touchez pas aux lieux avant les constatations et appelez d’abord la police ou la gendarmerie au 17, ou le 112 en cas de danger. La sécurisation de la porte intervient ensuite selon leurs consignes.',
  },
  {
    question: 'Intervenez-vous dans tous les Hauts-de-France ?',
    answer:
      'Les demandes sont étudiées dans la Somme, le Nord, le Pas-de-Calais, l’Oise et l’Aisne. La disponibilité réelle dépend du secteur et de la situation au moment de l’appel.',
  },
];
