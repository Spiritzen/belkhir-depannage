<?php

declare(strict_types=1);

namespace Belkhir\Form;

if (!defined('BELKHIR_FORM_API')) {
    http_response_code(404);
    exit;
}

/**
 * Validation stricte côté serveur des champs de la modale de devis.
 * Les validations HTML/JavaScript ne sont jamais considérées comme fiables.
 */
final class Validator
{
    public const SERVICES = [
        'plomberie' => 'Plomberie',
        'chauffage' => 'Chauffage',
        'serrurerie' => 'Serrurerie',
        'vitrerie' => 'Vitrerie',
        'rideaux-metalliques' => 'Rideaux métalliques',
        'autre' => 'Autre',
    ];

    public const DELAYS = [
        'des-que-possible' => 'Dès que possible',
        'aujourdhui' => 'Aujourd’hui',
        'sous-48h' => 'Sous 48 heures',
        'planifiee' => 'Intervention planifiée',
    ];

    public const DEFAULT_DELAY = 'des-que-possible';

    /**
     * @param array<string, mixed> $input
     * @return array{values: array<string, string>, errors: array<string, string>}
     */
    public static function validate(array $input): array
    {
        $errors = [];
        $values = [];

        $name = self::singleLine($input['name'] ?? null);
        if ($name === null || self::length($name) < 2 || self::length($name) > 100
            || preg_match('/\p{L}/u', $name) !== 1) {
            $errors['name'] = 'Merci d’indiquer votre nom et prénom.';
        } else {
            $values['name'] = $name;
        }

        $phoneRaw = self::singleLine($input['phone'] ?? null);
        $phone = $phoneRaw === null ? '' : preg_replace('/[\s.\-()]/u', '', $phoneRaw);
        if ($phone === null || preg_match('/^(?:\+|00)?[0-9]{9,15}$/', $phone) !== 1) {
            $errors['phone'] = 'Merci d’indiquer un numéro de téléphone valide.';
        } else {
            $values['phone'] = $phone;
        }

        $location = self::singleLine($input['location'] ?? null);
        if ($location === null || self::length($location) < 2 || self::length($location) > 80
            || preg_match('/^[\p{L}\p{N}][\p{L}\p{N} \'’\-,.()\/]*$/u', $location) !== 1) {
            $errors['location'] = 'Merci d’indiquer votre commune ou code postal.';
        } else {
            $values['location'] = $location;
        }

        $service = is_string($input['service'] ?? null) ? $input['service'] : '';
        if (!array_key_exists($service, self::SERVICES)) {
            $errors['service'] = 'Merci de choisir un type d’intervention.';
        } else {
            $values['service'] = $service;
        }

        $delayRaw = $input['delay'] ?? self::DEFAULT_DELAY;
        $delay = is_string($delayRaw) && $delayRaw !== '' ? $delayRaw : self::DEFAULT_DELAY;
        if (!array_key_exists($delay, self::DELAYS)) {
            $errors['delay'] = 'Délai non reconnu.';
        } else {
            $values['delay'] = $delay;
        }

        $description = self::multiLine($input['description'] ?? null);
        if ($description === null || self::length($description) < 5 || self::length($description) > 2000) {
            $errors['description'] = 'Merci de décrire votre situation (2 000 caractères maximum).';
        } else {
            $values['description'] = $description;
        }

        return ['values' => $values, 'errors' => $errors];
    }

    /** Supprime les caractères de contrôle, normalise les espaces, une seule ligne. */
    public static function singleLine($value): ?string
    {
        if (!is_string($value) || !self::isValidUtf8($value)) {
            return null;
        }
        $clean = preg_replace('/[\x00-\x1F\x7F\x{2028}\x{2029}]+/u', ' ', $value);
        if ($clean === null) {
            return null;
        }
        $clean = preg_replace('/\s+/u', ' ', $clean);

        return $clean === null ? null : trim($clean);
    }

    /** Supprime les caractères de contrôle (sauf retours à la ligne), borne les sauts de ligne. */
    public static function multiLine($value): ?string
    {
        if (!is_string($value) || !self::isValidUtf8($value)) {
            return null;
        }
        $clean = str_replace(["\r\n", "\r"], "\n", $value);
        $clean = preg_replace('/[\x00-\x09\x0B-\x1F\x7F]+/u', ' ', $clean);
        if ($clean === null) {
            return null;
        }
        $clean = preg_replace('/[ \t]+/u', ' ', $clean);
        $clean = $clean === null ? null : preg_replace('/\n{3,}/', "\n\n", $clean);

        return $clean === null ? null : trim($clean);
    }

    public static function length(string $value): int
    {
        return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
    }

    private static function isValidUtf8(string $value): bool
    {
        return preg_match('//u', $value) === 1;
    }
}
