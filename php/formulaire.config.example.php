<?php

/**
 * EXEMPLE — valeurs factices. Ce fichier n'est jamais déployé.
 *
 * Copier ce modèle vers le fichier de production HORS du document root LWS
 * (voir php/README.md), puis y saisir le vrai mot de passe SMTP DIRECTEMENT
 * sur le serveur. Ne jamais mettre le vrai mot de passe dans Git.
 */

return [
    // Mot de passe de la boîte formulaire@belkhir-depannage-hdf.fr (OBLIGATOIRE).
    'smtp_password' => 'CHANGER-ME-valeur-factice',

    // Dossier d'état du limiteur de débit (OPTIONNEL, hors document root,
    // inscriptible par PHP). Par défaut : sous-dossier « state » à côté de ce fichier.
    // 'state_dir' => '/chemin/absolu/hors/htdocs/belkhir-form-state',
];
