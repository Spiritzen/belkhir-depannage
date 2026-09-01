import { describe, expect, it } from 'vitest';
import { easeOutQuad, computeCounterValue } from '../src/scripts/why-us-motion';

// Tests de la logique pure (sans DOM ni IntersectionObserver) de l'animation
// des compteurs, conformément à la clause de repli de la section 18 du
// prompt PROMPT_CLAUDE_CODE_POURQUOI_CHOISIR_ANIMATIONS_COMPTEURS.txt.
//
// Micro-retouche vitesse (01/09/2026) : `easeOutCubic` remplacé par
// `easeOutQuad` (départ plus doux) et durée de comptage de production
// doublée (1200ms -> 2400ms) — tests mis à jour en conséquence.
describe('why-us-motion — logique pure des compteurs', () => {
  it('1. easeOutQuad starts at 0 and ends at 1', () => {
    expect(easeOutQuad(0)).toBe(0);
    expect(easeOutQuad(1)).toBe(1);
  });

  it('2. easeOutQuad is monotonically increasing (no overshoot, no rebound)', () => {
    const samples = [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1];
    let previous = -1;
    for (const t of samples) {
      const value = easeOutQuad(t);
      expect(value).toBeGreaterThanOrEqual(previous);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
      previous = value;
    }
  });

  it('3. easeOutQuad clamps values outside [0, 1]', () => {
    expect(easeOutQuad(-0.5)).toBe(0);
    expect(easeOutQuad(1.5)).toBe(1);
  });

  it('4. easeOutQuad starts more gently than a cubic-style ease-out (softer initial ramp)', () => {
    // La demande explicite du client est d'éviter une progression trop
    // brutale au début : à t=0.1, la valeur quad doit rester strictement
    // sous celle d'un easeOutCubic équivalent (1 - (1-t)^3).
    const t = 0.1;
    const quadValue = easeOutQuad(t);
    const cubicEquivalent = 1 - Math.pow(1 - t, 3);
    expect(quadValue).toBeLessThan(cubicEquivalent);
  });

  it('5. computeCounterValue is 0 at the very start of the animation', () => {
    expect(computeCounterValue(20, 0, 2400)).toBe(0);
    expect(computeCounterValue(500, 0, 2400)).toBe(0);
    expect(computeCounterValue(98, 0, 2400)).toBe(0);
  });

  it('6. computeCounterValue always lands exactly on the target once elapsed >= duration (production duration: 2400ms)', () => {
    expect(computeCounterValue(20, 2400, 2400)).toBe(20);
    expect(computeCounterValue(500, 2400, 2400)).toBe(500);
    expect(computeCounterValue(98, 2400, 2400)).toBe(98);
    // Au-delà de la durée (dernière frame en retard) : toujours la cible exacte.
    expect(computeCounterValue(20, 2800, 2400)).toBe(20);
  });

  it('7. computeCounterValue progresses strictly between 0 and the target mid-animation', () => {
    const midway = computeCounterValue(500, 1200, 2400);
    expect(midway).toBeGreaterThan(0);
    expect(midway).toBeLessThan(500);
  });

  it('8. computeCounterValue never returns a decimal (always an integer)', () => {
    for (const elapsed of [0, 240, 600, 900, 1200, 1500, 1800, 2100, 2399]) {
      const value = computeCounterValue(98, elapsed, 2400);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('9. computeCounterValue is monotonically increasing across the animation', () => {
    let previous = -1;
    for (const elapsed of [0, 300, 600, 900, 1200, 1500, 1800, 2100, 2400]) {
      const value = computeCounterValue(500, elapsed, 2400);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });

  it('10. computeCounterValue returns the target immediately for a zero or negative duration', () => {
    expect(computeCounterValue(20, 0, 0)).toBe(20);
    expect(computeCounterValue(20, 0, -100)).toBe(20);
  });

  it('11. doubling the duration (1200ms -> 2400ms) roughly halves the progress at a given elapsed time', () => {
    // Vérifie concrètement le ralenti demandé : à 600ms écoulées, on doit
    // être bien plus proche du départ avec une durée de 2400ms qu'avec
    // l'ancienne durée de 1200ms.
    const withOldDuration = computeCounterValue(500, 600, 1200);
    const withNewDuration = computeCounterValue(500, 600, 2400);
    expect(withNewDuration).toBeLessThan(withOldDuration);
  });
});
