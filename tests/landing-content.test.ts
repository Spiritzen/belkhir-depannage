import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import IndexPage from '../src/pages/index.astro';
import { legacyAssets } from '../src/data/legacy-assets';

let html = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  html = await container.renderToString(IndexPage, { request: new Request('http://localhost/') });
}, 30000);

describe('landing page — contenu et garde-fous (section 29 du prompt de mission)', () => {
  it('1. contains exactly one H1', () => {
    const matches = html.match(/<h1[\s>]/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it('2. lists the five primary trades within the first screen (hero pills)', () => {
    for (const trade of [
      'Plomberie',
      'Chauffage',
      'Serrurerie',
      'Vitrerie',
      'Rideaux métalliques',
    ]) {
      expect(html).toContain(trade);
    }
  });

  it('3. mentions "Hauts-de-France"', () => {
    expect(html).toContain('Hauts-de-France');
  });

  it('4. mentions "24h/24" and "7j/7"', () => {
    expect(html).toContain('24h/24');
    expect(html).toContain('7j/7');
  });

  it('5. shows both "Standard" and "Urgence extrême" labels', () => {
    expect(html).toContain('Standard');
    expect(html).toContain('Urgence extrême');
  });

  it('6. never reuses a legacy site phone number', () => {
    expect(html).not.toContain('0259229890');
    expect(html).not.toContain('0376212902');
    expect(html).not.toContain('2 59 22 98 90');
    expect(html).not.toContain('3 76 21 29 02');
  });

  it('7. does not mention "Amiens" in the H1 or the hero section', () => {
    const h1Match = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/);
    expect(h1Match?.[0] ?? '').not.toContain('Amiens');

    const heroMatch = html.match(/id="accueil"[\s\S]*?<\/section>/);
    expect(heroMatch?.[0] ?? '').not.toContain('Amiens');
  });

  it('8. never mentions "Fouad" anywhere on the landing (team framing only)', () => {
    expect(html).not.toContain('Fouad');
  });

  it('9. never generates a tel: link for the standard number, still incomplete/provisional (placeholder state)', () => {
    // Le numéro standard n'est toujours pas renseigné : aucun lien tel: ne
    // doit être produit pour lui, uniquement un libellé explicite. Le
    // numéro d'urgence, lui, est désormais officiel et versionné
    // directement dans site-config.ts (correctif d'architecture,
    // 01/09/2026) : il produit bien un vrai lien tel:, couvert par
    // tests/emergency-phone-activation.test.ts.
    expect(html).not.toMatch(/data-phone-role="standard"[^>]*href="tel:/);
    expect(html).toContain('NUMÉRO STANDARD À RENSEIGNER');
    expect(html).not.toContain('PORTABLE URGENCE À RENSEIGNER');
  });

  it('11. keeps the page non-indexable by default (noindex, nofollow)', () => {
    expect(html).toContain('content="noindex, nofollow"');
  });

  it('12. renders an accessible mobile navigation (drawer with dialog semantics, hamburger control)', () => {
    expect(html).toContain('id="mobile-drawer"');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('id="menu-toggle"');
    expect(html).toContain('aria-controls="mobile-drawer"');
  });

  it('13. renders an accessible FAQ accordion (button + aria-expanded + labelled region)', () => {
    expect(html).toMatch(/class="faq__trigger"[^>]*aria-expanded="false"/);
    expect(html).toContain('role="region"');
    for (const question of [
      'Quels dépannages prenez-vous en charge ?',
      'Intervenez-vous 24h/24 et 7j/7 ?',
      'Quel numéro dois-je appeler ?',
    ]) {
      expect(html).toContain(question);
    }
  });

  it('14. never links to a non-existent route (only anchors, external links, tel: links, or disabled placeholders)', () => {
    // Ne cible que les liens de navigation (<a href>), pas les <link> techniques
    // (favicon, sitemap...) qui pointent légitimement vers un asset statique.
    const hrefs = Array.from(html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)).map((match) => match[1]);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      const isAnchor = href.startsWith('#');
      const isExternal = /^https?:\/\//.test(href);
      const isRoot = href === '/';
      // Le numéro d'urgence est désormais officiel : son unique lien tel:
      // réel est légitime (correctif d'architecture, 01/09/2026).
      const isEmergencyTel = href === 'tel:+33649621619';
      expect(
        isAnchor || isExternal || isRoot || isEmergencyTel,
        `unexpected internal route link: ${href}`,
      ).toBe(true);
    }
  });

  it('15. marks preview/mock data explicitly (isPreview, mock reviews and interventions)', () => {
    expect(html).toContain('Maquette de prévisualisation');
    expect(html).toContain('Avis Google à connecter');
    expect(html).toContain('exemple');
  });

  it('16. shows the legacy logo in both the navbar and the footer', () => {
    const logoOccurrences = html.match(/logo-belkhir-depannage/g) ?? [];
    expect(logoOccurrences.length).toBeGreaterThanOrEqual(2);
  });

  it('17. uses the legacy hero image locally (built asset derived from 2151015241.jpg)', () => {
    expect(html).toContain('hero-intervention-urgence');
  });

  it('18. documents the legacy media manifest with real source URLs and local paths', () => {
    expect(legacyAssets.length).toBeGreaterThan(0);
    const logo = legacyAssets.find((asset) => asset.id === 'logo');
    expect(logo?.sourceUrl).toContain('belkhir-depannage80.fr');
    expect(logo?.localPath).toContain('src/assets/legacy/');
  });

  it('19. never leaks a wp-content URL into the generated HTML', () => {
    expect(html).not.toContain('wp-content');
  });

  it('20. never leaks the legacy domain into the generated HTML', () => {
    expect(html).not.toContain('belkhir-depannage80.fr');
  });

  it('21. never imports Elementor, WordPress, Trustindex or Mindset assets', () => {
    for (const forbidden of ['elementor', 'wp-content', 'wp-includes', 'trustindex', 'mindset']) {
      expect(html.toLowerCase()).not.toContain(forbidden);
    }
  });

  it('22. uses real legacy photographs in the trades accordion section', () => {
    expect(html).toContain('id="service-plomberie"');
    expect(html).toContain('id="service-serrurerie"');
    expect(html).toContain('accordeon-plomberie');
    expect(html).toContain('accordeon-serrurerie');
  });

  it('23. the photographic services grid renders six non-interactive cards, no dead #contact link (micro-retouche 01/09/2026)', () => {
    // Historique : d'abord des <button> qui dépliaient un panneau en place,
    // puis de vrais liens <a href> vers #contact (refonte « Nos domaines
    // d'intervention »). Depuis la suppression de FinalCta (01/09/2026) et
    // en l'absence de pages métier dédiées, les cartes ne sont plus des
    // liens (<article>, sans href) plutôt que de pointer vers une ancre
    // morte. Couverture complète dans tests/services-accordion-domaines.test.ts
    // et tests/final-cta-removal.test.ts.
    const matches = html.match(/<article id="service-[^"]+" class="service-card"/g) ?? [];
    expect(matches).toHaveLength(6);
    expect(html).not.toMatch(/<a\s[^>]*id="service-[^"]+" class="service-card"/);
    expect(html).not.toContain('href="#contact"');
  });

  it('24. keeps content immediately visible by default (reveal state opt-in via JS only)', () => {
    expect(html).not.toContain('js-reveal-ready');
    expect(html).toContain('data-reveal="up"');
  });
});
