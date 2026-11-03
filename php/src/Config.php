<?php

declare(strict_types=1);

namespace Belkhir\Form;

if (!defined('BELKHIR_FORM_API')) {
    http_response_code(404);
    exit;
}

/**
 * Configuration du formulaire.
 *
 * Les paramètres SMTP NON secrets sont des constantes versionnées. Le seul
 * secret (mot de passe SMTP) est lu dans un fichier PHP externe, situé HORS du
 * document root. Aucune valeur par défaut n'existe pour ce mot de passe.
 */
final class Config
{
    public const SMTP_HOST = 'mail73.lwspanel.com';
    public const SMTP_PORT = 465;
    public const SMTP_USER = 'formulaire@belkhir-depannage-hdf.fr';
    public const MAIL_FROM = 'formulaire@belkhir-depannage-hdf.fr';
    public const MAIL_FROM_NAME = 'BELKHIR DEPANNAGE — Site internet';
    public const MAIL_TO = 'formulaire@belkhir-depannage-hdf.fr';
    public const MAIL_HOSTNAME = 'belkhir-depannage-hdf.fr';

    public const ENV_CONFIG_PATH = 'BELKHIR_FORM_CONFIG';
    /** Chemin relatif, sous le dossier parent du document root LWS. */
    public const DEFAULT_RELATIVE_PATH = 'home/belkhir-depannage/formulaire.config.php';

    private string $smtpPassword;
    private string $stateDir;

    public function __construct(string $smtpPassword, string $stateDir)
    {
        $this->smtpPassword = $smtpPassword;
        $this->stateDir = $stateDir;
    }

    public function smtpPassword(): string
    {
        return $this->smtpPassword;
    }

    /** Dossier temporaire (hors document root) du limiteur de débit. */
    public function stateDir(): string
    {
        return $this->stateDir;
    }

    /**
     * Liste ordonnée des emplacements candidats du fichier de configuration.
     *
     * @return list<string>
     */
    public static function candidatePaths(?string $envPath, ?string $documentRoot): array
    {
        $paths = [];
        if ($envPath !== null && trim($envPath) !== '') {
            $paths[] = trim($envPath);
        }
        if ($documentRoot !== null && trim($documentRoot) !== '') {
            $parent = dirname(rtrim($documentRoot, '/\\'));
            $paths[] = $parent . '/' . self::DEFAULT_RELATIVE_PATH;
        }

        return $paths;
    }

    /**
     * Charge la configuration, ou retourne null si elle est absente,
     * illisible, invalide, ou située à l'intérieur du document root.
     */
    public static function load(?string $envPath, ?string $documentRoot): ?self
    {
        $docRoot = ($documentRoot !== null && $documentRoot !== '') ? realpath($documentRoot) : false;

        foreach (self::candidatePaths($envPath, $documentRoot) as $path) {
            $real = realpath($path);
            if ($real === false || !is_file($real) || !is_readable($real)) {
                continue;
            }
            if ($docRoot !== false && self::isInside($real, $docRoot)) {
                // Un secret exposé par le serveur web est refusé, jamais utilisé.
                continue;
            }

            $data = (static function (string $file) {
                return include $file;
            })($real);

            if (!is_array($data)) {
                continue;
            }
            $password = $data['smtp_password'] ?? null;
            if (!is_string($password) || $password === '') {
                continue;
            }
            $stateDir = $data['state_dir'] ?? null;
            if (!is_string($stateDir) || $stateDir === '') {
                $stateDir = dirname($real) . '/state';
            }

            return new self($password, $stateDir);
        }

        return null;
    }

    private static function isInside(string $path, string $root): bool
    {
        $path = str_replace('\\', '/', $path);
        $root = rtrim(str_replace('\\', '/', $root), '/') . '/';

        return strncasecmp($path, $root, strlen($root)) === 0;
    }
}
