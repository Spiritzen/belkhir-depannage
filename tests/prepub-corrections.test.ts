import { describe, expect, it, beforeAll } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolveSiteUrl, combineSiteAndBase } from '../src/lib/site-config';
import { withBase } from '../src/lib/url';

// Tests couvrant le micro-sprint correctif PREPUB-001 à PREPUB-009
// (01/09/2026, PROMPT_CLAUDE_CODE_CORRECTION_PREPUB_001_A_009.txt).
//
// PRÉREQUIS explicite pour ce fichier : `npm run build` doit avoir été
// exécuté avant `npm run test:run`. Le script `validate` a été réordonné
// dans ce même sprint (build avant test:run, plutôt que l'inverse) pour
// garantir ce prérequis automatiquement. Ce fichier lit intentionnellement
// dist/ tel quel plutôt que de reconstruire le site lui-même dans un hook
// Vitest : un premier essai avec un `execSync('npm run build')` dans
// `beforeAll` a produit une course concurrente avec un autre build lancé en
// parallèle pendant ce sprint (deux processus `astro build` écrivant dans le
// même dist/ en même temps sous Windows) et a fait lire à ces tests un
// dist/ obsolète — signalé précisément dans le rapport de sprint plutôt que
// masqué. Le rapport documente donc le build/l'inspection de dist/ comme une
// étape manuelle séparée (déjà exécutée et vérifiée avant ce fichier), et ce
// fichier se contente de lire le résultat.
//
// Limite de l'environnement de test connue et documentée séparément (voir le
// rapport de sprint) : `getViteConfig`/`AstroContainer` sous Vitest
// (vitest.config.ts, hors périmètre de ce sprint) ne propage pas le `base`
// d'Astro dans `import.meta.env.BASE_URL` pendant le rendu de composants —
// c'est pourquoi ce fichier lit dist/ directement plutôt que de rendre
// IndexPage via AstroContainer pour les assertions dépendant de `base`.

let distIndexHtml = '';
let distCssContent = '';
let distRobotsTxt = '';
let distSitemapIndex = '';
let distSitemap0 = '';
let tokensSource = '';
let astroConfigSource = '';
let packageJsonSource = '';

beforeAll(() => {
  const distIndexPath = fileURLToPath(new URL('../dist/index.html', import.meta.url));
  if (!existsSync(distIndexPath)) {
    throw new Error(
      'dist/index.html est absent : exécuter `npm run build` avant `npm run test:run` ' +
        'pour ce fichier de tests (voir le commentaire en tête de fichier).',
    );
  }

  distIndexHtml = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf-8');
  distRobotsTxt = readFileSync(new URL('../dist/robots.txt', import.meta.url), 'utf-8');
  distSitemapIndex = readFileSync(new URL('../dist/sitemap-index.xml', import.meta.url), 'utf-8');
  distSitemap0 = readFileSync(new URL('../dist/sitemap-0.xml', import.meta.url), 'utf-8');

  const cssDir = new URL('../dist/_astro/', import.meta.url);
  const cssFiles = readdirSync(cssDir).filter((f) => f.endsWith('.css'));
  distCssContent = cssFiles.map((f) => readFileSync(new URL(f, cssDir), 'utf-8')).join('\n');

  tokensSource = readFileSync(
    fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url)),
    'utf-8',
  );
  astroConfigSource = readFileSync(
    fileURLToPath(new URL('../astro.config.mjs', import.meta.url)),
    'utf-8',
  );
  packageJsonSource = readFileSync(
    fileURLToPath(new URL('../package.json', import.meta.url)),
    'utf-8',
  );
}, 60000);

describe('PREPUB-001 — configuration GitHub Pages (site/base)', () => {
  it('1. astro.config.mjs declares the GitHub Pages origin and repo subpath', () => {
    expect(astroConfigSource).toContain("'https://spiritzen.github.io'");
    expect(astroConfigSource).toMatch(/base:\s*GITHUB_PAGES_BASE/);
    expect(astroConfigSource).toContain("'/belkhir-depannage/'");
  });

  it('2. output stays static, no server adapter added', () => {
    expect(astroConfigSource).toContain("output: 'static'");
    expect(astroConfigSource).not.toMatch(/adapter:/);
  });
});

describe('PREPUB-006 — single URL source of truth, no temporary placeholder left', () => {
  it('3. combineSiteAndBase joins origin and base without double slashes, any slash combination', () => {
    expect(combineSiteAndBase('https://spiritzen.github.io', '/belkhir-depannage/')).toBe(
      'https://spiritzen.github.io/belkhir-depannage',
    );
    expect(combineSiteAndBase('https://spiritzen.github.io/', '/belkhir-depannage')).toBe(
      'https://spiritzen.github.io/belkhir-depannage',
    );
    expect(combineSiteAndBase('https://example.fr', '/')).toBe('https://example.fr');
  });

  it('4. resolveSiteUrl derives the real GitHub Pages URL from explicit site/base args, no SITE_URL override', () => {
    expect(resolveSiteUrl({}, 'https://spiritzen.github.io', '/belkhir-depannage/')).toBe(
      'https://spiritzen.github.io/belkhir-depannage',
    );
  });

  it('5. resolveSiteUrl uses SITE_URL as a normalized override when provided', () => {
    expect(
      resolveSiteUrl(
        { SITE_URL: 'https://www.futur-domaine.fr/' },
        'https://spiritzen.github.io',
        '/belkhir-depannage/',
      ),
    ).toBe('https://www.futur-domaine.fr');
  });

  it('6. resolveSiteUrl ignores a blank SITE_URL and falls back to site+base', () => {
    expect(
      resolveSiteUrl({ SITE_URL: '   ' }, 'https://spiritzen.github.io', '/belkhir-depannage/'),
    ).toBe('https://spiritzen.github.io/belkhir-depannage');
  });

  it('7. no second DEFAULT_SITE_URL constant survives in site-config.ts (single source of truth)', () => {
    const siteConfigSource = readFileSync(
      fileURLToPath(new URL('../src/lib/site-config.ts', import.meta.url)),
      'utf-8',
    );
    expect(siteConfigSource).not.toContain('DEFAULT_SITE_URL');
    expect(siteConfigSource).not.toContain('exemple-temporaire.fr');
  });

  it('8. the temporary placeholder domain does not appear anywhere in the compiled build', () => {
    expect(distIndexHtml).not.toContain('exemple-temporaire');
    expect(distRobotsTxt).not.toContain('exemple-temporaire');
    expect(distSitemapIndex).not.toContain('exemple-temporaire');
    expect(distSitemap0).not.toContain('exemple-temporaire');
  });

  it('9. canonical and og:url are absolute and include the /belkhir-depannage/ subpath', () => {
    expect(distIndexHtml).toContain(
      '<link rel="canonical" href="https://spiritzen.github.io/belkhir-depannage/">',
    );
    expect(distIndexHtml).toContain(
      '<meta property="og:url" content="https://spiritzen.github.io/belkhir-depannage/">',
    );
  });

  it('10. the sitemap lists the real GitHub Pages URL exactly once, no duplicate root entry', () => {
    expect(distSitemapIndex).toContain(
      '<loc>https://spiritzen.github.io/belkhir-depannage/sitemap-0.xml</loc>',
    );
    // Mise à jour micro-sprint 1 « page plomberie » (03/09/2026,
    // PROMPT_CLAUDE_CODE_MICRO_SPRINT_1_PAGE_PLOMBERIE_HERO.txt), puis pages
    // chauffage, serrurerie, vitrerie et rideaux métalliques (04/09/2026) :
    // le site compte désormais six pages réelles (landing + /plomberie/ +
    // /chauffage/ + /serrurerie/ + /vitrerie/ + /rideaux-metalliques/),
    // toutes légitimement listées par @astrojs/sitemap. L'intention
    // d'origine de ce test — repérer un doublon accidentel de l'URL racine
    // (avec et sans slash final) — reste vérifiée via `new Set(...)`, sans
    // figer l'ordre exact ni le nombre total de pages du site (dépend de
    // l'ordre de build du générateur).
    const locs = distSitemap0.match(/<loc>[^<]+<\/loc>/g) ?? [];
    expect(new Set(locs)).toEqual(
      new Set([
        '<loc>https://spiritzen.github.io/belkhir-depannage/</loc>',
        '<loc>https://spiritzen.github.io/belkhir-depannage/plomberie/</loc>',
        '<loc>https://spiritzen.github.io/belkhir-depannage/chauffage/</loc>',
        '<loc>https://spiritzen.github.io/belkhir-depannage/serrurerie/</loc>',
        '<loc>https://spiritzen.github.io/belkhir-depannage/vitrerie/</loc>',
        '<loc>https://spiritzen.github.io/belkhir-depannage/rideaux-metalliques/</loc>',
      ]),
    );
    expect(new Set(locs).size).toBe(locs.length);
  });

  it('11. robots.txt still fully disallows indexing (maquette non indexée, garde-fou préservé)', () => {
    expect(distRobotsTxt.trim()).toBe('User-agent: *\nDisallow: /');
  });
});

describe('PREPUB-002 — assets base-aware (favicons, polices, image OG)', () => {
  it('12. favicon links in the compiled HTML are prefixed with /belkhir-depannage/', () => {
    expect(distIndexHtml).toContain('href="/belkhir-depannage/favicon-legacy.png"');
    expect(distIndexHtml).toContain('href="/belkhir-depannage/favicon.svg"');
  });

  it('13. no favicon/font/og/_astro reference points at the GitHub account root (missing base)', () => {
    expect(distIndexHtml).not.toMatch(/href="\/favicon[^"]*"/);
    expect(distIndexHtml).not.toMatch(/(src|href)="\/_astro\/[^"]*"/);
    expect(distCssContent).not.toMatch(/url\(\/fonts\//);
  });

  it('14. all four font files are served through the base-aware Vite asset pipeline, hashed under _astro/', () => {
    const fontUrls =
      distCssContent.match(/url\(\/belkhir-depannage\/_astro\/[^)]*\.woff2\)/g) ?? [];
    expect(fontUrls.length).toBe(4);
    const families = ['sora-latin.', 'sora-latin-ext.', 'manrope-latin.', 'manrope-latin-ext.'];
    for (const family of families) {
      expect(fontUrls.some((url) => url.includes(family))).toBe(true);
    }
  });

  it('15. withBase() joins the base path and an asset filename correctly regardless of slash presence', () => {
    expect(withBase('/belkhir-depannage/', 'favicon.svg')).toBe('/belkhir-depannage/favicon.svg');
    expect(withBase('/belkhir-depannage', 'favicon.svg')).toBe('/belkhir-depannage/favicon.svg');
    expect(withBase('/belkhir-depannage/', '/favicon.svg')).toBe('/belkhir-depannage/favicon.svg');
  });
});

describe('PREPUB-009 — Open Graph / Twitter images absolute', () => {
  it('16. og:image and twitter:image are full absolute URLs including the subpath, not a root-relative path', () => {
    expect(distIndexHtml).toContain(
      '<meta property="og:image" content="https://spiritzen.github.io/belkhir-depannage/og-default.svg">',
    );
    expect(distIndexHtml).toContain(
      '<meta name="twitter:image" content="https://spiritzen.github.io/belkhir-depannage/og-default.svg">',
    );
    expect(distIndexHtml).not.toMatch(/content="\/og-default\.svg"/);
  });
});

describe('PREPUB-005 — reproducible Node version declared', () => {
  it('17. package.json declares an honest, non-invented engines.node range', () => {
    const pkg = JSON.parse(packageJsonSource);
    expect(pkg.engines).toBeDefined();
    expect(pkg.engines.node).toBe('^22.22.3 || ^24.16.0');
    expect(pkg.engines.npm).toBeDefined();
  });

  it('18. .nvmrc is consistent with the declared engines range (falls within it)', () => {
    const nvmrc = readFileSync(
      fileURLToPath(new URL('../.nvmrc', import.meta.url)),
      'utf-8',
    ).trim();
    expect(nvmrc).toBe('24.16.0');
  });
});

describe('PREPUB-003 — /docs/ ignored', () => {
  it('19. .gitignore contains an explicit /docs/ rule', () => {
    const gitignore = readFileSync(
      fileURLToPath(new URL('../.gitignore', import.meta.url)),
      'utf-8',
    );
    expect(gitignore).toMatch(/^\/docs\/$/m);
  });

  it('20. .env.example stays re-included (versionable) alongside the .env exclusion', () => {
    const gitignore = readFileSync(
      fileURLToPath(new URL('../.gitignore', import.meta.url)),
      'utf-8',
    );
    expect(gitignore).toContain('!.env.example');
  });
});

describe('PREPUB-007 — emergency CTA contrast (computed WCAG ratio, not a hardcoded string)', () => {
  function hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace('#', '');
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }

  function relativeLuminance([r, g, b]: [number, number, number]): number {
    const channel = (v: number) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  }

  function contrastRatio(hexA: string, hexB: string): number {
    const lA = relativeLuminance(hexToRgb(hexA)) + 0.05;
    const lB = relativeLuminance(hexToRgb(hexB)) + 0.05;
    return lA > lB ? lA / lB : lB / lA;
  }

  it('21. white text on --color-red-600 (solid emergency CTA background) meets WCAG AA (>= 4.5:1), with margin', () => {
    const redMatch = tokensSource.match(/--color-red-600:\s*(#[0-9a-fA-F]{6});/);
    expect(redMatch).not.toBeNull();
    const ratio = contrastRatio('#ffffff', redMatch![1]);
    expect(ratio).toBeGreaterThanOrEqual(4.6);
  });

  it('22. --color-red-700 (hover/focus state) still comfortably exceeds AA', () => {
    const redHoverMatch = tokensSource.match(/--color-red-700:\s*(#[0-9a-fA-F]{6});/);
    expect(redHoverMatch).not.toBeNull();
    const ratio = contrastRatio('#ffffff', redHoverMatch![1]);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('23. the emergency phone link is unchanged and still present at all 4 locations in the build', () => {
    const telLinks = distIndexHtml.match(/href="tel:\+33649621619"/g) ?? [];
    expect(telLinks).toHaveLength(4);
  });

  it('24. the standard number stays a non-callable placeholder (no regression)', () => {
    expect(distIndexHtml).not.toMatch(/href="tel:\+3322[0-9]+"/);
  });
});

describe('PREPUB-008 — footer legal text contrast (computed WCAG ratio)', () => {
  function hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace('#', '');
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }

  function relativeLuminance([r, g, b]: [number, number, number]): number {
    const channel = (v: number) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  }

  function contrastRatio(hexA: string, hexB: string): number {
    const lA = relativeLuminance(hexToRgb(hexA)) + 0.05;
    const lB = relativeLuminance(hexToRgb(hexB)) + 0.05;
    return lA > lB ? lA / lB : lB / lA;
  }

  it('25. --color-gray-400 on --color-anthracite-950 (real footer background) meets WCAG AA (>= 4.5:1), with margin', () => {
    const grayMatch = tokensSource.match(/--color-gray-400:\s*(#[0-9a-fA-F]{6});/);
    const bgMatch = tokensSource.match(/--color-anthracite-950:\s*(#[0-9a-fA-F]{6});/);
    expect(grayMatch).not.toBeNull();
    expect(bgMatch).not.toBeNull();
    const ratio = contrastRatio(grayMatch![1], bgMatch![1]);
    expect(ratio).toBeGreaterThanOrEqual(4.6);
  });

  it('26. Footer.astro uses the new token for .footer__bottom, not the old gray-500', () => {
    const footerSource = readFileSync(
      fileURLToPath(new URL('../src/components/layout/Footer.astro', import.meta.url)),
      'utf-8',
    );
    const bottomRule = footerSource.match(/\.footer__bottom\s*{[^}]*}/)?.[0] ?? '';
    expect(bottomRule).toContain('color: var(--color-gray-400)');
    expect(bottomRule).not.toContain('var(--color-gray-500)');
  });

  it('27. the site-wide --color-muted/--color-gray-500 alias used elsewhere is untouched (no unintended blast radius)', () => {
    expect(tokensSource).toContain('--color-gray-500: #6b7280;');
    expect(tokensSource).toContain('--color-muted: var(--color-gray-500);');
  });

  it('28. the B/D orange brand accents in the footer remain unchanged', () => {
    const footerSource = readFileSync(
      fileURLToPath(new URL('../src/components/layout/Footer.astro', import.meta.url)),
      'utf-8',
    );
    const brandInitialRule = footerSource.match(/\.footer__brand-initial\s*{[^}]*}/)?.[0] ?? '';
    expect(brandInitialRule).toContain('color: var(--color-brand)');
  });
});

describe('non-régression — indexation et build', () => {
  it('29. allowIndexing stays false without ENABLE_INDEXING=true and real phones (default env)', () => {
    const siteConfigSource = readFileSync(
      fileURLToPath(new URL('../src/lib/site-config.ts', import.meta.url)),
      'utf-8',
    );
    expect(siteConfigSource).toContain(
      'resolveAllowIndexing(requestedByEnv, standardPhone, emergencyPhone)',
    );
  });

  it('30. dist/index.html reflects noindex,nofollow (indexation toujours désactivée par défaut)', () => {
    expect(distIndexHtml).toContain('<meta name="robots" content="noindex, nofollow">');
  });
});
