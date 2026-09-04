/**
 * Contenu éditorial propre à la page `/zones-intervention/`
 * (PROMPT_CLAUDE_CODE_PAGE_ZONES_INTERVENTION_RADAR.txt, section 10,
 * 04/09/2026) — FAQ géographique, textes donnés mot pour mot par le prompt
 * de mission.
 */
import type { FaqItem } from './landing';

export const zonesInterventionFaqItems: FaqItem[] = [
  {
    question: 'Intervenez-vous dans tous les Hauts-de-France ?',
    answer:
      'Les demandes sont étudiées dans la Somme, le Nord, le Pas-de-Calais, l’Oise et l’Aisne. La possibilité de déplacement dépend ensuite de la commune, de la situation décrite et de la disponibilité au moment de l’appel.',
  },
  {
    question: 'Une commune trouvée garantit-elle une intervention ?',
    answer:
      'Non. Le résultat confirme que la commune appartient au secteur déclaré. L’intervention et son délai restent confirmés après qualification de la demande.',
  },
  {
    question: 'Comment connaître le délai d’intervention ?',
    answer:
      'Appelez Belkhir Dépannage en indiquant votre commune, le métier concerné et les signes observés. Un délai ne doit être annoncé qu’après vérification de la situation et de la disponibilité.',
  },
  {
    question: 'Quelles informations préparer avant d’appeler ?',
    answer:
      'Préparez le nom de la commune, le type de dépannage, une description concise et les éventuels risques pour les personnes ou les biens. Ne manipulez aucune installation dangereuse.',
  },
  {
    question: 'Que faire si ma commune n’est pas reconnue ?',
    answer:
      'Vérifiez l’orthographe ou le code postal. Si le résultat reste introuvable, appelez-nous afin que votre secteur puisse être étudié manuellement.',
  },
];
