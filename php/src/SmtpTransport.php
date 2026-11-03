<?php

declare(strict_types=1);

namespace Belkhir\Form;

use PHPMailer\PHPMailer\PHPMailer;

if (!defined('BELKHIR_FORM_API')) {
    http_response_code(404);
    exit;
}

/**
 * Transport SMTP authentifié (LWS, SMTPS implicite port 465) via PHPMailer.
 * Aucune fonction d’envoi native du serveur ; aucune sortie de débogage SMTP.
 */
final class SmtpTransport implements TransportInterface
{
    private string $password;
    /** @var null|callable(): PHPMailer */
    private $factory;

    /**
     * @param null|callable(): PHPMailer $mailerFactory réservé aux tests unitaires
     *        (instance PHPMailer dont l'envoi réseau est neutralisé) ; en
     *        production, toujours null.
     */
    public function __construct(string $password, ?callable $mailerFactory = null)
    {
        $this->password = $password;
        $this->factory = $mailerFactory;
    }

    public function send(array $message): void
    {
        $mail = $this->factory !== null ? ($this->factory)() : new PHPMailer(true);

        $mail->isSMTP();
        $mail->Host = Config::SMTP_HOST;
        $mail->Port = Config::SMTP_PORT;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->SMTPAuth = true;
        $mail->Username = Config::SMTP_USER;
        $mail->Password = $this->password;
        $mail->Timeout = 15;
        $mail->CharSet = PHPMailer::CHARSET_UTF8;
        $mail->Encoding = PHPMailer::ENCODING_QUOTED_PRINTABLE;
        // Hostname explicite : garantit un Message-ID valide (<id@domaine>).
        $mail->Hostname = Config::MAIL_HOSTNAME;
        // Enveloppe alignée sur l'expéditeur visible.
        $mail->Sender = Config::MAIL_FROM;

        $mail->setFrom(Config::MAIL_FROM, Config::MAIL_FROM_NAME, false);
        $mail->addAddress(Config::MAIL_TO);
        // Aucun Reply-To : le formulaire ne collecte pas d'adresse e-mail.

        $mail->isHTML(true);
        $mail->Subject = $message['subject'];
        $mail->Body = $message['html'];
        $mail->AltBody = $message['text'];

        $mail->send();
    }
}
