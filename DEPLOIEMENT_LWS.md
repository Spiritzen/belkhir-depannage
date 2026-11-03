# Mise en production sur LWS (FTPS) — procédure

Aucun secret dans ce fichier. Domaine : `https://belkhir-depannage-hdf.fr` (sans `www`).
Chaîne : GitHub `main` → GitHub Actions (`.github/workflows/deploy-lws.yml`) → build Astro + endpoint
PHP (`dist/`) → FTP explicite sur TLS → `/htdocs/`.

## Deux mots de passe, deux endroits — ne jamais les mélanger

| Mot de passe                                       | Où il vit                                              | Où il ne doit JAMAIS aller       |
| -------------------------------------------------- | ------------------------------------------------------ | -------------------------------- |
| Compte FTP LWS                                     | Secret GitHub `LWS_FTP_PASSWORD` uniquement            | prompt, commit, capture, rapport |
| Boîte `formulaire@belkhir-depannage-hdf.fr` (SMTP) | Fichier privé LWS hors `htdocs` (voir `php/README.md`) | GitHub Actions, dépôt, `dist/`   |

## Valeurs publiques attendues

- Hôte FTP suggéré par LWS : `ftp.belkhir-depannage-hdf.fr` (à saisir dans le secret `LWS_FTP_HOST`, nom d'hôte seul)
- Port : `21` — chiffrement : **FTP explicite sur TLS** (jamais de FTP clair, jamais de repli)
- Dossier distant : `/htdocs/` (seul dossier publié ; `home/` et `tmp/` ne sont jamais touchés)

## Avant le premier push (dans cet ordre)

1. GitHub → Settings → Environments → créer l'environnement **`production`** (protection de branche `main`, relecteur facultatif).
2. GitHub → Settings → Secrets and variables → Actions : créer **`LWS_FTP_HOST`**, **`LWS_FTP_USERNAME`**, **`LWS_FTP_PASSWORD`** (saisir les valeurs dans l'interface GitHub, jamais ailleurs).
3. LWS : créer le fichier SMTP privé hors `htdocs`, dans `home/belkhir-depannage/formulaire.config.php` (modèle : `php/formulaire.config.example.php`), permissions `0600`. Confirmer le chemin exact dans le gestionnaire de fichiers LWS.
4. LWS : `display_errors = Off` ; confirmer les extensions `openssl` et `mbstring` ; PHP ≥ 8.0.
5. LWS : vérifier que le certificat HTTPS du domaine nu (et de `www`) est actif.
6. **Ne pas créer la variable `LWS_DEPLOY_ENABLED` à ce stade.** Pousser le workflow : sur `main`, le premier push exécute les contrôles et le build, puis ignore le déploiement proprement (message « Déploiement LWS ignoré »). Aucune connexion FTPS n'a lieu.
7. Lancer à la main _Actions → Deploy to LWS (FTPS) → Run workflow_ avec **`mode = dry-run`** (possible depuis une branche) : connexion FTPS réelle, mais miroir `--dry-run` : aucun transfert, aucune suppression. Lire l'inventaire : `default_index.html` doit apparaître comme supprimé, `.well-known/` ne doit **pas** apparaître.
8. Seulement si l'inventaire est conforme : soit lancer _Run workflow_ avec **`mode = deploy`** depuis `main` (miroir réel, ponctuel), soit créer la variable GitHub **`LWS_DEPLOY_ENABLED = true`** (Settings → Secrets and variables → Actions → _Variables_) pour activer le déploiement automatique à chaque push sur `main`.

## Ce que fait le workflow

- **pull_request → main** : contrôles + build ; le job de déploiement n'existe pas pour ce déclencheur, donc **aucune connexion FTPS**.
- **push → main** : contrôles + build toujours. Le déploiement automatique n'a lieu que si la variable GitHub `LWS_DEPLOY_ENABLED` vaut exactement `true` ; absente (premier push) ou différente, le déploiement est ignoré après des contrôles verts, avec une notice explicite.
- **workflow_dispatch** : choix explicite `mode` (défaut `dry-run`) — `dry-run` : connexion FTPS puis miroir `--dry-run` (aucun transfert ni suppression), depuis n'importe quelle branche ; `deploy` : miroir réel, refusé hors `main`.
- Ordre : `composer validate --strict` → `composer install --no-dev …` → `composer audit` → `php -l` → tests PHP → `npm ci` → `npm run check` → `npm run build` → suite JS → `scripts/check-dist.mjs` → artefact (fichiers cachés inclus).
- Le build précède la suite JS car plusieurs tests lisent `dist/`.
- Déploiement : `lftp`, TLS obligatoire (`ssl-force`), certificat et nom d'hôte vérifiés, mode passif, données protégées, 3 tentatives, miroir `--delete` limité à `/htdocs/`, `.well-known/` exclu (préservé).
- Pourquoi `lftp` : seul client simple offrant TLS explicite forcé, vérification de certificat, miroir avec suppression, exclusions et simulation (`--dry-run`), sur le runner officiel, sans action tierce recevant les secrets.
- Concurrence : une exécution à la fois par branche ; les contrôles de PR sont annulés par une exécution plus récente, mais un déploiement sur `main` n'est jamais interrompu en cours de miroir.

## Premier déploiement : vérifications

```bash
curl.exe -I https://belkhir-depannage-hdf.fr/
curl.exe -I https://belkhir-depannage-hdf.fr/plomberie/
curl.exe -I https://belkhir-depannage-hdf.fr/inexistante-test      # 404 réel + page 404.html
curl.exe -I https://www.belkhir-depannage-hdf.fr/plomberie/        # 301 → domaine nu
curl.exe -I http://belkhir-depannage-hdf.fr/                       # noter le comportement (voir ci-dessous)
curl.exe https://belkhir-depannage-hdf.fr/robots.txt               # Disallow: /
curl.exe -I https://belkhir-depannage-hdf.fr/_astro/<fichier>      # Cache-Control: public, max-age=31536000, immutable
curl.exe -I https://belkhir-depannage-hdf.fr/.htaccess             # 403 (ou 404)
curl.exe -I https://belkhir-depannage-hdf.fr/api/_lib/src/Handler.php   # 403
curl.exe -i https://belkhir-depannage-hdf.fr/api/demande-devis.php # 405 + Allow: POST (200 interdit)
```

Avant d'ajouter le fichier SMTP privé, un POST JSON sur l'API doit répondre **503** (configuration absente) ; après ajout du fichier, faire **une seule** demande réelle (protocole dans `php/README.md` : Roundcube, copie Gmail, score antispam, suppression).

## Règles à valider lors du premier déploiement

Marquées « À VALIDER » dans `public/.htaccess` :

1. **HTTP → HTTPS** : volontairement commentée. Relever comment le proxy LWS signale le schéma (`curl -I http://…`, comportement de `%{HTTPS}` / `X-Forwarded-Proto`), puis décommenter le bloc si aucune boucle n'est possible, et redéployer.
2. **Cache long `/_astro/*`** : confirmer l'en-tête `Cache-Control` (variable d'environnement posée par `mod_rewrite`).
3. **Redirection `/dossier` → `/dossier/`** (mod_dir) : vérifier qu'elle conserve `https` et le domaine nu.
4. **HSTS** : aucun dans ce lot ; à n'envisager qu'après validation de HTTPS sur le domaine nu et `www`.

Les anciens domaines (`belkhir-depannage.fr`, `belkhir-depannage80.fr`) sont externes à ce serveur : leurs redirections 301 ne peuvent pas être posées ici (dette SEO, dépend de leur contrôle).

## Rollback (sans reset destructif)

- Rapide : _Actions_ → ouvrir un run précédent vert → _Re-run_ du job de déploiement (l'artefact `lws-dist` reste 7 jours), ou
- Propre : `git revert <commit>` sur `main` puis push (le workflow redéploie l'état précédent), ou
- Urgence : relancer _Run workflow_ depuis un commit antérieur.
- Ne jamais utiliser `git reset --hard` ni de force-push sur `main`.

## Après validation LWS

Désactiver GitHub Pages à la main : _Settings → Pages → Source : None_. Le workflow Pages a déjà été retiré du dépôt ; ne pas toucher à ce réglage avant que LWS soit validé.

## Indexation

Reste **fermée** (robots `Disallow: /`, `noindex, nofollow`). `scripts/check-dist.mjs` fait échouer le déploiement si ce n'est plus le cas ; son ouverture est un sprint séparé, après validation explicite.
