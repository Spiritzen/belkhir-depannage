<?php

declare(strict_types=1);

namespace Belkhir\Form;

if (!defined('BELKHIR_FORM_API')) {
    http_response_code(404);
    exit;
}

/**
 * Traitement d'une requête de demande de devis. Indépendant de l'environnement
 * PHP global (requête et horloge injectées) pour rester entièrement testable
 * avec un faux transport. Retourne [statut HTTP, en-têtes, corps JSON].
 */
final class Handler
{
    public const MAX_BODY_BYTES = 16384;
    public const MIN_FILL_SECONDS = 2;
    public const MAX_FORM_AGE_SECONDS = 86400;

    private ?Config $config;
    private TransportInterface $transport;
    private RateLimiter $limiter;
    /** @var callable(): int */
    private $clock;
    /** @var callable(string): void */
    private $logger;

    /**
     * @param callable(): int $clock
     * @param callable(string): void $logger
     */
    public function __construct(
        ?Config $config,
        TransportInterface $transport,
        RateLimiter $limiter,
        callable $clock,
        callable $logger
    ) {
        $this->config = $config;
        $this->transport = $transport;
        $this->limiter = $limiter;
        $this->clock = $clock;
        $this->logger = $logger;
    }

    /**
     * @param array{method: string, headers: array<string, string>, body: string, remote_addr: string, host: string} $request
     *        `headers` : noms en minuscules.
     * @return array{0: int, 1: array<string, string>, 2: array<string, mixed>}
     */
    public function handle(array $request): array
    {
        if ($request['method'] !== 'POST') {
            return $this->respond(405, ['ok' => false, 'error' => 'method', 'message' => 'Méthode non autorisée.'], ['Allow' => 'POST']);
        }

        if ($this->config === null) {
            return $this->respond(503, ['ok' => false, 'error' => 'unavailable', 'message' => 'Le service est momentanément indisponible. Merci de nous appeler directement.']);
        }

        $contentType = strtolower(trim(explode(';', $request['headers']['content-type'] ?? '')[0]));
        if ($contentType !== 'application/json') {
            return $this->respond(415, ['ok' => false, 'error' => 'format', 'message' => 'Format de requête non pris en charge.']);
        }

        if (!$this->isSameOrigin($request)) {
            return $this->respond(403, ['ok' => false, 'error' => 'forbidden', 'message' => 'Requête refusée.']);
        }

        if (strlen($request['body']) > self::MAX_BODY_BYTES) {
            return $this->respond(413, ['ok' => false, 'error' => 'too_large', 'message' => 'Demande trop volumineuse.']);
        }

        $now = ($this->clock)();
        if (!$this->limiter->allow($request['remote_addr'], $now)) {
            return $this->respond(429, ['ok' => false, 'error' => 'rate_limited', 'message' => 'Trop de demandes. Merci de réessayer dans quelques minutes ou de nous appeler.'], ['Retry-After' => '900']);
        }

        $data = json_decode($request['body'], true);
        if (!is_array($data)) {
            return $this->respond(400, ['ok' => false, 'error' => 'invalid_json', 'message' => 'Requête invalide.']);
        }

        // Honeypot : champ invisible pour un utilisateur, jamais rempli par lui.
        if (isset($data['website']) && $data['website'] !== '') {
            return $this->respond(403, ['ok' => false, 'error' => 'forbidden', 'message' => 'Requête refusée.']);
        }

        // Temporisation sans cookie : horodatage d'ouverture du formulaire.
        $openedAt = $data['opened_at'] ?? null;
        if (!is_int($openedAt) && !(is_float($openedAt) && floor($openedAt) === $openedAt)) {
            return $this->respond(400, ['ok' => false, 'error' => 'invalid', 'message' => 'Requête invalide.']);
        }
        $elapsed = $now - (int) floor(((int) $openedAt) / 1000);
        if ($elapsed < self::MIN_FILL_SECONDS) {
            return $this->respond(429, ['ok' => false, 'error' => 'too_fast', 'message' => 'Merci de réessayer dans quelques instants.']);
        }
        if ($elapsed > self::MAX_FORM_AGE_SECONDS) {
            return $this->respond(400, ['ok' => false, 'error' => 'expired', 'message' => 'Le formulaire a expiré. Merci de le rouvrir.']);
        }

        $result = Validator::validate($data);
        if ($result['errors'] !== []) {
            return $this->respond(422, ['ok' => false, 'error' => 'validation', 'message' => 'Merci de corriger les champs indiqués.', 'fields' => $result['errors']]);
        }

        $reference = 'DV-' . strtoupper(bin2hex(random_bytes(3)));
        $message = MessageBuilder::build(
            $result['values'],
            $reference,
            (new \DateTimeImmutable('@' . $now))
        );

        try {
            $this->transport->send($message);
        } catch (\Throwable $e) {
            // Aucun contenu de demande, aucun secret : référence + catégorie.
            ($this->logger)('ref=' . $reference . ' category=smtp_send_failed');

            return $this->respond(500, ['ok' => false, 'error' => 'send_failed', 'message' => 'L’envoi n’a pas pu aboutir. Merci de nous appeler directement.']);
        }

        return $this->respond(200, [
            'ok' => true,
            'reference' => $reference,
            'message' => 'Votre demande a bien été envoyée.',
        ]);
    }

    /**
     * Same-origin raisonnable : si Origin est présent, son hôte doit être celui
     * de la requête ; Sec-Fetch-Site, s'il est présent, ne doit pas être cross-site.
     *
     * @param array{headers: array<string, string>, host: string} $request
     */
    private function isSameOrigin(array $request): bool
    {
        $site = strtolower($request['headers']['sec-fetch-site'] ?? '');
        if ($site === 'cross-site') {
            return false;
        }

        $origin = $request['headers']['origin'] ?? '';
        if ($origin === '') {
            return true;
        }
        $originHost = parse_url($origin, PHP_URL_HOST);
        $originPort = parse_url($origin, PHP_URL_PORT);
        if (!is_string($originHost)) {
            return false;
        }
        $originAuthority = strtolower($originHost) . (is_int($originPort) ? ':' . $originPort : '');

        return $originAuthority === strtolower($request['host']);
    }

    /**
     * @param array<string, mixed> $body
     * @param array<string, string> $extraHeaders
     * @return array{0: int, 1: array<string, string>, 2: array<string, mixed>}
     */
    private function respond(int $status, array $body, array $extraHeaders = []): array
    {
        $headers = [
            'Content-Type' => 'application/json; charset=utf-8',
            'Cache-Control' => 'no-store, max-age=0',
            'Pragma' => 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
            'Referrer-Policy' => 'no-referrer',
            'Cross-Origin-Resource-Policy' => 'same-origin',
            'X-Robots-Tag' => 'noindex, nofollow',
        ] + $extraHeaders;

        return [$status, $headers, $body];
    }
}
