import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import IndexPage from '../src/pages/index.astro';

// Tests couvrant la micro-correction « luminosité directionnelle du Hero
// mobile » (02/09/2026, PROMPT_CLAUDE_CODE_MICRO_CORRECTION_LUMINOSITE_HERO_
// MOBILE.txt) : overlay mobile redistribué en 4 couches directionnelles,
// strictement scopé au breakpoint mobile existant, sans toucher au fichier
// image, au cadrage, au desktop ni à la structure du Hero validée au
// mini-sprint 4. Les mesures de contraste réelles (échantillonnage de pixels
// rendus) et les captures avant/après sont documentées dans le rapport de
// mission — ce fichier couvre la présence/absence des bonnes règles CSS et
// la non-régression structurelle.

let heroSource = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });

  heroSource = readFileSync(
    fileURLToPath(new URL('../src/components/landing/Hero.astro', import.meta.url)),
    'utf-8',
  );
}, 30000);

describe('overlay mobile — nouvelle redistribution directionnelle, scopée au breakpoint existant', () => {
  it('1. the mobile block gains a dedicated .hero__overlay override with 4 layered gradients', () => {
    const mobileBlock = heroSource.match(
      /@media \(max-width: 47\.9375rem\) {([\s\S]*?)\n {2}}\n\n {2}\.hero__title/,
    )?.[1];
    expect(mobileBlock).toBeDefined();
    const overlayRule = mobileBlock!.match(/\.hero__overlay\s*{[^}]*}/)?.[0];
    expect(overlayRule).toBeDefined();
    // 4 comma-separated background layers (top-level commas only — the
    // gradients' own internal commas are inside parentheses, not split).
    const backgroundValue = overlayRule!.match(/background:\s*([\s\S]*?);\s*}/)?.[1] ?? '';
    let depth = 0;
    let topLevelLayers = 1;
    for (const ch of backgroundValue) {
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (ch === ',' && depth === 0) topLevelLayers++;
    }
    expect(topLevelLayers).toBe(4);
  });

  it('2. no new opacity value in the mobile overlay exceeds the original desktop-inherited peak (0.92) — a genuine lightening, not a darkening', () => {
    const mobileBlock = heroSource.match(
      /@media \(max-width: 47\.9375rem\) {([\s\S]*?)\n {2}}\n\n {2}\.hero__title/,
    )?.[1];
    const overlayRule = mobileBlock!.match(/\.hero__overlay\s*{[^}]*}/)?.[0] ?? '';
    const alphas = Array.from(overlayRule.matchAll(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/g)).map(
      (m) => Number(m[1]),
    );
    expect(alphas.length).toBeGreaterThan(0);
    for (const alpha of alphas) {
      expect(alpha).toBeLessThanOrEqual(0.92);
    }
  });

  it('3. the horizontal reveal layer fades to fully transparent before the right edge, leaving the technician zone unreinforced', () => {
    const mobileBlock = heroSource.match(
      /@media \(max-width: 47\.9375rem\) {([\s\S]*?)\n {2}}\n\n {2}\.hero__title/,
    )?.[1];
    const overlayRule = mobileBlock!.match(/\.hero__overlay\s*{[^}]*}/)?.[0] ?? '';
    expect(overlayRule).toContain('90deg');
    expect(overlayRule).toMatch(/90deg,[\s\S]*?transparent 58%/);
  });

  it('4. no forbidden technique was introduced (no mix-blend-mode, no brightness/HDR filter, no animation on the overlay)', () => {
    const mobileBlock = heroSource.match(
      /@media \(max-width: 47\.9375rem\) {([\s\S]*?)\n {2}}\n\n {2}\.hero__title/,
    )?.[1];
    const overlayRule = mobileBlock!.match(/\.hero__overlay\s*{[^}]*}/)?.[0] ?? '';
    expect(overlayRule).not.toMatch(/mix-blend-mode/);
    expect(overlayRule).not.toMatch(/brightness\(/);
    expect(overlayRule).not.toMatch(/animation/);
    expect(heroSource).not.toMatch(/\.hero__bg\s*{[^}]*filter:\s*brightness/);
  });

  it('5. the existing orange radial accent is reused verbatim (same position, same color, same stops) — no new halo added', () => {
    const mobileBlock = heroSource.match(
      /@media \(max-width: 47\.9375rem\) {([\s\S]*?)\n {2}}\n\n {2}\.hero__title/,
    )?.[1];
    const overlayRule = mobileBlock!.match(/\.hero__overlay\s*{[^}]*}/)?.[0] ?? '';
    expect(overlayRule).toContain('radial-gradient(60% 55% at 78% 8%, rgba(255, 105, 0, 0.35)');
    // Exactly one radial-gradient in the mobile override (no second glow).
    const radialCount = (overlayRule.match(/radial-gradient\(/g) ?? []).length;
    expect(radialCount).toBe(1);
  });
});

describe('overlay desktop — conservation stricte, aucune fuite du mobile', () => {
  it('6. the base (desktop) .hero__overlay rule is byte-identical to before this mission', () => {
    const baseRule = heroSource.match(/\n {2}\.hero__overlay\s*{[^}]*}/)?.[0] ?? '';
    expect(baseRule).toContain(
      'linear-gradient(\n        0deg,\n        rgba(9, 10, 14, 0.92) 0%,\n        rgba(9, 10, 14, 0.72) 42%,\n        rgba(9, 10, 14, 0.35) 100%\n      ),\n      radial-gradient(60% 55% at 78% 8%, rgba(255, 105, 0, 0.35), transparent 70%);',
    );
  });

  it('7. no `order`-style leak: the mobile-only overlay override lives strictly inside the existing 47.9375rem query, not outside it', () => {
    const outsideMobileBlock = heroSource
      .split('@media (max-width: 47.9375rem) {')[0]
      .concat(heroSource.split(/\n {2}}\n\n {2}\.hero__title/)[1] ?? '');
    // The reveal-specific 90deg horizontal layer must not appear outside
    // the mobile block.
    expect(outsideMobileBlock).not.toMatch(/linear-gradient\(90deg, rgba\(9, 10, 14, 0\.22\)/);
  });
});

describe('non-régression — image source, cadrage et structure du Hero (mini-sprint 4) inchangés', () => {
  it('8. no change to the image source files or their import paths', () => {
    expect(heroSource).toContain(
      "import heroImg from '../../assets/legacy/hero-intervention-urgence.jpg';",
    );
    expect(heroSource).toContain(
      "import heroMobileImg from '../../assets/hero/hero-mobile-technicien-arrivee-belkhir.png';",
    );
  });

  it('9. the mobile object-position (cadrage) is untouched by this mission', () => {
    const mobileBlock = heroSource.match(
      /@media \(max-width: 47\.9375rem\) {([\s\S]*?)\n {2}}\n\n {2}\.hero__title/,
    )?.[1];
    expect(mobileBlock).toMatch(/\.hero__bg\s*{\s*object-position:\s*75% 22%;\s*}/);
  });

  it('10. the desktop base object-position is untouched', () => {
    const baseRule = heroSource.match(/\.hero__bg\s*{[^}]*}/)?.[0] ?? '';
    expect(baseRule).toContain('object-position: center 38%');
  });

  it('11. no Astro/Vite config file was touched, no new dependency was imported', () => {
    const importLines = heroSource.match(/^import .+$/gm) ?? [];
    for (const line of importLines) {
      expect(line).not.toMatch(/from ['"](?!\.\.\/|astro:)/);
    }
  });

  it('12. the mobile min-height (bar-protection, mini-sprint 4) calc is untouched — no Hero height change', () => {
    const mobileBlock = heroSource.match(
      /@media \(max-width: 47\.9375rem\) {([\s\S]*?)\n {2}}\n\n {2}\.hero__title/,
    )?.[1];
    expect(mobileBlock).toMatch(
      /min-height:\s*calc\(\s*100vh[\s\S]*?var\(--mobile-callbar-height\)/,
    );
    expect(mobileBlock).toMatch(
      /min-height:\s*calc\(\s*100svh[\s\S]*?var\(--mobile-callbar-height\)/,
    );
  });

  it('13. the H1, short description and Google/CTA structure from mini-sprint 4 are all still present, unchanged', () => {
    expect(heroSource).toContain('Fuite, panne de chauffage, porte bloquée ou vitre cassée');
    expect(heroSource).toContain('class="hero__lead hero__lead--full"');
    expect(heroSource).toContain('class="hero__lead hero__lead--short"');
    expect(heroSource).toContain('align-self: start');
    expect(heroSource).toContain('order: 0');
    expect(heroSource).toContain('order: 1');
  });
});
