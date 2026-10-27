import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import IndexPage from '../src/pages/index.astro';
import PlomberiePage from '../src/pages/plomberie/index.astro';
import MentionsPage from '../src/pages/mentions-legales/index.astro';
import { siteConfig } from '../src/lib/site-config';

const pages: Record<string, string> = {};

beforeAll(async () => {
  const container = await AstroContainer.create();
  const render = (Page: Parameters<typeof container.renderToString>[0], path: string) =>
    container.renderToString(Page, { request: new Request(`http://localhost${path}`) });
  pages.landing = await render(IndexPage, '/');
  pages.metier = await render(PlomberiePage, '/plomberie/');
  pages.legal = await render(MentionsPage, '/mentions-legales/');
}, 60000);

const credit = (html: string) =>
  html.match(/<p class="footer__credit[^"]*"[\s\S]*?<\/p>/)?.[0] ?? '';
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

describe('signature d’agence dans le footer', () => {
  it('config centrale : nom et URL', () => {
    expect(siteConfig.agencyName).toBe('Cantrelle Studio');
    expect(siteConfig.agencyUrl).toBe('https://cantrelle-studio.com/');
  });

  for (const name of ['landing', 'metier', 'legal']) {
    it(`${name} : signature unique, texte, lien et attributs`, () => {
      const html = pages[name];
      expect(html.match(/class="footer__credit"/g) ?? []).toHaveLength(1);
      const block = credit(html);
      expect(text(block)).toBe('Conception & développement — Cantrelle Studio');
      const a = block.match(/<a [^>]*>/)?.[0] ?? '';
      expect(a).toContain(`href="${siteConfig.agencyUrl}"`);
      expect(a).toContain('target="_blank"');
      expect(a).toContain('rel="noopener"');
      expect(a).not.toContain('noreferrer');
      expect(a).not.toMatch(/nofollow|sponsored/);
      expect(a).toContain(
        'aria-label="Conception &amp; développement — Cantrelle Studio (ouvre le site dans un nouvel onglet)"',
      );
      const initials = block.match(/<span class="footer__credit-initial"[^>]*>(.)<\/span>/g) ?? [];
      expect(initials.map((s) => s.replace(/<[^>]+>/g, ''))).toEqual(['C', 'S']);
    });
  }

  it('les deux liens juridiques sont conservés, signature hors de leur liste', () => {
    const footer = pages.landing.match(/<footer class="site-footer"[\s\S]*?<\/footer>/)?.[0] ?? '';
    const legal = footer.match(/<ul class="footer__legal"[^>]*>[\s\S]*?<\/ul>/)?.[0] ?? '';
    expect(legal.match(/<a\b/g) ?? []).toHaveLength(2);
    expect(legal).not.toContain('cantrelle-studio.com');
    expect(footer.indexOf('footer__credit')).toBeLessThan(footer.indexOf('footer__legal'));
  });
});
