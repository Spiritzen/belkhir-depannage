import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import IndexPage from '../src/pages/index.astro';
import PlomberiePage from '../src/pages/plomberie/index.astro';
import ChauffagePage from '../src/pages/chauffage/index.astro';
import SerrurariePage from '../src/pages/serrurerie/index.astro';
import VitreriePage from '../src/pages/vitrerie/index.astro';
import RideauxPage from '../src/pages/rideaux-metalliques/index.astro';
import { siteConfig } from '../src/lib/site-config';

// P0-01 — badges Google des Hero : lien interne vers la section #avis de la
// landing (même onglet), jamais la fiche Google externe. Les cartes d'avis et
// le CTA d'écriture gardent leurs destinations externes respectives.
const WRITE_URL = siteConfig.googleReviewWriteUrl;
const PUBLIC_URL = siteConfig.googleReviewsUrl;

const pages = {
  landing: { Page: IndexPage, url: 'http://localhost/' },
  plomberie: { Page: PlomberiePage, url: 'http://localhost/plomberie/' },
  chauffage: { Page: ChauffagePage, url: 'http://localhost/chauffage/' },
  serrurerie: { Page: SerrurariePage, url: 'http://localhost/serrurerie/' },
  vitrerie: { Page: VitreriePage, url: 'http://localhost/vitrerie/' },
  'rideaux-metalliques': { Page: RideauxPage, url: 'http://localhost/rideaux-metalliques/' },
} as const;

type PageName = keyof typeof pages;
const html: Record<string, string> = {};

// Ouverture de la balise <a> du badge Hero (unique par page, voir
// tests/hero-retouche-04.test.ts test 11).
const heroBadgeTag = (page: string) =>
  page.match(/<a class="hero__google-proof"[^>]*>/)?.[0] ?? '';
const hrefOf = (tag: string) => tag.match(/href="([^"]+)"/)?.[1] ?? '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  for (const name of Object.keys(pages) as PageName[]) {
    const { Page, url } = pages[name];
    html[name] = await container.renderToString(Page, { request: new Request(url) });
  }
}, 120000);

describe('P0-01 — badge Google du Hero : destination interne #avis', () => {
  it('the landing Hero badge points to the #avis anchor of the landing', () => {
    const href = hrefOf(heroBadgeTag(html.landing));
    expect(href).toMatch(/#avis$/);
    expect(html.landing).toContain('id="avis"');
  });

  it('each metier Hero badge points to the landing #avis anchor (same value as the landing)', () => {
    const landingHref = hrefOf(heroBadgeTag(html.landing));
    for (const name of ['plomberie', 'chauffage', 'serrurerie', 'vitrerie', 'rideaux-metalliques']) {
      expect(hrefOf(heroBadgeTag(html[name]))).toBe(landingHref);
    }
  });

  it('no Hero badge uses siteConfig.googleReviewsUrl', () => {
    for (const name of Object.keys(pages)) {
      expect(hrefOf(heroBadgeTag(html[name]))).not.toBe(PUBLIC_URL);
    }
  });

  it('no Hero badge opens a new tab nor carries external-link rel', () => {
    for (const name of Object.keys(pages)) {
      const tag = heroBadgeTag(html[name]);
      expect(tag).not.toBe('');
      expect(tag).not.toContain('target="_blank"');
      expect(tag).not.toContain('noopener');
    }
  });

  it('the Hero badge keeps its accessible label (rating, count, platform)', () => {
    const tag = heroBadgeTag(html.landing);
    expect(tag).toContain('aria-label="');
    expect(tag).toContain('avis Google');
  });
});

describe('P0-01 — cartes d’avis et CTA Google inchangés', () => {
  it('review cards keep the external public listing URL with new tab + noopener', () => {
    for (const name of ['landing', 'plomberie'] as PageName[]) {
      const cards = html[name].match(/<a [^>]*class="reviews__card"[^>]*>/g) ?? [];
      expect(cards).toHaveLength(3);
      for (const card of cards) {
        expect(card).toContain(`href="${PUBLIC_URL}"`);
        expect(card).toContain('target="_blank"');
        expect(card).toContain('rel="noopener noreferrer"');
      }
    }
  });

  it('write CTA keeps the write URL with new tab + noopener', () => {
    const cta = html.landing.match(/<a [^>]*class="reviews__cta"[^>]*>/)?.[0] ?? '';
    expect(cta).toContain(`href="${WRITE_URL}"`);
    expect(cta).toContain('target="_blank"');
    expect(cta).toContain('rel="noopener noreferrer"');
  });
});

describe('P0-01 — centralisation des URL Google', () => {
  it('both Google URLs remain centralized in site-config.ts', () => {
    expect(PUBLIC_URL).toBe('https://g.page/r/CeM9Ou9Il3SDEAE');
    expect(WRITE_URL).toBe('https://g.page/r/CeM9Ou9Il3SDEAE/review');
  });
});
