<?php

declare(strict_types=1);

namespace Belkhir\Form;

if (!defined('BELKHIR_FORM_API')) {
    http_response_code(404);
    exit;
}

/**
 * Construit l'objet et les corps (texte + HTML) du message interne.
 * Toute valeur issue du client est nettoyée avant d'entrer dans l'objet.
 */
final class MessageBuilder
{
    /**
     * @param array<string, string> $v valeurs déjà validées
     * @return array{subject: string, text: string, html: string}
     */
    public static function build(array $v, string $reference, \DateTimeImmutable $now): array
    {
        $serviceLabel = Validator::SERVICES[$v['service']] ?? 'Autre';
        $delayLabel = Validator::DELAYS[$v['delay']] ?? Validator::DELAYS[Validator::DEFAULT_DELAY];

        $location = (string) Validator::singleLine($v['location']);
        $subject = 'Nouvelle demande de devis — ' . $serviceLabel . ' — ' . $location;
        $subject = (string) Validator::singleLine($subject);
        if (Validator::length($subject) > 140) {
            $subject = mb_substr($subject, 0, 139, 'UTF-8') . '…';
        }

        $date = $now->setTimezone(new \DateTimeZone('Europe/Paris'))->format('d/m/Y H:i');

        $lines = [
            'Nouvelle demande de devis reçue depuis le site belkhir-depannage-hdf.fr',
            '',
            'Référence : ' . $reference,
            'Date (Europe/Paris) : ' . $date,
            '',
            'Nom : ' . $v['name'],
            'Téléphone : ' . $v['phone'],
            'Commune ou code postal : ' . $location,
            'Type d’intervention : ' . $serviceLabel,
            'Délai souhaité : ' . $delayLabel,
            '',
            'Description de la situation :',
            $v['description'],
            '',
            '—',
            'Message généré automatiquement par le formulaire du site.',
        ];
        $text = implode("\n", $lines);

        $e = static fn (string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $rows = [
            'Référence' => $reference,
            'Date (Europe/Paris)' => $date,
            'Nom' => $v['name'],
            'Téléphone' => $v['phone'],
            'Commune ou code postal' => $location,
            'Type d’intervention' => $serviceLabel,
            'Délai souhaité' => $delayLabel,
        ];
        $html = '<p>Nouvelle demande de devis reçue depuis le site belkhir-depannage-hdf.fr.</p><table cellpadding="4">';
        foreach ($rows as $label => $value) {
            $html .= '<tr><th align="left">' . $e($label) . '</th><td>' . $e($value) . '</td></tr>';
        }
        $html .= '</table><p><strong>Description de la situation</strong></p><p>'
            . nl2br($e($v['description']), false)
            . '</p><p><small>Message généré automatiquement par le formulaire du site.</small></p>';

        return ['subject' => $subject, 'text' => $text, 'html' => $html];
    }
}
