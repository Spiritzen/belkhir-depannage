import { describe, expect, it, beforeAll } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Raccordement du formulaire de devis à l'endpoint PHP (PHPMailer/SMTP LWS).
// Aucun e-mail réel : le harnais PHP utilise un faux transport, ou PHPMailer
// dont l'envoi réseau est neutralisé. Ces tests lisent `dist/` (npm run build
// requis) comme tests/migration-domaine-lws.test.ts.

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const api = join(dist, 'api');
const read = (p: string) => readFileSync(join(root, p), 'utf-8');

function findPhp(): string | null {
  const candidates = [process.env.PHP_BIN, 'php', 'C:/xampp/php/php.exe'].filter((c): c is string =>
    Boolean(c),
  );
  for (const c of candidates) {
    const r = spawnSync(c, ['-v'], { encoding: 'utf-8' });
    if (r.status === 0) return c;
  }
  return null;
}
const php = findPhp();
const vendorReady = existsSync(join(root, 'vendor', 'autoload.php'));

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

let modal = '';
let activeModalCode = '';
let phpSources: Array<{ file: string; text: string }> = [];

beforeAll(() => {
  modal = read('src/components/ui/QuoteModal.astro');
  activeModalCode = modal
    .split('\n')
    .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
    .join('\n');
  phpSources = [
    ...listFiles(join(root, 'php', 'src')),
    join(root, 'php', 'public', 'demande-devis.php'),
  ].map((file) => ({ file: relative(root, file), text: readFileSync(file, 'utf-8') }));
});

describe('formulaire — harnais PHP (validation, méthodes, protections, transport simulé)', () => {
  it.skipIf(!php || !vendorReady)(
    'php/tests/run.php : tous les contrôles passent (aucun envoi réseau)',
    () => {
      const out = execFileSync(php as string, ['php/tests/run.php'], {
        cwd: root,
        encoding: 'utf-8',
        timeout: 60000,
      });
      const summary = JSON.parse(out.trim().split('\n').pop() as string);
      expect(summary.failures).toBe(0);
      expect(summary.total).toBeGreaterThanOrEqual(60);
      expect(out).not.toContain('FAIL');
    },
    90000,
  );

  it.skipIf(!php)('php -l : chaque fichier PHP est syntaxiquement valide', () => {
    for (const { file } of phpSources) {
      const r = spawnSync(php as string, ['-l', join(root, file)], { encoding: 'utf-8' });
      expect(r.status, `${file}: ${r.stdout}${r.stderr}`).toBe(0);
    }
  });
});

describe('formulaire — chemin de production PHP', () => {
  it('aucun mail(), sendmail, SMTPDebug, CORS générique ni mode test dans le code déployé', () => {
    for (const { file, text } of phpSources) {
      expect(text, file).not.toMatch(/(?<![A-Za-z_>:$])mail\s*\(/);
      expect(text, file).not.toMatch(/sendmail/i);
      expect(text, file).not.toContain('SMTPDebug');
      expect(text, file).not.toMatch(/Access-Control-Allow-Origin/i);
      expect(text, file).not.toMatch(/getenv\(\s*['"][A-Z_]*TEST/);
    }
  });

  it('SMTP : paramètres non secrets attendus, mot de passe jamais en dur', () => {
    const cfg = phpSources.find((s) => s.file.endsWith('Config.php'))?.text ?? '';
    expect(cfg).toContain("SMTP_HOST = 'mail73.lwspanel.com'");
    expect(cfg).toContain('SMTP_PORT = 465');
    expect(cfg).toContain("SMTP_USER = 'formulaire@belkhir-depannage-hdf.fr'");
    expect(cfg).toContain("MAIL_TO = 'formulaire@belkhir-depannage-hdf.fr'");
    expect(cfg).not.toMatch(/gmail/i);
    const smtp = phpSources.find((s) => s.file.endsWith('SmtpTransport.php'))?.text ?? '';
    expect(smtp).toContain('ENCRYPTION_SMTPS');
    expect(smtp).toContain('SMTPAuth = true');
    expect(smtp).not.toMatch(/addReplyTo/);
    expect(smtp).not.toMatch(/gmail/i);
  });

  it('aucun secret en dur dans les fichiers suivis ou non ignorés', () => {
    const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], {
      cwd: root,
      encoding: 'utf-8',
    })
      .split('\n')
      .filter(
        (f) =>
          f &&
          existsSync(join(root, f)) &&
          !/\.(png|jpe?g|webp|woff2?|ico|svg|json|lock)$/i.test(f) &&
          !f.startsWith('PROMPT_') &&
          !f.startsWith('RAPPORT_') &&
          f !== 'tests/formulaire-smtp-lws.test.ts',
      );
    const allowed = ['dummy-password-for-tests', 'CHANGER-ME', 'x-not-a-real-secret', 'in-docroot'];
    const rx = /(smtp_?password|password|passwd)['"]?\s*(=>|=|:)\s*['"]([^'"]{6,})['"]/gi;
    for (const f of files) {
      const text = readFileSync(join(root, f), 'utf-8');
      for (const m of text.matchAll(rx)) {
        expect(
          allowed.some((a) => m[3].includes(a)),
          `${f}: affectation de mot de passe suspecte`,
        ).toBe(true);
      }
    }
    // Rien de secret n'est suivi : vendor/ et les fichiers de configuration réels sont ignorés.
    const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf-8' });
    expect(tracked).not.toMatch(/^vendor\//m);
    expect(tracked).not.toMatch(/(^|\/)formulaire\.config\.php$/m);
    expect(tracked).not.toMatch(/(^|\/)\.env$/m);
  });
});

describe('formulaire — artefact dist/ (build complet)', () => {
  it('contient l’endpoint, le code applicatif et PHPMailer', () => {
    expect(existsSync(join(api, 'demande-devis.php'))).toBe(true);
    for (const c of [
      'Config',
      'Validator',
      'RateLimiter',
      'MessageBuilder',
      'TransportInterface',
      'SmtpTransport',
      'Handler',
    ]) {
      expect(existsSync(join(api, '_lib', 'src', `${c}.php`)), c).toBe(true);
    }
    expect(existsSync(join(api, '_lib', 'vendor', 'autoload.php'))).toBe(true);
    expect(
      existsSync(join(api, '_lib', 'vendor', 'phpmailer', 'phpmailer', 'src', 'PHPMailer.php')),
    ).toBe(true);
    expect(
      existsSync(join(api, '_lib', 'vendor', 'phpmailer', 'phpmailer', 'src', 'SMTP.php')),
    ).toBe(true);
  });

  it('ne contient aucun secret, configuration réelle, exemple de configuration ni dépendance de développement', () => {
    const files = listFiles(dist);
    for (const f of files) {
      const name = f.replace(/\\/g, '/');
      expect(name, name).not.toMatch(/\/\.env/);
      expect(name, name).not.toMatch(/formulaire\.config/i);
      expect(name, name).not.toMatch(/secret/i);
      expect(name, name).not.toMatch(/composer\.(json|lock)$/);
      expect(name, name).not.toMatch(/README/i);
    }
    for (const f of listFiles(api)) {
      const text = readFileSync(f, 'utf-8');
      expect(text).not.toContain('CHANGER-ME');
      expect(text).not.toContain('dummy-password');
      expect(text).not.toContain('belkhir.depannage@gmail.com');
    }
    expect(existsSync(join(dist, 'api', '_lib', 'vendor', 'bin'))).toBe(false);
  });

  it('le point d’entrée charge tout depuis _lib et force display_errors à 0', () => {
    const entry = readFileSync(join(api, 'demande-devis.php'), 'utf-8');
    expect(entry).toContain("__DIR__ . '/_lib'");
    expect(entry).toContain("ini_set('display_errors', '0')");
    expect(entry).toContain('/vendor/autoload.php');
  });

  it('chaque fichier PHP de l’artefact (hors PHPMailer) est syntaxiquement valide', () => {
    if (!php) return;
    for (const f of listFiles(api).filter((p) => p.endsWith('.php') && !p.includes('vendor'))) {
      const r = spawnSync(php, ['-l', f], { encoding: 'utf-8' });
      expect(r.status, f).toBe(0);
    }
  });
});

describe('formulaire — modale raccordée (contrat côté navigateur)', () => {
  it('conserve les 5 champs obligatoires + le délai optionnel, sans case de consentement', () => {
    for (const id of [
      'quote-name',
      'quote-phone',
      'quote-location',
      'quote-service',
      'quote-description',
    ]) {
      expect(modal).toContain(`id="${id}"`);
    }
    expect(modal).toContain('id="quote-delay"');
    expect(modal).not.toContain('type="checkbox"');
    expect(modal).not.toContain('quote-consent');
  });

  it('honeypot discret : hors écran, aria-hidden, tabindex -1, autocomplete off', () => {
    expect(modal).toMatch(/class="quote-modal__hp"\s+aria-hidden="true"/);
    expect(modal).toMatch(/id="quote-website"[^>]*tabindex="-1"[^>]*autocomplete="off"/);
    expect(modal).toContain('opened_at: openedAt');
    expect(modal).toContain('openedAt = Date.now()');
  });

  it('envoie en JSON same-origin vers l’endpoint, sans cookie ni stockage local', () => {
    expect(activeModalCode).toContain("method: 'POST'");
    expect(activeModalCode).toContain("'Content-Type': 'application/json'");
    expect(activeModalCode).toContain("credentials: 'same-origin'");
    expect(activeModalCode).not.toMatch(/localStorage|sessionStorage|document\.cookie/);
  });

  it('état « envoi en cours » : bouton désactivé, libellé, aria-busy, double envoi bloqué', () => {
    expect(activeModalCode).toContain("'Envoi en cours…'");
    expect(activeModalCode).toContain('submitBtn.disabled = value');
    expect(activeModalCode).toContain("form!.setAttribute('aria-busy'");
    expect(activeModalCode).toMatch(/if \(sending\) return;/);
    expect(activeModalCode).toMatch(/finally\s*\{\s*setSending\(false\);/);
  });

  it('succès : référence affichée dans la zone aria-live, formulaire réinitialisé seulement dans la branche de succès', () => {
    expect(modal).toMatch(/id="quote-modal-status"[^>]*role="status"[^>]*aria-live="polite"/);
    const okBranch = activeModalCode.indexOf('payload?.ok === true');
    const reset = activeModalCode.indexOf('form!.reset()');
    const failure = activeModalCode.indexOf("showFailure('L’envoi");
    expect(okBranch).toBeGreaterThan(-1);
    expect(reset).toBeGreaterThan(okBranch);
    expect(reset).toBeLessThan(failure);
    expect(activeModalCode.match(/form!\.reset\(\)/g)).toHaveLength(1);
    expect(activeModalCode).toContain('Référence : ${payload.reference}');
    // La modale n'est jamais fermée automatiquement après l'envoi.
    expect(activeModalCode).not.toMatch(/setTimeout\([^)]*closeModal/);
  });

  it('erreur : données conservées, message clair et numéro d’urgence centralisé en lien tel:', () => {
    expect(activeModalCode).toContain('Vos informations sont conservées');
    expect(activeModalCode).toContain('En cas d’urgence, appelez le');
    expect(modal).toContain('data-emergency-display={emergency.display}');
    expect(modal).toContain('data-emergency-tel={emergency.international}');
    expect(activeModalCode).toContain('`tel:${tel}`');
  });

  it('fermeture bloquée seulement pendant l’envoi (croix, Annuler, fond, Échap natif)', () => {
    expect(activeModalCode).toMatch(/function closeModal\(\): void \{\s*if \(sending\) return;/);
    expect(activeModalCode).toContain("dialog.addEventListener('cancel'");
    expect(activeModalCode).toContain('event.preventDefault()');
  });
});
