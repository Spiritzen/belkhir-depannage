<?php

declare(strict_types=1);

/**
 * Harnais de tests PHP autonome (aucune dépendance de test, aucun réseau).
 * Usage : php php/tests/run.php   (après `composer install`)
 * Sortie : une ligne « ok » / « FAIL » par test, puis un récapitulatif JSON final.
 * Aucun e-mail réel : le transport est un faux transport, ou PHPMailer dont la
 * phase d'envoi réseau est neutralisée.
 */

define('BELKHIR_FORM_API', true);

$root = dirname(__DIR__, 2);
foreach (['Config', 'Validator', 'RateLimiter', 'MessageBuilder', 'TransportInterface', 'SmtpTransport', 'Handler'] as $c) {
    require_once $root . '/php/src/' . $c . '.php';
}
require_once $root . '/vendor/autoload.php';

use Belkhir\Form\Config;
use Belkhir\Form\Handler;
use Belkhir\Form\RateLimiter;
use Belkhir\Form\SmtpTransport;
use Belkhir\Form\TransportInterface;
use Belkhir\Form\Validator;

final class FakeTransport implements TransportInterface
{
    /** @var list<array{subject: string, text: string, html: string}> */
    public array $sent = [];
    public bool $fail = false;

    public function send(array $message): void
    {
        if ($this->fail) {
            throw new RuntimeException('simulated smtp failure with secret-looking text hunter2');
        }
        $this->sent[] = $message;
    }
}

$results = [];
$failures = 0;
function check(string $name, bool $cond): void
{
    global $results, $failures;
    $results[] = $name;
    if ($cond) {
        echo "ok   $name\n";
    } else {
        $failures++;
        echo "FAIL $name\n";
    }
}

$tmp = sys_get_temp_dir() . '/belkhir-form-tests-' . bin2hex(random_bytes(4));
mkdir($tmp, 0700, true);

$NOW = time();
$validBody = static function (array $over = []) use ($NOW): string {
    return json_encode($over + [
        'name' => 'Jean Dupont',
        'phone' => '06 12 34 56 78',
        'location' => 'Amiens',
        'service' => 'plomberie',
        'delay' => 'aujourdhui',
        'description' => "Fuite sous l'évier.\nMerci de rappeler.",
        'website' => '',
        'opened_at' => ($NOW - 30) * 1000,
    ], JSON_UNESCAPED_UNICODE);
};
$req = static function (string $body, array $over = []): array {
    return array_replace([
        'method' => 'POST',
        'headers' => ['content-type' => 'application/json', 'origin' => 'https://belkhir-depannage-hdf.fr'],
        'body' => $body,
        'remote_addr' => '203.0.113.9',
        'host' => 'belkhir-depannage-hdf.fr',
    ], $over);
};
$logs = [];
$make = static function (?Config $cfg = null, ?FakeTransport $t = null, int $max = 5) use ($tmp, $NOW, &$logs): array {
    $t ??= new FakeTransport();
    $dir = $tmp . '/rl-' . bin2hex(random_bytes(3));
    $h = new Handler(
        $cfg ?? new Config('x-not-a-real-secret', $dir),
        $t,
        new RateLimiter($dir, $max, 900),
        static fn (): int => $NOW,
        static function (string $l) use (&$logs): void {
            $logs[] = $l;
        }
    );

    return [$h, $t];
};

// 1. Succès nominal
[$h, $t] = $make();
[$s, $hd, $b] = $h->handle($req($validBody()));
check('succès : HTTP 200 et ok=true', $s === 200 && $b['ok'] === true);
check('succès : référence DV-XXXXXX sans donnée personnelle', preg_match('/^DV-[0-9A-F]{6}$/', $b['reference']) === 1);
check('succès : un seul message transmis', count($t->sent) === 1);
check('succès : JSON UTF-8, no-store, nosniff, aucun CORS', str_contains($hd['Content-Type'], 'utf-8')
    && str_contains($hd['Cache-Control'], 'no-store') && $hd['X-Content-Type-Options'] === 'nosniff'
    && !array_key_exists('Access-Control-Allow-Origin', $hd));
$m = $t->sent[0];
check('message : objet professionnel « Nouvelle demande de devis — Plomberie — Amiens »', $m['subject'] === 'Nouvelle demande de devis — Plomberie — Amiens');
check('message : corps texte structuré (référence, nom, téléphone, commune, service, délai, description)',
    str_contains($m['text'], 'Référence : ' . $b['reference']) && str_contains($m['text'], 'Nom : Jean Dupont')
    && str_contains($m['text'], 'Téléphone : 0612345678') && str_contains($m['text'], 'Commune ou code postal : Amiens')
    && str_contains($m['text'], 'Type d’intervention : Plomberie') && str_contains($m['text'], 'Délai souhaité : Aujourd’hui')
    && str_contains($m['text'], 'Fuite sous l\'évier.') && str_contains($m['text'], 'Europe/Paris'));
check('message : version HTML échappée', str_contains($m['html'], '<table') && !str_contains($m['html'], '<script'));

// 2. Méthodes
foreach (['GET', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'] as $meth) {
    [$h] = $make();
    [$s, $hd] = $h->handle($req($validBody(), ['method' => $meth]));
    check("méthode $meth refusée (405, Allow: POST)", $s === 405 && ($hd['Allow'] ?? '') === 'POST');
}

// 3. Content-Type
foreach (['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data', ''] as $ct) {
    [$h] = $make();
    [$s] = $h->handle($req($validBody(), ['headers' => ['content-type' => $ct, 'origin' => 'https://belkhir-depannage-hdf.fr']]));
    check("Content-Type « $ct » refusé (415)", $s === 415);
}
[$h] = $make();
[$s] = $h->handle($req($validBody(), ['headers' => ['content-type' => 'application/json; charset=UTF-8']]));
check('Content-Type application/json; charset=UTF-8 accepté', $s === 200);

// 4. Origine
[$h] = $make();
[$s] = $h->handle($req($validBody(), ['headers' => ['content-type' => 'application/json', 'origin' => 'https://evil.example']]));
check('origine étrangère refusée (403)', $s === 403);
[$h] = $make();
[$s] = $h->handle($req($validBody(), ['headers' => ['content-type' => 'application/json', 'sec-fetch-site' => 'cross-site']]));
check('Sec-Fetch-Site cross-site refusé (403)', $s === 403);
[$h] = $make();
[$s] = $h->handle($req($validBody(), ['host' => 'localhost:4399', 'headers' => ['content-type' => 'application/json', 'origin' => 'http://localhost:4399']]));
check('origine locale identique à l’hôte acceptée (test local documenté)', $s === 200);

// 5. JSON invalide / trop gros
[$h] = $make();
[$s] = $h->handle($req('{not json'));
check('JSON invalide : 400', $s === 400);
[$h] = $make();
[$s] = $h->handle($req(str_repeat('a', Handler::MAX_BODY_BYTES + 1)));
check('corps trop volumineux : 413', $s === 413);

// 6. Honeypot et temporisation
[$h, $t] = $make();
[$s] = $h->handle($req($validBody(['website' => 'http://spam.example'])));
check('honeypot rempli : 403 et rien d’envoyé', $s === 403 && $t->sent === []);
[$h, $t] = $make();
[$s] = $h->handle($req($validBody(['opened_at' => ($NOW - 0) * 1000])));
check('soumission instantanée : 429 et rien d’envoyé', $s === 429 && $t->sent === []);
[$h] = $make();
[$s] = $h->handle($req($validBody(['opened_at' => ($NOW - 90000) * 1000])));
check('formulaire expiré (> 24 h) : 400', $s === 400);
[$h] = $make();
[$s] = $h->handle($req(json_encode(['name' => 'Jean Dupont'])));
check('horodatage absent : 400', $s === 400);

// 7. Validation de chaque champ
$cases = [
    'name vide' => [['name' => ''], 'name'],
    'name trop court' => [['name' => 'J'], 'name'],
    'name sans lettre' => [['name' => '12345'], 'name'],
    'name trop long' => [['name' => str_repeat('a', 101)], 'name'],
    'phone invalide' => [['phone' => 'abc'], 'phone'],
    'phone trop court' => [['phone' => '0612'], 'phone'],
    'location vide' => [['location' => ''], 'location'],
    'location caractères interdits' => [['location' => '<script>'], 'location'],
    'service hors liste' => [['service' => 'hacker'], 'service'],
    'service vide' => [['service' => ''], 'service'],
    'delay hors liste' => [['delay' => 'hier'], 'delay'],
    'description vide' => [['description' => ''], 'description'],
    'description trop courte' => [['description' => 'abc'], 'description'],
    'description trop longue' => [['description' => str_repeat('a', 2001)], 'description'],
    'name tableau' => [['name' => ['x']], 'name'],
];
foreach ($cases as $label => [$over, $field]) {
    [$h, $t] = $make();
    [$s, , $b] = $h->handle($req($validBody($over)));
    check("validation : $label → 422 sur « $field »", $s === 422 && isset($b['fields'][$field]) && $t->sent === []);
}
[$h, $t] = $make();
[$s] = $h->handle($req(json_encode([
    'name' => 'Jean Dupont', 'phone' => '+33 6 12 34 56 78', 'location' => '80000', 'service' => 'autre',
    'description' => 'Porte bloquée', 'opened_at' => ($NOW - 30) * 1000,
])));
check('délai absent : valeur par défaut « Dès que possible », téléphone international accepté', $s === 200
    && str_contains($t->sent[0]['text'], 'Délai souhaité : Dès que possible'));

// 8. Injection d'en-tête
[$h, $t] = $make();
[$s] = $h->handle($req($validBody([
    'location' => "Amiens\r\nBcc: attaquant@example.org",
    'name' => "Jean\r\nBcc: attaquant@example.org",
])));
$subject = $t->sent[0]['subject'] ?? '';
check('injection : aucun retour ligne dans l’objet', $s !== 200 || (!str_contains($subject, "\n") && !str_contains($subject, "\r")));
check('injection : caractères de contrôle neutralisés', Validator::singleLine("a\r\nb\x00c") === 'a b c');

// 9. Rate limit
[$h] = $make(null, null, 3);
$codes = [];
for ($i = 0; $i < 5; $i++) {
    [$s] = $h->handle($req($validBody()));
    $codes[] = $s;
}
check('limitation de débit : 3 acceptées puis 429', $codes === [200, 200, 200, 429, 429]);
[$h] = $make(null, null, 3);
$s1 = $h->handle($req($validBody(), ['remote_addr' => '198.51.100.1']))[0];
check('limitation indépendante par adresse', $s1 === 200);
[$h] = $make(null, null, 1);
$h->handle($req($validBody(), ['remote_addr' => '198.51.100.2', 'headers' => ['content-type' => 'application/json', 'x-forwarded-for' => '1.1.1.1']]));
[$s] = $h->handle($req($validBody(), ['remote_addr' => '198.51.100.2', 'headers' => ['content-type' => 'application/json', 'x-forwarded-for' => '2.2.2.2']]));
check('X-Forwarded-For ignoré pour la limitation', $s === 429);
$files = glob($tmp . '/rl-*/rl-*.json') ?: [];
$leak = false;
foreach ($files as $f) {
    $c = (string) file_get_contents($f);
    if (str_contains($c, 'Dupont') || str_contains($c, '203.0.113.9') || str_contains($f, '203.0.113.9')) {
        $leak = true;
    }
}
check('état de limitation : ni adresse IP ni donnée de formulaire sur disque', !$leak && $files !== []);

// 10. Configuration absente → 503 générique
[$h] = (function () use ($tmp, $NOW) {
    $t = new FakeTransport();
    $h = new Handler(null, $t, new RateLimiter($tmp . '/none'), static fn (): int => $NOW, static function (): void {});

    return [$h, $t];
})();
[$s, , $b] = $h->handle($req($validBody()));
check('configuration absente : 503 générique, sans chemin ni détail', $s === 503
    && !str_contains(json_encode($b), '/') && !str_contains(strtolower(json_encode($b)), 'config'));

// 11. Échec du transport : 500 générique, journal minimal sans secret ni contenu
$logs = [];
$ft = new FakeTransport();
$ft->fail = true;
[$h] = $make(null, $ft);
[$s, , $b] = $h->handle($req($validBody()));
$logged = implode("\n", $logs);
check('échec SMTP : 500 générique', $s === 500 && $b['ok'] === false && !isset($b['reference']));
check('échec SMTP : journal = référence + catégorie uniquement', preg_match('/^ref=DV-[0-9A-F]{6} category=smtp_send_failed$/', $logged) === 1
    && !str_contains($logged, 'hunter2') && !str_contains($logged, 'Dupont') && !str_contains($logged, 'secret'));

// 12. Résolution de configuration
$cfgDir = $tmp . '/cfg';
mkdir($cfgDir, 0700, true);
file_put_contents($cfgDir . '/formulaire.config.php', "<?php\nreturn ['smtp_password' => 'dummy-password-for-tests'];\n");
$loaded = Config::load($cfgDir . '/formulaire.config.php', $tmp . '/htdocs-inexistant');
check('config : chargée depuis la variable d’environnement (chemin explicite)', $loaded !== null && $loaded->smtpPassword() === 'dummy-password-for-tests');
check('config : dossier d’état par défaut = à côté du fichier', $loaded !== null && str_ends_with(str_replace('\\', '/', $loaded->stateDir()), '/cfg/state'));
check('config : aucun fichier → null', Config::load($tmp . '/absent.php', null) === null);
file_put_contents($cfgDir . '/vide.php', "<?php\nreturn ['smtp_password' => ''];\n");
check('config : mot de passe vide → null (aucun défaut)', Config::load($cfgDir . '/vide.php', null) === null);
mkdir($tmp . '/htdocs', 0700, true);
file_put_contents($tmp . '/htdocs/formulaire.config.php', "<?php\nreturn ['smtp_password' => 'in-docroot'];\n");
check('config : fichier situé DANS le document root refusé', Config::load($tmp . '/htdocs/formulaire.config.php', $tmp . '/htdocs') === null);
$cands = Config::candidatePaths(null, '/home/xyz/htdocs');
check('config : chemin LWS externe par défaut (frère de htdocs)', $cands === ['/home/xyz/home/belkhir-depannage/formulaire.config.php']);

// 13. Transport SMTP : PHPMailer réel, envoi réseau neutralisé
$captured = null;
$factory = static function (): \PHPMailer\PHPMailer\PHPMailer {
    return new class(true) extends \PHPMailer\PHPMailer\PHPMailer {
        public function postSend(): bool
        {
            return true; // aucune connexion SMTP
        }
    };
};
$mailerRef = null;
$factory2 = static function () use (&$mailerRef, $factory) {
    $mailerRef = $factory();

    return $mailerRef;
};
$smtp = new SmtpTransport('dummy-password-for-tests', $factory2);
$smtp->send(MessageBuilderProxy::build());
$raw = $mailerRef->getSentMIMEMessage();
check('SMTP : From = formulaire@belkhir-depannage-hdf.fr, nom « BELKHIR DEPANNAGE — Site internet »',
    $mailerRef->From === 'formulaire@belkhir-depannage-hdf.fr' && str_contains($mailerRef->FromName, 'BELKHIR DEPANNAGE'));
check('SMTP : destinataire unique formulaire@belkhir-depannage-hdf.fr, aucun Gmail',
    array_keys($mailerRef->getAllRecipientAddresses()) === ['formulaire@belkhir-depannage-hdf.fr']
    && !str_contains($raw, 'gmail'));
check('SMTP : aucun Reply-To', $mailerRef->getReplyToAddresses() === [] && !preg_match('/^Reply-To:/mi', $raw));
check('SMTP : Message-ID valide généré par PHPMailer', preg_match('/^Message-ID: <[^@\s>]+@belkhir-depannage-hdf\.fr>/mi', $raw) === 1);
check('SMTP : enveloppe (Sender) alignée sur l’expéditeur', $mailerRef->Sender === 'formulaire@belkhir-depannage-hdf.fr');
check('SMTP : hôte, port 465, SMTPS, authentification, UTF-8',
    $mailerRef->Host === 'mail73.lwspanel.com' && $mailerRef->Port === 465
    && $mailerRef->SMTPSecure === \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS && $mailerRef->SMTPAuth === true
    && $mailerRef->Username === 'formulaire@belkhir-depannage-hdf.fr' && $mailerRef->CharSet === 'utf-8');
check('SMTP : pas de débogage, mailer SMTP (pas mail())', $mailerRef->SMTPDebug === 0 && $mailerRef->Mailer === 'smtp');
check('SMTP : multipart texte + HTML, objet encodé', str_contains($raw, 'multipart/alternative') && str_contains($raw, 'Subject:'));

// Nettoyage
$rm = static function (string $d) use (&$rm): void {
    foreach (glob($d . '/{,.}*', GLOB_BRACE) ?: [] as $p) {
        if (in_array(basename($p), ['.', '..'], true)) {
            continue;
        }
        is_dir($p) ? $rm($p) : @unlink($p);
    }
    @rmdir($d);
};
$rm($tmp);

echo json_encode(['total' => count($results), 'failures' => $failures]) . "\n";
exit($failures === 0 ? 0 : 1);

/** Message minimal pour le test du transport. */
final class MessageBuilderProxy
{
    /** @return array{subject: string, text: string, html: string} */
    public static function build(): array
    {
        return \Belkhir\Form\MessageBuilder::build([
            'name' => 'Jean Dupont', 'phone' => '0612345678', 'location' => 'Amiens', 'service' => 'plomberie',
            'delay' => 'aujourdhui', 'description' => 'Fuite sous l’évier.',
        ], 'DV-ABC123', new DateTimeImmutable('@1800000000'));
    }
}
