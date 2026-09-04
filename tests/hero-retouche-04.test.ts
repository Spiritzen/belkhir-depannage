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

  // MICRO-SPRINT « modale demande de devis » (04/09/2026, PROMPT_CLAUDE_
  // CODE_MICRO_SPRINT_MODALE_DEVIS.txt) : le bouton n'appelle plus la ligne
  // standard (garde-fou téléphonique devenu hors-sujet) — il ouvre la
  // modale partagée `QuoteModal.astro` et n'est donc plus jamais un lien ni
  // jamais désactivé. Couverture complète du comportement de la modale
  // dans tests/quote-modal.test.ts ; ce fichier ne couvre que le bouton du
  // Hero lui-même.
  it('5. never a dead #contact link, never href="#" (no href at all: the button now opens the shared quote modal instead)', () => {
    expect(heroHtml).not.toMatch(/class="hero__quote-cta"[^>]*href="#contact"/);
    expect(heroHtml).not.toMatch(/class="hero__quote-cta"[^>]*href="#"/);
    expect(heroHtml).not.toMatch(/class="hero__quote-cta"[^>]*href=/);
  });

  it('6. the button is a plain, always-enabled <button> that opens the shared quote modal — never disabled, regardless of the standard phone configuration', () => {
    const match = heroHtml.match(/<(a|button)[^>]*class="hero__quote-cta"[^>]*>/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('button');
    expect(match?.[0] ?? '').not.toContain('disabled');
    expect(match?.[0] ?? '').toContain('data-quote-trigger');
  });

  it('7. no hardcoded phone number appears on the button, and no leftover phone-placeholder guard note remains', () => {
    expect(heroHtml).not.toMatch(/0[1-9](?:[\s.-]?\d{2}){4}/);
    expect(heroHtml).not.toContain('id="hero-quote-note"');
    expect(heroHtml).not.toContain('Numéro standard non encore renseigné');
  });

  it('8. the button is never rendered as a link (a <button>, opening the shared modal, whatever the phone configuration)', () => {
    // Ancien contrat (numéro standard, getPhoneCta) devenu hors-sujet depuis
    // le micro-sprint « modale demande de devis » — voir le commentaire des
    // tests 5-7 ci-dessus.
    expect(heroHtml).not.toMatch(/<a[^>]*class="hero__quote-cta"/);
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

  it('21. the five trade links keep their order; two unchanged anchors, three real dedicated pages', () => {
    const hrefs = Array.from(heroHtml.matchAll(/<a href="([^"]+)" class="hero__trade"/g)).map(
      (m) => m[1],
    );
    expect(hrefs).toHaveLength(5);
    // Micro-sprint « accès à la page /plomberie/ » (03/09/2026, prompt
    // « ACCÈS À LA PAGE DEPUIS LA LANDING PAGE ») : le premier lien
    // (Plomberie) change de destination, vers la page dédiée réelle. Page
    // chauffage (04/09/2026) : même traitement pour le deuxième (Chauffage).
    // Page serrurerie (même jour) : même traitement pour le troisième
    // (Serrurerie). Page vitrerie (même jour) : même traitement pour le
    // quatrième (Vitrerie). Page rideaux métalliques (même jour) : même
    // traitement pour le cinquième et dernier (Rideaux métalliques) — plus
    // aucune ancre dans ce ruban.
    expect(hrefs[0].endsWith('/plomberie/')).toBe(true);
    expect(hrefs[1].endsWith('/chauffage/')).toBe(true);
    expect(hrefs[2].endsWith('/serrurerie/')).toBe(true);
    expect(hrefs[3].endsWith('/vitrerie/')).toBe(true);
    expect(hrefs[4].endsWith('/rideaux-metalliques/')).toBe(true);
  });

  it('22. a local hero photo is used — the exact photo was intentionally swapped by a later, explicit micro-correction (04/09/2026, PROMPT_CLAUDE_CODE_MICRO_CORRECTION_HERO_DESKTOP_IMAGE.txt)', () => {
    expect(heroHtml).toContain('hero-belkhir-depannage-desktop-bd');
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
