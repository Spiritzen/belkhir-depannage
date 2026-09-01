import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import IndexPage from '../src/pages/index.astro';

// Tests couvrant le sprint « verrouillage des couleurs en mode sombre mobile »
// (01/09/2026, PROMPT_CLAUDE_CODE_SPRINT_VERROUILLAGE_COULEURS_MODE_SOMBRE_MOBILE.txt) :
// la maquette ne doit jamais être recolorée par l'auto-darkening système de
// Chrome Android, Safari iOS ou Firefox mobile.

let pageHtml = '';
let tokensSource = '';
let globalSource = '';
let baseLayoutSource = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });

  tokensSource = readFileSync(
    fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url)),
    'utf-8',
  );
  globalSource = readFileSync(
    fileURLToPath(new URL('../src/styles/global.css', import.meta.url)),
    'utf-8',
  );
  baseLayoutSource = readFileSync(
    fileURLToPath(new URL('../src/layouts/BaseLayout.astro', import.meta.url)),
    'utf-8',
  );
}, 30000);

describe('verrouillage color-scheme — CSS', () => {
  it('1. :root declares color-scheme: only light (tolerant to minifier reordering to "light only")', () => {
    const rootRule = tokensSource.match(/:root\s*{[^}]*}/s)?.[0] ?? '';
    // La déclaration source doit être "only light" ; en production, un
    // minifieur CSS peut légalement la réordonner en "light only" (les deux
    // syntaxes sont strictement équivalentes selon la spécification
    // CSS Color Adjustment) — le test accepte donc les deux ordres.
    expect(rootRule).toMatch(/color-scheme:\s*(only light|light only)\s*;/);
  });

  it('2. no contradictory "light dark" or standalone "dark" color-scheme value exists', () => {
    expect(tokensSource).not.toMatch(/color-scheme:\s*light dark/);
    expect(tokensSource).not.toMatch(/color-scheme:\s*dark\s*;/);
    expect(globalSource).not.toMatch(/color-scheme:/);
  });

  it('3. no @media (prefers-color-scheme: dark) rule exists anywhere in the global stylesheets', () => {
    expect(tokensSource).not.toMatch(/prefers-color-scheme:\s*dark/);
    expect(globalSource).not.toMatch(/prefers-color-scheme:\s*dark/);
  });

  it('4. forced-color-adjust: none is never applied globally', () => {
    expect(tokensSource).not.toContain('forced-color-adjust');
    expect(globalSource).not.toContain('forced-color-adjust');
  });

  it('5. prefers-reduced-motion safety net is untouched (accessibility preserved)', () => {
    expect(globalSource).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('6. html has explicit background-color and color reusing existing tokens, not a new literal color', () => {
    const htmlRule = globalSource.match(/(?<!:root,\s*)html\s*{[^}]*}/s)?.[0] ?? '';
    expect(htmlRule).toContain('background-color: var(--color-bg)');
    expect(htmlRule).toContain('color: var(--color-text)');
  });
});

describe('verrouillage color-scheme — <head> HTML', () => {
  it('7. BaseLayout source declares the three meta tags with exact, non-contradictory values', () => {
    expect(baseLayoutSource).toContain('<meta name="color-scheme" content="only light" />');
    expect(baseLayoutSource).toContain('<meta name="supported-color-schemes" content="light" />');
    expect(baseLayoutSource).toMatch(/<meta name="theme-color" content="#[0-9a-f]{6}" \/>/);
    expect(baseLayoutSource).not.toMatch(/content="[^"]*dark[^"]*"/);
  });

  it('8. the compiled HTML actually contains <meta name="color-scheme" content="only light">', () => {
    expect(pageHtml).toMatch(/<meta name="color-scheme" content="only light"\s*\/?>/);
  });

  it('9. the compiled HTML contains <meta name="supported-color-schemes" content="light">, no contradictory value', () => {
    expect(pageHtml).toMatch(/<meta name="supported-color-schemes" content="light"\s*\/?>/);
    expect(pageHtml).not.toMatch(/<meta name="(color-scheme|supported-color-schemes)"[^>]*dark/);
  });

  it('10. theme-color in the compiled HTML matches an existing token value (--color-anthracite-950), not an invented hex', () => {
    const themeColorMatch = pageHtml.match(/<meta name="theme-color" content="(#[0-9a-f]{6})"/);
    expect(themeColorMatch).not.toBeNull();
    const tokenMatch = tokensSource.match(/--color-anthracite-950:\s*(#[0-9a-f]{6});/);
    expect(tokenMatch).not.toBeNull();
    expect(themeColorMatch?.[1]).toBe(tokenMatch?.[1]);
  });

  it('11. exactly one color-scheme meta and one theme-color meta are present (no duplicates)', () => {
    const colorSchemeMetas = pageHtml.match(/<meta name="color-scheme"/g) ?? [];
    const themeColorMetas = pageHtml.match(/<meta name="theme-color"/g) ?? [];
    expect(colorSchemeMetas).toHaveLength(1);
    expect(themeColorMetas).toHaveLength(1);
  });
});

describe('verrouillage color-scheme — non-régression', () => {
  it('12. the emergency phone link is still present and unchanged (tel:+33649621619, 4 occurrences)', () => {
    const telLinks = pageHtml.match(/href="tel:\+33649621619"/g) ?? [];
    expect(telLinks).toHaveLength(4);
  });

  it('13. the standard phone stays a non-callable placeholder (no regression from this sprint)', () => {
    expect(pageHtml).not.toMatch(/href="tel:\+3322[0-9]+"/);
  });

  it('14. no theme-toggle button or dark-mode JavaScript detection was introduced', () => {
    expect(baseLayoutSource).not.toMatch(/matchMedia\(['"]\(prefers-color-scheme/);
    expect(baseLayoutSource).not.toContain('theme-toggle');
    expect(pageHtml).not.toContain('theme-toggle');
  });

  it('15. no data-theme attribute or "dark" class was introduced anywhere in the page', () => {
    expect(pageHtml).not.toMatch(/data-theme=/);
    expect(pageHtml).not.toMatch(/class="[^"]*\bdark\b[^"]*"/);
  });

  it('16. no new npm dependency was introduced for theming (package.json dependencies unchanged in nature)', () => {
    const pkgSource = readFileSync(
      fileURLToPath(new URL('../package.json', import.meta.url)),
      'utf-8',
    );
    const pkg = JSON.parse(pkgSource);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    const themeLibPattern = /theme|dark-mode|next-themes/i;
    const suspicious = Object.keys(allDeps).filter((name) => themeLibPattern.test(name));
    expect(suspicious).toEqual([]);
  });
});
