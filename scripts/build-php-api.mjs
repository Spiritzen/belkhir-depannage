/**
 * Assemble l'endpoint PHP du formulaire dans dist/api/ (exécuté après
 * `astro build`, portable Windows/Linux — aucune commande Unix).
 *
 *   dist/api/demande-devis.php        point d'entrée public
 *   dist/api/_lib/src/*.php           code applicatif (php/src)
 *   dist/api/_lib/vendor/             PHPMailer + autoload Composer (runtime uniquement)
 *   dist/api/_lib/.htaccess           interdiction d'accès HTTP direct (php/_lib.htaccess)
 *
 * Prérequis : `composer install --no-dev --optimize-autoloader` (vendor/).
 * Aucune configuration secrète n'est copiée : le mot de passe SMTP vit dans un
 * fichier externe hors document root (voir php/README.md).
 *
 * Échappatoire explicite pour un build JavaScript seul : SKIP_PHP_API=1.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const out = join(dist, 'api');

if (process.env.SKIP_PHP_API === '1') {
  console.warn('[build-php-api] SKIP_PHP_API=1 : endpoint PHP NON inclus dans dist/.');
  process.exit(0);
}

if (!existsSync(dist)) {
  console.error('[build-php-api] dist/ introuvable : lancer `astro build` avant.');
  process.exit(1);
}

const vendor = join(root, 'vendor');
const required = [
  join(vendor, 'autoload.php'),
  join(vendor, 'composer'),
  join(vendor, 'phpmailer', 'phpmailer', 'src', 'PHPMailer.php'),
];
const missing = required.filter((p) => !existsSync(p));
if (missing.length > 0) {
  console.error(
    '[build-php-api] Dépendances PHP absentes. Lancer d’abord :\n' +
      '  composer install --no-dev --optimize-autoloader\n' +
      '(ou SKIP_PHP_API=1 pour un build sans endpoint).',
  );
  process.exit(1);
}

// Le .htaccess racine vient de public/.htaccess (copié par `astro build`).
if (!existsSync(join(dist, '.htaccess'))) {
  console.error('[build-php-api] dist/.htaccess absent : public/.htaccess n’a pas été copié.');
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, '_lib', 'vendor', 'phpmailer', 'phpmailer'), { recursive: true });

cpSync(join(root, 'php', 'public', 'demande-devis.php'), join(out, 'demande-devis.php'));
cpSync(join(root, 'php', 'src'), join(out, '_lib', 'src'), { recursive: true });
// Interdiction d'accès HTTP direct au code interne (seconde barrière après le .htaccess racine).
cpSync(join(root, 'php', '_lib.htaccess'), join(out, '_lib', '.htaccess'));
cpSync(join(vendor, 'autoload.php'), join(out, '_lib', 'vendor', 'autoload.php'));
cpSync(join(vendor, 'composer'), join(out, '_lib', 'vendor', 'composer'), { recursive: true });
cpSync(
  join(vendor, 'phpmailer', 'phpmailer', 'src'),
  join(out, '_lib', 'vendor', 'phpmailer', 'phpmailer', 'src'),
  { recursive: true },
);
for (const name of readdirSync(join(vendor, 'phpmailer', 'phpmailer'))) {
  if (/^(LICENSE|VERSION)/i.test(name)) {
    cpSync(
      join(vendor, 'phpmailer', 'phpmailer', name),
      join(out, '_lib', 'vendor', 'phpmailer', 'phpmailer', name),
    );
  }
}

console.log('[build-php-api] dist/api/ prêt (endpoint + PHPMailer, sans secret).');
