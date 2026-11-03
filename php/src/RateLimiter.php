<?php

declare(strict_types=1);

namespace Belkhir\Form;

if (!defined('BELKHIR_FORM_API')) {
    http_response_code(404);
    exit;
}

/**
 * Limitation de débit simple, basée uniquement sur REMOTE_ADDR (jamais sur
 * X-Forwarded-For). L'état est un fichier temporaire hors document root,
 * nommé par un condensat de l'adresse (aucune adresse IP en clair), protégé
 * par flock, et qui expire. Aucune donnée du formulaire n'y est écrite.
 */
final class RateLimiter
{
    private string $dir;
    private int $maxHits;
    private int $windowSeconds;

    public function __construct(string $dir, int $maxHits = 5, int $windowSeconds = 900)
    {
        $this->dir = $dir;
        $this->maxHits = $maxHits;
        $this->windowSeconds = $windowSeconds;
    }

    /**
     * Enregistre une tentative et indique si elle est autorisée.
     * En cas d'impossibilité technique de stocker l'état, la requête est
     * autorisée (les autres protections restent actives) : fail-open maîtrisé.
     */
    public function allow(string $remoteAddr, int $now): bool
    {
        if (!is_dir($this->dir) && !@mkdir($this->dir, 0700, true) && !is_dir($this->dir)) {
            return true;
        }

        $this->purge($now);

        $file = $this->dir . '/rl-' . hash('sha256', 'belkhir-form|' . $remoteAddr) . '.json';
        $handle = @fopen($file, 'c+');
        if ($handle === false) {
            return true;
        }

        try {
            if (!flock($handle, LOCK_EX)) {
                return true;
            }
            $raw = stream_get_contents($handle);
            $hits = [];
            if (is_string($raw) && $raw !== '') {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) {
                    foreach ($decoded as $t) {
                        if (is_int($t) && $t > $now - $this->windowSeconds) {
                            $hits[] = $t;
                        }
                    }
                }
            }

            if (count($hits) >= $this->maxHits) {
                return false;
            }

            $hits[] = $now;
            ftruncate($handle, 0);
            rewind($handle);
            fwrite($handle, (string) json_encode($hits));
            fflush($handle);

            return true;
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    /** Supprime les fichiers d'état plus anciens que la fenêtre. */
    private function purge(int $now): void
    {
        $files = glob($this->dir . '/rl-*.json');
        if ($files === false) {
            return;
        }
        foreach ($files as $f) {
            $mtime = @filemtime($f);
            if ($mtime !== false && $mtime < $now - $this->windowSeconds * 2) {
                @unlink($f);
            }
        }
    }
}
