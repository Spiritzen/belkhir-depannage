<?php

declare(strict_types=1);

/**
 * Point d'entrée public de la demande de devis : POST /api/demande-devis.php
 *
 * Déployé dans dist/api/ par `npm run build` (scripts/build-php-api.mjs), avec
 * le code applicatif dans _lib/src et PHPMailer dans _lib/vendor. Le mot de
 * passe SMTP n'est PAS dans cet artefact : voir php/README.md.
 */

define('BELKHIR_FORM_API', true);

// Aucun affichage d'erreur côté navigateur, quelle que soit la configuration.
ini_set('display_errors', '0');
error_reporting(E_ALL);

$lib = __DIR__ . '/_lib';

foreach (['Config', 'Validator', 'RateLimiter', 'MessageBuilder', 'TransportInterface', 'SmtpTransport', 'Handler'] as $class) {
    require_once $lib . '/src/' . $class . '.php';
}

$send = static function (int $status, array $headers, array $body): void {
    http_response_code($status);
    foreach ($headers as $name => $value) {
        header($name . ': ' . $value);
    }
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
};

try {
    $autoload = $lib . '/vendor/autoload.php';
    if (!is_file($autoload)) {
        throw new RuntimeException('dependencies_missing');
    }
    require_once $autoload;

    $envPath = getenv(\Belkhir\Form\Config::ENV_CONFIG_PATH);
    $config = \Belkhir\Form\Config::load(
        is_string($envPath) ? $envPath : null,
        isset($_SERVER['DOCUMENT_ROOT']) ? (string) $_SERVER['DOCUMENT_ROOT'] : null
    );

    $headers = [];
    foreach ($_SERVER as $key => $value) {
        if (is_string($value) && strncmp($key, 'HTTP_', 5) === 0) {
            $headers[strtolower(str_replace('_', '-', substr($key, 5)))] = $value;
        }
    }
    if (isset($_SERVER['CONTENT_TYPE'])) {
        $headers['content-type'] = (string) $_SERVER['CONTENT_TYPE'];
    }

    $stateDir = $config !== null ? $config->stateDir() : sys_get_temp_dir() . '/belkhir-form';

    $handler = new \Belkhir\Form\Handler(
        $config,
        new \Belkhir\Form\SmtpTransport($config !== null ? $config->smtpPassword() : ''),
        new \Belkhir\Form\RateLimiter($stateDir),
        static fn (): int => time(),
        static function (string $line): void {
            error_log('[belkhir-form] ' . $line);
        }
    );

    [$status, $responseHeaders, $body] = $handler->handle([
        'method' => strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')),
        'headers' => $headers,
        // Lecture bornée : jamais plus que la limite + 1 octet.
        'body' => (string) file_get_contents('php://input', false, null, 0, \Belkhir\Form\Handler::MAX_BODY_BYTES + 1),
        'remote_addr' => (string) ($_SERVER['REMOTE_ADDR'] ?? ''),
        'host' => (string) ($_SERVER['HTTP_HOST'] ?? ''),
    ]);

    $send($status, $responseHeaders, $body);
} catch (\Throwable $e) {
    error_log('[belkhir-form] category=internal_error');
    $send(500, [
        'Content-Type' => 'application/json; charset=utf-8',
        'Cache-Control' => 'no-store, max-age=0',
        'X-Content-Type-Options' => 'nosniff',
    ], ['ok' => false, 'error' => 'internal', 'message' => 'Le service est momentanément indisponible. Merci de nous appeler directement.']);
}
