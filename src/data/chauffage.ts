/**
 * Contenu éditorial propre à la page `/chauffage/` — réplication du pattern
 * validé de `/plomberie/` (PROMPT_CLAUDE_CODE_PAGE_CHAUFFAGE_PATTERN_
 * COMPLET.txt, 04/09/2026). Même forme que `src/data/plomberie.ts` : les
 * données déjà partagées (note Google, numéro d'urgence, départements
 * couverts) restent lues depuis `src/data/landing.ts` /
 * `src/lib/site-config.ts` — jamais recopiées ici.
 */
import type { FaqItem, ProcessStep } from './landing';
import type { SafetyTip } from '../components/sections/SafetyTips.astro';
import type { SafetyContact } from '../components/sections/SafetyAlert.astro';

/**
 * Section 1 — « Que faire lorsque le chauffage ne fonctionne plus
 * correctement ? ». Chaque bloc respecte la règle métier obligatoire du
 * prompt de mission : signe observé, premier geste sûr, interdit clair,
 * réassurance sans minimiser ni promettre.
 */
export const chauffageSafetyTips: SafetyTip[] = [
  {
    id: 'radiateurs-froids',
    situation: 'Radiateurs froids ou chaleur irrégulière',
    advice:
      'Vérifiez uniquement la consigne du thermostat et observez si tous les radiateurs sont concernés ou seulement certains.',
    avoid:
      'Ne démontez aucune vanne et ne purgez pas plusieurs radiateurs si vous ne connaissez pas la pression attendue de l’installation.',
    reassurance:
      'Une différence entre les pièces ne signifie pas nécessairement que toute l’installation est en panne. Ces observations permettent d’orienter le contrôle.',
    icon: 'flame',
  },
  {
    id: 'chaudiere-arretee',
    situation: 'Chaudière arrêtée ou code d’erreur',
    advice:
      'Notez le code affiché et vérifiez seulement, sans ouvrir l’appareil, si son alimentation générale semble active.',
    avoid: 'Ne retirez aucun capot et ne multipliez pas les réinitialisations.',
    reassurance:
      'Le code ou le voyant fournit déjà une information utile. Le communiquer lors de l’appel aide à qualifier la situation sans manipulation risquée.',
    icon: 'alert-triangle',
  },
  {
    id: 'pression-bruit',
    situation: 'Pression ou bruit inhabituel',
    advice:
      'Relevez la valeur affichée et l’endroit d’où semble provenir le bruit. Si la situation paraît anormale, cessez de modifier les réglages.',
    avoid:
      'N’ajoutez pas d’eau dans le circuit et ne manipulez pas les organes internes sans consigne adaptée.',
    reassurance:
      'Un bruit ou une variation de pression peut avoir plusieurs causes. Décrire précisément le signe observé évite les essais inutiles.',
    icon: 'search',
  },
  {
    id: 'fuite-chaudiere',
    situation: 'Fuite d’eau près de la chaudière',
    advice:
      'Éloignez les objets sensibles, recueillez l’eau sans toucher aux composants électriques et indiquez si l’écoulement est continu.',
    avoid: 'Ne resserrez pas un raccord sous pression et n’ouvrez pas la chaudière.',
    reassurance:
      'Le point où l’eau apparaît n’est pas toujours son origine. Une description simple permet de déterminer les premières précautions.',
    icon: 'droplet',
  },
];

export const chauffageSafetyNote =
  'Ces conseils sont généraux. Si la situation présente un danger pour les personnes ou les biens, éloignez-vous de la zone et contactez le service adapté.';

/**
 * Encart de sécurité gaz/monoxyde de carbone (section 1, obligatoire) :
 * sémantiquement distinct des CTA commerciaux, jamais présenté comme un
 * service Belkhir Dépannage. Numéros réels, cliquables, non inventés.
 */
export const chauffageSafetyAlertContacts: SafetyContact[] = [
  { label: 'Urgence Sécurité Gaz', displayNumber: '0 800 47 33 33', tel: 'tel:+33800473333' },
  { label: 'SAMU', displayNumber: '15', tel: 'tel:15' },
  { label: 'Pompiers', displayNumber: '18', tel: 'tel:18' },
  { label: 'Urgence européenne', displayNumber: '112', tel: 'tel:112' },
];

export const chauffageSafetyAlertTitle =
  'Odeur de gaz ou suspicion de monoxyde de carbone : mettez-vous d’abord en sécurité';

export const chauffageSafetyAlertText =
  'En cas d’odeur de gaz, n’actionnez aucun interrupteur et évitez toute flamme ou étincelle. Aérez si vous pouvez le faire immédiatement sans vous exposer, quittez les lieux puis appelez Urgence Sécurité Gaz depuis l’extérieur au 0 800 47 33 33.';

export const chauffageSafetyAlertAdditionalText =
  'En cas de maux de tête, nausées, vertiges, malaise ou déclenchement d’une alarme de monoxyde de carbone, aérez, arrêtez si possible l’appareil sans vous exposer, évacuez et appelez les secours au 15, 18 ou 112. Ne réintégrez pas les lieux sans autorisation.';

export const chauffageSafetyAlertDisclaimer =
  'La mise en sécurité et les services d’urgence passent toujours avant l’appel commercial.';

/** Section 2 — trois repères rassurants avant le CTA d'appel. */
export const chauffageReassurancePoints = [
  {
    title: 'Un interlocuteur unique',
    description: 'Vous décrivez une seule fois l’appareil concerné et les signes constatés.',
  },
  {
    title: 'Aucun démontage demandé',
    description:
      'Les premières observations restent visuelles et accessibles, sans ouvrir la chaudière.',
  },
  {
    title: 'Une réponse expliquée',
    description:
      'Les contrôles et actions envisagés sont présentés clairement selon la situation constatée.',
  },
];

/**
 * Section 3 — processus spécifique chauffage, même forme que `processSteps`
 * pour être passé tel quel au composant `Process.astro` paramétrable.
 */
export const chauffageProcessSteps: ProcessStep[] = [
  {
    step: 1,
    label: 'PRISE DE CONTACT',
    title: 'Votre appel',
    description:
      'Vous indiquez le type d’appareil, les pièces concernées et les voyants, codes, bruits ou variations de pression observés.',
    badges: ['APPAREIL DÉCRIT', 'SIGNES OBSERVÉS'],
    icon: 'phone',
  },
  {
    step: 2,
    label: 'SÉCURITÉ IMMÉDIATE',
    title: 'Les premiers gestes',
    description:
      'Nous vous aidons à distinguer les vérifications visuelles possibles des situations qui imposent de vous éloigner et d’appeler les services adaptés.',
    badges: ['GESTES GUIDÉS', 'SANS DANGER'],
    icon: 'shield-check',
  },
  {
    step: 3,
    label: 'DIAGNOSTIC SUR PLACE',
    title: 'Le contrôle de l’installation',
    description:
      'Sur place, les éléments accessibles sont examinés afin d’identifier l’origine probable de la panne ou de l’anomalie.',
    badges: ['CONTRÔLE VISUEL', 'ORIGINE RECHERCHÉE'],
    icon: 'search',
  },
  {
    step: 4,
    label: 'AVANT INTERVENTION',
    title: 'La solution expliquée',
    description:
      'Les constats et les actions adaptées vous sont présentés avant la poursuite de l’intervention.',
    badges: ['SOLUTION EXPLIQUÉE', 'CONDITIONS CLAIRES'],
    icon: 'clipboard-check',
  },
];

/** Section 4 — texte d'introduction de la zone desservie chauffage. */
export const chauffageCoverageIntro =
  'Belkhir Dépannage étudie les demandes liées au chauffage dans la Somme, le Nord, le Pas-de-Calais, l’Oise et l’Aisne. La possibilité d’intervention dépend du secteur, de la situation décrite et de la disponibilité au moment de l’appel.';

/**
 * Section 6 — FAQ chauffage, même forme que `FaqItem` pour être passée
 * telle quelle au composant `Faq.astro` paramétrable, et servir aussi de
 * source unique au balisage JSON-LD FAQPage (jamais des données
 * structurées différentes du contenu affiché).
 */
export const chauffageFaqItems: FaqItem[] = [
  {
    question: 'Que vérifier lorsqu’un radiateur reste froid ?',
    answer:
      'Observez si tous les radiateurs sont concernés et vérifiez uniquement la consigne du thermostat. Évitez de démonter une vanne ou de modifier plusieurs réglages avant d’avoir décrit la situation.',
  },
  {
    question: 'Que signifie un code d’erreur sur une chaudière ?',
    answer:
      'Le code varie selon l’appareil et la panne. Notez-le sans ouvrir la chaudière ni multiplier les réinitialisations, puis communiquez-le lors de l’appel.',
  },
  {
    question: 'Une baisse de pression nécessite-t-elle toujours une réparation importante ?',
    answer:
      'Non, plusieurs causes sont possibles. Relevez la valeur du manomètre et les autres signes visibles, mais n’ajoutez pas d’eau dans le circuit sans consigne adaptée.',
  },
  {
    question: 'Que faire si je sens une odeur de gaz ?',
    answer:
      'N’actionnez aucun interrupteur, évitez toute flamme, aérez si cela peut être fait immédiatement sans danger, quittez les lieux et appelez Urgence Sécurité Gaz depuis l’extérieur au 0 800 47 33 33.',
  },
  {
    question: 'Quels signes peuvent évoquer du monoxyde de carbone ?',
    answer:
      'Des maux de tête, nausées, vertiges ou malaises, notamment s’ils touchent plusieurs personnes, doivent conduire à aérer, évacuer les lieux et appeler immédiatement les secours au 15, 18 ou 112.',
  },
  {
    question: 'Intervenez-vous dans tous les Hauts-de-France ?',
    answer:
      'Les demandes sont étudiées dans la Somme, le Nord, le Pas-de-Calais, l’Oise et l’Aisne. La disponibilité réelle dépend du secteur et de la situation au moment de l’appel.',
  },
];
