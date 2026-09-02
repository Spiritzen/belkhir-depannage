import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import IndexPage from '../src/pages/index.astro';
import { services } from '../src/data/landing';

// Tests couvrant le mini-sprint 3 « ruban horizontal métiers mobile »
// (02/09/2026, PROMPT_CLAUDE_CODE_MINI_SPRINT_3_RUBAN_HORIZONTAL_METIERS_
// MOBILE(1).txt) : le ruban mobile des métiers et le masquage de l'accroche
// orange redondante, tous deux limités au breakpoint mobile existant, sans
// régression sur desktop/tablette large.

const EXPECTED_TRADE_ORDER = [
  'plomberie',
  'chauffage',
  'serrurerie',
  'vitrerie',
  'rideaux-metalliques',
];

let pageHtml = '';
let heroHtml = '';
let heroSource = '';
let scriptSource = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });
  heroHtml = pageHtml.match(/<section class="hero"[\s\S]*?<\/section>/)?.[0] ?? '';

  heroSource = readFileSync(
    fileURLToPath(new URL('../src/components/landing/Hero.astro', import.meta.url)),
    'utf-8',
  );
  scriptSource = readFileSync(
    fileURLToPath(new URL('../src/scripts/hero-trades-ribbon.ts', import.meta.url)),
    'utf-8',
  );
}, 30000);

describe('ruban métiers — libellés, ordre et destinations préservés', () => {
  it('1. exactly one interactive link per trade exists (no clone, no duplication)', () => {
    const tradeLinks = Array.from(heroHtml.matchAll(/<a\s[^>]*class="hero__trade"[^>]*>/g));
    expect(tradeLinks).toHaveLength(EXPECTED_TRADE_ORDER.length);
  });

  it('2. the trade order in the DOM matches the existing expected order exactly', () => {
    const anchors = Array.from(heroHtml.matchAll(/class="hero__trade"[^>]*href="#([^"]+)"/g)).map(
      (m) => m[1],
    );
    // Attribute order can vary; capture hrefs independently of that.
    const hrefsInOrder = Array.from(
      heroHtml.matchAll(/<a\s[^>]*href="#([^"]+)"[^>]*class="hero__trade"[^>]*>/g),
    ).map((m) => m[1]);
    const combined = anchors.length > 0 ? anchors : hrefsInOrder;
    expect(combined.length).toBe(EXPECTED_TRADE_ORDER.length);

    const expectedAnchors = EXPECTED_TRADE_ORDER.map(
      (id) => services.find((s) => s.id === id)?.anchor,
    );
    expect(combined).toEqual(expectedAnchors);
  });

  it('3. every trade href still targets its real, existing accordion anchor (no new route, no dead link)', () => {
    for (const id of EXPECTED_TRADE_ORDER) {
      const service = services.find((s) => s.id === id);
      expect(service).toBeDefined();
      expect(heroHtml).toContain(`href="#${service!.anchor}"`);
      expect(pageHtml).toContain(`id="${service!.anchor}"`);
    }
  });

  it('4. no href="#" and no javascript: pseudo-link was introduced', () => {
    expect(heroHtml).not.toMatch(/class="hero__trade"[^>]*href="#"/);
    expect(heroHtml).not.toContain('javascript:');
  });
});

describe('ruban métiers — structure sémantique et accessibilité', () => {
  it('5. the trades remain inside a single <nav> with an accessible label, exactly as before', () => {
    expect(heroHtml).toMatch(/<nav class="hero__trades" aria-label="Métiers pris en charge"/);
    const navCount = (heroHtml.match(/<nav class="hero__trades"/g) ?? []).length;
    expect(navCount).toBe(1);
  });

  it('6. no aria-hidden clone of the trade links was introduced (no decorative duplicate list)', () => {
    // Checked against the RENDERED markup (real `>` delimiters between every
    // tag) rather than the raw .astro source: since mini-sprint 4, a source
    // comment elsewhere in the file legitimately contains the literal string
    // `aria-hidden="true"` without an intervening `>` before the next
    // `.hero__trade` CSS selector further down, which made a source-text
    // regex match across unrelated prose instead of real markup.
    expect(heroHtml).not.toMatch(/aria-hidden="true"[^>]*hero__trade/);
    expect(heroHtml).not.toMatch(/hero__trade[^>]*aria-hidden="true"/);
    // Nothing in the template maps heroTrades more than once.
    const mapCalls = (heroSource.match(/heroTrades\.map/g) ?? []).length;
    expect(mapCalls).toBe(1);
  });

  it('7. focus-visible styling is not suppressed for the trade links (reuses the global focus ring)', () => {
    expect(heroSource).not.toMatch(/\.hero__trade:focus-visible\s*{\s*outline:\s*none/);
  });
});

describe('accroche orange — masquage limité au mobile, conservation desktop', () => {
  it('8. the eyebrow markup and its text are still rendered in the HTML (present in the DOM for desktop)', () => {
    expect(heroHtml).toContain('class="hero__eyebrow"');
    expect(heroHtml).toContain('DÉPANNAGE D’URGENCE');
  });

  it('9. the eyebrow is hidden only inside the existing mobile breakpoint, not globally', () => {
    const baseRule = heroSource.match(/\.hero__eyebrow\s*{[^}]*}/)?.[0] ?? '';
    expect(baseRule).not.toContain('display: none');

    const mobileBlock = heroSource.match(
      /@media \(max-width: 47\.9375rem\) {([\s\S]*?)\n {2}}\n\n {2}\.hero__title/,
    )?.[1];
    expect(mobileBlock).toBeDefined();
    expect(mobileBlock).toMatch(/\.hero__eyebrow\s*{\s*display:\s*none;\s*}/);
  });

  it('10. removing the eyebrow row also collapses the mobile grid to 2 rows, avoiding a leftover empty track', () => {
    const mobileBlock = heroSource.match(
      /@media \(max-width: 47\.9375rem\) {([\s\S]*?)\n {2}}\n\n {2}\.hero__title/,
    )?.[1];
    expect(mobileBlock).toMatch(
      /\.hero__container\s*{\s*grid-template-rows:\s*auto minmax\(0, 1fr\);\s*}/,
    );
  });

  it('11. the equivalent information stays available in the top availability bar (not removed elsewhere)', () => {
    // AvailabilityBar.astro carries the same "24h/24 · 7j/7" promise —
    // untouched by this mini-sprint (out of scope, verified unchanged).
    const availabilityBarSource = readFileSync(
      fileURLToPath(new URL('../src/components/layout/AvailabilityBar.astro', import.meta.url)),
      'utf-8',
    );
    expect(availabilityBarSource).toContain('Dépannage d’urgence 24h/24 · 7j/7');
  });

  it('12. desktop/tablet grid-template-rows (3 rows, base rule) is untouched', () => {
    const baseContainerRule = heroSource.match(/\.hero__container\s*{[^}]*}/)?.[0] ?? '';
    expect(baseContainerRule).toContain('grid-template-rows: auto auto minmax(0, 1fr)');
  });
});

describe('ruban métiers — comportement responsive limité au mobile', () => {
  it('13. the flex/horizontal-scroll ribbon layout is scoped to the existing mobile breakpoint only', () => {
    const mobileBlock = heroSource.match(
      /@media \(max-width: 47\.9375rem\) {([\s\S]*?)\n {2}}\n\n {2}\.hero__title/,
    )?.[1];
    expect(mobileBlock).toMatch(/\.hero__trades\s*{[^}]*display:\s*flex/);
    expect(mobileBlock).toMatch(/\.hero__trade\s*{[^}]*flex:\s*0 0 auto/);
  });

  it('14. the desktop grid (5-column) base rule for .hero__trades is untouched', () => {
    const baseRule = heroSource.match(/\.hero__trades\s*{[^}]*}/)?.[0] ?? '';
    expect(baseRule).toContain('display: grid');
    expect(baseRule).toContain('grid-template-columns: repeat(5, minmax(0, 1fr))');
  });

  it('15. no new breakpoint was invented — only the existing 47.9375rem query gained new rules', () => {
    const mediaQueries = heroSource.match(/@media \([^)]+\)/g) ?? [];
    const uniqueQueries = new Set(mediaQueries);
    expect(uniqueQueries.has('@media (max-width: 47.9375rem)')).toBe(true);
    // The full set of breakpoints used in this file must be exactly the
    // ones already present before this mini-sprint, PLUS the single new
    // desktop-restoration query added by mini-sprint 4 (min-width: 48rem —
    // the exact, non-overlapping complement of the existing 47.9375rem
    // mobile breakpoint, used only to restore CTA/Google-proof visual order
    // via `order` on desktop/tablet large — see hero-hierarchie-mobile.test.ts).
    const allowed = new Set([
      '@media (prefers-reduced-motion: reduce)',
      '@media (max-width: 63.9375rem)',
      '@media (max-width: 47.9375rem)',
      '@media (min-width: 48rem)',
      '@media (max-width: 64rem)',
      '@media (max-width: 56rem)',
      '@media (max-width: 30rem)',
      '@media (max-width: 40rem)',
      '@media (max-width: 23rem)',
    ]);
    for (const query of uniqueQueries) {
      expect(allowed.has(query), `unexpected new breakpoint: ${query}`).toBe(true);
    }
  });
});

describe('ruban métiers — script : arrêt définitif, pause hors viewport, reduced motion', () => {
  it('16. the component script gates the automatic scroll on prefers-reduced-motion', () => {
    expect(heroSource).toMatch(/prefers-reduced-motion: reduce/);
    expect(heroSource).toMatch(/reducedMotionQuery\.matches/);
  });

  it('17. the component script only animates while the existing mobile breakpoint matches', () => {
    expect(heroSource).toContain('window.matchMedia(MOBILE_QUERY)');
    expect(heroSource).toContain('mobileQuery.matches');
  });

  it('18. a permanent stop flag exists and gates every restart path (viewport re-entry, breakpoint change)', () => {
    expect(heroSource).toContain('hasInteracted');
    expect(heroSource).toMatch(/function shouldAnimate\(\)[\s\S]*!hasInteracted/);
  });

  it('19. the stop is wired to real interaction origins (pointer, touch, wheel, keyboard focus), not the ambiguous native "scroll" event', () => {
    expect(heroSource).toMatch(/addEventListener\('pointerdown', stopForever/);
    expect(heroSource).toMatch(/addEventListener\('touchstart', stopForever/);
    expect(heroSource).toMatch(/addEventListener\('wheel', stopForever/);
    expect(heroSource).toMatch(/addEventListener\('focusin'/);
    expect(heroSource).not.toMatch(/addEventListener\('scroll'/);
  });

  it('20. IntersectionObserver pauses the animation outside the viewport, with a reasonable fallback', () => {
    expect(heroSource).toContain("'IntersectionObserver' in window");
    expect(heroSource).toContain('observer.observe(heroSection)');
  });

  it('21. no external carousel dependency was imported (native scroll + minimal TS only)', () => {
    const importLines = heroSource.match(/^import .+$/gm) ?? [];
    for (const line of importLines) {
      expect(line).not.toMatch(/from ['"](?!\.\.\/|astro:)/);
    }
  });

  it('22. the ribbon speed/duration is centralized in one named constant, not scattered magic numbers', () => {
    expect(scriptSource).toMatch(/export const RIBBON_PASS_DURATION_MS/);
    // Hero.astro imports the constant rather than redefining its own value.
    expect(heroSource).toContain('RIBBON_PASS_DURATION_MS');
    expect(heroSource).not.toMatch(/const RIBBON_PASS_DURATION_MS\s*=/);
  });
});

describe('non-régression — numéro d’urgence et reste du Hero', () => {
  it('23. the emergency phone link is untouched by this mini-sprint (still absent from the Hero, present in the navbar)', () => {
    expect(heroHtml).not.toContain('tel:+33649621619');
    const telLinks = pageHtml.match(/href="tel:\+33649621619"/g) ?? [];
    expect(telLinks).toHaveLength(4);
  });

  it('24. the H1 wording is untouched', () => {
    expect(heroHtml).toContain('Dépannage d’urgence');
    expect(heroHtml).toContain('Hauts-de-France');
  });

  it('25. the Google trust badge is still present, unrelated to this mini-sprint', () => {
    expect(heroHtml).toContain('hero__google-proof');
    expect(heroHtml).toContain('4,7/5');
  });
});

describe('ruban métiers — correction de fluidité (02/09/2026) : timestamp-driven, décimal, sans saut', () => {
  it('26. Hero.astro imports the new leg-based primitives and does not hardcode a rival duration', () => {
    expect(heroSource).toContain('computeLegPosition');
    expect(heroSource).toContain('computeLegProgress');
    expect(heroSource).toContain('resumeLeg');
    expect(heroSource).toContain('nextFullLeg');
    expect(heroSource).toContain('RIBBON_PASS_DURATION_MS');
    expect(heroSource).not.toMatch(/const RIBBON_PASS_DURATION_MS\s*=/);
    // The old delta-accumulation helpers must be fully retired, not left
    // dangling as dead imports alongside the new ones.
    expect(heroSource).not.toContain('computeNextRibbonState');
    expect(heroSource).not.toContain('computeRibbonSpeed');
  });

  it('27. the component tick() never rounds the interpolated position (decimal precision reaches scrollLeft untouched)', () => {
    const tickFn = heroSource.match(/function tick\([\s\S]*?\n {4}}/)?.[0] ?? '';
    expect(tickFn.length).toBeGreaterThan(0);
    expect(tickFn).not.toMatch(/Math\.round|Math\.floor|Math\.trunc|parseInt/);
    expect(tickFn).toContain('ribbonEl.scrollLeft = computeLegPosition(leg, rawProgress)');
  });

  it('28. progress is computed from the rAF timestamp via computeLegProgress, not from a per-frame pixel increment', () => {
    expect(heroSource).toContain('computeLegProgress(leg, timestamp)');
    // The retired per-frame increment pattern ("position += ...") must be gone.
    expect(heroSource).not.toMatch(/position\s*\+=/);
  });

  it('29. an abnormally large frame delta (suspended tab) rebases the leg instead of letting progress jump straight to 1', () => {
    expect(heroSource).toContain('ABNORMAL_DELTA_MS');
    expect(heroSource).toMatch(/timestamp - lastTickTimestamp > ABNORMAL_DELTA_MS/);
  });

  it('30. resuming (startFrame) always clears the current leg, forcing the next tick to rebase from the real displayed position', () => {
    const startFrameFn = heroSource.match(/function startFrame\(\)[\s\S]*?\n {4}}/)?.[0] ?? '';
    expect(startFrameFn).toContain('leg = null');
  });

  it('31. the source module documents the validated 18000ms target and the abnormal-delta safeguard', () => {
    expect(scriptSource).toContain('RIBBON_PASS_DURATION_MS = 18000');
    expect(scriptSource).toMatch(/ABNORMAL_DELTA_MS\s*=\s*500/);
  });

  it('32. easeInOutSine and lerp are both exported and used by the leg position computation', () => {
    expect(scriptSource).toMatch(/export const easeInOutSine/);
    expect(scriptSource).toMatch(/export const lerp/);
    expect(scriptSource).toMatch(
      /computeLegPosition[\s\S]*?lerp\(leg\.start, leg\.end, easeInOutSine\(rawProgress\)\)/,
    );
  });
});
