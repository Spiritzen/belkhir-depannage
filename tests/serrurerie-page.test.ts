import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import SerruriePage from '../src/pages/serrurerie/index.astro';
import { googleReviewSummary } from '../src/data/landing';

// Tests ciblés pour la page /serrurerie/ (PROMPT_CLAUDE_CODE_PAGE_
// SERRURERIE_PATTERN_COMPLET.txt, 04/09/2026) : réplication du pattern
// plomberie/chauffage — contenu exact du Hero, CTA réels, SEO de la page,
// navbar/footer réutilisés.
//
// Même limite d'environnement documentée par tests/plomberie-page.test.ts et
// tests/prepub-corrections.test.ts : les assertions dépendant de `base`
// lisent `dist/` (PRÉREQUIS : `npm run build` déjà exécuté).
let pageHtml = '';
let heroHtml = '';
let distHtml = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(SerruriePage, {
    request: new Request('http://localhost/serrurerie/'),
  });
  const heroMatch = pageHtml.match(/<section class="hero"[\s\S]*?<\/section>/);
  heroHtml = heroMatch?.[0] ?? '';

  const distPath = fileURLToPath(new URL('../dist/serrurerie/index.html', import.meta.url));
  distHtml = readFileSync(distPath, 'utf-8');
}, 30000);

describe('page /serrurerie/ — SEO (dist/, base-dépendant)', () => {
  it('has the requested <title>', () => {
    expect(distHtml).toContain(
      '<title>Serrurier en urgence Hauts-de-France | Belkhir Dépannage</title>',
    );
  });

  it('has a canonical URL under the real GitHub Pages subpath', () => {
    expect(distHtml).toContain(
      '<link rel="canonical" href="https://spiritzen.github.io/belkhir-depannage/serrurerie/">',
    );
  });

  it('preserves the global indexing policy (noindex while numbers/flag are not confirmed)', () => {
    expect(distHtml).toContain('<meta name="robots" content="noindex, nofollow">');
  });

  // CORRECTION (PAGE ZONES D'INTERVENTION, 04/09/2026) : le CTA « Vérifier
  // mon secteur » du Hero pointe désormais vers la page dédiée réelle
  // plutôt que l'ancre `#zones-couvertes` de la landing.
  it('the secondary CTA points to the real /zones-intervention/ page under the GitHub Pages subpath', () => {
    const match = distHtml.match(/class="hero__coverage-cta"[^>]*href="([^"]+)"/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('/belkhir-depannage/zones-intervention/');
  });
});

describe('page /serrurerie/ — Hero content', () => {
  it('contains exactly one H1 with the exact validated wording', () => {
    const matches = pageHtml.match(/<h1[\s>]/g) ?? [];
    expect(matches).toHaveLength(1);

    const h1Match = pageHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const visibleText = (h1Match?.[1] ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visibleText).toBe('Dépannage serrurerie d’urgence dans les Hauts-de-France');
  });

  it('gives the hero background photo a useful, non-empty alt text', () => {
    expect(heroHtml).toContain(
      'alt="Technicien Belkhir Dépannage intervenant sur la serrure d’une porte d’entrée"',
    );
  });

  it('renders the exact eyebrow', () => {
    const visible = heroHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visible).toContain('SERRURERIE D’URGENCE · HAUTS-DE-FRANCE · 24H/24 · 7J/7');
  });

  it('renders the exact description paragraph', () => {
    expect(heroHtml).toContain('Porte claquée, clé cassée, serrure bloquée ou accès endommagé');
  });

  it('never promises an unconfirmed delay, price or a damage-free opening', () => {
    expect(heroHtml).not.toMatch(/moins d.une heure/i);
    expect(heroHtml).not.toMatch(/gratuit/i);
    expect(heroHtml).not.toMatch(/garanti/i);
    expect(heroHtml).not.toMatch(/sans dommage/i);
  });
});

describe('page /serrurerie/ — CTA principal (appel d’urgence)', () => {
  it('uses the exact visible label and the real emergency number', () => {
    expect(heroHtml).toContain('Appeler en urgence');
    expect(heroHtml).toContain('06 49 62 16 19');
  });

  it('links to the exact confirmed tel: href, never a placeholder', () => {
    const match = heroHtml.match(/class="hero__call-cta"[^>]*href="([^"]+)"/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('tel:+33649621619');
  });
});

describe('page /serrurerie/ — preuve Google', () => {
  it('reuses the centralized rating data, never a new invented number', () => {
    const expectedRating = googleReviewSummary.rating.toFixed(1).replace('.', ',');
    expect(heroHtml).toContain(`${expectedRating}/5`);
    expect(heroHtml).toContain(
      `${googleReviewSummary.reviewCount} avis ${googleReviewSummary.platform}`,
    );
  });
});

describe('page /serrurerie/ — navbar/footer réutilisés', () => {
  it('reuses the real shared Navbar (both phone lines present)', () => {
    const navbarMatch = pageHtml.match(/<header class="navbar"[\s\S]*?<\/header>/);
    expect(navbarMatch).not.toBeNull();
    expect(navbarMatch?.[0]).toContain('APPEL STANDARD');
    expect(navbarMatch?.[0]).toContain('APPEL URGENCE');
  });

  it('reserves space for the fixed mobile call bar (hasMobileCallBar)', () => {
    expect(pageHtml).toContain('class="has-mobile-call-bar"');
    expect(pageHtml).toContain('id="mobile-call-bar"');
  });
});
