import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ZonesInterventionPage from '../src/pages/zones-intervention/index.astro';

// Tests ciblés pour /zones-intervention/ (PROMPT_CLAUDE_CODE_PAGE_ZONES_
// INTERVENTION_RADAR.txt, sections 12, 13, 16, 04/09/2026). Même limite
// d'environnement documentée par tests/plomberie-page.test.ts et
// tests/prepub-corrections.test.ts : les assertions dépendant de `base`
// lisent `dist/` (PRÉREQUIS : `npm run build` déjà exécuté).
let pageHtml = '';
let distHtml = '';
let sitemapXml = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(ZonesInterventionPage, {
    request: new Request('http://localhost/zones-intervention/'),
  });

  const distPath = fileURLToPath(new URL('../dist/zones-intervention/index.html', import.meta.url));
  distHtml = readFileSync(distPath, 'utf-8');

  const sitemapPath = fileURLToPath(new URL('../dist/sitemap-0.xml', import.meta.url));
  if (existsSync(sitemapPath)) {
    sitemapXml = readFileSync(sitemapPath, 'utf-8');
  }
}, 30000);

describe('page /zones-intervention/ — SEO (dist/, base-dépendant)', () => {
  it('has the requested <title>', () => {
    expect(distHtml).toContain(
      '<title>Zones d’intervention dépannage Hauts-de-France | Belkhir Dépannage</title>',
    );
  });

  it('has the requested meta description', () => {
    expect(distHtml).toContain(
      'Vérifiez si Belkhir Dépannage étudie les urgences de plomberie, chauffage, serrurerie, vitrerie et rideaux métalliques dans votre commune des Hauts-de-France.',
    );
  });

  it('has a canonical URL built from site + base, ending on /zones-intervention/', () => {
    expect(distHtml).toContain(
      '<link rel="canonical" href="https://spiritzen.github.io/belkhir-depannage/zones-intervention/">',
    );
  });

  it('preserves the global indexing policy (noindex while numbers/flag are not confirmed)', () => {
    expect(distHtml).toContain('<meta name="robots" content="noindex, nofollow">');
  });

  it('is listed in the generated sitemap', () => {
    expect(sitemapXml).toContain(
      'https://spiritzen.github.io/belkhir-depannage/zones-intervention/',
    );
  });

  it('carries FAQPage, BreadcrumbList and Service JSON-LD, matching the visible content', () => {
    const scripts = [
      ...distHtml.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g),
    ].map((m) => JSON.parse(m[1]));
    const types = scripts.map((s) => s['@type']);
    expect(types).toEqual(expect.arrayContaining(['FAQPage', 'BreadcrumbList', 'Service']));

    const service = scripts.find((s) => s['@type'] === 'Service');
    expect(service.serviceType).toEqual([
      'Plomberie',
      'Chauffage',
      'Serrurerie',
      'Vitrerie',
      'Rideaux métalliques',
    ]);
    const areaNames = service.areaServed.map((a: { name: string }) => a.name);
    expect(areaNames.sort()).toEqual(['Aisne', 'Nord', 'Oise', 'Pas-de-Calais', 'Somme'].sort());
    for (const area of service.areaServed) {
      expect(area['@type']).toBe('AdministrativeArea');
    }
  });
});

describe('page /zones-intervention/ — structure (pageHtml, non base-dépendant)', () => {
  it('has exactly one relevant H1 with the exact validated wording', () => {
    const matches = pageHtml.match(/<h1[\s>]/g) ?? [];
    expect(matches).toHaveLength(1);
    const h1Match = pageHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const visibleText = (h1Match?.[1] ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    expect(visibleText).toBe('Dépannage d’urgence dans les Hauts-de-France');
  });

  it('never invents a local commune, review, certification or figure', () => {
    const lower = pageHtml.toLowerCase();
    for (const forbidden of ['certifié', 'certification', 'avis vérifié', 'meilleur artisan']) {
      expect(lower).not.toContain(forbidden);
    }
  });

  it('reuses the real shared shell (navbar with both phone lines, footer)', () => {
    expect(pageHtml).toContain('APPEL STANDARD');
    expect(pageHtml).toContain('APPEL URGENCE');
    expect(pageHtml).toContain('class="site-footer"');
  });

  it('reserves space for the fixed mobile call bar (hasMobileCallBar)', () => {
    expect(pageHtml).toContain('class="has-mobile-call-bar"');
    expect(pageHtml).toContain('id="mobile-call-bar"');
  });
});

describe('page /zones-intervention/ — section A (cinq départements, exemples)', () => {
  it('shows exactly the five covered départements, each with example cities, never as real links', () => {
    for (const dept of ['Somme', 'Nord', 'Pas-de-Calais', 'Oise', 'Aisne']) {
      expect(pageHtml).toContain(dept);
    }
    expect(pageHtml).toContain('Amiens');
    expect(pageHtml).toContain('Votre commune n’apparaît pas dans ces exemples');
  });

  it('never renders thousands of communes in the static HTML', () => {
    // Un contrôle proportionné : la page ne doit jamais embarquer le
    // snapshot complet (3000+ communes) dans son propre HTML statique.
    const occurrences = pageHtml.match(/Abbeville|Doullens|Péronne/g) ?? [];
    expect(occurrences.length).toBeLessThan(20);
  });
});

describe('page /zones-intervention/ — section B (cinq liens métiers réels)', () => {
  it('links to all five real métier pages, with the base prefix, never a dead link', () => {
    const hrefs = Array.from(pageHtml.matchAll(/class="services-links__card" href="([^"]+)"/g)).map(
      (m) => m[1],
    );
    expect(hrefs).toHaveLength(5);
    expect(hrefs.some((h) => h.endsWith('/plomberie/'))).toBe(true);
    expect(hrefs.some((h) => h.endsWith('/chauffage/'))).toBe(true);
    expect(hrefs.some((h) => h.endsWith('/serrurerie/'))).toBe(true);
    expect(hrefs.some((h) => h.endsWith('/vitrerie/'))).toBe(true);
    expect(hrefs.some((h) => h.endsWith('/rideaux-metalliques/'))).toBe(true);
    for (const href of hrefs) {
      expect(href).not.toBe('#');
    }
  });

  it('never hardcodes "/belkhir-depannage/" in active code — every internal URL is built from BASE_URL', () => {
    // Contrôle de code source plutôt que de HTML rendu (BASE_URL vaut déjà
    // "/belkhir-depannage/" en local) : aucune chaîne littérale du
    // sous-chemin dans le code réellement exécuté des fichiers propres à
    // cette page — les lignes de commentaire (qui nomment cette règle pour
    // l'expliquer) sont exclues du contrôle.
    const sourceFiles = [
      '../src/pages/zones-intervention/index.astro',
      '../src/components/zones-intervention/Hero.astro',
      '../src/components/zones-intervention/ServicesLinks.astro',
      '../src/components/zones-intervention/DepartmentsShowcase.astro',
      '../src/components/zones-intervention/ProcessSteps.astro',
      '../src/components/zones-intervention/Reassurance.astro',
      '../src/components/sections/CoverageChecker.astro',
    ];
    for (const rel of sourceFiles) {
      const source = readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf-8');
      const activeLines = source
        .split('\n')
        .filter((line) => {
          const trimmed = line.trim();
          return !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*');
        })
        .join('\n');
      expect(activeLines).not.toContain('/belkhir-depannage/');
    }
  });
});

describe('page /zones-intervention/ — sections C, D, E', () => {
  it('renders the three-step process with the exact validated titles', () => {
    expect(pageHtml).toContain('Indiquez votre commune');
    expect(pageHtml).toContain('Décrivez votre urgence');
    expect(pageHtml).toContain('Obtenez une confirmation');
  });

  it('the reassurance section carries two real CTAs (call + quote), never a promised delay', () => {
    expect(pageHtml).toContain('Une disponibilité confirmée avant le déplacement');
    expect(pageHtml).toMatch(/href="tel:\+33649621619"/);
    expect(pageHtml).toContain('data-quote-trigger');
    expect(pageHtml.toLowerCase()).not.toContain('délai garanti');
  });

  it('the geographic FAQ renders the five validated questions', () => {
    expect(pageHtml).toContain('Intervenez-vous dans tous les Hauts-de-France ?');
    expect(pageHtml).toContain('Une commune trouvée garantit-elle une intervention ?');
    expect(pageHtml).toContain('Comment connaître le délai d’intervention ?');
    expect(pageHtml).toContain('Quelles informations préparer avant d’appeler ?');
    expect(pageHtml).toContain('Que faire si ma commune n’est pas reconnue ?');
  });
});

describe('non-régression — landing #zones-couvertes préservée (section 12 du prompt)', () => {
  it('the landing keeps its own #zones-couvertes section, unchanged in structure', () => {
    const landingDistPath = fileURLToPath(new URL('../dist/index.html', import.meta.url));
    if (!existsSync(landingDistPath)) return;
    const landingHtml = readFileSync(landingDistPath, 'utf-8');
    expect(landingHtml).toContain('id="zones-couvertes"');
  });
});
