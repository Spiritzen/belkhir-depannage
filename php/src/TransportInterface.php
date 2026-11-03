<?php

declare(strict_types=1);

namespace Belkhir\Form;

if (!defined('BELKHIR_FORM_API')) {
    http_response_code(404);
    exit;
}

/** Transport de messagerie injectable : SMTP en production, faux transport en test. */
interface TransportInterface
{
    /**
     * @param array{subject: string, text: string, html: string} $message
     * @throws \Throwable en cas d'échec d'envoi
     */
    public function send(array $message): void;
}
