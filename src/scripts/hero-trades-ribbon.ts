/**
 * Logique pure du défilement automatique du ruban horizontal des métiers du
 * Hero, mobile uniquement (mini-sprint 3 « ruban horizontal métiers
 * mobile », 02/09/2026 ; correction de fluidité, 02/09/2026). Volontairement
 * séparée du DOM pour rester vérifiable par un test unitaire classique, sans
 * navigateur — même convention que `why-us-motion.ts`. Consommée par le
 * <script> de Hero.astro, qui gère lui seul le DOM, IntersectionObserver et
 * les événements d'interaction.
 *
 * Architecture par « legs » (retouche fluidité) : le trajet est découpé en
 * segments (« legs ») définis par une position de départ, une position
 * d'arrivée, une durée et un timestamp de départ. La position à un instant
 * donné se déduit directement du temps réellement écoulé depuis le début du
 * leg (jamais d'accumulation frame à frame, qui dérive avec le taux de
 * rafraîchissement réel de l'écran) et d'une courbe d'accélération/
 * décélération douce (`easeInOutSine`) — jamais un pas fixe ajouté à chaque
 * frame. Un leg de reprise (après une pause hors viewport, un onglet
 * suspendu ou un delta anormalement grand) repart toujours de la position
 * RÉELLEMENT AFFICHÉE vers la même borne cible, avec une durée recalculée
 * proportionnellement à la distance restante — jamais un nouveau trajet
 * complet de `RIBBON_PASS_DURATION_MS` pour quelques pixels restants, et
 * jamais un saut/téléportation vers l'extrémité.
 *
 * Va-et-vient (ping-pong) entre les deux bornes du conteneur, plutôt qu'une
 * boucle infinie à base de clones dupliqués : choix explicitement autorisé
 * par le prompt de mission du mini-sprint 3 lorsque la boucle « seamless »
 * entrerait en conflit avec la robustesse de l'accessibilité/du tactile
 * (aucun clone, donc aucun risque de double annonce ou de tabulation
 * fantôme) — inchangé par cette retouche.
 */

/**
 * Cible validée pour un aller simple complet (retouche fluidité,
 * 02/09/2026) : ramenée de 40 000 ms à 18 000 ms — la précédente valeur
 * produisait un mouvement mesuré à ~6,5 px/s (≈0,11 px/frame à 60 Hz),
 * perçu comme trop lent et légèrement saccadé lors de la validation
 * visuelle du mini-sprint 3.
 */
export const RIBBON_PASS_DURATION_MS = 18000;

/**
 * Delta anormalement grand entre deux frames (onglet suspendu, throttling
 * navigateur) : au-delà, on rebase le départ temporel du leg courant plutôt
 * que de laisser `computeLegProgress` sauter directement à 1 (ce qui
 * téléporterait visuellement le ruban à l'extrémité). Un delta normal à
 * 60 Hz vaut ~16,7 ms, à 120 Hz ~8,3 ms : 500 ms laisse une marge large pour
 * un jank ponctuel légitime sans manquer une vraie suspension.
 */
export const ABNORMAL_DELTA_MS = 500;

export type RibbonDirection = 1 | -1;

/** Un segment de trajet : de `start` à `end`, sur `duration` ms depuis `startedAt`. */
export interface RibbonLeg {
  start: number;
  end: number;
  duration: number;
  startedAt: number;
}

/** Interpolation linéaire simple entre deux valeurs. */
export const lerp = (start: number, end: number, progress: number): number =>
  start + (end - start) * progress;

/**
 * Courbe douce, symétrique et déterministe : accélération progressive au
 * départ, vitesse maximale au centre, décélération progressive à
 * l'arrivée — sans dépendre du taux de rafraîchissement réel de l'écran.
 */
export const easeInOutSine = (progress: number): number => -(Math.cos(Math.PI * progress) - 1) / 2;

/**
 * Durée proportionnelle à la distance réelle à parcourir, pour qu'un leg
 * partiel (reprise après pause, delta anormal) ne dure jamais un aller
 * complet pour quelques pixels restants.
 */
export function computeProportionalDuration(
  start: number,
  end: number,
  maxScroll: number,
  fullPassDurationMs: number,
): number {
  if (maxScroll <= 0 || fullPassDurationMs <= 0) {
    return 0;
  }
  const distance = Math.abs(end - start);
  return fullPassDurationMs * (distance / maxScroll);
}

/**
 * Progression brute [0, 1] écoulée dans `leg` à `timestamp` — jamais de
 * dépassement au-delà de ces bornes, quel que soit le retard éventuel du
 * timestamp fourni.
 */
export function computeLegProgress(leg: RibbonLeg, timestamp: number): number {
  if (leg.duration <= 0) {
    return 1;
  }
  return Math.min(1, Math.max(0, (timestamp - leg.startedAt) / leg.duration));
}

/** Position interpolée et adoucie (`easeInOutSine`) pour une progression brute donnée. */
export function computeLegPosition(leg: RibbonLeg, rawProgress: number): number {
  return lerp(leg.start, leg.end, easeInOutSine(rawProgress));
}

/**
 * Construit le leg suivant un fois une borne atteinte : la direction
 * s'inverse, le nouveau leg parcourt la largeur complète (`maxScroll`) —
 * jamais un raccourci, contrairement à un leg de reprise.
 */
export function nextFullLeg(
  completedLeg: RibbonLeg,
  maxScroll: number,
  timestamp: number,
  fullPassDurationMs: number,
): RibbonLeg {
  const start = completedLeg.end;
  const end = start >= maxScroll ? 0 : maxScroll;
  return {
    start,
    end,
    duration: computeProportionalDuration(start, end, maxScroll, fullPassDurationMs),
    startedAt: timestamp,
  };
}

/**
 * Construit un leg de reprise depuis une position réellement affichée
 * (jamais depuis une valeur mémorisée potentiellement obsolète) vers la
 * même borne cible que le leg interrompu — sans saut, avec une durée
 * proportionnelle à la distance réellement restante. Utilisé aussi bien
 * pour la reprise après pause hors viewport que pour le rebasage après un
 * delta anormalement grand (onglet suspendu) : dans les deux cas, on repart
 * de « où le ruban est réellement affiché maintenant », jamais d'un état
 * mémorisé qui pourrait être en décalage.
 */
export function resumeLeg(
  currentPosition: number,
  targetEnd: number,
  maxScroll: number,
  timestamp: number,
  fullPassDurationMs: number,
): RibbonLeg {
  return {
    start: currentPosition,
    end: targetEnd,
    duration: computeProportionalDuration(
      currentPosition,
      targetEnd,
      maxScroll,
      fullPassDurationMs,
    ),
    startedAt: timestamp,
  };
}
