/**
 * Contenu éditorial propre à la page `/vitrerie/` — réplication du pattern
 * validé de `/plomberie/`, `/chauffage/` et `/serrurerie/`
 * (PROMPT_CLAUDE_CODE_PAGE_VITRERIE_PATTERN_COMPLET.txt, 04/09/2026). Même
 * forme que `src/data/serrurerie.ts` : les données déjà partagées (note
 * Google, numéro d'urgence, départements couverts) restent lues depuis
 * `src/data/landing.ts` / `src/lib/site-config.ts` — jamais recopiées ici.
 *
 * Règle métier obligatoire (prompt de mission) : jamais d'indication
 * permettant de forcer, contourner ou fragiliser un accès vitré — le
 * contenu aide à protéger les personnes et la zone, il n'encourage aucune
 * manipulation du verre.
 */
import type { FaqItem, ProcessStep } from './landing';
import type { SafetyTip } from '../components/sections/SafetyTips.astro';
import type { SafetyContact } from '../components/sections/SafetyAlert.astro';

/**
 * Section 1 — « Que faire face à une vitre cassée ou fissurée ? ». Chaque
 * bloc respecte la règle métier obligatoire du prompt de mission : signe
 * observé, premier geste sûr, interdit clair, réassurance sans minimiser ni
 * promettre.
 */
export const vitrerieSafetyTips: SafetyTip[] = [
  {
    id: 'vitre-cassee',
    situation: 'Vitre cassée',
    advice:
      'Éloignez enfants et animaux de la zone, isolez l’accès et gardez des chaussures fermées si vous devez circuler à proximité.',
    avoid: 'Ne touchez pas les bords ni les éclats, même stables en apparence.',
    reassurance:
      'Isoler la zone suffit dans l’immédiat. Décrire ce qui est cassé et son emplacement permet d’organiser la mise en sécurité adaptée.',
    icon: 'window',
  },
  {
    id: 'vitre-fissuree',
    situation: 'Vitre fissurée',
    advice:
      'Évitez les chocs et les variations brutales de température près du vitrage et limitez l’accès à la pièce concernée.',
    avoid: 'N’appuyez pas sur le vitrage et ne tentez pas de tester sa résistance.',
    reassurance:
      'Une fissure n’évolue pas toujours de la même façon. Décrire son étendue et sa localisation permet de qualifier le risque avant d’agir.',
    icon: 'alert-triangle',
  },
  {
    id: 'fenetre-baie-bloquee',
    situation: 'Fenêtre ou baie qui ne ferme plus',
    advice:
      'Préservez l’accès existant, éloignez les personnes du vitrage instable et signalez la zone si elle reste ouverte.',
    avoid: 'Ne forcez pas le mécanisme de fermeture ni les gonds.',
    reassurance:
      'Un mécanisme bloqué ne signifie pas que le vitrage entier doit être remplacé. Décrire son comportement oriente la mise en sécurité.',
    icon: 'shield',
  },
  {
    id: 'vitrine-acces-endommage',
    situation: 'Vitrine ou accès vitré endommagé',
    advice:
      'Balisez la zone sans vous exposer, tenez les personnes à distance des éclats et protégez l’ouverture si possible.',
    avoid: 'Ne restez pas au contact prolongé du vitrage endommagé.',
    reassurance:
      'Un accès professionnel endommagé demande souvent une réponse rapide. Décrire la situation permet d’orienter vers le service adapté.',
    icon: 'window',
  },
];

export const vitrerieSafetyNote =
  'Ces conseils sont généraux. Si la situation présente un danger pour les personnes ou les biens, éloignez-vous de la zone et contactez le service adapté.';

/**
 * Encart de sécurité effraction / personne en danger (section 1,
 * obligatoire) : sémantiquement distinct des CTA commerciaux, jamais
 * présenté comme un substitut aux forces de l'ordre ou aux secours. Numéros
 * réels, cliquables, non inventés.
 */
export const vitrerieSafetyAlertContacts: SafetyContact[] = [
  { label: 'Police / Gendarmerie', displayNumber: '17', tel: 'tel:17' },
  { label: 'Urgence européenne', displayNumber: '112', tel: 'tel:112' },
];

export const vitrerieSafetyAlertTitle =
  'Traces d’effraction ou danger immédiat : appelez d’abord les services compétents';

export const vitrerieSafetyAlertText =
  'Si le vitrage brisé résulte d’une effraction ou si vous pensez qu’une personne peut encore se trouver sur place, ne vous approchez pas des lieux et appelez immédiatement la police ou la gendarmerie au 17, ou le 112.';

export const vitrerieSafetyAlertAdditionalText =
  'Ne balayez pas et ne retirez pas les éclats avant les constatations. La mise en sécurité du vitrage intervient après les consignes des forces de l’ordre.';

export const vitrerieSafetyAlertDisclaimer =
  'Belkhir Dépannage n’intervient jamais en substitut des forces de l’ordre ou des secours — la mise en sécurité vient après leurs consignes.';

/** Section 2 — trois repères rassurants avant le CTA d'appel. */
export const vitrerieReassurancePoints = [
  {
    title: 'Une situation qualifiée',
    description:
      'Vous décrivez le type de vitrage, son emplacement et son état sans manipuler le verre davantage.',
  },
  {
    title: 'Une exposition évaluée',
    description:
      'Le niveau d’exposition au froid, aux intempéries ou à un accès non sécurisé est pris en compte dès l’appel.',
  },
  {
    title: 'Une solution expliquée',
    description:
      'La mise en sécurité, la protection provisoire ou l’intervention envisagée vous sont présentées avant la poursuite.',
  },
];

/**
 * Section 3 — processus spécifique vitrerie, même forme que `processSteps`
 * pour être passé tel quel au composant `Process.astro` paramétrable.
 */
export const vitrerieProcessSteps: ProcessStep[] = [
  {
    step: 1,
    label: 'PRISE DE CONTACT',
    title: 'Votre appel',
    description:
      'Vous indiquez le type de vitrage concerné, son emplacement et ce qui a été observé au moment des faits.',
    badges: ['VITRAGE DÉCRIT', 'ZONE LOCALISÉE'],
    icon: 'phone',
  },
  {
    step: 2,
    label: 'SÉCURITÉ IMMÉDIATE',
    title: 'Les premières précautions',
    description:
      'Nous vous indiquons comment isoler la zone sans manipuler le verre, et distinguons une demande de vitrerie d’une situation relevant d’abord des secours ou des forces de l’ordre.',
    badges: ['GESTES GUIDÉS', 'SANS DANGER'],
    icon: 'shield-check',
  },
  {
    step: 3,
    label: 'DIAGNOSTIC SUR PLACE',
    title: 'Le contrôle du vitrage et de l’accès',
    description:
      'Sur place, le vitrage, le châssis et l’accès sont examinés afin de déterminer une intervention adaptée.',
    badges: ['CONTRÔLE VISUEL', 'ACCÈS VÉRIFIÉ'],
    icon: 'search',
  },
  {
    step: 4,
    label: 'AVANT INTERVENTION',
    title: 'La solution expliquée',
    description:
      'Mise en sécurité, protection provisoire ou intervention adaptée : le constat et les actions envisagées vous sont présentés avant la poursuite.',
    badges: ['SOLUTION EXPLIQUÉE', 'CONDITIONS CLAIRES'],
    icon: 'clipboard-check',
  },
];

/** Section 4 — texte d'introduction de la zone desservie vitrerie. */
export const vitrerieCoverageIntro =
  'Belkhir Dépannage étudie les demandes de vitrerie dans la Somme, le Nord, le Pas-de-Calais, l’Oise et l’Aisne. La possibilité d’intervention dépend du secteur, de la situation décrite et de la disponibilité au moment de l’appel.';

/**
 * Section 6 — FAQ vitrerie, même forme que `FaqItem` pour être passée telle
 * quelle au composant `Faq.astro` paramétrable, et servir aussi de source
 * unique au balisage JSON-LD FAQPage (jamais des données structurées
 * différentes du contenu affiché).
 */
export const vitrerieFaqItems: FaqItem[] = [
  {
    question: 'Que faire immédiatement devant une vitre cassée ?',
    answer:
      'Éloignez enfants et animaux, isolez la zone et évitez tout contact avec les éclats ou les bords. Décrivez ensuite la situation lors de l’appel.',
  },
  {
    question: 'Intervenez-vous pour une vitre fissurée ?',
    answer:
      'Oui. Décrivez l’étendue et l’emplacement de la fissure : cela permet de qualifier le risque avant d’organiser une intervention adaptée.',
  },
  {
    question: 'Pouvez-vous sécuriser une fenêtre ou une baie qui ne ferme plus ?',
    answer:
      'Nous étudions la demande. Ne forcez pas le mécanisme : décrire son comportement et l’état de l’accès permet d’orienter la mise en sécurité.',
  },
  {
    question: 'Intervenez-vous pour les vitrines de commerces et les locaux professionnels ?',
    answer:
      'Les demandes concernant les vitrines et accès vitrés professionnels sont étudiées au cas par cas, selon la situation décrite et la disponibilité.',
  },
  {
    question: 'Dois-je ramasser les morceaux de verre avant votre arrivée ?',
    answer:
      'Non. Évitez de manipuler les éclats à mains nues ; baliser et isoler la zone suffit dans l’attente de la prise en charge.',
  },
  {
    question: 'Dans quelles zones des Hauts-de-France intervenez-vous ?',
    answer:
      'Les demandes sont étudiées dans la Somme, le Nord, le Pas-de-Calais, l’Oise et l’Aisne. La disponibilité réelle dépend du secteur et de la situation au moment de l’appel.',
  },
];
