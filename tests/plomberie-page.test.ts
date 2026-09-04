import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import PlomberiePage from '../src/pages/plomberie/index.astro';
import { googleReviewSummary } from '../src/data/landing';

// Tests ciblés pour le micro-sprint 1 « fondation page plomberie »
// (PROMPT_CLAUDE_CODE_MICRO_SPRINT_1_PAGE_PLOMBERIE_HERO.txt, 03/09/2026) :
// contenu exact du Hero, CTA réels (jamais d'ancre morte ni de faux `tel:`),
// SEO de la page, navbar/footer réutilisés.
//
// Deux sources de HTML, pour la même raison documentée par
// tests/prepub-corrections.test.ts : `getViteConfig`/`AstroContainer` sous
// Vitest ne propage pas le `base` d'Astro dans `import.meta.env.BASE_URL`
// pendant le rendu de composants. Les assertions qui DÉPENDENT de `base`
// (canonical, ancre de couverture cross-page) lisent donc `dist/` (PRÉREQUIS :
// `npm run build` déjà exécuté — voir `validate` dans package.json, qui
// enchaîne build puis test:run) ; les assertions de contenu indépendantes de
// `base` restent rendues via AstroContainer.
let pageHtml = '';
let heroHtml = '';
let distHtml = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(PlomberiePage, {
    request: new Request('http://localhost/plomberie/'),
  });
  const heroMatch = pageHtml.match(/<section class="hero"[\s\S]*?<\/section>/);
  heroHtml = heroMatch?.[0] ?? '';

  const distPath = fileURLToPath(new URL('../dist/plomberie/index.html', import.meta.url));
  distHtml = readFileSync(distPath, 'utf-8');
}, 30000);

describe('page /plomberie/ — SEO (dist/, base-dépendant)', () => {
  it('has the requested <title>', () => {
    expect(distHtml).toContain(
      '<title>Plombier en urgence dans les Hauts-de-France | Belkhir Dépannage</title>',
    );
  });

  it('has a canonical URL under the real GitHub Pages subpath', () => {
    expect(distHtml).toContain(
      '<link rel="canonical" href="https://spiritzen.github.io/belkhir-depannage/plomberie/">',
    );
  });

  it('preserves the global indexing policy (noindex while numbers/flag are not confirmed)', () => {
    expect(distHtml).toContain('<meta name="robots" content="noindex, nofollow">');
  });

  it('the secondary CTA points to the real coverage section under the GitHub Pages subpath', () => {
    const match = distHtml.match(/class="hero__coverage-cta"[^>]*href="([^"]+)"/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('/belkhir-depannage/#zones-couvertes');
    expect(match?.[1]).not.toBe('#');
  });
});

describe('page /plomberie/ — Hero content', () => {
  it('contains exactly one H1 with the exact validated wording', () => {
    const matches = pageHtml.match(/<h1[\s>]/g) ?? [];
    expect(matches).toHaveLength(1);

    const h1Match = pageHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const visibleText = (h1Match?.[1] ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visibleText).toBe('Dépannage plomberie d’urgence dans les Hauts-de-France');
  });

  it('gives the hero background photo a useful, non-empty alt text', () => {
    expect(heroHtml).toContain(
      'alt="Technicien Belkhir Dépannage intervenant sur une fuite sous un évier"',
    );
  });

  it('renders the exact eyebrow, in the requested order', () => {
    const visible = heroHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visible).toContain('PLOMBERIE D’URGENCE · HAUTS-DE-FRANCE · 24H/24 · 7J/7');
  });

  it('renders the exact description paragraph', () => {
    expect(heroHtml).toContain(
      'Fuite d’eau, canalisation bouchée, robinet ou chasse d’eau défectueuse : notre équipe',
    );
    expect(heroHtml).toContain('vous indique les premiers gestes de sécurité');
  });

  it('never promises an unconfirmed delay, price or guarantee', () => {
    expect(heroHtml).not.toMatch(/moins d.une heure/i);
    expect(heroHtml).not.toMatch(/gratuit/i);
    expect(heroHtml).not.toMatch(/garanti/i);
  });
});

describe('page /plomberie/ — CTA principal (appel d’urgence)', () => {
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

describe('page /plomberie/ — CTA secondaire (Vérifier mon secteur)', () => {
  it('uses the exact requested label', () => {
    expect(heroHtml).toContain('Vérifier mon secteur');
  });

  it('never uses a dead anchor ("#" alone)', () => {
    expect(heroHtml).not.toMatch(/class="hero__coverage-cta"[^>]*href="#"/);
  });
});

describe('page /plomberie/ — preuve Google', () => {
  it('reuses the centralized rating data, never a new invented number', () => {
    const expectedRating = googleReviewSummary.rating.toFixed(1).replace('.', ',');
    expect(heroHtml).toContain(`${expectedRating}/5`);
    expect(heroHtml).toContain(
      `${googleReviewSummary.reviewCount} avis ${googleReviewSummary.platform}`,
    );
  });

  it('appears after the H1 and the CTA row in the DOM (stays secondary)', () => {
    const h1Index = heroHtml.indexOf('<h1');
    const ctaIndex = heroHtml.indexOf('hero__call-cta');
    const proofIndex = heroHtml.indexOf('hero__google-proof');
    expect(h1Index).toBeGreaterThan(-1);
    expect(ctaIndex).toBeGreaterThan(h1Index);
    expect(proofIndex).toBeGreaterThan(ctaIndex);
  });
});

describe('page /plomberie/ — navbar/footer réutilisés', () => {
  it('reuses the real shared Navbar (both phone lines present)', () => {
    const navbarMatch = pageHtml.match(/<header class="navbar"[\s\S]*?<\/header>/);
    expect(navbarMatch).not.toBeNull();
    expect(navbarMatch?.[0]).toContain('APPEL STANDARD');
    expect(navbarMatch?.[0]).toContain('APPEL URGENCE');
  });

  it('reuses the real shared Footer (brand initials colored, metiers links present)', () => {
    const footerMatch = pageHtml.match(/<footer class="site-footer"[\s\S]*?<\/footer>/);
    expect(footerMatch).not.toBeNull();
    expect(footerMatch?.[0]).toContain('footer__brand-initial');
    expect(footerMatch?.[0]).toContain('#service-plomberie');
  });

  it('reserves space for the fixed mobile call bar (hasMobileCallBar)', () => {
    expect(pageHtml).toContain('class="has-mobile-call-bar"');
    expect(pageHtml).toContain('id="mobile-call-bar"');
  });
});
