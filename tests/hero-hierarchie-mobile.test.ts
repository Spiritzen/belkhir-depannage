import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import IndexPage from '../src/pages/index.astro';

// Tests couvrant le mini-sprint 4 « hiérarchie du Hero mobile » (02/09/2026,
// PROMPT_CLAUDE_CODE_MINI_SPRINT_4_HIERARCHIE_HERO_MOBILE.txt) : remontée du
// H1, description mobile concise, preuve Google avant le CTA sur mobile,
// protection contre la barre d'appel fixe — toutes limitées au breakpoint
// mobile existant (ou à sa réciproque exacte pour la restauration desktop),
// sans régression sur desktop/tablette large. Les mesures géométriques
// (écarts en pixels, position par rapport à la barre fixe) sont vérifiées en
// navigateur réel via le script browser-automation documenté dans le rapport
// de mission — ce fichier couvre la structure et le contenu rendus par Astro.

const SHORT_LEAD_TEXT =
  'Fuite, panne de chauffage, porte bloquée ou vitre cassée : nous qualifions votre urgence dès l’appel.';

let pageHtml = '';
let heroHtml = '';
let heroSource = '';

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
}, 30000);

describe('mission 1 — remontée du H1 : écart ruban → H1 resserré, H1 inchangé', () => {
  it('1. the H1 wording and its two-line grouping are untouched', () => {
    expect(heroHtml).toContain('Dépannage d’urgence');
    expect(heroHtml).toContain('24h/24');
    expect(heroHtml).toContain('Hauts-de-France');
    const h1Count = (heroHtml.match(/<h1 class="hero__title"/g) ?? []).length;
    expect(h1Count).toBe(1);
  });

  it('2. .hero__message gains align-self: start and a reduced padding-top only inside the existing mobile breakpoint', () => {
    const mobileBlock = heroSource.match(
      /@media \(max-width: 47\.9375rem\) {([\s\S]*?)\n {2}}\n\n {2}\.hero__title/,
    )?.[1];
    expect(mobileBlock).toBeDefined();
    expect(mobileBlock).toMatch(/\.hero__message\s*{[^}]*align-self:\s*start;/);
    expect(mobileBlock).toMatch(/\.hero__message\s*{[^}]*padding-top:\s*16px;/);
  });

  it('3. the desktop/tablet base rule for .hero__message keeps its original centered alignment', () => {
    const baseRule = heroSource.match(/\.hero__message\s*{[^}]*}/)?.[0] ?? '';
    expect(baseRule).toContain('align-self: center');
    expect(baseRule).not.toContain('align-self: start');
  });
});

describe('mission 2 — description mobile concise : deux variantes server-rendered, une seule annoncée', () => {
  it('4. the full (existing) description is still rendered verbatim', () => {
    expect(heroHtml).toContain('Plomberie, chauffage, serrurerie, vitrerie et rideaux métalliques');
    expect(heroHtml).toContain('nous qualifions votre situation dès l’appel');
  });

  it('5. the exact short description required by the mission prompt is rendered, verbatim', () => {
    const normalized = heroHtml.replace(/\s+/g, ' ');
    expect(normalized).toContain(SHORT_LEAD_TEXT);
  });

  it('6. exactly two .hero__lead paragraphs exist (full + short, no stray third variant)', () => {
    const leadParagraphs = heroHtml.match(/<p class="hero__lead[^"]*"/g) ?? [];
    expect(leadParagraphs).toHaveLength(2);
    expect(heroHtml).toContain('class="hero__lead hero__lead--full"');
    expect(heroHtml).toContain('class="hero__lead hero__lead--short"');
  });

  it('7. neither lead paragraph carries aria-hidden — the active one must be announced by assistive tech', () => {
    const leadBlock =
      heroHtml.match(/<p class="hero__lead hero__lead--full"[\s\S]*?<\/p>/)?.[0] ?? '';
    const shortBlock =
      heroHtml.match(/<p class="hero__lead hero__lead--short"[\s\S]*?<\/p>/)?.[0] ?? '';
    expect(leadBlock).not.toContain('aria-hidden');
    expect(shortBlock).not.toContain('aria-hidden');
  });

  it('8. the short variant is hidden by default (base rule) and shown only inside the mobile breakpoint, with the inverse for the full variant', () => {
    const baseShortRule = heroSource.match(/\.hero__lead--short\s*{\s*display:\s*none;\s*}/);
    expect(baseShortRule).toBeTruthy();

    const mobileBlock = heroSource.match(
      /@media \(max-width: 47\.9375rem\) {\s*\.hero__lead--full[\s\S]*?\.hero__lead--short[\s\S]*?}\s*}/,
    )?.[0];
    expect(mobileBlock).toBeDefined();
    expect(mobileBlock).toMatch(/\.hero__lead--full\s*{\s*display:\s*none;\s*}/);
    expect(mobileBlock).toMatch(/\.hero__lead--short\s*{\s*display:\s*block;/);
  });

  it('9. the short variant line-height stays within the 1.4–1.55 target range, distinct from the desktop 1.65', () => {
    const shortLineHeight = heroSource.match(
      /\.hero__lead--short\s*{\s*display:\s*block;\s*line-height:\s*([\d.]+);/,
    )?.[1];
    expect(shortLineHeight).toBeDefined();
    const value = Number(shortLineHeight);
    expect(value).toBeGreaterThanOrEqual(1.4);
    expect(value).toBeLessThanOrEqual(1.55);
  });

  it('10. the shared .hero__lead base rule (size, color, max-width, margin) is untouched — both variants keep it', () => {
    const baseRule = heroSource.match(/\.hero__lead\s*{[^}]*}/)?.[0] ?? '';
    expect(baseRule).toContain('max-width: 56.25rem');
    expect(baseRule).toContain('line-height: 1.65');
    expect(baseRule).toContain('color: var(--color-gray-100)');
  });
});

describe('mission 3 — preuve Google avant le CTA sur mobile, structure logique (pas de order sur mobile)', () => {
  it('11. exactly one interactive Google-proof link exists (no duplicated interactive element)', () => {
    const googleLinks = heroHtml.match(/<a class="hero__google-proof"/g) ?? [];
    expect(googleLinks).toHaveLength(1);
  });

  it('12. the Google-proof link keeps its existing href source and full accessible label (untouched destination/name logic)', () => {
    expect(heroSource).toContain("const googleHref = siteConfig.googleReviewsUrl ?? '#avis';");
    expect(heroSource).toContain('href={googleHref}');
    expect(heroSource).toContain('aria-label={googleAccessibleLabel}');
  });

  it('13. in the DOM, the Google-proof link precedes the quote CTA inside .hero__conversion-row', () => {
    const rowMatch = heroHtml.match(
      /<div class="hero__conversion-row"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
    );
    expect(rowMatch).toBeTruthy();
    const row = rowMatch![0];
    const googleIndex = row.indexOf('hero__google-proof"');
    const ctaIndex = row.indexOf('hero__quote-cta"');
    expect(googleIndex).toBeGreaterThan(-1);
    expect(ctaIndex).toBeGreaterThan(-1);
    expect(googleIndex).toBeLessThan(ctaIndex);
  });

  it('14. no CSS order is applied without being scoped to the desktop-restoration query (min-width: 48rem)', () => {
    const orderDeclarations = Array.from(heroSource.matchAll(/order:\s*\d;/g));
    expect(orderDeclarations.length).toBeGreaterThan(0);
    const restorationBlock = heroSource.match(
      /@media \(min-width: 48rem\) {([\s\S]*?)\n {2}}\n\n {2}\.hero__quote-cta \{/,
    )?.[1];
    expect(restorationBlock).toBeDefined();
    expect(restorationBlock).toMatch(/\.hero__quote-cta\s*{\s*order:\s*0;\s*}/);
    expect(restorationBlock).toMatch(/\.hero__google-proof\s*{\s*order:\s*1;\s*}/);
    // No other rule in the file (mobile block included) sets `order`.
    const outsideRestoration = heroSource.replace(
      /@media \(min-width: 48rem\) {[\s\S]*?\n {2}}\n\n {2}\.hero__quote-cta \{/,
      '',
    );
    expect(outsideRestoration).not.toMatch(/order:\s*\d;/);
  });

  it('15. the compact mobile meta variant reuses the existing rating/count data, with no new figure invented', () => {
    expect(heroSource).toContain(
      'googleReviewSummary.reviewCount} avis {googleReviewSummary.platform',
    );
    const shortMetaBlock = heroHtml.match(
      /<span class="hero__google-proof-meta--short"[^>]*>([\s\S]*?)<\/span>/,
    )?.[1];
    expect(shortMetaBlock).toBeDefined();
    expect(shortMetaBlock!.replace(/\s+/g, ' ').trim()).toBe('— 277 avis Google');
  });

  it('16. the compact mobile meta variant carries aria-hidden (the parent link’s aria-label already covers the accessible name)', () => {
    expect(heroHtml).toMatch(/<span class="hero__google-proof-meta--short" aria-hidden="true"/);
  });

  it('17. the full (desktop) meta text — "Excellent · 277 avis Google" — is conserved, hidden only on mobile', () => {
    expect(heroHtml).toContain('4,7/5');
    const normalized = heroHtml.replace(/\s+/g, ' ');
    expect(normalized).toContain('277 avis Google');
    const mobileBlock = heroSource.match(
      /@media \(max-width: 47\.9375rem\) {([\s\S]*?)\n {2}}\n\n {2}@media \(prefers-reduced-motion: reduce\) {\s*\.hero__quote-cta:hover/,
    )?.[1];
    expect(mobileBlock).toBeDefined();
    expect(mobileBlock).toMatch(/\.hero__google-proof-meta--full\s*{\s*display:\s*none;\s*}/);
  });

  it('18. the desktop base .hero__google-proof-meta rule (shared font-size/color) is untouched', () => {
    const baseRule = heroSource.match(/\n {2}\.hero__google-proof-meta\s*{[^}]*}/)?.[0] ?? '';
    expect(baseRule).toContain('font-size: 0.78rem');
    expect(baseRule).toContain('color: var(--color-gray-100)');
  });

  it('19. the desktop base .hero__google-proof rule keeps its original 56px min-height (mobile compacting is scoped, not global)', () => {
    const baseRule =
      heroSource.match(/\.hero__google-proof\s*{\s*display: inline-flex;[^}]*}/)?.[0] ?? '';
    expect(baseRule).toContain('min-height: 56px');
  });

  it('20. .hero__conversion-row base spacing (margin-top/gap clamps) is untouched', () => {
    const baseRule = heroSource.match(/\.hero__conversion-row\s*{[^}]*}/)?.[0] ?? '';
    expect(baseRule).toContain('margin-top: clamp(1.75rem, 1.65rem + 0.2vw, 2rem)');
    expect(baseRule).toContain('gap: clamp(1rem, 0.9rem + 0.3vw, 1.25rem)');
  });
});

describe('mission 4 — protection contre la barre d’appel fixe : token réutilisé, mobile uniquement', () => {
  it('21. the mobile .hero__container min-height reuses the existing --mobile-callbar-height token plus a safe-area allowance', () => {
    const mobileBlock = heroSource.match(
      /@media \(max-width: 47\.9375rem\) {([\s\S]*?)\n {2}}\n\n {2}\.hero__title/,
    )?.[1];
    expect(mobileBlock).toBeDefined();
    expect(mobileBlock).toMatch(
      /min-height:\s*calc\(\s*100vh[\s\S]*?var\(--mobile-callbar-height\)/,
    );
    expect(mobileBlock).toMatch(
      /min-height:\s*calc\(\s*100svh[\s\S]*?var\(--mobile-callbar-height\)/,
    );
    expect(mobileBlock).toMatch(/env\(safe-area-inset-bottom\)/);
  });

  it('22. no new CSS custom property was invented — the existing token is reused as-is', () => {
    expect(heroSource).not.toMatch(/--mobile-callbar-height:\s*\d/);
    const tokensSource = readFileSync(
      fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url)),
      'utf-8',
    );
    expect(tokensSource).toContain('--mobile-callbar-height: 70px;');
  });

  it('23. the desktop base .hero__container min-height calc is untouched (bar protection is mobile-only)', () => {
    const baseRule = heroSource.match(/\.hero__container\s*{[^}]*}/)?.[0] ?? '';
    expect(baseRule).toContain('min-height: calc(100vh - var(--header-total-height))');
    expect(baseRule).toContain('min-height: calc(100svh - var(--header-total-height))');
    expect(baseRule).not.toContain('--mobile-callbar-height');
  });
});

describe('non-régression — pas de nouvelle dépendance, un seul nouveau point de rupture, structure globale intacte', () => {
  it('24. the only new breakpoint token introduced by this mission is the desktop-restoration query (min-width: 48rem)', () => {
    const mediaQueries = heroSource.match(/@media \([^)]+\)/g) ?? [];
    const uniqueQueries = new Set(mediaQueries);
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
    expect(uniqueQueries.has('@media (min-width: 48rem)')).toBe(true);
  });

  it('25. no import was added to Hero.astro (no new runtime dependency)', () => {
    const importLines = heroSource.match(/^import .+$/gm) ?? [];
    expect(importLines).toEqual([
      "import { Image, getImage } from 'astro:assets';",
      "import heroImg from '../../assets/legacy/hero-intervention-urgence.jpg';",
      "import heroMobileImg from '../../assets/hero/hero-mobile-technicien-arrivee-belkhir.png';",
      "import Icon from '../ui/Icon.astro';",
      "import { services, type ServiceId, googleReviewSummary } from '../../data/landing';",
      "import { siteConfig } from '../../lib/site-config';",
      "import { getPhoneCta } from '../../lib/phone';",
    ]);
  });

  it('26. the emergency phone link is still untouched by this mission (absent from the Hero, present 4× elsewhere)', () => {
    expect(heroHtml).not.toContain('tel:+33649621619');
    const telLinks = pageHtml.match(/href="tel:\+33649621619"/g) ?? [];
    expect(telLinks).toHaveLength(4);
  });

  it('27. the trades ribbon (mini-sprint 3/fluidity-correction territory) is untouched by this mission', () => {
    expect(heroSource).toContain('RIBBON_PASS_DURATION_MS');
    expect(heroSource).toContain('computeLegPosition');
    const tradeLinks = heroHtml.match(/<a href="#[^"]+" class="hero__trade"/g) ?? [];
    expect(tradeLinks).toHaveLength(5);
  });
});
