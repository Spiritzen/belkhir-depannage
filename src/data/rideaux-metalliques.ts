/**
 * Contenu éditorial propre à la page `/rideaux-metalliques/` — réplication
 * du pattern validé de `/plomberie/`, `/chauffage/`, `/serrurerie/` et
 * `/vitrerie/` (PROMPT_CLAUDE_CODE_PAGE_RIDEAUX_METALLIQUES_PATTERN_
 * COMPLET.txt, 04/09/2026). Même forme que `src/data/vitrerie.ts` : les
 * données déjà partagées (note Google, numéro d'urgence, départements
 * couverts) restent lues depuis `src/data/landing.ts` /
 * `src/lib/site-config.ts` — jamais recopiées ici.
 *
 * Règle métier obligatoire (prompt de mission) : jamais de procédure
 * mécanique/électrique détaillée, ni technique de forçage, contournement,
 * ouverture ou neutralisation d'un rideau métallique — le contenu aide à
 * protéger les personnes et l'accès, il ne forme pas le visiteur à
 * intervenir sur le mécanisme.
 */
import type { FaqItem, ProcessStep } from './landing';
import type { SafetyTip } from '../components/sections/SafetyTips.astro';
import type { SafetyContact } from '../components/sections/SafetyAlert.astro';

/**
 * Section 1 — « Que faire face à un rideau métallique bloqué ou en panne ? ».
 * Chaque bloc respecte la règle métier obligatoire du prompt de mission :
 * signe observé, premier geste sûr, interdit clair, réassurance sans
 * minimiser ni promettre.
 */
export const rideauxMetalliquesSafetyTips: SafetyTip[] = [
  {
    id: 'rideau-bloque-ferme',
    situation: 'Rideau bloqué fermé',
    advice:
      'Cessez les commandes répétées et dégagez la zone en décrivant à l’équipe les bruits ou signes observés.',
    avoid: 'Ne tirez pas, ne soulevez pas et ne forcez pas le tablier.',
    reassurance:
      'Un rideau bloqué fermé ne signifie pas toujours une panne majeure. Décrire le comportement du tablier et de la commande permet d’orienter la mise en sécurité.',
    icon: 'shutter',
  },
  {
    id: 'rideau-bloque-ouvert',
    situation: 'Rideau bloqué ouvert',
    advice:
      'Empêchez le passage sous le rideau et surveillez l’accès à distance en attendant une mise en sécurité adaptée.',
    avoid: 'Ne tentez pas de le retenir ni de le faire descendre à la main.',
    reassurance:
      'Un rideau immobilisé en position ouverte peut représenter un risque de chute. Sécuriser le passage suffit dans l’immédiat.',
    icon: 'alert-triangle',
  },
  {
    id: 'tablier-desaxe',
    situation: 'Tablier désaxé ou lames déformées',
    advice:
      'Arrêtez immédiatement toute nouvelle manœuvre et éloignez les personnes de la trajectoire.',
    avoid: 'Ne remettez pas les lames dans les coulisses vous-même.',
    reassurance:
      'Un désaxement peut venir de plusieurs éléments du rail ou des coulisses. Décrire ce qui est visible évite une manipulation inutile.',
    icon: 'search',
  },
  {
    id: 'moteur-silencieux',
    situation: 'Moteur silencieux ou bruit inhabituel',
    advice:
      'Interrompez les essais successifs et signalez si le problème est apparu brutalement ou progressivement.',
    avoid: 'N’ouvrez pas le coffre du moteur et ne touchez pas au câblage.',
    reassurance:
      'Un moteur silencieux n’implique pas forcément son remplacement. Le diagnostic sur place détermine la cause réelle.',
    icon: 'shield',
  },
];

export const rideauxMetalliquesSafetyNote =
  'Ces conseils sont généraux. Si la situation présente un danger pour les personnes ou les biens, éloignez-vous de la zone et contactez le service adapté.';

/**
 * Encart de sécurité (section 1, obligatoire) : chute/écrasement, pièce
 * métallique instable, odeur de brûlé/fumée/danger électrique, tentative
 * d'effraction ou danger immédiat. Sémantiquement distinct des CTA
 * commerciaux, jamais présenté comme un substitut aux forces de l'ordre ou
 * aux secours. Numéros réels, cliquables, non inventés.
 */
export const rideauxMetalliquesSafetyAlertContacts: SafetyContact[] = [
  { label: 'Pompiers', displayNumber: '18', tel: 'tel:18' },
  { label: 'Police / Gendarmerie', displayNumber: '17', tel: 'tel:17' },
  { label: 'Urgence européenne', displayNumber: '112', tel: 'tel:112' },
];

export const rideauxMetalliquesSafetyAlertTitle =
  'Risque de chute, odeur de brûlé ou danger immédiat : appelez d’abord les services compétents';

export const rideauxMetalliquesSafetyAlertText =
  'Si une pièce métallique semble instable, si vous sentez une odeur de brûlé ou de fumée près du moteur, ou si vous constatez une tentative d’effraction, éloignez-vous immédiatement de la zone et appelez les pompiers au 18, la police ou la gendarmerie au 17, ou le 112 en cas de danger pour une personne.';

export const rideauxMetalliquesSafetyAlertAdditionalText =
  'Ne restez pas sous un rideau instable et ne tentez pas de couper l’alimentation électrique vous-même. La mise en sécurité par notre équipe intervient après les consignes des services compétents.';

export const rideauxMetalliquesSafetyAlertDisclaimer =
  'Belkhir Dépannage n’intervient jamais en substitut des forces de l’ordre ou des secours — la mise en sécurité vient après leurs consignes.';

/** Section 2 — trois repères rassurants avant le CTA d'appel. */
export const rideauxMetalliquesReassurancePoints = [
  {
    title: 'Une situation qualifiée',
    description:
      'Vous décrivez le type de rideau, sa position, son mode de commande et les bruits observés sans manipuler davantage le mécanisme.',
  },
  {
    title: 'Un risque évalué',
    description:
      'L’existence d’un risque immédiat pour les personnes ou l’accès est prise en compte dès l’appel.',
  },
  {
    title: 'Une solution expliquée',
    description:
      'Remise en fonctionnement, mise en sécurité ou suite adaptée : le constat vous est présenté avant la poursuite de l’intervention.',
  },
];

/**
 * Section 3 — processus spécifique rideaux métalliques, même forme que
 * `processSteps` pour être passé tel quel au composant `Process.astro`
 * paramétrable. Aucune procédure mécanique/électrique détaillée.
 */
export const rideauxMetalliquesProcessSteps: ProcessStep[] = [
  {
    step: 1,
    label: 'PRISE DE CONTACT',
    title: 'Votre appel',
    description:
      'Vous indiquez le type de rideau (motorisé ou manuel), sa position, son mode de commande et les bruits ou signes observés.',
    badges: ['RIDEAU DÉCRIT', 'POSITION CONNUE'],
    icon: 'phone',
  },
  {
    step: 2,
    label: 'SÉCURITÉ IMMÉDIATE',
    title: 'Les consignes immédiates',
    description:
      'Nous vous aidons à préserver les personnes et l’accès, et à distinguer une demande de dépannage d’une situation relevant d’abord des secours ou des forces de l’ordre.',
    badges: ['ACCÈS PROTÉGÉ', 'SANS DANGER'],
    icon: 'shield-check',
  },
  {
    step: 3,
    label: 'DIAGNOSTIC SUR PLACE',
    title: 'Le contrôle du tablier et de la commande',
    description:
      'Sur place, le tablier, les coulisses, la commande et les éléments accessibles sont examinés afin de déterminer une intervention adaptée.',
    badges: ['CONTRÔLE VISUEL', 'MÉCANISME VÉRIFIÉ'],
    icon: 'search',
  },
  {
    step: 4,
    label: 'AVANT INTERVENTION',
    title: 'La solution expliquée',
    description:
      'Remise en fonctionnement, mise en sécurité ou suite adaptée : les constats et les actions envisagées vous sont présentés avant la poursuite.',
    badges: ['SOLUTION EXPLIQUÉE', 'CONDITIONS CLAIRES'],
    icon: 'clipboard-check',
  },
];

/** Section 4 — texte d'introduction de la zone desservie rideaux métalliques. */
export const rideauxMetalliquesCoverageIntro =
  'Belkhir Dépannage étudie les demandes de dépannage de rideaux métalliques dans la Somme, le Nord, le Pas-de-Calais, l’Oise et l’Aisne. La possibilité d’intervention dépend du secteur, de la situation décrite et de la disponibilité au moment de l’appel.';

/**
 * Section 6 — FAQ rideaux métalliques, même forme que `FaqItem` pour être
 * passée telle quelle au composant `Faq.astro` paramétrable, et servir
 * aussi de source unique au balisage JSON-LD FAQPage (jamais des données
 * structurées différentes du contenu affiché).
 */
export const rideauxMetalliquesFaqItems: FaqItem[] = [
  {
    question: 'Que faire lorsqu’un rideau métallique reste bloqué fermé ?',
    answer:
      'Cessez les commandes répétées, ne forcez pas le tablier et décrivez à l’équipe les bruits ou signes observés lors de l’appel.',
  },
  {
    question: 'Que faire si le rideau reste bloqué en position ouverte ?',
    answer:
      'Empêchez le passage sous le rideau et surveillez l’accès à distance sans tenter de le faire descendre à la main.',
  },
  {
    question: 'Intervenez-vous sur les rideaux métalliques motorisés et manuels ?',
    answer:
      'Les deux types de rideaux sont étudiés. Le mode de commande (motorisé ou manuel) est simplement précisé lors de l’appel pour orienter le diagnostic.',
  },
  {
    question: 'Pouvez-vous mettre en sécurité un rideau désaxé ou endommagé ?',
    answer:
      'Nous étudions la demande. Décrire l’état du tablier et des lames permet de qualifier le risque avant d’organiser une intervention adaptée.',
  },
  {
    question: 'Intervenez-vous pour les commerces, garages et locaux professionnels ?',
    answer:
      'Les demandes concernant les commerces, garages et accès professionnels sont étudiées au cas par cas, selon la situation décrite et la disponibilité.',
  },
  {
    question: 'Dans quelles zones des Hauts-de-France intervenez-vous ?',
    answer:
      'Les demandes sont étudiées dans la Somme, le Nord, le Pas-de-Calais, l’Oise et l’Aisne. La disponibilité réelle dépend du secteur et de la situation au moment de l’appel.',
  },
];
