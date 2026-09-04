import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import IndexPage from '../src/pages/index.astro';
import { faqItems, interventionsPreview } from '../src/data/landing';

// Tests couvrant la micro-retouche « fonds FAQ/Interventions récentes et
// signature de marque du footer » (01/09/2026, instruction directe).
const ABRICOT_BACKGROUND =
  'radial-gradient(circle at 20% 0%, rgba(255, 105, 0, 0.1), transparent 34%), #fff7f0';

let pageHtml = '';
let faqSource = '';
let latestSource = '';
let footerSource = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });

  faqSource = readFileSync(
    fileURLToPath(new URL('../src/components/landing/Faq.astro', import.meta.url)),
    'utf-8',
  );
  latestSource = readFileSync(
    fileURLToPath(new URL('../src/components/landing/LatestInterventions.astro', import.meta.url)),
    'utf-8',
  );
  footerSource = readFileSync(
    fileURLToPath(new URL('../src/components/layout/Footer.astro', import.meta.url)),
    'utf-8',
  );
}, 30000);

describe('micro-retouche — fond blanc abricot FAQ / Interventions récentes', () => {
  it('1. .faq reuses the exact apricot background already validated elsewhere (no new near-identical color)', () => {
    const ruleMatch = faqSource.match(/\.faq\s*{[^}]*}/);
    expect(ruleMatch).not.toBeNull();
    expect(ruleMatch?.[0]).toContain(ABRICOT_BACKGROUND);
    // Toujours aucun token centralisé pour ce dégradé : la même valeur brute
    // doit rester identique aux autres sections, jamais une variante.
    expect(faqSource).not.toMatch(/#fff[0-9a-f]{4}(?<!7f0)/i);
  });

  it('2. .latest reuses the exact same apricot background', () => {
    const ruleMatch = latestSource.match(/\.latest\s*{[^}]*}/);
    expect(ruleMatch).not.toBeNull();
    expect(ruleMatch?.[0]).toContain(ABRICOT_BACKGROUND);
  });

  it('3. padding-block is untouched on both sections (no spacing regression)', () => {
    const faqRule = faqSource.match(/\.faq\s*{[^}]*}/)?.[0] ?? '';
    const latestRule = latestSource.match(/\.latest\s*{[^}]*}/)?.[0] ?? '';
    expect(faqRule).toContain('padding-block: var(--space-7)');
    expect(latestRule).toContain('padding-block: var(--space-7)');
  });

  it('4. no inset/renfoncement shadow was added to either section', () => {
    expect(faqSource).not.toMatch(/\.faq\s*{[^}]*box-shadow/);
    expect(latestSource).not.toMatch(/\.latest\s*{[^}]*box-shadow/);
  });

  it('5. FAQ content is untouched: same six questions, same accordion markup', () => {
    const faqSectionHtml = pageHtml.match(/<section class="faq"[\s\S]*?<\/section>/)?.[0] ?? '';
    expect(faqSectionHtml).toContain('Questions fréquentes');
    for (const item of faqItems) {
      expect(faqSectionHtml).toContain(item.question);
    }
    expect(faqSectionHtml).toContain('class="faq__trigger"');
  });

  it('6. Latest Interventions content is untouched: same cards, same titles', () => {
    const latestSectionHtml =
      pageHtml.match(/<section class="latest"[\s\S]*?<\/section>/)?.[0] ?? '';
    expect(latestSectionHtml).toContain('Dernières interventions');
    const cardMatches = latestSectionHtml.match(/class="latest__card"/g) ?? [];
    expect(cardMatches).toHaveLength(interventionsPreview.length);
    for (const item of interventionsPreview) {
      expect(latestSectionHtml).toContain(item.title);
    }
  });

  it('7. section order and ids are unchanged (no regression elsewhere on the page)', () => {
    expect(pageHtml).toContain('id="faq"');
    expect(pageHtml).toContain('id="interventions-recentes"');
    const faqIndex = pageHtml.indexOf('id="faq"');
    const latestIndex = pageHtml.indexOf('id="interventions-recentes"');
    expect(latestIndex).toBeGreaterThan(-1);
    expect(faqIndex).toBeGreaterThan(latestIndex);
  });
});

describe('micro-retouche — signature de marque orange dans le footer', () => {
  it('8. only the B of Belkhir and the D of Dépannage are wrapped for coloring, using the centralized brand token', () => {
    const ruleMatch = footerSource.match(/\.footer__brand-initial\s*{[^}]*}/);
    expect(ruleMatch).not.toBeNull();
    expect(ruleMatch?.[0]).toContain('color: var(--color-brand)');
    // Jamais une nouvelle valeur hexadécimale codée en dur pour cet accent.
    expect(footerSource).not.toMatch(/\.footer__brand-initial\s*{[^}]*#[0-9a-fA-F]{3,6}/);
  });

  it('9. the rendered footer wraps exactly B and D in .footer__brand-initial, in that order', () => {
    const footerHtml = pageHtml.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
    expect(footerHtml).toMatch(/<span class="footer__brand-initial"[^>]*>B<\/span>elkhir/);
    expect(footerHtml).toMatch(/<span class="footer__brand-initial"[^>]*>D<\/span>épannage/);
    const initials = footerHtml.match(/class="footer__brand-initial"/g) ?? [];
    expect(initials).toHaveLength(2);
  });

  it('10. the accessible name stays continuous: "Belkhir Dépannage" is read as one unbroken string', () => {
    const footerHtml = pageHtml.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
    // Micro-correction « navigation depuis les pages métiers » (03/09/2026) :
    // le href est désormais préfixé par `base` (voir src/data/landing.ts,
    // `homeHref`) — l'ancre elle-même (#accueil) reste inchangée.
    const linkMatch = footerHtml.match(
      /<a href="[^"]*#accueil" class="footer__brand-link"[^>]*>[\s\S]*?<\/a>/,
    );
    expect(linkMatch).not.toBeNull();
    const visibleText = (linkMatch?.[0] ?? '')
      .replace(/<img[^>]*>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visibleText).toBe('Belkhir Dépannage');
  });

  it('11. the brand link, logo, text size/weight/font and alignment are untouched', () => {
    const ruleMatch = footerSource.match(/\.footer__brand-link\s*{[^}]*}/);
    expect(ruleMatch).not.toBeNull();
    expect(ruleMatch?.[0]).toContain('display: flex');
    expect(ruleMatch?.[0]).toContain('align-items: center');
    expect(ruleMatch?.[0]).toContain('font-weight: 700');
    expect(ruleMatch?.[0]).toContain('font-size: 1.05rem');
    // Micro-correction « navigation depuis les pages métiers » (03/09/2026) :
    // le href littéral `#accueil` a été remplacé par la constante partagée
    // `homeHref` (src/data/landing.ts), désormais préfixée par `base`.
    expect(footerSource).toContain('href={homeHref} class="footer__brand-link"');
    expect(footerSource).toContain('class="footer__logo"');
  });

  it('12. the footer columns, phone buttons and the 16px gap between them remain untouched', () => {
    const footerHtml = pageHtml.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
    expect(footerHtml).toContain('Métiers');
    expect(footerHtml).toContain('Navigation');
    expect(footerHtml).toContain('Nous appeler');
    const phoneButtons = footerHtml.match(/class="[^"]*footer__phone[^"]*"/g) ?? [];
    expect(phoneButtons).toHaveLength(2);
    const gapRule = footerSource.match(/\.footer__calls\s*{[^}]*}/)?.[0] ?? '';
    expect(gapRule).toContain('gap: var(--space-3)');
  });
});
