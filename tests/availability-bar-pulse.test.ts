import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import AvailabilityBar from '../src/components/layout/AvailabilityBar.astro';

// Tests couvrant la micro-animation « pulsation du point de disponibilité »
// (02/09/2026, PROMPT_CLAUDE_CODE_MICRO_ANIMATION_POINT_DISPONIBILITE.txt) :
// halo CSS pur en `::after` sur `.availability-bar__dot`, cycle ~1s,
// désactivé sous prefers-reduced-motion, aucun JavaScript, aucune
// régression sur le texte ou la structure de la barre. Les mesures réelles
// (position figée du point sur 13 frames, dérive sur 12 cycles consécutifs,
// captures) sont documentées dans le rapport de mission — ce fichier
// couvre la présence/absence des bonnes règles CSS et la non-régression
// structurelle.

let html = '';
let source = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  html = await container.renderToString(AvailabilityBar, {
    request: new Request('http://localhost/'),
  });

  source = readFileSync(
    fileURLToPath(new URL('../src/components/layout/AvailabilityBar.astro', import.meta.url)),
    'utf-8',
  );
}, 30000);

describe('halo de pulsation — présence, cible et propriétés CSS', () => {
  it('1. an animation named availability-pulse is applied to .hero__dot::after, not to the dot itself', () => {
    const afterRule = source.match(/\.availability-bar__dot::after\s*{[^}]*}/)?.[0] ?? '';
    expect(afterRule).toMatch(/animation:\s*availability-pulse/);
    const dotRule = source.match(/\.availability-bar__dot\s*{[^}]*}/)?.[0] ?? '';
    expect(dotRule).not.toMatch(/animation/);
  });

  it('2. the animation duration is exactly 1s, repeating indefinitely, with an eased-impulse curve', () => {
    const afterRule = source.match(/\.availability-bar__dot::after\s*{[^}]*}/)?.[0] ?? '';
    expect(afterRule).toMatch(
      /animation:\s*availability-pulse\s+1s\s+cubic-bezier\(0\.2, 0\.7, 0\.2, 1\)\s+infinite/,
    );
  });

  it('3. a @keyframes availability-pulse block exists with a franc start, a moderated peak (~24-29px halo) and a final fully-transparent state', () => {
    const keyframes = source.match(/@keyframes availability-pulse\s*{[\s\S]*?\n {2}}/)?.[0] ?? '';
    expect(keyframes).toBeTruthy();
    expect(keyframes).toMatch(/0%\s*{/);
    expect(keyframes).toMatch(/100%\s*{[^}]*opacity:\s*0;/);
    // Correction chirurgicale (02/09/2026, message de suivi du prompt
    // PROMPT_CLAUDE_CODE_CORRECTION_PULSATION_VISIBLE_POINT_DISPONIBILITE.txt):
    // compromis entre l'original imperceptible (18,7px) et le renforcement
    // excessif (34,5px) — départ franc (>=0.7) et halo final ~26,6px pour
    // le point de 7,1875px mesuré (scale(3.7)).
    const startOpacity = Number(keyframes.match(/0%\s*{[^}]*opacity:\s*([\d.]+);/)?.[1]);
    expect(startOpacity).toBeGreaterThanOrEqual(0.7);
    const scales = Array.from(keyframes.matchAll(/scale\(([\d.]+)\)/g)).map((m) => Number(m[1]));
    expect(scales.length).toBeGreaterThan(0);
    const maxScale = Math.max(...scales);
    const dotDiameterPx = 7.1875; // mesuré en navigateur (0.45rem à 16px racine).
    const haloDiameterPx = maxScale * dotDiameterPx;
    expect(haloDiameterPx).toBeGreaterThanOrEqual(24);
    expect(haloDiameterPx).toBeLessThanOrEqual(29);
  });

  it('4. the halo is non-interactive (pointer-events: none) and purely visual', () => {
    const afterRule = source.match(/\.availability-bar__dot::after\s*{[^}]*}/)?.[0] ?? '';
    expect(afterRule).toContain('pointer-events: none');
  });

  it('5. the halo uses the existing orange brand token, no new color introduced', () => {
    const afterRule = source.match(/\.availability-bar__dot::after\s*{[^}]*}/)?.[0] ?? '';
    expect(afterRule).toContain('background: var(--color-orange-500)');
    // No hardcoded red color value anywhere in the component (explicitly
    // forbidden) — matched as a CSS color keyword/hex, not as a substring
    // (French words like "réduite" or "prefers-reduced-motion" contain
    // "red" without meaning the color).
    expect(source).not.toMatch(/:\s*#f00\b/i);
    expect(source).not.toMatch(/:\s*red\b/i);
    expect(source).not.toMatch(/rgb\(2[0-5][0-9],\s*0,\s*0\)/);
  });

  it('6. the dot gets position: relative to host the halo, without changing its own box (no top/left/right/bottom offset)', () => {
    const dotRule = source.match(/\.availability-bar__dot\s*{[^}]*}/)?.[0] ?? '';
    expect(dotRule).toContain('position: relative');
    expect(dotRule).not.toMatch(
      /\btop:|(?<!padding-|margin-)\bleft:|(?<!padding-|margin-)\bright:|\bbottom:/,
    );
  });
});

describe('prefers-reduced-motion — désactivation stricte', () => {
  it('7. a prefers-reduced-motion: reduce block disables the animation entirely and keeps the halo invisible', () => {
    const reducedBlock = source.match(
      /@media \(prefers-reduced-motion: reduce\)\s*{([\s\S]*?)\n {2}}/,
    )?.[1];
    expect(reducedBlock).toBeDefined();
    expect(reducedBlock).toMatch(
      /\.availability-bar__dot::after\s*{\s*animation:\s*none;\s*opacity:\s*0;\s*}/,
    );
  });

  it('8. the reduced-motion override never introduces a blink/flicker (no opacity toggling animation left active)', () => {
    const reducedBlock = source.match(
      /@media \(prefers-reduced-motion: reduce\)\s*{([\s\S]*?)\n {2}}/,
    )?.[1];
    // The animation NAME itself must be gone (not merely re-declared with
    // "none" alongside a leftover reference) — a robust check independent
    // of whitespace backtracking around the property value.
    expect(reducedBlock).not.toContain('availability-pulse');
  });
});

describe('non-régression — aucun JavaScript, texte et structure de la barre conservés', () => {
  it('9. no <script> tag and no JS-driven animation primitive was introduced', () => {
    expect(source).not.toMatch(/<script/);
    expect(source).not.toMatch(/setInterval|requestAnimationFrame|setTimeout/);
  });

  it('10. the availability text is rendered exactly once, unchanged', () => {
    expect(html).toContain('Dépannage d’urgence 24h/24 · 7j/7');
    const occurrences = (html.match(/Dépannage d’urgence 24h\/24 · 7j\/7/g) ?? []).length;
    expect(occurrences).toBe(1);
  });

  it('11. the dot stays aria-hidden and non-focusable (no new interactive element, no ARIA added)', () => {
    const dotMarkup = html.match(/<span class="availability-bar__dot"[^>]*>/)?.[0] ?? '';
    expect(dotMarkup).toContain('aria-hidden="true"');
    expect(dotMarkup).not.toMatch(/tabindex|role=|aria-live/);
  });

  it('12. the new label wrapper preserves truncation behavior (functional, not decorative) and does not duplicate the text', () => {
    const labelRule = source.match(/\.availability-bar__label\s*{[^}]*}/)?.[0] ?? '';
    expect(labelRule).toContain('overflow: hidden');
    expect(labelRule).toContain('text-overflow: ellipsis');
    expect(labelRule).toContain('white-space: nowrap');
    const labelSpans = html.match(/<span class="availability-bar__label"[^>]*>/g) ?? [];
    expect(labelSpans).toHaveLength(1);
  });

  it('13. the region item keeps its own truncation behavior directly (no wrapper needed, no dot there)', () => {
    const regionRule = source.match(/\.availability-bar__region\s*{[^}]*}/)?.[0] ?? '';
    expect(regionRule).toContain('overflow: hidden');
    expect(regionRule).toContain('text-overflow: ellipsis');
  });

  it('14. the dot dimensions, bar structure and region text are all untouched', () => {
    const dotRule = source.match(/\.availability-bar__dot\s*{[^}]*}/)?.[0] ?? '';
    expect(dotRule).toContain('width: 0.45rem');
    expect(dotRule).toContain('height: 0.45rem');
    expect(dotRule).toContain('border-radius: 50%');
    expect(html).toContain('availability-bar__region');
  });

  it('15. no new dependency, no Astro/Vite config touched (import list unchanged)', () => {
    const importLines = source.match(/^import .+$/gm) ?? [];
    expect(importLines).toEqual(["import { siteConfig } from '../../lib/site-config';"]);
  });
});
