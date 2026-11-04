/* eslint-disable @typescript-eslint/no-explicit-any -- structure YAML du workflow, non typée */
import { describe, expect, it, beforeAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

// .htaccess de production + CI/CD FTPS LWS : tests statiques (aucun Apache, aucune
// connexion distante). Lisent dist/ : `npm run build` requis au préalable.

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const read = (p: string) => readFileSync(join(root, p), 'utf-8');
const activeLines = (text: string) =>
  text
    .split('\n')
    .filter((l) => !l.trim().startsWith('#'))
    .join('\n');

let htaccess = '';
let htActive = '';
let workflow: any;
let workflowText = '';
let verifySteps: any[] = [];
let deploySteps: any[] = [];
let mirrorScript = '';

beforeAll(() => {
  htaccess = readFileSync(join(dist, '.htaccess'), 'utf-8');
  htActive = activeLines(htaccess);
  workflowText = read('.github/workflows/deploy-lws.yml');
  workflow = YAML.parse(workflowText);
  verifySteps = workflow.jobs.verify.steps;
  deploySteps = workflow.jobs.deploy.steps;
  mirrorScript = deploySteps.at(-1).run;
});

describe('.htaccess — présence et contenu', () => {
  it('1. présent à la racine de dist/, identique à la source public/.htaccess', () => {
    expect(existsSync(join(dist, '.htaccess'))).toBe(true);
    expect(htaccess).toBe(read('public/.htaccess'));
  });

  it('2. api/_lib/ est protégé (seconde barrière dédiée + règle racine)', () => {
    const lib = readFileSync(join(dist, 'api', '_lib', '.htaccess'), 'utf-8');
    expect(lib).toContain('Require all denied');
    expect(lib).toContain('Deny from all');
    expect(htActive).toMatch(/RedirectMatch 403 "\^\/api\/_lib\(\/\|\$\)"/);
  });

  it('3. /api/demande-devis.php n’est ni bloqué ni réécrit', () => {
    expect(htActive).not.toMatch(/demande-devis/);
    expect(htActive).not.toMatch(/RedirectMatch \d+ "\^\/api\/?"/);
    expect(existsSync(join(dist, 'api', 'demande-devis.php'))).toBe(true);
  });

  it('4. aucun HSTS actif', () => {
    expect(htActive).not.toMatch(/Strict-Transport-Security/i);
  });

  it('5. /.well-known/ reste accessible (ACME exclu des blocages et des redirections)', () => {
    expect(htActive).toContain('RewriteRule ^\\.well-known/acme-challenge/ - [L]');
    expect(htActive).toContain('(?!well-known(/|$))');
  });

  it('6. aucun fallback SPA global, DirectoryIndex et listage désactivé, 404 statique', () => {
    expect(htActive).not.toMatch(/RewriteRule\s+\.\*\s+\/?index\.html/);
    expect(htActive).not.toMatch(/RewriteRule\s+\^\s+\/?index\.html/);
    expect(htActive).not.toMatch(/FallbackResource/);
    expect(htActive).toContain('DirectoryIndex index.html');
    expect(htActive).toContain('Options -Indexes');
    expect(htActive).toContain('ErrorDocument 404 /404.html');
    expect(existsSync(join(dist, '404.html'))).toBe(true);
  });

  it('7. canonicalisation : www → domaine nu en HTTPS ; HTTP→HTTPS documentée mais désactivée ; aucun ancien chemin', () => {
    expect(htActive).toContain('RewriteCond %{HTTP_HOST} ^www\\.belkhir-depannage-hdf\\.fr$ [NC]');
    expect(htActive).toContain(
      'RewriteRule ^ https://belkhir-depannage-hdf.fr%{REQUEST_URI} [R=301,L]',
    );
    // Le bloc HTTP→HTTPS n'existe qu'en commentaire (À VALIDER au premier déploiement).
    expect(htaccess).toMatch(/#\s*RewriteCond %\{HTTP:X-Forwarded-Proto\} !=https/);
    expect(htActive).not.toMatch(/X-Forwarded-Proto/);
    expect(htaccess).not.toMatch(
      /github\.io|\/belkhir-depannage\/|belkhir-depannage80|belkhir-depannage\.fr/,
    );
    expect(htaccess).toContain('À VALIDER');
  });

  it('en-têtes sobres, cache long réservé à /_astro/, pas de CSP', () => {
    expect(htActive).toContain('X-Content-Type-Options "nosniff"');
    expect(htActive).toContain('Referrer-Policy');
    expect(htActive).toContain('Permissions-Policy');
    expect(htActive).not.toMatch(/Content-Security-Policy/i);
    expect(htActive).toContain('RewriteRule ^_astro/ - [E=BELKHIR_ASSET:1]');
    expect(htActive).toContain('env=BELKHIR_ASSET');
    expect(htActive).toMatch(/\\\.\(html\|xml\|txt\)\$[\s\S]*no-cache/);
  });

  it('toutes les directives dépendantes d’un module sont encapsulées dans <IfModule>', () => {
    for (const directive of [
      'RewriteEngine',
      'RedirectMatch',
      'Header ',
      'AddOutputFilterByType',
      'AddType',
    ]) {
      const idx = htActive.indexOf(directive);
      expect(idx, directive).toBeGreaterThan(-1);
      const before = htActive.slice(0, idx);
      const opened = (before.match(/<IfModule /g) ?? []).length;
      const closed = (before.match(/<\/IfModule>/g) ?? []).length;
      expect(opened - closed, `${directive} hors IfModule`).toBeGreaterThan(0);
    }
  });
});

describe('.htaccess — expressions de blocage (simulées en JavaScript)', () => {
  const rules = [...htmlRules()];
  function htmlRules(): string[] {
    const text = readFileSync(join(root, 'public', '.htaccess'), 'utf-8');
    return [...text.matchAll(/RedirectMatch 403 "([^"]+)"/g)].map((m) => m[1]);
  }
  const blocked = (path: string) =>
    rules.some((r) => {
      const flags = r.startsWith('(?i)') ? 'i' : '';
      return new RegExp(r.replace(/^\(\?i\)/, ''), flags).test(path);
    });

  it('bloque les chemins sensibles', () => {
    for (const p of [
      '/.env',
      '/.git/config',
      '/.htpasswd',
      '/api/_lib/src/Handler.php',
      '/api/_lib/vendor/autoload.php',
      '/api/_lib',
      '/composer.json',
      '/composer.lock',
      '/formulaire.config.php',
      '/api/secret.txt',
      '/backup.sql',
      '/config.ini',
      '/app.log',
      '/formulaire.config.example.php.bak',
    ]) {
      expect(blocked(p), p).toBe(true);
    }
  });

  it('laisse passer le site, l’API publique et les validations de certificat', () => {
    for (const p of [
      '/',
      '/index.html',
      '/plomberie/',
      '/404.html',
      '/robots.txt',
      '/sitemap-index.xml',
      '/api/demande-devis.php',
      '/_astro/BaseLayout.CEzEVOQl.css',
      '/.well-known/acme-challenge/abc123',
      '/.well-known/security.txt',
      '/favicon.svg',
    ]) {
      expect(blocked(p), p).toBe(false);
    }
  });
});

describe('CI/CD — workflow GitHub Actions', () => {
  it('l’ancien workflow GitHub Pages est supprimé ; un seul workflow de déploiement', () => {
    const dir = join(root, '.github', 'workflows');
    expect(existsSync(join(dir, 'deploy.yml'))).toBe(false);
    expect(readdirSync(dir)).toEqual(['deploy-lws.yml']);
    expect(workflowText).not.toMatch(/deploy-pages|upload-pages-artifact|configure-pages|id-token/);
    expect(workflowText).not.toMatch(/pages:\s*write/);
  });

  it('déclencheurs : pull_request et push vers main, workflow_dispatch ; concurrence ; permissions minimales', () => {
    expect(Object.keys(workflow.on).sort()).toEqual(['pull_request', 'push', 'workflow_dispatch']);
    expect(workflow.on.pull_request.branches).toEqual(['main']);
    expect(workflow.on.push.branches).toEqual(['main']);
    expect(workflow.concurrency.group).toContain('github.ref');
    expect(workflow.permissions).toEqual({ contents: 'read' });
    for (const job of Object.values<any>(workflow.jobs)) {
      expect(job.permissions).toEqual({ contents: 'read' });
      expect(job['timeout-minutes']).toBeLessThanOrEqual(30);
    }
  });

  it('actions épinglées sur un SHA complet de 40 caractères', () => {
    const uses = [...workflowText.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1]);
    expect(uses.length).toBeGreaterThanOrEqual(5);
    for (const u of uses) expect(u, u).toMatch(/@[0-9a-f]{40}$/);
  });

  it('9. composer install s’exécute avant npm run build ; ordre complet des contrôles', () => {
    const cmds = verifySteps.map((s) => s.run ?? s.uses ?? '');
    const idx = (needle: RegExp) => cmds.findIndex((c) => needle.test(c));
    const order = [
      /composer validate --strict/,
      /composer install --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader/,
      /composer audit/,
      /php -l/,
      /php php\/tests\/run\.php/,
      /npm ci/,
      /npm run check/,
      /npm run build/,
      /npm run test:run/,
      /check-dist\.mjs/,
      /upload-artifact/,
    ].map(idx);
    for (const i of order) expect(i).toBeGreaterThan(-1);
    expect([...order]).toEqual([...order].sort((a, b) => a - b));
  });

  it('10-11. le déploiement dépend du job de contrôle, n’a pas lieu sur pull_request', () => {
    expect(workflow.jobs.deploy.needs).toBe('verify');
    const cond: string = workflow.jobs.deploy.if.replace(/\s+/g, ' ');
    expect(cond).toContain("github.event_name != 'pull_request'");
    expect(cond).toContain("github.ref == 'refs/heads/main'");
    expect(workflow.jobs.deploy.environment).toBe('production');
  });

  it('push sur main : déploiement automatique seulement si vars.LWS_DEPLOY_ENABLED == true ; sinon ignoré après contrôles verts', () => {
    const cond: string = workflow.jobs.deploy.if.replace(/\s+/g, ' ');
    expect(cond).toContain(
      "(github.event_name == 'push' && github.ref == 'refs/heads/main' && vars.LWS_DEPLOY_ENABLED == 'true')",
    );
    // Le job de contrôle n'est jamais conditionné par la variable : contrôles et build toujours exécutés.
    expect(workflow.jobs.verify.if).toBeUndefined();
    const notice = verifySteps.find((s) => String(s.name).includes('Déploiement LWS désactivé'));
    expect(notice.if).toBe("github.event_name == 'push' && vars.LWS_DEPLOY_ENABLED != 'true'");
    expect(notice.run).toContain('::notice::');
    // La variable (non secrète) n'est utilisée qu'en condition, jamais dans une commande.
    const runs = [...verifySteps, ...deploySteps].map((s) => s.run ?? '').join('\n');
    expect(runs).not.toContain('vars.');
  });

  it('workflow_dispatch : choix explicite dry-run | deploy (défaut dry-run), deploy réservé à main', () => {
    const input = workflow.on.workflow_dispatch.inputs.mode;
    expect(input.type).toBe('choice');
    expect(input.options).toEqual(['dry-run', 'deploy']);
    expect(input.default).toBe('dry-run');
    expect(workflowText).not.toContain('inputs.dry_run');
    const cond: string = workflow.jobs.deploy.if.replace(/\s+/g, ' ');
    expect(cond).toContain("inputs.mode == 'dry-run'");
    expect(cond).toContain("(inputs.mode == 'deploy' && github.ref == 'refs/heads/main')");
    expect(workflow.jobs.deploy.env.DRY_RUN).toBe(
      "${{ github.event_name == 'workflow_dispatch' && inputs.mode == 'dry-run' }}",
    );
  });

  it('dry-run : le miroir reçoit --dry-run (aucun transfert ni suppression) ; le mode réel ne l’ajoute pas', () => {
    expect(mirrorScript).toContain(
      'if [ "$DRY_RUN" = "true" ]; then mirror_opts="$mirror_opts --dry-run"',
    );
    expect(mirrorScript).toContain('--reverse --delete');
    // Une seule commande de miroir, jamais de put/rm/mv/mrm séparés.
    expect(mirrorScript.match(/^mirror /gm)).toHaveLength(1);
    expect(mirrorScript).not.toMatch(/^(put|mput|rm|mrm|mv|rmdir)\b/m);
  });

  it('pull_request ne se connecte jamais au FTPS : aucun secret ni lftp dans le job de contrôle', () => {
    const verifyText = JSON.stringify(verifySteps);
    expect(verifyText).not.toMatch(/LWS_FTP|lftp|secrets\./);
    expect(workflow.jobs.verify.env).toBeUndefined();
    expect(workflow.jobs.deploy.if).toContain("github.event_name != 'pull_request'");
  });

  it('8. l’artefact conserve les fichiers cachés et échoue s’il est vide', () => {
    const up = verifySteps.find((s) => String(s.uses).includes('upload-artifact'));
    expect(up.with['include-hidden-files']).toBe(true);
    expect(up.with['if-no-files-found']).toBe('error');
    expect(up.with.path).toBe('dist');
    const check = verifySteps.find((s) => String(s.run).includes('test -f dist/.htaccess'));
    expect(check.run).toContain('test -f dist/api/_lib/.htaccess');
    const dl = deploySteps.find((s) => String(s.uses).includes('download-artifact'));
    expect(dl.with.name).toBe('lws-dist');
    expect(deploySteps.some((s) => String(s.run).includes('test -f dist/.htaccess'))).toBe(true);
  });

  it('12. FTP explicite sur TLS, port 21, passif, données protégées, certificat vérifié, aucun repli clair', () => {
    // Réglages lftp réellement utilisés (une seule configuration partagée par dry-run, deploy manuel et automatique).
    const settings = new Map(
      [...mirrorScript.matchAll(/^set (\S+) (\S+)$/gm)].map((m) => [m[1], m[2]] as const),
    );
    expect(mirrorScript.match(/lftp -f/g)).toHaveLength(1);
    expect(settings.get('ftp:ssl-force')).toBe('yes');
    expect(settings.get('ftp:ssl-auth')).toBe('TLS');
    expect(settings.get('ftp:ssl-protect-data')).toBe('yes');
    expect(settings.get('ftp:ssl-protect-list')).toBe('yes');
    expect(settings.get('ftp:passive-mode')).toBe('yes');
    expect(settings.get('ssl:verify-certificate')).toBe('yes');
    expect(settings.get('cmd:fail-exit')).toBe('yes');
    expect(mirrorScript).toContain('-p 21');
    // Aucune option de repli ou de désactivation de TLS.
    expect(settings.get('ftp:ssl-force')).not.toBe('no');
    expect(settings.get('ftp:ssl-allow')).not.toBe('no');
    expect(mirrorScript).not.toMatch(/verify-certificate\s+(no|false)/);
    expect(mirrorScript).not.toMatch(/ssl-force\s+(no|false)|ssl-allow\s+no|ssl-protect-data\s+no/);
    expect(mirrorScript).not.toMatch(/ftp:\/\//);
    expect(mirrorScript).not.toMatch(/set -x|--insecure|\s-k\s|sftp/);
  });

  it('12 bis. exception documentée : seule la comparaison du nom d’hôte du certificat est désactivée (serveur FTPS mutualisé LWS)', () => {
    expect(mirrorScript).toMatch(/^set ssl:check-hostname no$/m);
    expect(mirrorScript).not.toMatch(/check-hostname\s+yes/);
    // Le commentaire YAML qui justifie l'exception précède l'étape.
    const idx = workflowText.indexOf('- name: Miroir FTPS explicite');
    const before = workflowText.slice(Math.max(0, idx - 1400), idx);
    expect(before).toContain('serveur FTPS mutualisé LWS');
    expect(before).toContain('ssl:check-hostname no');
    expect(before).toContain('ssl:verify-certificate yes');
    // L'exception n'existe qu'à cet endroit (une seule occurrence active).
    expect(workflowText.match(/^\s+set ssl:check-hostname no$/gm)).toHaveLength(1);
  });

  it('13-15. cible = racine virtuelle « / » du compte FTP LWS, source dist/, miroir borné, /.well-known/ préservé', () => {
    // Corps du script lftp (heredoc), hors libellés d'information.
    const lftpBody = mirrorScript.split('<<LFTP\n')[1].split('\nLFTP')[0];
    const lines = lftpBody.split('\n');
    const cdIdx = lines.findIndex((l) => /^cd\s/.test(l));
    const mirrorIdx = lines.findIndex((l) => /^mirror\s/.test(l));
    // Une seule commande cd, vers la racine virtuelle, avant le miroir ; échec immédiat si elle échoue.
    expect(mirrorScript.match(/^cd /gm)).toHaveLength(1);
    expect(lines[cdIdx]).toBe('cd /');
    expect(mirrorScript).toContain('set cmd:fail-exit yes');
    expect(cdIdx).toBeGreaterThan(-1);
    expect(mirrorIdx).toBeGreaterThan(cdIdx);
    // Aucun sous-dossier /htdocs dans la session FTP (550 observé), aucun chemin hors compte.
    expect(lftpBody).not.toMatch(/htdocs/);
    expect(mirrorScript).not.toMatch(/^cd\s+\/\S/m);
    expect(mirrorScript).not.toMatch(/cd\s+\.\./);
    expect(mirrorScript).not.toMatch(/\/home\b|\/tmp\b|\/etc\b|\/var\b|\/usr\b|\bmkdir\b|\.\.\//);
    // Miroir : source locale dist/, cible = dossier courant de la session (la racine après cd /).
    expect(mirrorScript).toMatch(/^mirror \$mirror_opts[^\n]*\.\/dist \.$/m);
    expect(mirrorScript).toContain('--reverse --delete');
    expect(mirrorScript.match(/^mirror /gm)).toHaveLength(1);
    expect(mirrorScript).toContain("--exclude-glob .well-known --exclude-glob '.well-known/*'");
    // Le seul chemin distant est écrit en dur : aucune entrée utilisateur.
    expect(workflowText).not.toMatch(/github\.event\.(inputs|pull_request|head_ref)/);
  });

  it('13 bis. la racine « / » est documentée comme racine virtuelle du compte LWS = htdocs physique', () => {
    const idx = workflowText.indexOf('- name: Miroir FTPS explicite');
    const before = workflowText.slice(Math.max(0, idx - 700), idx);
    expect(before).toContain('racine VIRTUELLE du compte FTP LWS');
    expect(before).toContain('dossier web physique htdocs');
    expect(before).toContain('550');
    // Les libellés ne laissent pas croire qu'un sous-dossier /htdocs existe côté FTP.
    const activeYaml = workflowText
      .split('\n')
      .filter((l) => !l.trim().startsWith('#'))
      .join('\n');
    expect(activeYaml).not.toMatch(/vers \/htdocs|cible distante : \/htdocs|cd \/htdocs/);
    expect(workflow.jobs.deploy.name).toContain('racine FTP LWS (htdocs)');
    const doc = readFileSync(join(root, 'DEPLOIEMENT_LWS.md'), 'utf-8');
    expect(doc).toContain("550 Can't change directory to /htdocs");
    expect(doc).toMatch(/racine virtuelle/);
    expect(doc).toMatch(/ni créer ni cibler un sous-dossier `\/htdocs`/);
  });

  it('16-17. secrets : uniquement les trois noms LWS_FTP_*, aucun secret SMTP', () => {
    const refs = [...workflowText.matchAll(/secrets\.([A-Za-z0-9_]+)/g)].map((m) => m[1]);
    expect([...new Set(refs)].sort()).toEqual([
      'LWS_FTP_HOST',
      'LWS_FTP_PASSWORD',
      'LWS_FTP_USERNAME',
    ]);
    expect(workflowText).not.toMatch(/secrets\.[A-Za-z_]*SMTP/i);
    expect(workflowText).not.toMatch(/smtp_password|formulaire\.config/i);
    expect(workflowText).not.toMatch(/\$\{\{\s*secrets\.[^}]+\}\}[^\n]*\n[^\n]*echo/);
    // Les secrets ne passent que par env, jamais par la ligne de commande.
    const runs = [...verifySteps, ...deploySteps].map((s) => s.run ?? '').join('\n');
    expect(runs).not.toContain('secrets.');
  });

  it('secrets manquants : échec explicite sans afficher leur valeur', () => {
    const step = deploySteps.find((s) => String(s.run).includes('Secret GitHub manquant'));
    expect(step.run).toContain('LWS_FTP_HOST LWS_FTP_USERNAME LWS_FTP_PASSWORD');
    expect(step.run).not.toMatch(/echo[^\n]*\$\{?LWS_FTP_(PASSWORD|USERNAME)\}?/);
  });

  it('19. robots/noindex fermés : contrôlés avant tout déploiement', () => {
    const checks = [...verifySteps, ...deploySteps].filter((s) =>
      String(s.run).includes('check-dist.mjs'),
    );
    expect(checks.length).toBeGreaterThanOrEqual(2);
  });
});

describe('scripts/check-dist.mjs — contrôle de l’artefact', () => {
  const run = (dir: string) =>
    spawnSync('node', [join(root, 'scripts', 'check-dist.mjs'), dir], { encoding: 'utf-8' });

  it('20. dist/ réel : complet pour le formulaire PHP, sans secret, noindex', () => {
    const r = run(dist);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain('artefact complet et sans secret');
  });

  it('échoue si le noindex, un secret, un .env, un ancien chemin ou le .htaccess disparaissent', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'belkhir-dist-'));
    try {
      cpSync(dist, tmp, { recursive: true });
      expect(run(tmp).status).toBe(0);

      writeFileSync(join(tmp, '.env'), 'X=1');
      expect(run(tmp).status).toBe(1);
      rmSync(join(tmp, '.env'));

      writeFileSync(join(tmp, 'api', 'leak.php'), '<?php $smtp_' + 'password = "' + 'abcdefghij";');
      expect(run(tmp).status).toBe(1);
      rmSync(join(tmp, 'api', 'leak.php'));

      const idx = readFileSync(join(tmp, 'index.html'), 'utf-8');
      writeFileSync(join(tmp, 'index.html'), idx + '<a href="/belkhir-depannage/">x</a>');
      expect(run(tmp).status).toBe(1);
      writeFileSync(join(tmp, 'index.html'), idx.replace('noindex, nofollow', 'index, follow'));
      expect(run(tmp).status).toBe(1);
      writeFileSync(join(tmp, 'index.html'), idx);

      writeFileSync(join(tmp, 'robots.txt'), 'User-agent: *\nAllow: /\n');
      expect(run(tmp).status).toBe(1);
      writeFileSync(join(tmp, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

      rmSync(join(tmp, '.htaccess'));
      expect(run(tmp).status).toBe(1);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }, 120000);
});
