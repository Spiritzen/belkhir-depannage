<div align="center">

# 🔧 Belkhir Dépannage

### Maquette d’un site de dépannage d’urgence dans les Hauts-de-France

**Identifier le problème · Sécuriser · Rassurer · Mettre en relation**

[![Portfolio](https://img.shields.io/badge/Portfolio-Sébastien_Cantrelle-ff6a00?style=for-the-badge)](https://spiritzen.github.io/portfolio/)
[![GitHub](https://img.shields.io/badge/GitHub-Spiritzen-181717?style=for-the-badge&logo=github)](https://github.com/Spiritzen)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/sebastien-cantrelle-26b695106/)

<br>

![Statut](https://img.shields.io/badge/Statut-Maquette_multi--pages-f59e0b?style=flat-square)
![Validation](https://img.shields.io/badge/Validation_client-En_cours-f59e0b?style=flat-square)
![Astro](https://img.shields.io/badge/Astro-7-BC52EE?style=flat-square&logo=astro)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript)
![Rendu](https://img.shields.io/badge/Rendu-Statique-10b981?style=flat-square)
![Indexation](<https://img.shields.io/badge/Indexation-Bloquée_(noindex)-6b7280?style=flat-square>)
![Publication](https://img.shields.io/badge/GitHub_Pages-En_ligne-222222?style=flat-square&logo=githubpages)

</div>

---

> [!IMPORTANT]
> Ce dépôt présente une **maquette fonctionnelle en cours de conception** destinée à permettre à Fouad de découvrir, tester et valider la future expérience du site Belkhir Dépannage.
>
> Il ne s’agit **ni du site officiel, ni d’une version de production**. La démonstration est publiée sur GitHub Pages mais reste explicitement **non indexée** (`noindex, nofollow` sur toutes les pages). Les contenus, chiffres, avis, zones, horaires, prestations, mentions juridiques et informations commerciales restent soumis à validation avant toute publication officielle.

> **Belkhir Dépannage** est un projet de refonte complète d’un site vitrine consacré au dépannage d’urgence : plomberie, chauffage, serrurerie, vitrerie et rideaux métalliques.
>
> La maquette doit rendre l’offre immédiatement compréhensible, rassurer une personne confrontée à un problème et faciliter la prise de contact depuis un téléphone, sans présenter l’urgence de manière anxiogène.

---

## 🎯 Objectif de la maquette

La landing page doit répondre en moins de cinq secondes à quatre questions essentielles :

1. **Est-ce que Belkhir Dépannage traite mon problème ?**
2. **L’équipe peut-elle intervenir dans mon secteur ?**
3. **Puis-je lui faire confiance ?**
4. **Comment appeler immédiatement ?**

Le projet ne cherche donc pas seulement à produire une belle vitrine. Il construit un parcours de conversion cohérent :

```text
Reconnaître son urgence
        ↓
Découvrir les premiers gestes de sécurité
        ↓
Comprendre les domaines d’intervention
        ↓
Voir le déroulement d’une prise en charge
        ↓
Consulter les preuves de confiance
        ↓
Vérifier la zone couverte et appeler
```

---

## ✅ État du projet — 4 septembre 2026

> Phase actuelle : **maquette multi-pages** (landing + 5 pages métiers dédiées + 2 pages juridiques), publiée en démonstration sur GitHub Pages, toujours **non indexée**.

| Périmètre                    | Statut                       | État actuel                                                        |
| ---------------------------- | ---------------------------- | ------------------------------------------------------------------ |
| Direction artistique         | ✅ **Maquettée**             | Noir profond, blanc abricot et orange de sécurité                  |
| Navigation desktop / mobile  | ✅ **Maquettée**             | Barre sticky, menu hamburger, barre d’appel mobile permanente      |
| Landing page                 | ✅ **Maquettée**             | Hero, urgences, domaines, prise en charge, confiance, FAQ, zones   |
| Pages métiers dédiées        | ✅ **Construites**           | Plomberie, Chauffage, Serrurerie, Vitrerie, Rideaux métalliques    |
| Pages juridiques             | ✅ **Construites**           | Mentions légales et Politique de confidentialité                   |
| Modale « Demander un devis » | ✅ **Fonctionnelle (UI)**    | Partagée sur tout le site ; envoi réel non branché (voir plus bas) |
| Avis Google                  | 🟡 **Structure prête**       | Note et nombre d’avis à confirmer avec la fiche Google réelle      |
| Interventions récentes       | 🟡 **Présentation prête**    | Contenus authentiques à fournir et valider                         |
| Numéro d’urgence             | ✅ **Activé**                | `06 49 62 16 19` — lien `tel:` réel et fonctionnel                 |
| Numéro standard              | ⏳ **À renseigner**          | Doit rester clairement identifié comme non disponible              |
| Formulaire de devis (envoi)  | ⏳ **À connecter**           | Hébergement LWS + endpoint PHP non encore disponibles              |
| Images desktop/mobile        | ✅ **Optimisées**            | `astro:assets` → WebP/AVIF responsive, voir section dédiée         |
| Déploiement de démonstration | ✅ **En ligne**              | GitHub Pages, non indexé (voir section Déploiement)                |
| Audit SEO/perf/images        | ✅ **Réalisé (04/09/2026)**  | Voir `RAPPORT_AUDIT_AVANT_PUSH_SEO_PERFORMANCE.md`                 |
| Publication officielle       | ⛔ **Hors périmètre actuel** | Domaine, contenus, formulaire et recette finale non validés        |

---

## 🗺️ Routes disponibles

9 routes sont réellement générées par le build (`npm run build`) :

| Route                            | Contenu                                                     |
| -------------------------------- | ----------------------------------------------------------- |
| `/`                              | Landing page (hero, urgences, domaines, confiance, avis…)   |
| `/plomberie/`                    | Page métier dédiée — plomberie                              |
| `/chauffage/`                    | Page métier dédiée — chauffage                              |
| `/serrurerie/`                   | Page métier dédiée — serrurerie                             |
| `/vitrerie/`                     | Page métier dédiée — vitrerie                               |
| `/rideaux-metalliques/`          | Page métier dédiée — rideaux métalliques                    |
| `/mentions-legales/`             | Identité légale de l’entreprise (SASU, SIREN/SIRET, RCS…)   |
| `/politique-de-confidentialite/` | Données personnelles, cookies (aucun sur ce site), sécurité |
| `/404`                           | Page d’erreur (exclue du sitemap et non indexée)            |

Chaque page métier suit le même gabarit (Hero dédié, urgences/FAQ propres, section « zones couvertes », schéma JSON-LD `FAQPage`) avec un contenu rédactionnel réellement distinct — jamais un copier-coller du même texte.

La page/fonctionnalité **« Vérifier mon secteur »** en tant que page dédiée reste **volontairement différée** : le bouton du même nom renvoie aujourd’hui vers la section « Zones couvertes » de la landing (`#zones-couvertes`), pas vers une page satellite.

---

## 🧩 Composants partagés

```text
src/layouts/BaseLayout.astro     — <head> SEO, styles globaux, modale de devis (rendue une fois par page)
src/components/layout/
  ├─ AvailabilityBar.astro       — bandeau « ouvert 24h/24 » en tête de page
  ├─ Navbar.astro                — navigation sticky desktop + déclencheur du menu mobile
  ├─ MobileDrawer.astro          — menu mobile (Astro pur, sans framework — voir Stack technique)
  ├─ MobileCallBar.astro         — barre d’appel fixe en bas d’écran sur mobile
  └─ Footer.astro                — liens métiers, navigation, pages juridiques, coordonnées
src/components/ui/
  ├─ Icon.astro                  — jeu d’icônes SVG inline, dessinées pour le projet
  ├─ PhoneCta.astro              — bouton d’appel (garde-fou : jamais de faux numéro)
  └─ QuoteModal.astro            — modale « Demander un devis », partagée sur tout le site
src/components/sections/         — blocs réutilisés par plusieurs pages métiers (alerte sécurité,
                                    conseils, résumé de couverture, carte, réassurance)
src/components/seo/Seo.astro     — <title>, meta description, canonical, Open Graph, JSON-LD
```

Chaque page (landing, métier, juridique) assemble ces briques via `BaseLayout`, sans dupliquer la navigation, le pied de page ou la modale de devis.

---

## 🧱 Gestion du `base` Astro

Le site est publié en **site de projet** GitHub Pages (pas à la racine du compte) :

```js
// astro.config.mjs
site: 'https://spiritzen.github.io',
base: '/belkhir-depannage/',
```

Ces deux valeurs sont l’**unique source** de l’URL et du sous-chemin publics : elles alimentent automatiquement le canonical, l’Open Graph, le sitemap et `robots.txt` via `src/lib/site-config.ts` (`resolveSiteUrl`). Toute URL absolue interne passe par `withBase()` (`src/lib/url.ts`) plutôt que par une concaténation manuelle, pour ne jamais produire un lien qui oublierait le sous-chemin `/belkhir-depannage`.

Faire évoluer la cible de déploiement (nouveau dépôt, domaine personnalisé) ne demande donc de modifier que `astro.config.mjs` — jamais une seconde constante codée en dur ailleurs.

---

## 🖼️ Images desktop/mobile et optimisation WebP/AVIF

Toutes les images de contenu passent par **`astro:assets`** (`<Image>` ou `<Picture>`) — aucune image lourde n’est servie en PNG/JPEG brut, aucune `background-image: url(...)` CSS n’est utilisée sur le site.

- **Images Hero** (landing et pages métiers) : `loading="eager"` + `fetchpriority="high"` (jamais de lazy-loading sur l’image LCP), dimensions explicites, `srcset`/`sizes` responsive. Les pages métiers utilisent un `<picture>` avec sources AVIF puis WebP, scindées par `media` mobile/desktop — un seul fichier est réellement téléchargé par appareil.
- **Cadrage desktop/mobile** : géré en CSS (`object-position` différent par breakpoint) plutôt que par deux images totalement distinctes lorsque la même photo convient aux deux formats ; les pages métiers, elles, fournissent une image mobile et une image desktop dédiées quand le cadrage l’exige.
- **Images sous la ligne de flottaison** (accordéons, cartes « interventions récentes », illustrations) : toutes en `loading="lazy"`, dimensions explicites, `srcset` responsive.
- **Formats livrés** : WebP partout, avec une variante AVIF supplémentaire sur les heros des pages métiers (négociation de format via `<picture>`).
- **Textes alternatifs** : descriptifs et réels sur les photographies de contenu ; `alt=""` volontaire sur les visuels purement décoratifs (fond du hero, silhouettes d’illustration).

Le détail chiffré (poids avant/après, formats réellement livrés) est documenté dans `RAPPORT_AUDIT_AVANT_PUSH_SEO_PERFORMANCE.md`.

---

## 💬 Modale « Demander un devis »

Un unique composant partagé (`src/components/ui/QuoteModal.astro`, `<dialog>` natif, sans dépendance nouvelle) est rendu une seule fois par page depuis `BaseLayout.astro` et s’ouvre depuis n’importe quel élément portant `data-quote-trigger` (aujourd’hui : le bouton du Hero de la landing).

Fonctionnement actuel :

- ouverture centrée, focus déplacé dans la modale, défilement de la page bloqué puis restauré exactement à la fermeture ;
- fermeture par la croix, « Annuler », Échap ou un vrai clic extérieur — jamais par un clic à l’intérieur du formulaire ;
- validation locale des champs (nom, téléphone, commune, type d’intervention, description, consentement) ;
- **aucun envoi réseau réel** : la soumission est interceptée, validée localement puis explicitement bloquée avec un message honnête, tant que l’hébergement LWS et son endpoint PHP ne sont pas disponibles. Rien n’est simulé, rien n’est stocké.

Le point de branchement du futur endpoint est documenté par un commentaire dédié dans le `<script>` du composant (« FUTUR ENDPOINT PHP »).

---

## 🎨 Direction artistique

La maquette suit une direction **« urgence maîtrisée + technicien premium »** :

- noir et anthracite pour la maîtrise et le contraste ;
- blanc abricot pour réchauffer les sections claires ;
- orange de sécurité pour les actions, accents et éléments de marque ;
- lueurs orangées très légères dans les sections sombres ;
- grands visuels métier ;
- cartes arrondies et hiérarchie typographique forte ;
- animations brèves, lisibles, désactivées via `prefers-reduced-motion`.

La signature de marque colore notamment le **B** de _Belkhir_ et le **D** de _Dépannage_ en orange.

### Médias

Les photographies métiers et le logo sont intégrés localement au projet, sans hotlinking. Leur maintien dans la version officielle dépendra de la validation du client et des droits d’utilisation.

---

## 🛠 Stack technique

| Couche                       | Technologie       | Rôle                                                                |
| ---------------------------- | ----------------- | ------------------------------------------------------------------- |
| Génération                   | Astro 7           | Production de pages statiques rapides                               |
| Langage                      | TypeScript strict | Données et composants typés                                         |
| Interactivité                | Astro + JS natif  | `<dialog>` natif, IntersectionObserver — voir note React ci-dessous |
| Styles                       | CSS natif         | Tokens, responsive et animations                                    |
| Images                       | `astro:assets`    | WebP/AVIF responsive, dimensions explicites                         |
| Tests                        | Vitest            | Garde-fous fonctionnels et techniques                               |
| Vérification                 | Astro Check       | Validation Astro et TypeScript                                      |
| Hébergement de démonstration | GitHub Pages      | Présentation de la maquette à Fouad                                 |

> **Note** : l’intégration `@astrojs/react` reste installée (`astro.config.mjs`, `package.json`) mais **n’est plus utilisée** — aucun composant `.tsx` ni aucune directive `client:*` ne subsiste dans le code actuel (le menu mobile, un temps envisagé en React, est un composant Astro pur avec piège de focus manuel). Retirer cette dépendance inutilisée est une amélioration à faible risque, documentée dans le rapport d’audit plutôt qu’appliquée en cours de sprint.

### Principes d’architecture

- rendu statique par défaut ;
- JavaScript client limité aux interactions utiles (menu mobile, modale de devis, révélations au scroll) ;
- données commerciales centralisées (`src/lib/site-config.ts`) ;
- numéros d’appel non dupliqués manuellement ;
- composants réutilisables (voir « Composants partagés ») ;
- responsive mobile-first ;
- aucune base de données ni authentification dans ce MVP.

---

## ⚙️ Lancement local

### Prérequis

- Node.js LTS compatible avec les dépendances du projet ;
- npm ;
- Git.

### Installation

```bash
npm ci
```

### Développement

```bash
npm run dev
```

Astro affiche ensuite l’adresse locale dans le terminal, généralement `http://localhost:4321`.

### Vérification, build et prévisualisation

```bash
npm run check     # Astro Check (TypeScript + templates)
npm run lint       # ESLint
npm run build      # Build de production dans dist/
npm run preview    # Sert dist/ localement, pour mesurer les performances réelles
npm run test:run   # Suite de tests Vitest (une seule fois, sans watch)
npm run validate   # Enchaîne check + lint + build + test:run
```

> Les mesures de performance (Lighthouse, poids réel des pages) doivent toujours être faites sur `npm run preview`, jamais sur `npm run dev` — le serveur de développement n’est pas représentatif (pas de minification, HMR actif, etc.).

---

## 🧪 Qualité et recette

La maquette ne doit pas être déclarée publiable sur la seule base de son rendu visuel.

Chaque évolution vérifie au minimum :

- Astro Check, lint, tests et build (`npm run validate`) ;
- absence de liens et d’ancres mortes ;
- fonctionnement des appels `tel:` ;
- présence du numéro d’urgence dans tous les emplacements prévus ;
- maintien volontaire du numéro standard en attente ;
- responsive de 320 px aux grands écrans ;
- navigation clavier et focus visibles ;
- respect de `prefers-reduced-motion` ;
- contraste et lisibilité ;
- poids et chargement des images ;
- compatibilité du chemin de base GitHub Pages ;
- absence de secret ou de donnée privée versionnée ;
- présence d’une protection contre l’indexation prématurée ;
- cohérence des mentions et absence de promesse commerciale inventée.

Un audit SEO/performance/images complet a été réalisé le 04/09/2026 — voir `RAPPORT_AUDIT_AVANT_PUSH_SEO_PERFORMANCE.md` pour le verdict détaillé, les mesures Lighthouse et la roadmap.

---

## 🌐 Déploiement

Le dépôt est :

```text
belkhir-depannage
```

La démonstration est **en ligne** à :

```text
https://spiritzen.github.io/belkhir-depannage/
```

Le site reste explicitement **non indexé** (`robots.txt` en `Disallow: /`, `<meta name="robots" content="noindex, nofollow">` sur chaque page) tant que les informations commerciales (numéro standard, avis Google réels) ne sont pas toutes confirmées — voir `src/lib/site-config.ts` (`resolveAllowIndexing`). Le retrait de cette protection est une étape volontairement contrôlée, listée en priorité P0 de la roadmap SEO (voir plus bas).

> La publication GitHub Pages ne constitue pas le lancement officiel du site Belkhir Dépannage et ne remplace pas le futur domaine professionnel.

---

## 🔍 Roadmap SEO (résumé)

Le détail complet (actions, justification, statut) vit dans `RAPPORT_AUDIT_AVANT_PUSH_SEO_PERFORMANCE.md`. Résumé :

**P0 — avant mise en production définitive**
Domaine définitif, hébergement LWS, canonical définitif, retrait contrôlé du `noindex`, numéro standard réel, endpoint sécurisé du formulaire de devis, mise à jour RGPD après activation du formulaire, informations légales restant à compléter (médiateur de la consommation), vérification finale de tous les CTA.

**P1 — lancement SEO**
Google Search Console, envoi du sitemap, cohérence avec la fiche Google Business Profile, données structurées `LocalBusiness` (une fois l’adresse/le numéro définitifs), indexation des pages métiers, suivi Core Web Vitals et des erreurs d’indexation.

**P2 — SEO local**
Pages des principales villes desservies, contenu réellement distinct par ville (jamais des pages satellites dupliquées), intentions de recherche métier + urgence + localisation, maillage interne, FAQ locales, page/fonctionnalité **« Vérifier mon secteur »** (différée, non réalisée à ce stade).

---

## 🔐 Git, données et confidentialité

Le dépôt public ne doit contenir :

- aucun fichier `.env` ;
- aucun token, mot de passe ou identifiant privé ;
- aucune donnée personnelle de client ;
- aucune photographie d’intervention non autorisée ;
- aucun document commercial ou juridique confidentiel.

Le `.gitignore` doit notamment exclure :

```gitignore
node_modules/
dist/
.astro/
.env
.env.*
!.env.example
docs/
```

Le dossier `docs/`, utilisé pour les prompts et rapports de travail, n’a pas vocation à être publié dans le dépôt de démonstration.

---

## 🚧 Limites assumées

Cette version ne comprend pas encore :

- un formulaire de devis réellement connecté (hébergement LWS + endpoint PHP à venir) ;
- un back-office ;
- une base de données ;
- une prise de rendez-vous ;
- un système de paiement ;
- une mesure fiable des conversions (aucun outil Analytics installé à ce stade) ;
- les mentions légales définitivement complètes (médiateur de la consommation notamment) ;
- une page dédiée « Vérifier mon secteur » (fonctionnalité différée, volontairement) ;
- les pages locales et départementales (SEO local, priorité P2) ;
- la validation éditoriale et juridique finale ;
- le domaine officiel et la configuration SEO de production (indexation encore bloquée).

Les boutons non reliés à une destination réelle doivent rester désactivés, être redirigés vers une section existante ou porter un libellé honnête. Aucun faux parcours ne doit être présenté comme fonctionnel.

---

## 📋 Prochaines étapes

### Validation client

- [ ] Recueillir les retours de Fouad sur la démonstration en ligne
- [ ] Valider le numéro standard
- [ ] Confirmer tous les horaires et niveaux de disponibilité
- [ ] Valider les prestations et exclusions
- [ ] Valider les zones réellement couvertes
- [ ] Vérifier la note, le nombre d’avis et le lien Google
- [ ] Remplacer les contenus temporaires par des preuves authentiques
- [ ] Confirmer les droits sur les médias

### Version officielle

- [ ] Connecter l’envoi réel du formulaire de devis (hébergement LWS + endpoint PHP)
- [ ] Mettre à jour la politique de confidentialité une fois le formulaire actif
- [ ] Compléter les informations légales restantes (médiateur de la consommation)
- [ ] Construire l’architecture SEO locale sans pages artificielles (priorité P2)
- [ ] Réaliser un nouvel audit SEO/accessibilité/performance avant le retrait du `noindex`
- [ ] Choisir et configurer le domaine officiel
- [ ] Tester tous les canaux de contact en conditions réelles
- [ ] Obtenir la recette finale de Fouad
- [ ] Retirer le `noindex` et publier officiellement le site

---

## ⚠️ Règles d’honnêteté

Ne jamais publier sans validation ou preuve :

- un délai d’intervention garanti ;
- un tarif ou un devis présenté comme contractuel ;
- une certification, assurance ou qualification ;
- un nombre d’années, de projets ou de clients ;
- un avis, une note ou un volume d’avis ;
- une réalisation ;
- une ville ou zone non réellement couverte ;
- une disponibilité technique non assurée ;
- une première position Google garantie.

Le site doit convaincre par sa clarté, son utilité et ses preuves — jamais par la surpromesse.

---

## 🤝 Workflow de contribution

Avant toute modification :

```bash
git branch --show-current
git status -sb
git log -3 --oneline --decorate
git diff --check
```

Règles de travail :

- avancer par micro-sprints bornés ;
- préserver l’existant validé ;
- ne modifier que le périmètre demandé ;
- ne jamais inventer de donnée métier ;
- tester avant de déclarer un sprint terminé ;
- documenter les fichiers touchés, les preuves et les limites ;
- ne pas exécuter `git add`, `commit`, `push`, `merge` ou `rebase` sans autorisation explicite.

---

## 👥 Projet

### Client

**Belkhir Dépannage**  
Dépannage d’urgence — Hauts-de-France

### Conception et développement

<div align="center">

### Sébastien Cantrelle

**Développeur Full Stack · Amiens, France**

[![Portfolio](https://img.shields.io/badge/Portfolio-spiritzen.github.io-ff6a00?style=flat-square)](https://spiritzen.github.io/portfolio/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Sébastien_Cantrelle-0077B5?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/sebastien-cantrelle-26b695106/)
[![GitHub](https://img.shields.io/badge/GitHub-Spiritzen-181717?style=flat-square&logo=github)](https://github.com/Spiritzen)

</div>

---

## 📄 Licence et réutilisation

Projet client privé en cours de conception.

Sauf mention contraire, le code, les contenus, les médias et l’identité Belkhir Dépannage ne sont pas placés sous licence open source. Toute réutilisation, redistribution ou exploitation commerciale nécessite l’autorisation préalable de leurs détenteurs respectifs.

---

<div align="center">

**Une urgence doit être comprise vite. Une réponse professionnelle doit inspirer confiance immédiatement.**

</div>
