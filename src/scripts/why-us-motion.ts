/**
 * Logique pure de l'animation des compteurs de preuve de la section
 * « Pourquoi choisir Belkhir Dépannage ? » (micro-sprint animations/
 * compteurs). Volontairement séparée du DOM et d'IntersectionObserver pour
 * rester vérifiable par un test unitaire classique, sans navigateur (section
 * 18 du prompt de mission : « factoriser la logique de calcul des compteurs
 * dans une fonction testable »). Consommée par le `<script>` de
 * `WhyUs.astro`, qui se charge lui de tout le DOM/scroll/rAF.
 *
 * Micro-retouche vitesse (01/09/2026) : `easeOutCubic` remplacé par
 * `easeOutQuad`, dont la pente de départ est plus douce (dérivée en 0 = 2
 * contre 3 pour le cubique), pour éviter une montée des chiffres trop
 * brutale au tout début de l'animation.
 */

/** Easing « sortie » : démarre en douceur puis ralentit en approchant de 1. */
export function easeOutQuad(t: number): number {
  const clamped = Math.min(Math.max(t, 0), 1);
  return 1 - (1 - clamped) * (1 - clamped);
}

/**
 * Valeur entière à afficher par un compteur à un instant donné de
 * l'animation. Toujours arrondie (aucune décimale) et toujours exactement
 * `target` dès que `elapsed >= duration`, quelle que soit l'imprécision de
 * l'arrondi intermédiaire.
 */
export function computeCounterValue(target: number, elapsed: number, duration: number): number {
  if (duration <= 0 || elapsed >= duration) {
    return target;
  }
  const progress = easeOutQuad(elapsed / duration);
  return Math.round(progress * target);
}
