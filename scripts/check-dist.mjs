/**
 * Contrôle de l'artefact dist/ avant déploiement (CI et local, portable).
 *
 *   node scripts/check-dist.mjs [dossier]      (défaut : dist)
 *
 * Échoue (code 1) si un fichier requis manque ou si dist/ contient un secret,
 * une configuration réelle, l'ancien chemin GitHub Pages, ou si l'indexation
 * n'est plus fermée. N'affiche jamais le contenu d'un secret.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const dist = resolve(process.argv[2] ?? 'dist');
const errors = [];
const fail = (msg) => errors.push(msg);

if (!existsSync(dist)) {
  console.error(`[check-dist] dossier introuvable : ${dist}`);
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}
const files = walk(dist).map((f) => ({ abs: f, rel: relative(dist, f).replace(/\\/g, '/') }));
const rels = new Set(files.map((f) => f.rel));
const read = (rel) => readFileSync(join(dist, rel), 'utf-8');

// 1. Fichiers requis
const required = [
  'index.html',
  '404.html',
  'robots.txt',
  'sitemap-index.xml',
  'sitemap-0.xml',
  '.htaccess',
  'api/demande-devis.php',
  'api/_lib/.htaccess',
  'api/_lib/src/Handler.php',
  'api/_lib/src/SmtpTransport.php',
  'api/_lib/vendor/autoload.php',
  'api/_lib/vendor/phpmailer/phpmailer/src/PHPMailer.php',
  'api/_lib/vendor/phpmailer/phpmailer/src/SMTP.php',
];
for (const r of required) if (!rels.has(r)) fail(`fichier requis absent : ${r}`);

// 2. Fichiers interdits
const forbidden = [
  /(^|\/)\.env/i,
  /secret/i,
  /formulaire\.config/i,
  /(^|\/)composer\.(json|lock)$/i,
  /(^|\/)README/i,
  /\.example\.php$/i,
  /(^|\/)vendor\/bin\//i,
  /\.(log|bak|sql|swp)$/i,
];
for (const { rel } of files) {
  if (forbidden.some((rx) => rx.test(rel))) fail(`fichier interdit dans dist : ${rel}`);
}

// 3. Contenu : secrets, anciens chemins, données de test
const textRx = /\.(html|css|js|mjs|xml|txt|svg|json|php|htaccess)$|(^|\/)\.htaccess$/i;
const passwordRx = /(smtp_?password|password|passwd)['"]?\s*(=>|=|:)\s*['"]([^'"\s]{6,})['"]/gi;
for (const { rel } of files) {
  if (!textRx.test(rel) || rel.startsWith('data/')) continue;
  const text = read(rel);
  if (/CHANGER-ME|dummy-password|x-not-a-real-secret/.test(text)) {
    fail(`valeur factice/secrète suspecte dans ${rel}`);
  }
  if (rel.endsWith('.php') || rel.endsWith('.html')) {
    for (const m of text.matchAll(passwordRx)) {
      fail(`affectation de mot de passe suspecte dans ${rel}`);
      void m;
      break;
    }
  }
  // Le chemin privé LWS (home/belkhir-depannage/) apparaît légitimement dans le code PHP.
  if (
    !rel.endsWith('.php') &&
    /spiritzen\.github\.io|github\.io|\/belkhir-depannage\//.test(text)
  ) {
    fail(`ancien chemin GitHub Pages dans ${rel}`);
  }
  if (/belkhir\.depannage@gmail\.com/.test(text)) fail(`adresse de compte LWS/Gmail dans ${rel}`);
}

// 4. Indexation fermée (préproduction)
if (rels.has('robots.txt') && read('robots.txt').trim() !== 'User-agent: *\nDisallow: /') {
  fail('robots.txt n’est pas fermé (Disallow: /) ');
}
for (const page of ['index.html', '404.html']) {
  if (rels.has(page) && !read(page).includes('<meta name="robots" content="noindex, nofollow">')) {
    fail(`${page} n’est plus en noindex, nofollow`);
  }
}

// 5. Sitemap sur le bon domaine
for (const sm of ['sitemap-index.xml', 'sitemap-0.xml']) {
  if (!rels.has(sm)) continue;
  for (const loc of read(sm).match(/<loc>[^<]+<\/loc>/g) ?? []) {
    if (!loc.startsWith('<loc>https://belkhir-depannage-hdf.fr/'))
      fail(`${sm} : URL hors domaine ${loc}`);
  }
}

// 6. .htaccess : garde-fous
if (rels.has('.htaccess')) {
  const h = read('.htaccess');
  if (/Strict-Transport-Security/i.test(h.replace(/^\s*#.*$/gm, '')))
    fail('HSTS actif dans .htaccess');
  if (!/api\/_lib/.test(h)) fail('.htaccess ne protège pas /api/_lib/');
}
if (rels.has('api/_lib/.htaccess') && !/Require all denied/.test(read('api/_lib/.htaccess'))) {
  fail('api/_lib/.htaccess ne contient pas « Require all denied »');
}

if (errors.length > 0) {
  console.error(`[check-dist] ÉCHEC (${errors.length}) :`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`[check-dist] OK : ${files.length} fichiers, artefact complet et sans secret.`);
