import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import MentionsLegalesPage from '../src/pages/mentions-legales/index.astro';
import IndexPage from '../src/pages/index.astro';

// Tests ciblés pour /mentions-legales/ (PROMPT_CLAUDE_CODE_PAGE_MENTIONS_
// LEGALES.txt, 04/09/2026) : Hero abstrait propre (jamais une recopie du
// Hero confidentialité), informations juridiques exactes (éditeur,
// direction de la publication, hébergeur), bloc médiateur explicitement
// « reste à compléter », attribution cartographique, deux liens footer
// activés.
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
  pageHtml = await container.renderToString(MentionsLegalesPage, {
    request: new Request('http://localhost/mentions-legales/'),
  });
  const heroMatch = pageHtml.match(/<section class="mentions-hero"[\s\S]*?<\/section>/);
  heroHtml = heroMatch?.[0] ?? '';

  indexHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });

  const distPath = fileURLToPath(new URL('../dist/mentions-legales/index.html', import.meta.url));
  distHtml = readFileSync(distPath, 'utf-8');
}, 30000);

describe('page /mentions-legales/ — SEO (dist/, base-dépendant)', () => {
  it('has the requested <title>', () => {
    expect(distHtml).toContain('<title>Mentions légales | Belkhir Dépannage</title>');
  });

  it('has a canonical URL under the real GitHub Pages subpath', () => {
    expect(distHtml).toContain(
      '<link rel="canonical" href="https://spiritzen.github.io/belkhir-depannage/mentions-legales/">',
    );
  });

  it('preserves the global indexing policy (noindex) — not touched by this mission', () => {
    expect(distHtml).toContain('<meta name="robots" content="noindex, nofollow">');
  });

  it('never emits a WebPage/Organization/BreadcrumbList JSON-LD schema (pattern not yet used by any real page)', () => {
    expect(distHtml).not.toContain('application/ld+json');
  });
});

describe('page /mentions-legales/ — Hero abstrait, propre à cette page', () => {
  it('contains exactly one H1 with the exact validated wording', () => {
    const matches = pageHtml.match(/<h1[\s>]/g) ?? [];
    expect(matches).toHaveLength(1);
    const h1Match = pageHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const visibleText = (h1Match?.[1] ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visibleText).toBe('Une entreprise clairement identifiée');
  });

  it('renders the exact eyebrow, intro and three short proofs', () => {
    expect(heroHtml).toContain('INFORMATIONS LÉGALES · TRANSPARENCE');
    expect(heroHtml).toContain(
      'Retrouvez les informations relatives à l’éditeur, au responsable de la publication',
    );
    expect(heroHtml).toContain('SASU');
    expect(heroHtml).toContain('RCS Amiens');
    expect(heroHtml).toContain('SIREN 977 900 216');
  });

  it('never uses a raster <img> or a background photograph (abstract SVG only)', () => {
    expect(heroHtml).not.toContain('<img');
    expect(heroHtml).not.toContain('<picture');
    expect(heroHtml).toContain('<svg');
  });

  it('uses its own visual identity, never the confidentialité Hero shield/lock markup', () => {
    expect(heroHtml).toContain('mentions-hero__document');
    expect(heroHtml).toContain('mentions-hero__seal');
    expect(heroHtml).not.toContain('privacy-hero__shield');
    expect(heroHtml).not.toContain('privacy-hero__lock');
  });

  it('the SVG never embeds meaningful legal text, only a short brand monogram', () => {
    const textMatch = heroHtml.match(/<text[^>]*>([^<]*)<\/text>/);
    expect(textMatch).not.toBeNull();
    expect((textMatch?.[1] ?? '').trim()).toBe('BD');
  });

  // CORRECTION P0 (DOUBLE CORRECTION P0 — DIALOG FERMÉ ET RETOUR RÉEL EN
  // HAUT DE PAGE, 04/09/2026) : `homeHref` cible désormais `#top` (sommet
  // réel du document) plutôt que `#accueil` (id du Hero de la landing,
  // positionné sous le bandeau de disponibilité et la navbar sticky).
  it('the "Retour à l’accueil" link targets the real document top with base', () => {
    const match = heroHtml.match(/class="mentions-hero__back" href="([^"]+)"/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toMatch(/#top$/);
  });

  it('has no commercial CTA in the Hero (calls stay in the shared navbar/call bar)', () => {
    expect(heroHtml).not.toContain('tel:+33649621619');
  });
});

describe('page /mentions-legales/ — éditeur, direction de la publication, hébergeur', () => {
  it('renders the exact validated publisher identity, never reformulated', () => {
    expect(pageHtml).toContain('BELKHIR DEPANNAGE');
    expect(pageHtml).toContain('Société par actions simplifiée unipersonnelle (SASU)');
    expect(pageHtml).toContain('1 000 €');
    expect(pageHtml).toContain('13 bis rue du Pont Blanc, 80300 Albert, France');
    expect(pageHtml).toContain('977 900 216');
    expect(pageHtml).toContain('977 900 216 00010');
    expect(pageHtml).toContain('Amiens 977 900 216');
    expect(pageHtml).toContain('FR68 977900216');
  });

  it('never publishes the fake standard phone or its placeholder in the editeur section (shared navbar/footer keep their own pre-existing placeholder, out of scope here)', () => {
    const section = pageHtml.match(/<section[^>]*id="editeur"[\s\S]*?<\/section>/)?.[0] ?? '';
    expect(section).not.toContain('NUMÉRO STANDARD À RENSEIGNER');
    expect(section).not.toContain('03 XX XX XX XX');
  });

  it('the real emergency tel: link is used for the editor phone number', () => {
    const telLinks = pageHtml.match(/href="tel:\+33649621619"/g) ?? [];
    expect(telLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('the real mailto: link is used at least for the editor and publication-director contacts', () => {
    const mailtoLinks = pageHtml.match(/href="mailto:belkhirdepannage@gmail\.com"/g) ?? [];
    expect(mailtoLinks.length).toBeGreaterThanOrEqual(3);
  });

  it('names Fouad BELKHIR as the publication director, never the developer', () => {
    expect(pageHtml).toContain('Fouad BELKHIR');
    expect(pageHtml).toContain('jamais le développeur du site');
  });

  it('identifies GitHub, Inc. and GitHub Pages as the real current host', () => {
    expect(pageHtml).toContain('GitHub, Inc.');
    expect(pageHtml).toContain('GitHub Pages');
    expect(pageHtml).toContain('88 Colin P. Kelly Jr. Street, San Francisco, CA 94107');
    expect(pageHtml).toContain('+1 415 735 4488');
    expect(pageHtml).toMatch(/href="https:\/\/github\.com\/"[^>]*target="_blank"/);
  });
});

describe('page /mentions-legales/ — attribution cartographique et propriété intellectuelle', () => {
  it('attributes the real IGN/Etalab map data source, with a link to the actual license', () => {
    expect(pageHtml).toContain('Admin Express (IGN)');
    expect(pageHtml).toContain('france-geojson');
    expect(pageHtml).toMatch(
      /href="https:\/\/www\.etalab\.gouv\.fr\/licence-ouverte-open-licence\/"[^>]*target="_blank"/,
    );
  });

  it('never claims blanket ownership of every element by BELKHIR DEPANNAGE', () => {
    expect(pageHtml).toContain('sauf mention contraire');
    expect(pageHtml).toContain('propriété de leurs titulaires');
  });
});

describe('page /mentions-legales/ — médiateur de la consommation explicitement à compléter', () => {
  it('shows the exact mandatory placeholder flag', () => {
    expect(pageHtml).toContain('[RESTE À COMPLÉTER AVANT MISE EN PRODUCTION]');
  });

  it('never invents a mediator name, address or website', () => {
    const section = pageHtml.match(
      /<section[^>]*id="mediation-consommation"[\s\S]*?<\/section>/,
    )?.[0];
    expect(section).toBeDefined();
    expect(section).toContain('à compléter');
    for (const forbidden of [
      'médiateur national de l’énergie',
      'cnil',
      'commission européenne',
      'ec.europa.eu',
    ]) {
      expect(section?.toLowerCase()).not.toContain(forbidden);
    }
  });

  it('never creates a fake link for the not-yet-confirmed mediator', () => {
    const section = pageHtml.match(
      /<section[^>]*id="mediation-consommation"[\s\S]*?<\/section>/,
    )?.[0];
    expect(section).not.toMatch(/<a\s/);
  });
});

describe('page /mentions-legales/ — danger, secours et forces de l’ordre', () => {
  it('states the 17/18/112 links redirect to public services, never Belkhir itself', () => {
    expect(pageHtml).toContain('ne se substitue ni aux secours, ni aux forces de l’ordre');
  });

  it('never repeats a metier-page safety technique or procedure', () => {
    expect(pageHtml).not.toContain('coulisses');
    expect(pageHtml).not.toContain('tablier');
  });
});

describe('page /mentions-legales/ — données personnelles renvoyées vers la politique dédiée', () => {
  it('links to the real /politique-de-confidentialite/ route with base, never a dead anchor', () => {
    const match = pageHtml.match(/href="([^"]*politique-de-confidentialite\/)"/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toMatch(/\/politique-de-confidentialite\/$/);
  });

  it('never re-adds a cookie banner or duplicates the full privacy policy', () => {
    const lower = pageHtml.toLowerCase();
    expect(lower).not.toContain('accepter les cookies');
    expect(pageHtml).not.toContain('id="droits-personnes"');
  });
});

describe('page /mentions-legales/ — navbar/footer réutilisés', () => {
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

describe('maillage footer — les deux liens juridiques sont désormais réels', () => {
  it('the footer "Mentions légales" entry is now a real link to the dedicated page', () => {
    const footerMatch = indexHtml.match(/<footer class="site-footer"[\s\S]*?<\/footer>/);
    expect(footerMatch).not.toBeNull();
    expect(footerMatch?.[0]).toMatch(/href="[^"]*\/mentions-legales\/"[^>]*>Mentions légales</);
  });

  it('the footer "Confidentialité" entry still points to the dedicated page, untouched', () => {
    const footerMatch = indexHtml.match(/<footer class="site-footer"[\s\S]*?<\/footer>/);
    expect(footerMatch?.[0]).toMatch(
      /href="[^"]*\/politique-de-confidentialite\/"[^>]*>Confidentialité</,
    );
  });

  it('no third fake legal link was invented', () => {
    const footerMatch = indexHtml.match(/<footer class="site-footer"[\s\S]*?<\/footer>/);
    const legalMatch = footerMatch?.[0].match(/<ul class="footer__legal"[^>]*>[\s\S]*?<\/ul>/);
    const links = legalMatch?.[0].match(/<a\b/g) ?? [];
    expect(links).toHaveLength(2);
  });
});

describe('non-régression — landing et page confidentialité inchangées', () => {
  it('landing hero and trades ribbon are untouched', () => {
    expect(indexHtml).toContain('id="accueil"');
    const tradeLinks = indexHtml.match(/class="hero__trade"/g) ?? [];
    expect(tradeLinks).toHaveLength(5);
  });
});
