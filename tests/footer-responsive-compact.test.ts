import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import IndexPage from '../src/pages/index.astro';
import { services, navLinks } from '../src/data/landing';

// Tests couvrant la retouche « footer responsive compact deux colonnes »
// (01/09/2026, PROMPT_CLAUDE_CODE_FOOTER_RESPONSIVE_COMPACT_DEUX_COLONNES.txt) :
// sur mobile, Métiers et Navigation s'affichent côte à côte au lieu de
// s'empiler en pleine hauteur, sans toucher le rendu desktop.

let pageHtml = '';
let footerSource = '';
let tokensSource = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });

  footerSource = readFileSync(
    fileURLToPath(new URL('../src/components/layout/Footer.astro', import.meta.url)),
    'utf-8',
  );
  tokensSource = readFileSync(
    fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url)),
    'utf-8',
  );
}, 30000);

function extractRule(source: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escaped}\\s*{[^}]*}`));
  return match?.[0] ?? '';
}

function extractMediaBlock(source: string, maxWidth: string): string {
  const escaped = maxWidth.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`@media \\(max-width: ${escaped}\\)\\s*{([\\s\\S]*?)\\n  }\\n`);
  return source.match(re)?.[1] ?? '';
}

describe('footer responsive — deux colonnes mobile (Métiers / Navigation)', () => {
  it('1. the existing mobile breakpoint (32rem) is reused, not a new one invented', () => {
    const mediaQueries = footerSource.match(/@media \(max-width: [^)]+\)/g) ?? [];
    expect(mediaQueries).toContain('@media (max-width: 62rem)');
    expect(mediaQueries).toContain('@media (max-width: 32rem)');
    expect(mediaQueries).toHaveLength(2);
  });

  it('2. the mobile grid uses a 2-column grid with named areas placing brand/calls full-width and metiers/navigation side by side', () => {
    const mobileBlock = extractMediaBlock(footerSource, '32rem');
    expect(mobileBlock).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
    expect(mobileBlock).toMatch(
      /grid-template-areas:\s*'brand brand'\s*'metiers navigation'\s*'calls calls'/,
    );
  });

  it('3. brand, metiers, navigation and calls are each assigned to their matching grid-area', () => {
    const mobileBlock = extractMediaBlock(footerSource, '32rem');
    expect(mobileBlock).toMatch(/\.footer__brand\s*{\s*grid-area:\s*brand;/);
    expect(mobileBlock).toMatch(/\.footer__col--metiers\s*{\s*grid-area:\s*metiers;/);
    expect(mobileBlock).toMatch(/\.footer__col--navigation\s*{\s*grid-area:\s*navigation;/);
    expect(mobileBlock).toMatch(/\.footer__calls\s*{\s*grid-area:\s*calls;/);
  });

  it('4. the markup carries the new targeting classes without losing the shared .footer__col class', () => {
    expect(footerSource).toContain('class="footer__col footer__col--metiers"');
    expect(footerSource).toContain('class="footer__col footer__col--navigation"');
  });

  it('5. no accordion, no <script>, no JS-driven toggle was introduced in the footer', () => {
    expect(footerSource).not.toContain('<script');
    expect(footerSource).not.toMatch(/addEventListener/);
    expect(footerSource).not.toContain('data-accordion');
  });

  it('6. no new external dependency or library is referenced', () => {
    const importLines = footerSource.match(/^import .+$/gm) ?? [];
    for (const line of importLines) {
      expect(line).not.toMatch(/from ['"](?!\.\.\/|astro:)/);
    }
  });

  it('7. the desktop breakpoint (62rem) rule is structurally unchanged', () => {
    const tabletBlock = extractMediaBlock(footerSource, '62rem');
    expect(tabletBlock.trim()).toBe(
      '.footer__grid {\n      grid-template-columns: repeat(2, 1fr);\n    }',
    );
  });

  it('8. the base 4-column desktop grid rule is untouched', () => {
    const baseRule = extractRule(footerSource, '.footer__grid');
    expect(baseRule).toContain('grid-template-columns: 1.4fr repeat(3, 1fr)');
    expect(baseRule).toContain('gap: var(--space-5)');
    expect(baseRule).toContain('padding-block: var(--space-6)');
  });

  it('9. all six Métiers links and all five Navigation links are still rendered, no link removed', () => {
    const footerHtml = pageHtml.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
    const metiersNav =
      footerHtml.match(/<nav class="footer__col footer__col--metiers"[\s\S]*?<\/nav>/)?.[0] ?? '';
    for (const service of services) {
      expect(metiersNav).toContain(service.title);
    }
    const navigationNav =
      footerHtml.match(/<nav class="footer__col footer__col--navigation"[\s\S]*?<\/nav>/)?.[0] ??
      '';
    for (const link of navLinks) {
      expect(navigationNav).toContain(link.label);
    }
  });

  it('10. no "Contact" link is reintroduced anywhere in the footer', () => {
    const footerHtml = pageHtml.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
    expect(footerHtml).not.toContain('>Contact<');
    expect(footerHtml).not.toContain('#contact');
  });

  it('11. the 16px gap (--space-3) between the two call buttons is untouched', () => {
    const callsRule = extractRule(footerSource, '.footer__calls');
    expect(callsRule).toContain('display: flex');
    expect(callsRule).toContain('flex-direction: column');
    expect(callsRule).toContain('gap: var(--space-3)');
  });

  it('12. the real emergency number stays callable, the standard number stays a non-callable placeholder', () => {
    const footerHtml = pageHtml.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
    expect(footerHtml).toMatch(/<a[^>]*href="tel:\+33649621619"[^>]*>/);
    expect(footerHtml).toMatch(/<button[^>]*disabled[^>]*>/);
    expect(footerHtml).not.toMatch(/<a[^>]*href="tel:\+33[^"]*"[^>]*>[\s\S]*?03 XX XX XX XX/);
  });

  it('13. the B/D brand-initial orange signature is untouched', () => {
    const brandInitialRule = extractRule(footerSource, '.footer__brand-initial');
    expect(brandInitialRule).toContain('color: var(--color-brand)');
    const footerHtml = pageHtml.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
    const initials = footerHtml.match(/class="footer__brand-initial"/g) ?? [];
    expect(initials).toHaveLength(2);
  });

  it('14. --mobile-callbar-height is a properly defined token in tokens.css, not an invented undefined variable', () => {
    expect(tokensSource).toMatch(/--mobile-callbar-height:\s*\d+(\.\d+)?px;/);
  });

  it('15. the footer reserves bottom space for the sticky call bar using that token, without duplicating safe-area-inset-bottom', () => {
    const mobileBlock = extractMediaBlock(footerSource, '32rem');
    expect(mobileBlock).toMatch(
      /\.footer__bottom\s*{\s*padding-bottom:\s*calc\(var\(--mobile-callbar-height\)\s*\+\s*24px\);/,
    );
    // Le mot "safe-area-inset-bottom" peut légitimement apparaître dans un
    // commentaire explicatif ; seul un appel CSS réel dupliqué est interdit.
    expect(mobileBlock).not.toContain('env(safe-area-inset-bottom)');
  });

  it('16. the DOM order of the four grid children is unchanged (brand, Métiers, Navigation, Nous appeler)', () => {
    const footerHtml = pageHtml.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
    const brandIdx = footerHtml.indexOf('class="footer__brand"');
    const metiersIdx = footerHtml.indexOf('footer__col--metiers');
    const navigationIdx = footerHtml.indexOf('footer__col--navigation');
    const callsIdx = footerHtml.indexOf('class="footer__col footer__calls"');
    expect(brandIdx).toBeLessThan(metiersIdx);
    expect(metiersIdx).toBeLessThan(navigationIdx);
    expect(navigationIdx).toBeLessThan(callsIdx);
  });

  it('17. link text wrapping is preserved (no white-space:nowrap, no ellipsis/truncation added)', () => {
    const linkRule = extractRule(footerSource, '.footer__col a');
    expect(linkRule).not.toContain('white-space: nowrap');
    expect(linkRule).not.toContain('text-overflow');
    expect(footerSource).not.toContain('text-overflow: ellipsis');
  });
});
