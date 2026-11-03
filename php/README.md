# Formulaire de devis — endpoint PHP (LWS, SMTP authentifié)

Endpoint : `POST /api/demande-devis.php` (JSON, same-origin). Envoie la demande à
`formulaire@belkhir-depannage-hdf.fr` via PHPMailer (SMTPS 465, authentifié). La règle de
copie LWS/Roundcube vers Gmail est inchangée : **ne jamais** ajouter Gmail comme destinataire.

Aucun secret dans ce dépôt. Le mot de passe SMTP n'existe que dans un fichier externe.

## Architecture

| Élément         | Emplacement                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| Code applicatif | `php/src/*.php` (copié dans `dist/api/_lib/src/`)                                                                  |
| Point d'entrée  | `php/public/demande-devis.php` (copié dans `dist/api/`)                                                            |
| PHPMailer       | Composer (`composer.json` + `composer.lock`), `vendor/` non versionné ; runtime copié dans `dist/api/_lib/vendor/` |
| Assemblage      | `scripts/build-php-api.mjs` (portable Windows/Linux)                                                               |
| Secret          | fichier externe hors `htdocs` (ci-dessous), **jamais** dans `dist/`                                                |
| Tests PHP       | `php/tests/run.php` (faux transport, aucun réseau)                                                                 |

## Construire

```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build          # astro build + assemblage de dist/api/
```

`npm run build` échoue si `vendor/` est absent. `SKIP_PHP_API=1 npm run build` produit un
build sans endpoint (réservé aux vérifications purement front).

## Fichier de configuration externe (secret)

1. Modèle : `php/formulaire.config.example.php` (valeurs factices, non déployé).
2. Créer sur LWS, **hors du dossier `htdocs`**, le fichier :

   ```
   <dossier parent de htdocs>/home/belkhir-depannage/formulaire.config.php
   ```

   (chemin LWS « frère » de `htdocs` ; **à confirmer dans le gestionnaire de fichiers LWS** avant
   le premier déploiement). Contenu attendu :

   ```php
   <?php
   return [
       'smtp_password' => '…',                 // obligatoire, saisi uniquement sur le serveur
       // 'state_dir' => '/chemin/hors/htdocs/etat',   // optionnel : état du limiteur de débit
   ];
   ```

3. Permissions recommandées : fichier `0600` (ou le plus restrictif accepté par LWS), dossier
   `0700`, propriétaire = compte web.
4. Résolution par l'endpoint : (a) variable d'environnement `BELKHIR_FORM_CONFIG` (chemin absolu),
   sinon (b) le chemin LWS ci-dessus. Un fichier situé **dans** le document root est refusé.
5. Sans configuration valide, l'endpoint répond **503** avec un message générique.

## À vérifier côté LWS

- `display_errors = Off` (l'endpoint le force aussi, mais vérifier le réglage serveur).
- PHP ≥ 8.0 (8.5 prévu) ; extensions `openssl`, `mbstring`.
- Le dossier d'état du limiteur de débit doit être inscriptible (par défaut `…/home/belkhir-depannage/state`).
- `dist/api/_lib/` est interdit d'accès HTTP par `dist/api/_lib/.htaccess` (`Require all denied`)
  et par `public/.htaccess` ; chaque fichier PHP applicatif a en plus une garde d'entrée.
  Procédure de déploiement : voir `DEPLOIEMENT_LWS.md` à la racine.

## Contrat JSON

Requête : `Content-Type: application/json`, corps ≤ 16 Ko :
`name`, `phone`, `location`, `service` (`plomberie|chauffage|serrurerie|vitrerie|rideaux-metalliques|autre`),
`delay` (optionnel : `des-que-possible|aujourdhui|sous-48h|planifiee`), `description` (5–2000),
`website` (piège, doit rester vide), `opened_at` (ms, ouverture de la modale).

Réponses (toutes JSON UTF-8, `Cache-Control: no-store`) :
`200 {ok,reference,message}` · `400` requête/horodatage invalide · `403` piège ou origine ·
`405` (+ `Allow: POST`) · `413` trop gros · `415` format · `422 {fields}` validation ·
`429` débit ou envoi trop rapide (+ `Retry-After`) · `500` échec d'envoi · `503` configuration absente.

## Protections

Validation stricte serveur, honeypot, temporisation sans cookie (≥ 2 s, ≤ 24 h), limitation
5 requêtes / 15 min par `REMOTE_ADDR` (état = condensat, `flock`, expiration, aucune donnée de
formulaire), contrôle d'origine, pas de CORS, aucune donnée conservée, journal = référence +
catégorie uniquement.

## Protocole de test réel (à faire une seule fois, après déploiement)

1. Déposer le fichier secret externe (jamais via Git).
2. Soumettre **une seule** demande de test depuis le site.
3. Vérifier la réception dans Roundcube (`formulaire@…`), puis la copie Gmail.
4. Relever le score antispam LWS (cible : très inférieur à 5 ; le test `mail()` initial était à 8,38).
5. Supprimer le message de test (Roundcube et Gmail).

## Rotation du mot de passe

Changer le mot de passe de la boîte dans LWS, puis modifier **uniquement** le fichier externe sur
le serveur. Aucun commit, aucun redéploiement. Tester avec une demande unique.

## Tests locaux

```bash
php php/tests/run.php        # 65 contrôles, aucun envoi réel
npx vitest run               # inclut l'exécution du harnais PHP si php est disponible
```
