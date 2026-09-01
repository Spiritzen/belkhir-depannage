import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import IndexPage from '../src/pages/index.astro';
import { googleReviewSummary } from '../src/data/landing';

// Tests couvrant la section 20 du prompt de la retouche 04 (H1 maîtrisé,
// bouton de devis unique, badge de confiance Google sur mesure). Le socle
// de la retouche 03 (signature, métiers, texte du H1, absence de téléphone
// dans le Hero...) reste couvert par tests/hero-retouche-03.test.ts et n'est
// pas dupliqué ici.
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

describe('retouche 04 — hero (H1 maîtrisé, devis et confiance Google)', () => {
  it('1. contains exactly one H1 on the page', () => {
    const matches = pageHtml.match(/<h1[\s>]/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it('2. the H1 reconstructed text is exactly the validated wording', () => {
    const h1Match = pageHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const visibleText = (h1Match?.[1] ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visibleText).toBe('Dépannage d’urgence 24h/24 et 7j/7 dans les Hauts-de-France');
  });

  it('3. "Hauts-de-France" still carries the unbreakable class/strategy', () => {
    expect(heroHtml).toMatch(/class="hero__title-accent hero__title-region"[^>]*>Hauts-de-France/);
  });

  it('4. the "Demander un devis gratuit" button exists exactly once in the hero', () => {
    const occurrences = heroHtml.match(/Demander un devis gratuit/g) ?? [];
    expect(occurrences).toHaveLength(1);
  });

  // Micro-retouche suppression FinalCta (01/09/2026) : le bouton ne pointe
  // plus vers l'ancienne section #contact mais vers la ligne standard
  // centralisée, avec le même garde-fou que PhoneCta — jamais de faux
  // `tel:` tant que le numéro reste provisoire. Avec la configuration de
  // développement actuelle (numéros placeholders), l'élément est donc un
  // <button disabled>, jamais un <a href="#...">.
  it('5. never a dead #contact link, never href="#" (the old internal-anchor destination is gone)', () => {
    expect(heroHtml).not.toMatch(/class="hero__quote-cta"[^>]*href="#contact"/);
    expect(heroHtml).not.toMatch(/class="hero__quote-cta"[^>]*href="#"/);
  });

  it('6. with the current placeholder phone configuration, the button is disabled and produces no href at all', () => {
    const match = heroHtml.match(/<(a|button)[^>]*class="hero__quote-cta"[^>]*>/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('button');
    expect(match?.[0] ?? '').toContain('disabled');
    expect(match?.[0] ?? '').not.toMatch(/href=/);
  });

  it('7. no hardcoded phone number appears on the button, and it reuses the centralized guard note', () => {
    expect(heroHtml).not.toMatch(/0[1-9](?:[\s.-]?\d{2}){4}/);
    expect(heroHtml).toContain('id="hero-quote-note"');
    expect(heroHtml).toContain('Numéro standard non encore renseigné');
  });

  it('8. if the button were ever a link (real number configured), it would only ever use a tel: href, never an internal anchor', () => {
    // Documente le contrat attendu de getPhoneCta pour ce bouton : vérifié
    // structurellement plutôt que par une vraie configuration de numéro
    // (hors périmètre de ce test), voir src/lib/phone.ts (buildTelHref) et
    // tests/final-cta-removal.test.ts.
    const match = heroHtml.match(/<a[^>]*class="hero__quote-cta"[^>]*href="([^"]+)"/);
    if (match) {
      expect(match[1]).toMatch(/^tel:\+/);
    }
  });

  it('9. the hero displays "Excellent"', () => {
    expect(heroHtml).toContain('Excellent');
  });

  it('10. the hero displays "4,7/5" visually, even though the source value is the number 4.7', () => {
    expect(googleReviewSummary.rating).toBe(4.7);
    expect(heroHtml).toContain('4,7/5');
  });

  it('11. the hero displays "277 avis Google" (or an equivalent structure carrying the three pieces of data)', () => {
    expect(googleReviewSummary.reviewCount).toBe(277);
    expect(heroHtml).toContain('277 avis Google');
  });

  it('12. five decorative stars are rendered', () => {
    const starMatches = heroHtml.match(/class="hero__google-proof-star"/g) ?? [];
    expect(starMatches).toHaveLength(5);
  });

  it('13. the badge carries a complete accessible label', () => {
    expect(heroHtml).toContain(
      'aria-label="Excellent, note de 4,7 sur 5 basée sur 277 avis Google"',
    );
  });

  it('14. the badge never mentions Trustindex', () => {
    expect(heroHtml.toLowerCase()).not.toContain('trustindex');
  });

  it('15. no iframe exists in the hero', () => {
    expect(heroHtml.toLowerCase()).not.toContain('<iframe');
  });

  it('16. no external script is added for the badge (local HTML/CSS only)', () => {
    expect(heroHtml).not.toMatch(/<script[^>]+src=/);
  });

  it('17. no phone number exists in the hero', () => {
    expect(heroHtml).not.toMatch(/0[1-9](?:[\s.-]?\d{2}){4}/);
  });

  it('18. no tel: link exists in the hero', () => {
    expect(heroHtml).not.toContain('tel:');
  });

  it('19. no PhoneCta component is rendered in the hero', () => {
    expect(heroHtml).not.toMatch(/class="phone-cta/);
  });

  it('20. the standard and emergency calls remain present in the navbar', () => {
    const navbarMatch = pageHtml.match(/<header class="navbar"[\s\S]*?<\/header>/);
    expect(navbarMatch).not.toBeNull();
    expect(navbarMatch?.[0]).toContain('APPEL STANDARD');
    expect(navbarMatch?.[0]).toContain('APPEL URGENCE');
  });

  it('21. the five trade links and their destinations remain unchanged', () => {
    const hrefs = Array.from(heroHtml.matchAll(/<a href="([^"]+)" class="hero__trade"/g)).map(
      (m) => m[1],
    );
    expect(hrefs).toEqual([
      '#service-plomberie',
      '#service-chauffage',
      '#service-serrurerie',
      '#service-vitrerie',
      '#service-rideaux-metalliques',
    ]);
  });

  it('22. the current hero photo is still used', () => {
    expect(heroHtml).toContain('hero-intervention-urgence');
  });

  it('23. the Google data comes from a centralized source, not a hardcoded duplicate', () => {
    // La bande TrustGoogle.astro, qui consommait aussi ces données, a été
    // supprimée par une micro-retouche ultérieure (01/09/2026) — le badge
    // du Hero reste seul consommateur affiché sur la page. On vérifie ici
    // directement que son contenu correspond à la source centralisée
    // `googleReviewSummary` (src/data/landing.ts), plutôt que de comparer
    // deux emplacements affichés.
    const expectedRating = googleReviewSummary.rating.toFixed(1).replace('.', ',');
    expect(heroHtml).toContain(`${expectedRating}/5`);
    expect(heroHtml).toContain(
      `${googleReviewSummary.reviewCount} avis ${googleReviewSummary.platform}`,
    );
  });

  it('24. no "Découvrir nos services" button is added to the hero', () => {
    expect(heroHtml).not.toContain('Découvrir nos services');
  });

  it('25. no second CTA is added (exactly one hero__quote-cta link)', () => {
    const occurrences = heroHtml.match(/class="hero__quote-cta"/g) ?? [];
    expect(occurrences).toHaveLength(1);
  });

  it('26. the google badge is a real link, never href="#"', () => {
    const match = heroHtml.match(/class="hero__google-proof" href="([^"]+)"/);
    expect(match).not.toBeNull();
    expect(match?.[1]).not.toBe('#');
    expect((match?.[1] ?? '').length).toBeGreaterThan(1);
  });

  it('27. the google badge target points to a real anchor on the page (Avis section) given no validated Google Business URL exists yet', () => {
    const match = heroHtml.match(/class="hero__google-proof" href="([^"]+)"/);
    const href = match?.[1] ?? '';
    expect(href).toBe('#avis');
    expect(pageHtml).toContain('id="avis"');
  });
});
