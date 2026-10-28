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

  it('14. never links to a non-existent route (only anchors, external links, tel: links, real known pages, or disabled placeholders)', () => {
    // Ne cible que les liens de navigation (<a href>), pas les <link> techniques
    // (favicon, sitemap...) qui pointent légitimement vers un asset statique.
    const hrefs = Array.from(html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)).map((match) => match[1]);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      // Micro-correction « navigation depuis les pages métiers » (03/09/2026) :
      // la navigation partagée (navbar, drawer mobile, footer) préfixe
      // désormais ses ancres avec `base` pour fonctionner aussi depuis une
      // page métier comme /plomberie/ (ex. "/#depannages" en local, voir
      // src/data/landing.ts) — un fragment n'est donc plus forcément en
      // toute première position du href.
      const isAnchor = href.includes('#');
      const isExternal = /^https?:\/\//.test(href);
      const isRoot = href === '/';
      // Le numéro d'urgence est désormais officiel : son unique lien tel:
      // réel est légitime (correctif d'architecture, 01/09/2026).
      const isEmergencyTel = href === 'tel:+33649621619';
      // Micro-sprint « accès à la page /plomberie/ » (03/09/2026, prompt
      // « ACCÈS À LA PAGE DEPUIS LA LANDING PAGE ») : première page métier
      // réelle (créée au micro-sprint précédent), désormais liée depuis le
      // Hero, l'accordéon des domaines d'intervention et le sélecteur
      // d'urgence. Page chauffage (04/09/2026, PROMPT_CLAUDE_CODE_PAGE_
      // CHAUFFAGE_PATTERN_COMPLET.txt) puis serrurerie puis vitrerie puis
      // rideaux métalliques (même jour) : pages métier réelles suivantes,
      // même traitement. Pages politique de confidentialité puis mentions
      // légales (même jour, PROMPT_CLAUDE_CODE_PAGE_POLITIQUE_
      // CONFIDENTIALITE.txt puis PROMPT_CLAUDE_CODE_PAGE_MENTIONS_LEGALES.txt) :
      // les deux liens footer juridiques sont désormais activés vers ces
      // pages réelles non-métier.
      const isMetierPage =
        href.endsWith('/plomberie/') ||
        href.endsWith('/chauffage/') ||
        href.endsWith('/serrurerie/') ||
        href.endsWith('/vitrerie/') ||
        href.endsWith('/rideaux-metalliques/');
      const isLegalPage =
        href.endsWith('/politique-de-confidentialite/') || href.endsWith('/mentions-legales/');
      // Page « zones d'intervention » (radar, commit c12704d) : page réelle non-métier.
      const isZonesPage = href.endsWith('/zones-intervention/');
      expect(
        isAnchor ||
          isExternal ||
          isRoot ||
          isEmergencyTel ||
          isMetierPage ||
          isLegalPage ||
          isZonesPage,
        `unexpected internal route link: ${href}`,
      ).toBe(true);
    }
  });

  it('15. keeps the preview mention, with no placeholder wording in the interventions', () => {
    expect(html).toContain('Maquette de prévisualisation');
    expect(html).not.toContain('Avis Google à connecter');
    const latest = html.match(/<section class="latest"[\s\S]*?<\/section>/)?.[0] ?? '';
    expect(latest).toContain('Nos interventions sur le terrain');
    expect(latest).not.toMatch(/exemple|Content Collections|à connecter|en attente/i);
  });

  it('16. shows the legacy logo in both the navbar and the footer', () => {
    const logoOccurrences = html.match(/logo-belkhir-depannage/g) ?? [];
    expect(logoOccurrences.length).toBeGreaterThanOrEqual(2);
  });

  it('17. uses a local hero image, self-hosted (desktop photo intentionally swapped for the brand photo by a later, explicit micro-correction — 04/09/2026, PROMPT_CLAUDE_CODE_MICRO_CORRECTION_HERO_DESKTOP_IMAGE.txt)', () => {
    expect(html).toContain('hero-belkhir-depannage-desktop-bd');
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

  it('23. the photographic services grid renders two non-interactive cards and four real links to dedicated pages, no dead #contact link', () => {
    // Historique : d'abord des <button> qui dépliaient un panneau en place,
    // puis de vrais liens <a href> vers #contact (refonte « Nos domaines
    // d'intervention »). Depuis la suppression de FinalCta (01/09/2026) et
    // en l'absence de pages métier dédiées, les six cartes n'étaient plus
    // des liens (<article>, sans href) plutôt que de pointer vers une ancre
    // morte. Micro-sprint « accès à la page /plomberie/ » (03/09/2026) :
    // Plomberie et Fuites et anomalies redeviennent de vrais liens vers la
    // page dédiée réelle. Page chauffage puis serrurerie puis vitrerie puis
    // rideaux métalliques (04/09/2026) rejoignent ce groupe ; les six
    // cartes sont désormais toutes des liens réels. Couverture complète
    // dans tests/services-accordion-domaines.test.ts.
    const articles = html.match(/<article id="service-[^"]+" class="service-card"/g) ?? [];
    expect(articles).toHaveLength(0);

    const links = Array.from(
      html.matchAll(
        /<a id="(service-plomberie|service-fuites-anomalies|service-chauffage|service-serrurerie|service-vitrerie|service-rideaux-metalliques)" href="([^"]+)" class="service-card"/g,
      ),
    );
    expect(links).toHaveLength(6);
    // Affiné au micro-sprint 2 (04/09/2026) : « Plomberie »/« Chauffage »/
    // « Serrurerie »/« Vitrerie »/« Rideaux métalliques » pointent vers le
    // haut de leur page dédiée, « Fuites et anomalies » vers sa section
    // « premiers gestes » réelle (id="urgences-plomberie").
    const hrefById = Object.fromEntries(links.map(([, id, href]) => [id, href]));
    expect(hrefById['service-plomberie']).toMatch(/\/plomberie\/$/);
    expect(hrefById['service-fuites-anomalies']).toMatch(/\/plomberie\/#urgences-plomberie$/);
    expect(hrefById['service-chauffage']).toMatch(/\/chauffage\/$/);
    expect(hrefById['service-serrurerie']).toMatch(/\/serrurerie\/$/);
    expect(hrefById['service-vitrerie']).toMatch(/\/vitrerie\/$/);
    expect(hrefById['service-rideaux-metalliques']).toMatch(/\/rideaux-metalliques\/$/);

    expect(html).not.toContain('href="#contact"');
  });

  it('24. keeps content immediately visible by default (reveal state opt-in via JS only)', () => {
    expect(html).not.toContain('js-reveal-ready');
    expect(html).toContain('data-reveal="up"');
  });
});
