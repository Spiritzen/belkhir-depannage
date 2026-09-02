import { describe, expect, it } from 'vitest';
import {
  computeLegPosition,
  computeLegProgress,
  computeProportionalDuration,
  easeInOutSine,
  lerp,
  nextFullLeg,
  resumeLeg,
  ABNORMAL_DELTA_MS,
  RIBBON_PASS_DURATION_MS,
  type RibbonLeg,
} from '../src/scripts/hero-trades-ribbon';

// Tests de la logique pure (sans DOM ni IntersectionObserver) du
// défilement automatique du ruban horizontal des métiers (mini-sprint 3,
// puis correction de fluidité, 02/09/2026,
// PROMPT_CLAUDE_CODE_CORRECTION_FLUIDITE_RUBAN_METIERS_MOBILE.txt).
//
// Architecture par « legs » : position déduite directement du temps
// écoulé depuis le début du leg (jamais d'accumulation frame à frame), avec
// une courbe d'accélération/décélération douce (easeInOutSine).
describe('hero-trades-ribbon — durée cible', () => {
  it('1. the target pass duration is exactly the validated 18000ms, not an arbitrary new value', () => {
    expect(RIBBON_PASS_DURATION_MS).toBe(18000);
  });

  it('2. the abnormal-delta threshold is a sane, centralized value well above a normal frame interval', () => {
    expect(ABNORMAL_DELTA_MS).toBeGreaterThan(100);
    expect(ABNORMAL_DELTA_MS).toBeLessThan(2000);
  });
});

describe('hero-trades-ribbon — lerp et easeInOutSine', () => {
  it('3. lerp returns start at progress 0 and end at progress 1', () => {
    expect(lerp(10, 210, 0)).toBe(10);
    expect(lerp(10, 210, 1)).toBe(210);
  });

  it('4. lerp is exactly linear in between', () => {
    expect(lerp(0, 200, 0.5)).toBe(100);
  });

  it('5. easeInOutSine starts at 0 and ends at 1, exactly', () => {
    // -(Math.cos(0) - 1) / 2 evaluates to floating-point negative zero —
    // numerically identical to 0 (Object.is(-0, 0) is merely false), not a
    // real deviation, so compared with toBeCloseTo rather than toBe.
    expect(easeInOutSine(0)).toBeCloseTo(0, 10);
    expect(easeInOutSine(1)).toBeCloseTo(1, 10);
  });

  it('6. easeInOutSine is monotonically increasing across [0, 1] (no overshoot, no rebound)', () => {
    const samples = [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1];
    let previous = -1;
    for (const t of samples) {
      const value = easeInOutSine(t);
      expect(value).toBeGreaterThanOrEqual(previous);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
      previous = value;
    }
  });

  it('7. easeInOutSine is slower than linear near both ends (gentle acceleration/deceleration) and faster at the center', () => {
    expect(easeInOutSine(0.1)).toBeLessThan(0.1);
    expect(easeInOutSine(0.9)).toBeGreaterThan(0.9);
    // Around the midpoint, the eased curve is at its steepest — a small
    // step there covers more progress than the same step near an edge.
    const stepNearEdge = easeInOutSine(0.1) - easeInOutSine(0);
    const stepAtCenter = easeInOutSine(0.55) - easeInOutSine(0.45);
    expect(stepAtCenter).toBeGreaterThan(stepNearEdge);
  });

  it('8. easeInOutSine is symmetric around the midpoint (smooth, continuous direction change)', () => {
    expect(easeInOutSine(0.5)).toBeCloseTo(0.5, 10);
    expect(easeInOutSine(0.3)).toBeCloseTo(1 - easeInOutSine(0.7), 10);
  });
});

describe('hero-trades-ribbon — computeProportionalDuration', () => {
  it('9. a full-width leg gets exactly the full pass duration', () => {
    expect(computeProportionalDuration(0, 400, 400, 18000)).toBe(18000);
  });

  it('10. a partial leg gets a proportionally shorter duration (not a full 18s for a few pixels)', () => {
    // 40 out of 400px remaining = 10% of the distance -> 10% of the duration.
    expect(computeProportionalDuration(360, 400, 400, 18000)).toBeCloseTo(1800, 5);
  });

  it('11. duration is 0 when there is nothing to scroll', () => {
    expect(computeProportionalDuration(0, 0, 0, 18000)).toBe(0);
  });
});

describe('hero-trades-ribbon — computeLegProgress (bornage strict)', () => {
  const leg: RibbonLeg = { start: 0, end: 400, duration: 18000, startedAt: 1000 };

  it('12. progress is 0 at the exact start timestamp', () => {
    expect(computeLegProgress(leg, 1000)).toBe(0);
  });

  it('13. progress is exactly 1 once the full duration has elapsed', () => {
    expect(computeLegProgress(leg, 1000 + 18000)).toBe(1);
  });

  it('14. progress never exceeds 1 even with a timestamp far beyond the duration (no overshoot)', () => {
    expect(computeLegProgress(leg, 1000 + 999999)).toBe(1);
  });

  it('15. progress never goes below 0 for a timestamp before the leg started', () => {
    expect(computeLegProgress(leg, 500)).toBe(0);
  });

  it('16. progress is always confined to [0, 1] across a dense timestamp sweep', () => {
    for (let t = -5000; t <= 30000; t += 250) {
      const progress = computeLegProgress(leg, 1000 + t);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    }
  });
});

describe('hero-trades-ribbon — computeLegPosition (jamais de saut, jamais hors bornes)', () => {
  it('17. position lands exactly on `end` once progress reaches 1 (no overshoot past the boundary)', () => {
    const leg: RibbonLeg = { start: 0, end: 262, duration: 18000, startedAt: 0 };
    expect(computeLegPosition(leg, 1)).toBeCloseTo(262, 8);
  });

  it('18. position starts exactly at `start` at progress 0 (no jump on the very first tick)', () => {
    const leg: RibbonLeg = { start: 130, end: 262, duration: 9000, startedAt: 0 };
    expect(computeLegPosition(leg, 0)).toBe(130);
  });

  it('19. position stays within [start, end] for every progress in a dense sweep, in either direction', () => {
    const forward: RibbonLeg = { start: 0, end: 262, duration: 18000, startedAt: 0 };
    const backward: RibbonLeg = { start: 262, end: 0, duration: 18000, startedAt: 0 };
    for (let p = 0; p <= 1; p += 0.01) {
      const posForward = computeLegPosition(forward, p);
      expect(posForward).toBeGreaterThanOrEqual(0);
      expect(posForward).toBeLessThanOrEqual(262);
      const posBackward = computeLegPosition(backward, p);
      expect(posBackward).toBeGreaterThanOrEqual(0);
      expect(posBackward).toBeLessThanOrEqual(262);
    }
  });

  it('20. position is not a rounded/integer-only value (decimal precision preserved)', () => {
    const leg: RibbonLeg = { start: 0, end: 263, duration: 18000, startedAt: 0 };
    const position = computeLegPosition(leg, computeLegProgress(leg, 4137));
    expect(Number.isInteger(position)).toBe(false);
  });
});

describe('hero-trades-ribbon — nextFullLeg (continuité du changement de direction)', () => {
  it('21. the next leg starts exactly where the completed leg ended (no jump)', () => {
    const completed: RibbonLeg = { start: 0, end: 400, duration: 18000, startedAt: 0 };
    const next = nextFullLeg(completed, 400, 18000, 18000);
    expect(next.start).toBe(completed.end);
  });

  it('22. the next leg targets the opposite boundary', () => {
    const completedForward: RibbonLeg = { start: 0, end: 400, duration: 18000, startedAt: 0 };
    expect(nextFullLeg(completedForward, 400, 18000, 18000).end).toBe(0);

    const completedBackward: RibbonLeg = { start: 400, end: 0, duration: 18000, startedAt: 0 };
    expect(nextFullLeg(completedBackward, 400, 18000, 18000).end).toBe(400);
  });

  it('23. the next leg is a full pass (proportional duration = fullPassDurationMs for a full-width trip)', () => {
    const completed: RibbonLeg = { start: 0, end: 400, duration: 18000, startedAt: 0 };
    const next = nextFullLeg(completed, 400, 18000, 18000);
    expect(next.duration).toBe(18000);
  });

  it('24. the next leg starts its clock at the given timestamp', () => {
    const completed: RibbonLeg = { start: 0, end: 400, duration: 18000, startedAt: 0 };
    const next = nextFullLeg(completed, 400, 12345, 18000);
    expect(next.startedAt).toBe(12345);
  });
});

describe('hero-trades-ribbon — resumeLeg (reprise sans saut, durée proportionnelle)', () => {
  it('25. a resume leg starts from the exact current position, never a memorized/stale one', () => {
    const leg = resumeLeg(173.4, 400, 400, 5000, 18000);
    expect(leg.start).toBe(173.4);
  });

  it('26. a resume leg targets the same boundary it was already heading toward', () => {
    const leg = resumeLeg(173.4, 400, 400, 5000, 18000);
    expect(leg.end).toBe(400);
  });

  it('27. a resume leg duration is proportional to the remaining distance, never a full 18s for a few pixels', () => {
    // 30px remaining out of 300px total = 10% -> 10% of 18000ms.
    const leg = resumeLeg(270, 300, 300, 0, 18000);
    expect(leg.duration).toBeCloseTo(1800, 5);
  });

  it('28. a resume leg starting exactly at the boundary has zero duration (already arrived, no further motion)', () => {
    const leg = resumeLeg(400, 400, 400, 0, 18000);
    expect(leg.duration).toBe(0);
  });
});

describe('hero-trades-ribbon — simulation bout en bout (bornes, continuité, pas de téléportation)', () => {
  it('29. a simulated multi-second run at 60fps never leaves [0, maxScroll] and reverses smoothly at both ends', () => {
    const maxScroll = 262; // valeur mesurée à 390px lors du mini-sprint 3
    let leg: RibbonLeg = resumeLeg(0, maxScroll, maxScroll, 0, RIBBON_PASS_DURATION_MS);
    let direction: 1 | -1 = 1;
    let reachedMax = false;
    let reachedZero = false;

    const frameMs = 1000 / 60;
    const totalFrames = Math.ceil((RIBBON_PASS_DURATION_MS * 2.5) / frameMs);

    for (let i = 1; i <= totalFrames; i++) {
      const timestamp = i * frameMs;
      const progress = computeLegProgress(leg, timestamp);
      const position = computeLegPosition(leg, progress);

      expect(position).toBeGreaterThanOrEqual(-1e-6);
      expect(position).toBeLessThanOrEqual(maxScroll + 1e-6);

      if (progress >= 1) {
        if (leg.end >= maxScroll) reachedMax = true;
        else reachedZero = true;
        direction = direction === 1 ? -1 : 1;
        leg = nextFullLeg(leg, maxScroll, timestamp, RIBBON_PASS_DURATION_MS);
      }
    }

    expect(reachedMax).toBe(true);
    expect(reachedZero).toBe(true);
  });

  it('30. a resume mid-leg (simulating a viewport re-entry) continues toward the same target without exceeding bounds', () => {
    const maxScroll = 262;
    // Simulates: the ribbon was 40% of the way through a forward leg when
    // it left the viewport (paused), then re-entered — resume from the
    // real displayed position, not from 0.
    const inFlightLeg: RibbonLeg = {
      start: 0,
      end: maxScroll,
      duration: RIBBON_PASS_DURATION_MS,
      startedAt: 0,
    };
    const pausedAtProgress = computeLegProgress(inFlightLeg, RIBBON_PASS_DURATION_MS * 0.4);
    const pausedAtPosition = computeLegPosition(inFlightLeg, pausedAtProgress);

    const resumed = resumeLeg(
      pausedAtPosition,
      maxScroll,
      maxScroll,
      99999,
      RIBBON_PASS_DURATION_MS,
    );

    expect(resumed.start).toBeCloseTo(pausedAtPosition, 8);
    // Remaining ~60% of the distance -> roughly 60% of the full duration,
    // not a fresh full 18s pass.
    expect(resumed.duration).toBeLessThan(RIBBON_PASS_DURATION_MS);
    expect(resumed.duration).toBeGreaterThan(RIBBON_PASS_DURATION_MS * 0.5);

    const finalPosition = computeLegPosition(resumed, 1);
    expect(finalPosition).toBeCloseTo(maxScroll, 8);
  });
});
