/**
 * Coordonnées du médiateur de la consommation auquel BELKHIR DEPANNAGE aura
 * adhéré (PROMPT_CLAUDE_CODE_PAGE_MENTIONS_LEGALES.txt, 04/09/2026, section
 * H). Rubrique obligatoire pour l'activité auprès de particuliers, mais
 * l'organisme choisi n'est pas encore confirmé en l'absence de Fouad.
 *
 * RÈGLE ABSOLUE : ne jamais inventer un médiateur, une adresse ou une
 * adhésion (ni Médiateur national de l'énergie, ni CNIL, ni plateforme
 * européenne non compétente, ni organisme choisi au hasard). Les trois
 * valeurs restent `null` tant qu'elles ne sont pas confirmées ; la page
 * affiche alors explicitement le bloc `[RESTE À COMPLÉTER AVANT MISE EN
 * PRODUCTION]`.
 *
 * Centralisé ici pour que la future substitution des trois valeurs, une
 * fois l'organisme confirmé, se limite à ce seul fichier — jamais besoin de
 * reconstruire `src/pages/mentions-legales/index.astro`.
 */
export interface MediateurConsommation {
  nom: string;
  adresse: string;
  siteInternet: string;
}

/** `null` tant que l'organisme n'est pas confirmé par Fouad. */
export const mediateurConsommation: MediateurConsommation | null = null;
