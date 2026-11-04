import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { resolveAllowIndexing, siteConfig } from '../src/lib/site-config';
import { INDEXING_ENABLED, ROBOTS_META, ROBOTS_TXT } from './helpers/indexing';

// Mise en production LWS : indexation ouverte, numéro standard provisoire identique
// à l'urgence, plus aucune mention de maquette. Ces tests lisent dist/ : le build
// et les tests doivent partager ENABLE_INDEXING (la CI de production le fixe à true).

const root = fileURLToPath(new URL('..', import.meta.url));
const distDir = join(root, 'dist');
const read = (p: string) => readFileSync(join(distDir, p), 'utf-8');
const ORIGIN = 'https://belkhir-depannage-hdf.fr';
const TEL = 'tel:+33649621619';

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
const pageOf = (route: string) => read(route ? `${route}/index.html` : 'index.html');

describe('numéros : deux rôles, un même numéro provisoire versionné', () => {
  it('la source déclare des constantes standard distinctes de celles de l’urgence', () => {
    const src = readFileSync(join(root, 'src', 'lib', 'site-config.ts'), 'utf-8');
    expect(src).toMatch(/const STANDARD_PHONE_DISPLAY = '06 49 62 16 19';/);
    expect(src).toMatch(/const STANDARD_PHONE_INTERNATIONAL = '\+33649621619';/);
    expect(src).toMatch(/const EMERGENCY_PHONE_DISPLAY = '06 49 62 16 19';/);
    expect(src).toMatch(/const EMERGENCY_PHONE_INTERNATIONAL = '\+33649621619';/);
    // Le standard ne dépend plus du .env (build CI sans .env).
    expect(src).not.toMatch(
      /process\.env\.STANDARD_PHONE|'STANDARD_PHONE_DISPLAY',\s*\n\s*'STANDARD/,
    );
  });

  it('rôles et libellés distincts, valeurs identiques', () => {
    const { standardPhone: s, emergencyPhone: e } = siteConfig;
    expect([s.role, e.role]).toEqual(['standard', 'emergency']);
    expect([s.label, e.label]).toEqual(['Standard', 'Urgence extrême']);
    expect(s.subLabel).toBe('Demandes, devis et suivi');
    expect(s.display).toBe('06 49 62 16 19');
    expect(e.display).toBe('06 49 62 16 19');
    expect(s.international).toBe('+33649621619');
    expect(e.international).toBe('+33649621619');
  });

  it('chaque page expose les deux boutons actifs vers tel:+33649621619 (standard et urgence)', () => {
    for (const route of ROUTES) {
      const html = pageOf(route);
      expect(html, route).toMatch(
        new RegExp(`href="${TEL.replace('+', '\\+')}"[^>]*data-phone-role="standard"`),
      );
      expect(html, route).toMatch(
        new RegExp(`href="${TEL.replace('+', '\\+')}"[^>]*data-phone-role="emergency"`),
      );
      // Aucun bouton désactivé ni numéro fictif.
      expect(html, route).not.toMatch(/03 XX XX XX XX|aria-disabled="true"[^>]*data-phone-role/);
      const allowed = new Set([TEL, 'tel:112', 'tel:15', 'tel:18', 'tel:17', 'tel:+33800473333']);
      for (const href of html.match(/href="(tel:[^"]+)"/g) ?? []) {
        expect(allowed.has(href.slice(6, -1)), route + ' ' + href).toBe(true);
      }
    }
  });

  it('desktop, hamburger, barre mobile et footer portent le numéro', () => {
    const html = pageOf('');
    for (const marker of ['class="footer', 'id="mobile-drawer"']) expect(html).toContain(marker);
    expect(html.match(/06 49 62 16 19/g)?.length ?? 0).toBeGreaterThanOrEqual(6);
  });
});

describe('indexation : uniquement avec ENABLE_INDEXING=true et deux lignes complètes', () => {
  const full = {
    role: 'standard',
    label: 'a',
    subLabel: 'b',
    display: '06',
    international: '+33',
  } as const;
  const empty = { ...full, display: null, international: null };

  it('resolveAllowIndexing garde son garde-fou', () => {
    expect(resolveAllowIndexing(true, full, full)).toBe(true);
    expect(resolveAllowIndexing(false, full, full)).toBe(false);
    expect(resolveAllowIndexing(true, full, empty)).toBe(false);
    expect(resolveAllowIndexing(true, empty, full)).toBe(false);
  });

  it('siteConfig suit la variable du build', () => {
    expect(siteConfig.allowIndexing).toBe(INDEXING_ENABLED);
    expect(siteConfig.isPreview).toBe(false);
  });

  it('.env.example reste fermé par défaut pour les usages locaux', () => {
    expect(readFileSync(join(root, '.env.example'), 'utf-8')).toContain('ENABLE_INDEXING=false');
  });
});

describe('build : robots, meta, sitemap, 404', () => {
  it('robots.txt suit le mode ; en production : Allow + ligne Sitemap absolue', () => {
    expect(read('robots.txt').trim()).toBe(ROBOTS_TXT);
    if (INDEXING_ENABLED) {
      expect(read('robots.txt')).toContain(`Sitemap: ${ORIGIN}/sitemap-index.xml`);
      expect(read('robots.txt')).not.toContain('Disallow');
    }
  });

  it('pages de contenu : meta robots du mode (index, follow en production)', () => {
    for (const route of ROUTES) expect(pageOf(route), route).toContain(ROBOTS_META);
    if (INDEXING_ENABLED) {
      for (const route of ROUTES) expect(pageOf(route), route).not.toContain('noindex');
    }
  });

  it('la 404 reste noindex, nofollow dans tous les modes', () => {
    expect(read('404.html')).toContain('<meta name="robots" content="noindex, nofollow">');
  });

  it('sitemap : uniquement le domaine LWS, sans 404, index → sitemap-0.xml', () => {
    const index = read('sitemap-index.xml');
    const sm = read('sitemap-0.xml');
    expect(index).toContain(`<loc>${ORIGIN}/sitemap-0.xml</loc>`);
    const locs = (sm.match(/<loc>[^<]+<\/loc>/g) ?? []).map((l) => l.replace(/<\/?loc>/g, ''));
    expect(locs.length).toBeGreaterThanOrEqual(ROUTES.length);
    for (const loc of locs) {
      expect(loc.startsWith(`${ORIGIN}/`)).toBe(true);
      expect(loc).not.toMatch(/\/404\/?$/);
    }
  });

  it('aucune mention publique de maquette, prévisualisation ou « non indexée » dans le HTML', () => {
    const files = readdirSync(distDir, { recursive: true, encoding: 'utf-8' })
      .map((p) => p.replace(/\\/g, '/'))
      .filter((p) => p.endsWith('.html'));
    expect(files.length).toBeGreaterThanOrEqual(ROUTES.length + 1);
    for (const f of files) {
      expect(read(f), f).not.toMatch(/maquette de prévisualisation|non indexée|prévisualisation/i);
      expect(read(f), f).not.toMatch(/dans cette maquette/i);
    }
  });
});

describe('workflow : indexation de production explicite, protections inchangées', () => {
  const text = readFileSync(join(root, '.github', 'workflows', 'deploy-lws.yml'), 'utf-8');
  const wf = YAML.parse(text);

  it('ENABLE_INDEXING=true et EXPECT_INDEXING=true aux bons endroits, sans secret ni .env', () => {
    expect(wf.jobs.verify.env).toEqual({ ENABLE_INDEXING: 'true', EXPECT_INDEXING: 'true' });
    const recheck = wf.jobs.deploy.steps.find((s: { run?: string }) =>
      String(s.run).includes('check-dist.mjs'),
    );
    expect(recheck.env).toEqual({ EXPECT_INDEXING: 'true' });
    expect(wf.jobs.deploy.env.ENABLE_INDEXING).toBeUndefined();
    expect(text).not.toMatch(/dotenv|cp \.env|--env-file|cat \.env/);
  });

  it('protections FTPS, .well-known, racine virtuelle et garde LWS_DEPLOY_ENABLED inchangées', () => {
    const script: string = wf.jobs.deploy.steps.at(-1).run;
    expect(script).toContain('set ssl:verify-certificate yes');
    expect(script).toContain('set ftp:ssl-force yes');
    expect(script).toMatch(/^\s*cd \/$/m);
    expect(script).toContain("--exclude-glob .well-known --exclude-glob '.well-known/*'");
    expect(script).not.toMatch(/verify-certificate\s+no|ssl-force\s+no/);
    expect(wf.jobs.deploy.if).toContain("vars.LWS_DEPLOY_ENABLED == 'true'");
  });

  it('les protections .htaccess et API ne sont pas affaiblies', () => {
    const h = readFileSync(join(distDir, '.htaccess'), 'utf-8');
    expect(h).toMatch(/api\/_lib/);
    expect(readFileSync(join(distDir, 'api', '_lib', '.htaccess'), 'utf-8')).toContain(
      'Require all denied',
    );
  });
});
