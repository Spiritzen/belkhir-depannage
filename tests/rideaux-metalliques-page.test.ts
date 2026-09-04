import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import RideauxMetalliquesPage from '../src/pages/rideaux-metalliques/index.astro';
import { googleReviewSummary } from '../src/data/landing';

// Tests ciblés pour la page /rideaux-metalliques/ (PROMPT_CLAUDE_CODE_PAGE_
// RIDEAUX_METALLIQUES_PATTERN_COMPLET.txt, 04/09/2026) : réplication du
// pattern plomberie/chauffage/serrurerie/vitrerie — contenu exact du Hero,
// CTA réels, SEO de la page, navbar/footer réutilisés.
//
// Même limite d'environnement documentée par tests/plomberie-page.test.ts et
// tests/prepub-corrections.test.ts : les assertions dépendant de `base`
// lisent `dist/` (PRÉREQUIS : `npm run build` déjà exécuté).
let pageHtml = '';
let heroHtml = '';
let distHtml = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(RideauxMetalliquesPage, {
    request: new Request('http://localhost/rideaux-metalliques/'),
  });
  const heroMatch = pageHtml.match(/<section class="hero"[\s\S]*?<\/section>/);
  heroHtml = heroMatch?.[0] ?? '';

  const distPath = fileURLToPath(
    new URL('../dist/rideaux-metalliques/index.html', import.meta.url),
  );
  distHtml = readFileSync(distPath, 'utf-8');
}, 30000);

describe('page /rideaux-metalliques/ — SEO (dist/, base-dépendant)', () => {
  it('has the requested <title>', () => {
    expect(distHtml).toContain(
      '<title>Dépannage rideaux métalliques Hauts-de-France | Belkhir Dépannage</title>',
    );
  });

  it('has a canonical URL under the real GitHub Pages subpath', () => {
    expect(distHtml).toContain(
      '<link rel="canonical" href="https://spiritzen.github.io/belkhir-depannage/rideaux-metalliques/">',
    );
  });

  it('preserves the global indexing policy (noindex while numbers/flag are not confirmed)', () => {
    expect(distHtml).toContain('<meta name="robots" content="noindex, nofollow">');
  });

  it('the secondary CTA points to the real coverage section under the GitHub Pages subpath', () => {
    const match = distHtml.match(/class="hero__coverage-cta"[^>]*href="([^"]+)"/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('/belkhir-depannage/#zones-couvertes');
  });
});

describe('page /rideaux-metalliques/ — Hero content', () => {
  it('contains exactly one H1 with the exact validated wording', () => {
    const matches = pageHtml.match(/<h1[\s>]/g) ?? [];
    expect(matches).toHaveLength(1);

    const h1Match = pageHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const visibleText = (h1Match?.[1] ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visibleText).toBe('Dépannage de rideaux métalliques d’urgence dans les Hauts-de-France');
  });

  it('gives the hero background photo a useful, non-empty alt text', () => {
    expect(heroHtml).toContain(
      'alt="Technicien Belkhir Dépannage intervenant sur le rideau métallique d’un commerce"',
    );
  });

  it('renders the exact eyebrow', () => {
    const visible = heroHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visible).toContain('RIDEAUX MÉTALLIQUES D’URGENCE · HAUTS-DE-FRANCE · 24H/24 · 7J/7');
  });

  it('renders the exact description paragraph', () => {
    expect(heroHtml).toContain(
      'Un rideau bloqué, désaxé ou qui ne répond plus ne doit pas être forcé',
    );
  });

  it('never promises an unconfirmed delay, price or a damage-free/guaranteed opening', () => {
    expect(heroHtml).not.toMatch(/moins d.une heure/i);
    expect(heroHtml).not.toMatch(/gratuit/i);
    expect(heroHtml).not.toMatch(/garanti/i);
    expect(heroHtml).not.toMatch(/sans dommage/i);
  });
});

describe('page /rideaux-metalliques/ — CTA principal (appel d’urgence)', () => {
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

describe('page /rideaux-metalliques/ — preuve Google', () => {
  it('reuses the centralized rating data, never a new invented number', () => {
    const expectedRating = googleReviewSummary.rating.toFixed(1).replace('.', ',');
    expect(heroHtml).toContain(`${expectedRating}/5`);
    expect(heroHtml).toContain(
      `${googleReviewSummary.reviewCount} avis ${googleReviewSummary.platform}`,
    );
  });
});

describe('page /rideaux-metalliques/ — navbar/footer réutilisés', () => {
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
