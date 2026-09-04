import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import PolitiqueConfidentialitePage from '../src/pages/politique-de-confidentialite/index.astro';
import IndexPage from '../src/pages/index.astro';

// Tests ciblés pour /politique-de-confidentialite/ (PROMPT_CLAUDE_CODE_PAGE_
// POLITIQUE_CONFIDENTIALITE.txt, 04/09/2026) : Hero abstrait sans photo,
// informations administratives exactes, aucun cookie/formulaire/tracker
// ajouté, lien footer activé.
//
// Même limite d'environnement documentée par tests/plomberie-page.test.ts et
// tests/prepub-corrections.test.ts : les assertions dépendant de `base`
// lisent `dist/` (PRÉREQUIS : `npm run build` déjà exécuté).
let pageHtml = '';
let heroHtml = '';
let distHtml = '';
let indexHtml = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(PolitiqueConfidentialitePage, {
    request: new Request('http://localhost/politique-de-confidentialite/'),
  });
  const heroMatch = pageHtml.match(/<section class="privacy-hero"[\s\S]*?<\/section>/);
  heroHtml = heroMatch?.[0] ?? '';

  indexHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });

  const distPath = fileURLToPath(
    new URL('../dist/politique-de-confidentialite/index.html', import.meta.url),
  );
  distHtml = readFileSync(distPath, 'utf-8');
}, 30000);

describe('page /politique-de-confidentialite/ — SEO (dist/, base-dépendant)', () => {
  it('has the requested <title>', () => {
    expect(distHtml).toContain('<title>Politique de confidentialité | Belkhir Dépannage</title>');
  });

  it('has a canonical URL under the real GitHub Pages subpath', () => {
    expect(distHtml).toContain(
      '<link rel="canonical" href="https://spiritzen.github.io/belkhir-depannage/politique-de-confidentialite/">',
    );
  });

  it('preserves the global indexing policy (noindex while numbers/flag are not confirmed) — not touched by this mission', () => {
    expect(distHtml).toContain('<meta name="robots" content="noindex, nofollow">');
  });

  it('never emits a WebPage or BreadcrumbList JSON-LD schema (pattern not yet used by any real page)', () => {
    expect(distHtml).not.toContain('application/ld+json');
  });
});

describe('page /politique-de-confidentialite/ — Hero abstrait, sans photo', () => {
  it('contains exactly one H1 with the exact validated wording', () => {
    const matches = pageHtml.match(/<h1[\s>]/g) ?? [];
    expect(matches).toHaveLength(1);
    const h1Match = pageHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const visibleText = (h1Match?.[1] ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visibleText).toBe('Vos informations restent au service de votre urgence');
  });

  it('renders the exact eyebrow and intro paragraph', () => {
    expect(heroHtml).toContain('CONFIDENTIALITÉ · TRANSPARENCE · RESPECT');
    expect(heroHtml).toContain(
      'Aucun formulaire, aucun outil publicitaire et aucun dispositif de suivi ne collecte vos',
    );
  });

  it('renders the three short proofs', () => {
    expect(heroHtml).toContain('Aucun formulaire');
    expect(heroHtml).toContain('Aucun cookie');
    expect(heroHtml).toContain('Aucune revente de données');
  });

  it('never uses a raster <img> or a background photograph (abstract SVG only)', () => {
    expect(heroHtml).not.toContain('<img');
    expect(heroHtml).not.toContain('<picture');
    expect(heroHtml).toContain('<svg');
    expect(heroHtml).toContain('privacy-hero__shield');
  });

  it('the SVG visual is decorative, never conveying legal text as an image', () => {
    const svgMatch = heroHtml.match(/<svg[^>]*>/);
    expect(svgMatch).not.toBeNull();
    expect(svgMatch?.[0]).toContain('aria-hidden="true"');
    expect(heroHtml).not.toMatch(/<svg[\s\S]*?<text/);
  });

  // CORRECTION P0 (DOUBLE CORRECTION P0 — DIALOG FERMÉ ET RETOUR RÉEL EN
  // HAUT DE PAGE, 04/09/2026) : `homeHref` cible désormais `#top` (sommet
  // réel du document) plutôt que `#accueil` (id du Hero de la landing,
  // positionné sous le bandeau de disponibilité et la navbar sticky).
  it('the "Retour à l’accueil" link targets the real document top with base', () => {
    const match = heroHtml.match(/class="privacy-hero__back" href="([^"]+)"/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toMatch(/#top$/);
  });

  it('has no commercial CTA in the Hero (calls stay in the shared navbar/call bar)', () => {
    expect(heroHtml).not.toContain('tel:+33649621619');
    expect(heroHtml).not.toContain('hero__call-cta');
  });
});

describe('page /politique-de-confidentialite/ — informations administratives exactes', () => {
  it('renders the exact validated legal identity, never reformulated', () => {
    expect(pageHtml).toContain('BELKHIR DEPANNAGE');
    expect(pageHtml).toContain('Société par actions simplifiée unipersonnelle (SASU)');
    expect(pageHtml).toContain('Fouad BELKHIR');
    expect(pageHtml).toContain('977 900 216');
    expect(pageHtml).toContain('977 900 216 00010');
    expect(pageHtml).toContain('Amiens 977 900 216');
    expect(pageHtml).toContain('1 000 €');
    expect(pageHtml).toContain('13 bis rue du Pont Blanc, 80300 Albert, France');
  });

  it('the data controller is explicitly BELKHIR DEPANNAGE, never GitHub nor the developer', () => {
    expect(pageHtml).toContain('jamais GitHub, ni le développeur du site');
  });

  it('the real mailto: link is used for the contact/rights-exercise address', () => {
    const mailtoLinks = pageHtml.match(/href="mailto:belkhirdepannage@gmail\.com"/g) ?? [];
    expect(mailtoLinks.length).toBeGreaterThanOrEqual(3);
  });

  it('links to the real CNIL complaint page as an identified external link', () => {
    expect(pageHtml).toMatch(
      /href="https:\/\/www\.cnil\.fr\/fr\/plaintes"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/,
    );
  });

  it('links to the real GitHub privacy policy as an identified external link', () => {
    expect(pageHtml).toMatch(
      /href="https:\/\/docs\.github\.com\/site-policy\/privacy-policies\/github-general-privacy-statement"[^>]*target="_blank"/,
    );
  });
});

describe('page /politique-de-confidentialite/ — aucun cookie, formulaire ou tracker ajouté', () => {
  it('never contains a <form> element of its own — the shared quote-request modal now rendered globally by BaseLayout.astro on every page (MICRO-SPRINT modale devis, 04/09/2026) is excluded here: it is sitewide UI, not specific to this page, stays hidden until a visitor explicitly opens it, and makes zero network request or storage until a real backend exists', () => {
    const withoutSharedQuoteModal = pageHtml.replace(
      /<dialog id="quote-modal"[\s\S]*?<\/dialog>/,
      '',
    );
    expect(withoutSharedQuoteModal).not.toContain('<form');
  });

  it('never contains a cookie-consent banner or button', () => {
    const lower = pageHtml.toLowerCase();
    expect(lower).not.toContain('accepter les cookies');
    expect(lower).not.toContain('cookie-banner');
    expect(lower).not.toContain('cookie-consent');
  });

  it('never references Google Analytics, Google Tag Manager, or any ad pixel', () => {
    const lower = pageHtml.toLowerCase();
    for (const forbidden of ['gtag(', 'googletagmanager', 'google-analytics', 'fbq(']) {
      expect(lower).not.toContain(forbidden);
    }
  });

  it('explicitly states no cookie/tracker is used and no consent banner is needed', () => {
    expect(pageHtml).toContain('aucun cookie ni traceur n’est déposé par le site');
    expect(pageHtml).toContain('aucun bandeau de consentement n’est donc nécessaire');
  });

  it('never invents a false DPO or an absolute security/compliance promise', () => {
    const lower = pageHtml.toLowerCase();
    expect(lower).not.toContain('délégué à la protection des données');
    expect(lower).not.toContain('dpo');
    expect(lower).not.toContain('conformité totale');
    expect(pageHtml).toContain('aucune promesse de sécurité absolue');
  });

  it('never claims a commercial use of the collected coordinates', () => {
    expect(pageHtml).toContain(
      'ne sont ni vendues, ni louées, ni cédées à des partenaires à des fins de publicité',
    );
  });
});

describe('page /politique-de-confidentialite/ — navbar/footer réutilisés', () => {
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

describe('maillage footer vers /politique-de-confidentialite/', () => {
  it('the footer "Confidentialité" entry is now a real link to the dedicated page', () => {
    const footerMatch = indexHtml.match(/<footer class="site-footer"[\s\S]*?<\/footer>/);
    expect(footerMatch).not.toBeNull();
    expect(footerMatch?.[0]).toMatch(
      /href="[^"]*\/politique-de-confidentialite\/"[^>]*>Confidentialité</,
    );
  });

  it('"Mentions légales" is now also a real link (activated the same day, PROMPT_CLAUDE_CODE_PAGE_MENTIONS_LEGALES.txt) — full coverage in tests/mentions-legales-page.test.ts', () => {
    const footerMatch = indexHtml.match(/<footer class="site-footer"[\s\S]*?<\/footer>/);
    expect(footerMatch?.[0]).toMatch(/href="[^"]*\/mentions-legales\/"[^>]*>Mentions légales</);
  });
});

describe('non-régression — landing et pages métier inchangées', () => {
  it('landing hero and trades ribbon are untouched', () => {
    expect(indexHtml).toContain('id="accueil"');
    const tradeLinks = indexHtml.match(/class="hero__trade"/g) ?? [];
    expect(tradeLinks).toHaveLength(5);
  });
});
