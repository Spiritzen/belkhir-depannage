import { ROBOTS_META } from './helpers/indexing';
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

  it('has a canonical URL on the LWS root domain', () => {
    expect(distHtml).toContain(
      '<link rel="canonical" href="https://belkhir-depannage-hdf.fr/politique-de-confidentialite/">',
    );
  });

  it('preserves the global indexing policy (noindex while numbers/flag are not confirmed) — not touched by this mission', () => {
    expect(distHtml).toContain(ROBOTS_META);
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
      'outil publicitaire et aucun dispositif de suivi ne collecte vos coordonnées pendant votre',
    );
    expect(heroHtml).toContain('seul le formulaire de devis, rempli à votre initiative');
  });

  it('renders the three short proofs', () => {
    expect(heroHtml).toContain('Formulaire à votre initiative');
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
  it('shows the official controller identity, with the registered office as postal address', () => {
    const section =
      pageHtml.match(/<section[^>]*id="responsable-traitement"[\s\S]*?<\/section>/)?.[0] ?? '';
    const text = section.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    expect(text).toContain('BELKHIR DEPANNAGE');
    expect(text).toContain('Société par actions simplifiée (SAS)');
    expect(text).toContain('977 900 216');
    expect(text).toContain('977 900 216 00010');
    expect(text.toLowerCase().replace(/[.,]/g, '')).toContain('13 bis rue du pont blanc');
    expect(text).toContain('80300 Albert');
    expect(text).toContain('belkhirdepannage@gmail.com');
    expect(text).not.toContain('[À COMPLÉTER');
    const page = pageHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    expect(page).toContain('BELKHIR DEPANNAGE, 13 bis rue du Pont Blanc, 80300 Albert, France');
    expect(page).not.toContain('[À COMPLÉTER AVANT MISE EN LIGNE]');
  });

  it('minimisation: no capital, RCS, birth data, nationality, headcount, old SIREN or director name', () => {
    const page = pageHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    expect(page).not.toContain('907 702 377');
    expect(page).not.toMatch(/capital|RCS|1984|nationalité|date de naissance|effectif/i);
    expect(page).not.toContain('Fouad');
  });

  it('no longer carries any placeholder marker: the form is described as really connected', () => {
    expect(pageHtml).not.toContain('[À COMPLÉTER');
    expect(pageHtml).not.toContain('non raccordé');
    expect(pageHtml).not.toContain('pas encore raccordée');
    expect(pageHtml).not.toContain('aucune information saisie n’est transmise');
  });

  it('the data controller is explicitly BELKHIR DEPANNAGE, never GitHub nor the developer', () => {
    expect(pageHtml).toContain('jamais l’hébergeur, ni le développeur du site');
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

  it('names LWS as the host for technical logs and no longer mentions GitHub', () => {
    expect(pageHtml).toContain('hébergé par LWS (Ligne Web Services SAS)');
    expect(pageHtml).toContain('user-agent');
    expect(pageHtml).not.toContain('GitHub');
  });

  it('documents the connected quote form: recipient, purpose, legal basis, access, one-year retention', () => {
    const page = pageHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    expect(page).toContain('Formulaire de demande de devis');
    expect(page).toContain('formulaire@belkhir-depannage-hdf.fr');
    expect(page).toContain('traiter votre demande de devis et vous recontacter');
    expect(page).toContain('mesures précontractuelles');
    expect(page).toContain('personnes habilitées de BELKHIR DEPANNAGE');
    expect(page).toContain('jusqu’à un an');
    expect(page).toContain('obligations légales applicables');
    expect(page).not.toMatch(/j’accepte|consentement obligatoire/i);
    expect(page.toLowerCase()).not.toContain('accepter les cookies');
  });

  it('distinguishes Google external links and adds no cookie banner', () => {
    expect(pageHtml).toContain('Liens externes vers Google');
    expect(pageHtml.toLowerCase()).not.toContain('accepter les cookies');
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
    expect(lower).not.toMatch(/\bdpo\b/);
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
