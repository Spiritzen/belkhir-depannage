import { ROBOTS_META, ROBOTS_TXT } from './helpers/indexing';
import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Migration GitHub Pages -> LWS (domaine racine). Ces tests lisent le build
// compilé (`dist/`) : ils exigent un `npm run build` préalable, comme
// tests/prepub-corrections.test.ts.

const ORIGIN = 'https://belkhir-depannage-hdf.fr';
const distDir = fileURLToPath(new URL('../dist', import.meta.url));
const read = (p: string) => readFileSync(join(distDir, p), 'utf-8');

const ROUTES = [
  '',
  'plomberie',
  'chauffage',
  'serrurerie',
  'vitrerie',
  'rideaux-metalliques',
  'zones-intervention',
  'mentions-legales',
  'politique-de-confidentialite',
];

function listTextFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listTextFiles(full));
    else if (/\.(html|css|js|xml|txt|svg|json)$/.test(name)) out.push(full);
  }
  return out;
}

let astroConfig = '';
let indexHtml = '';
let sitemap = '';
let sitemapIndex = '';
let robots = '';
let allText: Array<{ file: string; text: string }> = [];

beforeAll(() => {
  astroConfig = readFileSync(
    fileURLToPath(new URL('../astro.config.mjs', import.meta.url)),
    'utf-8',
  );
  indexHtml = read('index.html');
  sitemap = read('sitemap-0.xml');
  sitemapIndex = read('sitemap-index.xml');
  robots = read('robots.txt');
  allText = listTextFiles(distDir)
    // Données publiques tierces (communes) : hors périmètre de la recherche d'origines.
    .filter((f) => !f.includes(`${join('dist', 'data')}`))
    .map((file) => ({ file, text: readFileSync(file, 'utf-8') }));
}, 60000);

describe('migration LWS — origine et base Astro', () => {
  it('1-2. site = domaine LWS sans www, base = racine', () => {
    expect(astroConfig).toContain(`const SITE_ORIGIN = '${ORIGIN}';`);
    expect(astroConfig).toContain("const SITE_BASE = '/';");
    expect(astroConfig).not.toMatch(/https:\/\/www\./);
  });
});

describe('migration LWS — aucune ancienne origine dans le build', () => {
  it('3. ni GitHub Pages, ni sous-chemin /belkhir-depannage/, ni ancien domaine servi', () => {
    for (const { file, text } of allText) {
      expect(text, file).not.toContain('spiritzen.github.io');
      expect(text, file).not.toContain('github.io');
      expect(text, file).not.toContain('/belkhir-depannage/');
      expect(text, file).not.toContain('belkhir-depannage80.fr');
      expect(text, file).not.toContain('belkhir-depannage.fr');
    }
  });
});

describe('migration LWS — sitemap, canonical, Open Graph', () => {
  it('4/7. le sitemap n’utilise que le nouveau domaine', () => {
    expect(sitemapIndex).toContain(`<loc>${ORIGIN}/sitemap-0.xml</loc>`);
    const locs = sitemap.match(/<loc>[^<]+<\/loc>/g) ?? [];
    expect(locs).toHaveLength(ROUTES.length);
    for (const loc of locs) expect(loc.startsWith(`<loc>${ORIGIN}/`)).toBe(true);
  });

  it('5. canonical et og:url de chaque page indexable pointent vers le nouveau domaine', () => {
    for (const route of ROUTES) {
      const html = read(route ? `${route}/index.html` : 'index.html');
      const expected = route ? `${ORIGIN}/${route}/` : `${ORIGIN}/`;
      expect(html).toContain(`<link rel="canonical" href="${expected}">`);
      expect(html).toContain(`<meta property="og:url" content="${expected}">`);
      expect(html).toContain(`<meta property="og:image" content="${ORIGIN}/og-default.svg">`);
    }
  });

  it('12. la page 404 existe mais reste hors sitemap', () => {
    expect(existsSync(join(distDir, '404.html'))).toBe(true);
    expect(sitemap).not.toContain('/404');
  });

  it('JSON-LD existants : toutes les URL absolues sont sur le nouveau domaine, sans LocalBusiness ni note', () => {
    for (const route of ROUTES) {
      const html = read(route ? `${route}/index.html` : 'index.html');
      for (const m of html.matchAll(
        /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
      )) {
        const json = m[1];
        for (const url of json.match(/https?:\/\/[^"]+/g) ?? []) {
          if (url.startsWith('https://schema.org')) continue;
          expect(url.startsWith(ORIGIN)).toBe(true);
        }
        expect(json).not.toContain('LocalBusiness');
        expect(json).not.toContain('aggregateRating');
      }
    }
  });
});

describe('migration LWS — indexation selon ENABLE_INDEXING', () => {
  it('6. robots.txt et meta robots suivent le mode du build ; la 404 reste noindex, nofollow', () => {
    expect(robots.trim()).toBe(ROBOTS_TXT);
    for (const route of ROUTES) {
      const html = read(route ? `${route}/index.html` : 'index.html');
      expect(html).toContain(ROBOTS_META);
    }
    expect(read('404.html')).toContain('<meta name="robots" content="noindex, nofollow">');
  });
});

describe('migration LWS — chemins compatibles racine', () => {
  it('11. favicons, assets et liens internes principaux partent de la racine /', () => {
    expect(indexHtml).toContain('href="/favicon.svg"');
    expect(indexHtml).toContain('href="/favicon-legacy.png"');
    expect(indexHtml).toMatch(/src="\/_astro\/[^"]+\.webp"/);
    for (const route of ROUTES.filter(Boolean)) {
      expect(indexHtml).toContain(`href="/${route}/"`);
    }
  });
});

describe('migration LWS — pages légales', () => {
  it('8/9/10. LWS hébergeur, formulaire raccordé, marqueurs restants côté mentions', () => {
    const mentions = read('mentions-legales/index.html');
    const privacy = read('politique-de-confidentialite/index.html');
    expect(mentions).toContain('LWS');
    expect(mentions).not.toContain('GitHub');
    expect(privacy).not.toContain('GitHub');
    expect(privacy).not.toContain('il n’en existe aucun');
    expect(mentions).toContain('[À COMPLÉTER AVANT MISE EN LIGNE]');
    expect(privacy).not.toContain('[À COMPLÉTER');
  });
});
