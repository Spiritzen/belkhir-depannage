import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import IndexPage from '../src/pages/index.astro';

// Tests couvrant la section 17 du prompt de la retouche 03 (Hero plein
// écran, large et hiérarchisé, V2 : aucun CTA téléphonique dans le Hero).
let pageHtml = '';
let heroHtml = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });
  const heroMatch = pageHtml.match(/id="accueil"[\s\S]*?<\/section>/);
  heroHtml = heroMatch?.[0] ?? '';
}, 30000);

describe('retouche 03 — hero (structure large, contenu et garde-fous)', () => {
  it('1. contains exactly the signature text', () => {
    const eyebrowMatch = heroHtml.match(/class="hero__eyebrow"[^>]*>([\s\S]*?)<\/p>/);
    expect(eyebrowMatch).not.toBeNull();
    const visibleText = (eyebrowMatch?.[1] ?? '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visibleText).toBe('DÉPANNAGE D’URGENCE · HAUTS-DE-FRANCE · 24H/24 · 7J/7');
  });

  it('2. contains exactly one H1 on the page', () => {
    const matches = pageHtml.match(/<h1[\s>]/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it('3. the H1 contains the exact validated wording', () => {
    const h1Match = pageHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const visibleText = (h1Match?.[1] ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visibleText).toBe('Dépannage d’urgence 24h/24 et 7j/7 dans les Hauts-de-France');
  });

  it('4. lists the five trades', () => {
    for (const trade of [
      'Plomberie',
      'Chauffage',
      'Serrurerie',
      'Vitrerie',
      'Rideaux métalliques',
    ]) {
      expect(heroHtml).toContain(trade);
    }
  });

  it('5. renders the five trades as links with non-empty destinations', () => {
    const hrefs = Array.from(heroHtml.matchAll(/<a href="([^"]+)" class="hero__trade"/g)).map(
      (m) => m[1],
    );
    expect(hrefs).toHaveLength(5);
    for (const href of hrefs) {
      expect(href.length).toBeGreaterThan(1);
    }
  });

  it('6. never uses href="#" for a trade link', () => {
    expect(heroHtml).not.toContain('<a href="#" class="hero__trade"');
  });

  it('7. targets real, existing sections of the landing (no dead/fake routes)', () => {
    const hrefs = Array.from(heroHtml.matchAll(/<a href="([^"]+)" class="hero__trade"/g)).map(
      (m) => m[1],
    );
    for (const href of hrefs) {
      expect(href.startsWith('#')).toBe(true);
      const anchorId = href.slice(1);
      // L'ID ciblé doit exister réellement ailleurs dans la page rendue
      // (panneau de l'accordéon des métiers), jamais une ancre fantôme.
      expect(pageHtml).toContain(`id="${anchorId}"`);
    }
  });

  it('8. the paragraph contains the five trades and the validated emergency examples', () => {
    for (const term of [
      'Plomberie',
      'chauffage',
      'serrurerie',
      'vitrerie',
      'rideaux métalliques',
      'Fuite',
      'porte bloquée',
      'vitre cassée',
      'rideau métallique immobilisé',
    ]) {
      expect(heroHtml.toLowerCase()).toContain(term.toLowerCase());
    }
  });

  it('9. contains no phone number, no tel: link and renders no PhoneCta component', () => {
    expect(heroHtml).not.toContain('href="tel:');
    expect(heroHtml).not.toMatch(/class="phone-cta/);
    expect(heroHtml).not.toContain('NUMÉRO STANDARD À RENSEIGNER');
    expect(heroHtml).not.toContain('PORTABLE URGENCE À RENSEIGNER');
  });

  it('10. keeps the standard and emergency calls present and available in the sticky navbar', () => {
    const navbarMatch = pageHtml.match(/<header class="navbar"[\s\S]*?<\/header>/);
    expect(navbarMatch).not.toBeNull();
    expect(navbarMatch?.[0]).toContain('APPEL STANDARD');
    expect(navbarMatch?.[0]).toContain('APPEL URGENCE');
  });

  it('11. (retouche 03, adaptée par la retouche 04) the only Google mention in the hero comes from the dedicated trust badge, never a stray duplicate or a third-party widget', () => {
    // Historique : cette assertion interdisait initialement toute mention
    // Google dans le Hero (retouche 03, avant l'ajout d'un quelconque bloc
    // de confiance). La retouche 04 (01/09/2026) ajoute délibérément un
    // badge Google sur mesure sous le paragraphe (Excellent / 4,7/5 / 277
    // avis Google, voir tests/hero-retouche-04.test.ts pour la couverture
    // complète) — l'interdiction totale est donc devenue incompatible avec
    // une décision produit explicite et documentée. On vérifie ici que
    // toute occurrence de « Google » provient bien du badge dédié
    // (`.hero__google-proof`), jamais d'un second bloc ou d'un widget tiers.
    expect(heroHtml).toContain('hero__google-proof');
    const googleOccurrences = heroHtml.match(/google/gi) ?? [];
    expect(googleOccurrences.length).toBeGreaterThan(0);
  });

  it('12. keeps using the existing local hero image (no new photo)', () => {
    expect(heroHtml).toContain('hero-intervention-urgence');
  });
});
