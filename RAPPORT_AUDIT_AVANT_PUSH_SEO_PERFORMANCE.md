# Rapport d'audit avant push — SEO, images, performance et documentation

**Date** : 04/09/2026
**Périmètre** : landing, 5 pages métiers (Plomberie, Chauffage, Serrurerie, Vitrerie, Rideaux métalliques), 2 pages juridiques (Mentions légales, Politique de confidentialité), composants partagés (Navbar, Footer, CTA, notation Google, modale de devis).
**Méthode** : inspection directe du HTML généré par `npm run build` (`dist/`), mesures Lighthouse sur `npm run preview` (jamais `astro dev`), une seule mesure de disponibilité/TTFB sur l'URL publique réelle.
**Hors périmètre (rappel du prompt de mission)** : la page/fonctionnalité « Vérifier mon secteur » n'a pas été créée. La transmission réelle du formulaire de devis n'a pas été simulée ni connectée.

---

## 1. Verdict global

🟠 **Publication de démonstration conforme, lancement définitif non engageable en l'état — plus aucun bug bloquant côté technique/code après la passe complémentaire du 04/09/2026.**

Le code technique (SEO on-page, images, performance, maillage interne) est **globalement propre et déjà exemplaire par endroits** (images 100 % `astro:assets`, WebP + AVIF, scores Lighthouse 93/100 mobile et 100/100 desktop sur la landing). Un lien interne réellement cassé et une priorité de chargement d'image incorrecte ont été trouvés et corrigés pendant l'audit initial (section 6). Une **passe complémentaire, le même jour**, a ensuite trouvé et corrigé deux défauts bloquants distincts, remontés après cet audit initial : la modale de devis restait rendue en dehors du footer une fois fermée, et les liens de retour à l'accueil n'atteignaient pas le sommet réel de la landing — voir la section 2 bis pour le détail complet.

Ce qui empêche un lancement définitif **n'est pas un défaut technique** mais une liste connue et déjà documentée d'informations commerciales/légales non finalisées (numéro standard, formulaire non connecté, médiateur de la consommation, avis Google réels) — voir section 2 et la roadmap P0.

---

## 2. Points bloquants avant lancement définitif (BLOQUANT LANCEMENT)

Aucun de ces points n'est un bug : ce sont des étapes **volontairement différées**, déjà connues du projet, reconfirmées par cet audit.

| #   | Constat                                                                      | Preuve                                                                                          |
| --- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | `noindex, nofollow` actif sur les 9 routes + `robots.txt` en `Disallow: /`   | `dist/**/index.html` (`<meta name="robots">`), `dist/robots.txt`                                |
| 2   | Numéro standard non renseigné (`siteConfig.standardPhone.display = null`)    | `src/lib/site-config.ts`                                                                        |
| 3   | Formulaire de devis sans envoi réel (hébergement LWS + endpoint PHP absents) | `src/components/ui/QuoteModal.astro` (commentaire « FUTUR ENDPOINT PHP »)                       |
| 4   | Médiateur de la consommation non renseigné                                   | `src/data/mediateur-consommation.ts` → `null`, affiché « à compléter » sur `/mentions-legales/` |
| 5   | Avis Google (note, nombre, lien officiel) non confirmés                      | `src/data/landing.ts`, `siteConfig.googleReviewsUrl = null`                                     |

**Ne pas retirer le `noindex` maintenant** — conforme à l'instruction du prompt de mission. Repris en P0 de la roadmap (section 10).

---

## 2 bis. Corrections P0 supplémentaires — dialog fermé visible et retour à l'accueil incorrect (passe complémentaire, 04/09/2026)

Deux défauts bloquants ont été signalés après la remise de l'audit initial et corrigés le même jour, dans ce même sprint.

### P0.1 — La modale de devis restait rendue après le footer une fois fermée

**Cause exacte** : `dialog.quote-modal { display: flex; … }` (`src/components/ui/QuoteModal.astro`) s'appliquait **sans condition**, avec exactement la même spécificité CSS (0,1,1) que la règle native de la feuille agent `dialog:not([open]) { display: none; }`. À spécificité égale, la règle d'auteur (la nôtre) l'emportait toujours sur la règle native — y compris dialog **fermé** (aucun attribut `open` statique dans le markup, confirmé). La modale restait donc en permanence dans le flux normal du document, à l'endroit où `<QuoteModal />` est rendu dans `BaseLayout.astro` (après le footer), avec un grand espace vide sous elle.

**Correction** : layout conditionné à l'état natif du dialog —

```css
dialog.quote-modal:not([open]) {
  display: none;
}
dialog.quote-modal[open] {
  display: flex;
}
```

Aucun changement de markup (toujours aucun attribut `open` statique, ouverture/fermeture toujours via `showModal()`/`close()` uniquement), aucun `visibility: hidden`, aucun déplacement hors écran, aucun correctif JavaScript.

**Vérifié** (`npm run preview`, script Playwright) : dialog fermé → `display: none`, `getBoundingClientRect()` à zéro partout, `offsetParent: null` (donc hors de l'arbre d'accessibilité) ; `footer.getBoundingClientRect().bottom + scrollY` === `document.body.scrollHeight` au pixel près (le footer est réellement le dernier élément) ; dialog ouvert → `display: flex` inchangé, design/backdrop flouté/croix/Annuler/Échap/clic extérieur/selects/restitution du focus tous re-testés sans régression.

### P0.2 — Les liens de retour à l'accueil n'atteignaient pas le sommet réel de la landing

**Cause exacte** : `homeHref` (`src/data/landing.ts`, unique source de tous les liens « retour à l'accueil » — logo, « Accueil » desktop/hamburger, footer, liens « Retour à l'accueil » des deux pages juridiques) ciblait `#accueil`, l'`id` du `<section class="hero">` lui-même. Cette section est positionnée **après** le bandeau de disponibilité et la navbar dans le document ; y naviguer scrolle donc son bord supérieur au ras du haut du viewport, faisant sortir le bandeau noir du cadre (`scrollY` > 0, page apparemment décalée d'une trentaine de pixels) — jamais `scrollY === 0`.

**Correction systématique** : un identifiant réel et unique pour le sommet absolu du document, `id="top"`, ajouté sur `<body>` dans `BaseLayout.astro` — disponible de façon cohérente sur les 9 pages via le layout partagé. `homeHref` cible désormais `${BASE_URL}#top` au lieu de `${BASE_URL}#accueil`. Comme un seul point de vérité alimente déjà tous les liens de retour à l'accueil du site, ce changement unique s'est propagé automatiquement à : logo (navbar + footer), « Accueil » desktop, « Accueil » du tiroir mobile, lien « Retour à l'accueil » de `/mentions-legales/` et de `/politique-de-confidentialite/` — aucune duplication de logique. `id="accueil"` reste sur le Hero (inchangé, plus rien ne le cible pour la navigation). Construit via `import.meta.env.BASE_URL`, comme le reste du site — fonctionne en local, sous le sous-répertoire GitHub Pages actuel et avec un futur domaine.

Le défilement fluide sitewide (`scroll-behavior: smooth`, basculé sur `auto` sous `prefers-reduced-motion: reduce`, déjà présent dans `global.css`) n'a pas eu besoin d'être modifié : aucun script de scroll n'a été ajouté, `history.scrollRestoration` n'a pas été touché, aucune navigation n'est forcée à `scrollY = 0` en dehors des liens représentant réellement un retour à l'accueil. Les ancres de section (Dépannages, Interventions, Zones couvertes, Avis) conservent leur `scroll-margin-top: var(--header-total-height)` existant, inchangé, jamais appliqué à `#top`.

**Vérifié** (`npm run preview`, script Playwright, desktop 1440 + mobile 390) :

| Trajet                                     | `scrollY` après clic |
| ------------------------------------------ | -------------------- |
| Landing (scrollé) → logo                   | `0`                  |
| Landing (scrollé) → « Accueil »            | `0`                  |
| Plomberie → logo (navbar desktop)          | `0`                  |
| Mentions légales (scrollé) → logo (footer) | `0`                  |

Bandeau noir supérieur entièrement visible après chaque retour (capture d'écran desktop et mobile), navbar affichée juste en dessous, Hero à sa position normale. Ancre de section « Dépannages » re-testée : son titre reste visible sous la navbar sticky (offset intact).

---

## 3. Problèmes SEO constatés

| Constat                                                                                                                                                                                                                                                                                     | Catégorie                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Lien footer « Plomberie » pointait vers l'ancre `#service-plomberie`, inexistante sur 7 des 8 pages de contenu (id réellement présent uniquement sur la landing) — lien mort partout ailleurs                                                                                               | **IMPORTANT — corrigé pendant cet audit**                                                  |
| Aucune donnée structurée `LocalBusiness`/`Organization` (seul `FAQPage` présent sur les 5 pages métiers)                                                                                                                                                                                    | IMPORTANT — légitime tant que l'adresse/le numéro ne sont pas définitifs ; à ajouter en P1 |
| `og:image` au format SVG (`og-default.svg`) — plusieurs plateformes de partage social (Facebook, LinkedIn, iMessage) ne génèrent pas d'aperçu fiable à partir d'un SVG                                                                                                                      | IMPORTANT — prévoir une variante PNG/JPEG 1200×630 avant lancement                         |
| Deux paires de questions FAQ à la formulation très proche (« Intervenez-vous dans tous les Hauts-de-France ? » sur Chauffage/Serrurerie ; « Dans quelles zones... » sur Vitrerie/Rideaux métalliques) — les réponses restent spécifiques à chaque métier, aucun paragraphe dupliqué détecté | AMÉLIORATION                                                                               |
| H1 unique et pertinent, titles uniques, meta descriptions uniques, canonical correct (`site`+`base`), `lang="fr"`, Open Graph/Twitter complets et en URL absolue, alt descriptifs et réels, aucune URL construite sans `base`, aucune page orpheline                                        | **CONFORME** (vérifié sur les 8 pages de contenu)                                          |

Détail de la vérification « aucune URL sans `base` » : 235 références vers `dist/_astro/...` recensées sur les 9 pages, **0 manquante** sur le disque après build.

---

## 4. État réel de robots / noindex / sitemap / canonical

- **`robots.txt` généré** (`src/pages/robots.txt.ts`) : `User-agent: *` / `Disallow: /` — reflète `siteConfig.allowIndexing = false` (double condition : `ENABLE_INDEXING=true` **et** les deux lignes téléphoniques réellement renseignées ; aucune des deux n'est actuellement remplie).
- **`<meta name="robots">`** : `noindex, nofollow` sur les 9 routes, y compris `/404`.
- **Sitemap** (`@astrojs/sitemap`) : `sitemap-index.xml` → `sitemap-0.xml`, **8 URLs exactes** (les 6 pages de contenu principal + les 2 pages juridiques), `/404` correctement exclue par le filtre du intégration, aucun doublon de la racine (grâce au slash final volontaire sur `base`).
- **Canonical** : `https://spiritzen.github.io/belkhir-depannage/<route>` sur chaque page, cohérent avec `site`+`base` d'Astro — aucune divergence trouvée.

**CONFORME** dans son ensemble ; le `noindex` reste une décision volontaire, à traiter en P0 (section 10), jamais retirée automatiquement.

---

## 5. État des images et formats réellement livrés

**Constat général : le pipeline `astro:assets` est déjà systématiquement utilisé.** Aucune image de contenu n'est servie en PNG/JPEG brut, aucune `background-image: url(...)` CSS n'existe sur le site (vérifié sur l'ensemble des feuilles CSS générées).

| Type d'image                                                                                           | Format source   | Formats livrés                                                                                                                    | `astro:assets`                                          | Chargement                                                                               |
| ------------------------------------------------------------------------------------------------------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Hero landing (`hero-belkhir-depannage-desktop-bd.png`)                                                 | PNG (1837 KB)   | WebP responsive (`srcset` 640→1774w, 16–65 Ko selon la taille)                                                                    | Oui (`<Image>`)                                         | `eager` + `fetchpriority="high"`                                                         |
| Heros pages métiers (mobile + desktop, 5 pages)                                                        | JPEG/PNG legacy | **AVIF + WebP** via `<picture>`, sources séparées mobile/desktop par `media` (un seul fichier réellement téléchargé par appareil) | Oui (`<Image>`/`getImage()` dans un `<picture>` manuel) | `eager` + `fetchpriority="high"`                                                         |
| Photos « Quelle est votre urgence ? », accordéons métiers, interventions récentes, illustration équipe | JPEG/PNG legacy | WebP responsive                                                                                                                   | Oui (`<Image>`)                                         | `lazy`, dimensions explicites                                                            |
| Logo (navbar + footer)                                                                                 | PNG legacy      | WebP (1,2 Ko)                                                                                                                     | Oui (`<Image>`)                                         | **Navbar : `eager` (corrigé) — Footer : `lazy` (conforme, sous la ligne de flottaison)** |
| Favicon                                                                                                | PNG             | PNG (inchangé, 3,2 Ko)                                                                                                            | Non (servi tel quel depuis `public/`)                   | N/A — taille négligeable, format normal pour un favicon                                  |
| `og-default.svg`                                                                                       | SVG             | SVG (inchangé)                                                                                                                    | Non                                                     | Voir section 3 (IMPORTANT)                                                               |

Total : **50 fichiers AVIF + 124 fichiers WebP** générés dans `dist/_astro/` (7,3 Mo), 100 % via le pipeline Astro.

**Aucune conversion mécanique n'a été appliquée** — conforme à l'instruction du prompt : les PNG déjà optimisés automatiquement par Astro n'ont pas été retouchés, la présence de `srcset`/`sizes`/formats a été vérifiée directement dans le HTML généré plutôt que supposée.

---

## 6. Tableau des optimisations réellement appliquées

| #   | Élément                                                                                                          | Avant                                                                                                                                                                 | Après                                                                                                                      | Risque                                                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Lien footer « Plomberie » (`src/components/layout/Footer.astro`)                                                 | `href="#service-plomberie"` — lien mort sur 7/8 pages (id inexistant hors landing)                                                                                    | `href="/belkhir-depannage/plomberie/"` — page réelle, cohérent avec les 4 autres métiers                                   | Faible — un seul attribut `href`, calqué sur le motif déjà utilisé pour Chauffage/Serrurerie/Vitrerie/Rideaux métalliques          |
| 2   | Logo de la navbar (`src/components/layout/Navbar.astro`)                                                         | `loading` non précisé → défaut `<Image>` = `lazy`, alors que le logo est toujours visible au premier écran                                                            | `loading="eager"` explicite                                                                                                | Faible — un seul attribut, élément minuscule (1,2 Ko), toujours dans le viewport initial                                           |
| 3   | Layout du `<dialog>` de la modale de devis (`src/components/ui/QuoteModal.astro`) — **P0, passe complémentaire** | `display: flex` posé sans condition, à spécificité égale à la règle native `dialog:not([open]) { display: none; }` → dialog fermé rendu en permanence après le footer | `display: flex` uniquement sur `dialog.quote-modal[open]` + `display: none` explicite sur `dialog.quote-modal:not([open])` | Faible — 2 règles CSS scindées, aucun changement de markup ni de JS                                                                |
| 4   | `homeHref`, source unique des liens de retour à l'accueil (`src/data/landing.ts`) — **P0, passe complémentaire** | `${BASE_URL}#accueil` — id du Hero, sous le bandeau de disponibilité et la navbar (`scrollY` > 0 au retour)                                                           | `${BASE_URL}#top` — nouvel `id="top"` sur `<body>` (`src/layouts/BaseLayout.astro`), sommet réel du document               | Faible — une constante changée + un `id` ajouté, propagé automatiquement à tous les liens « accueil » du site (aucune duplication) |

Aucune image n'a nécessité de reformatage/recompression (pipeline déjà optimal — voir section 5). Aucune autre correction du périmètre autorisé (canonical, meta dupliquée, 404 d'asset, erreur sémantique) n'a été trouvée à appliquer lors de l'audit initial ; les lignes 3 et 4 proviennent de la passe complémentaire détaillée en section 2 bis.

---

## 7. Résultats de performance (Lighthouse, sur `npm run preview`, jamais `astro dev`)

Lighthouse 12.8.1, Chrome headless 152. Mesures **locales** (voir limites en section 8).

| Page                                   | Profil                     | Score perf. | LCP   | CLS   | TBT    | FCP   | Poids total | Requêtes |
| -------------------------------------- | -------------------------- | ----------- | ----- | ----- | ------ | ----- | ----------- | -------- |
| Landing                                | Mobile (throttling simulé) | **93/100**  | 2,2 s | 0,002 | 200 ms | 2,2 s | 198 Kio     | 13       |
| Landing                                | Desktop                    | **100/100** | 0,5 s | 0,006 | 0 ms   | 0,4 s | 268 Kio     | —        |
| Plomberie (page métier représentative) | Mobile                     | **92/100**  | 2,0 s | 0,092 | 220 ms | 2,0 s | 115 Kio     | —        |

Répartition du poids (landing, mobile) : Image 97 Kio · Police 65 Kio · Document 21 Kio · CSS 15 Kio · **0 script mesuré en requête séparée, 0 tiers**.

**0 erreur console, 0 requête échouée (404 d'asset)** sur les trois mesures.

Deux opportunités Lighthouse relevées, **non corrigées** (hors périmètre « faible risque »/Hero interdit) :

- **CSS bloquant le rendu** (4 fichiers scopés par composant, ~15,5 Ko cumulés, ≈ 899 ms de gain théorique sous débit 4G simulé) — comportement standard d'Astro (CSS par composant), un inlining critique serait une optimisation d'architecture plus large que ce sprint. **AMÉLIORATION**, recommandée pour un futur sprint dédié.
- **`uses-responsive-images`** : 3 images (2 cartes « Quelle est votre urgence ? » + le Hero mobile de la landing) légèrement surdimensionnées pour leur zone d'affichage selon le DPR simulé par Lighthouse — ce sont déjà des images responsive (WebP, `srcset` réel), pas des « images lourdes en PNG » au sens du prompt de mission ; le Hero est explicitement non modifiable dans ce sprint. **AMÉLIORATION**, ajustement fin des breakpoints à envisager plus tard.

CLS légèrement plus élevé sur Plomberie mobile (0,092, sous le seuil « bon » de 0,1) : un décalage vertical du badge Google (~24 px, ~3 s après chargement) a été observé indépendamment de toute animation ou script de ce projet — cause non identifiée dans ce sprint, à surveiller. **AMÉLIORATION**.

L'intégration `@astrojs/react` reste installée (`astro.config.mjs`, `package.json`) mais **n'est utilisée nulle part** (aucun `.tsx`, aucune directive `client:*`) — poids de build inutile, non retiré ici (changement de dépendance plus large qu'une correction ciblée). **IMPORTANT**, recommandé pour un futur sprint.

---

## 8. Limites des mesures de latence

- Toutes les mesures Lighthouse ci-dessus sont **locales** (`npm run preview` sur `localhost`) : elles ignorent la latence réseau réelle, le CDN GitHub Pages, la géolocalisation du visiteur et la charge serveur réelle. **Elles ne permettent pas d'affirmer la performance perçue en production.**
- Une seule mesure légère de disponibilité/TTFB a été effectuée sur l'URL publique réelle (déterminée avec certitude depuis `astro.config.mjs` : `site` + `base`) :

  ```text
  https://spiritzen.github.io/belkhir-depannage/
  HTTP 200 — DNS 84 ms — connexion 142 ms — TLS 276 ms — TTFB 456 ms — total 807 ms
  ```

  Un seul point de mesure, depuis une seule localisation, à un instant donné — **ne constitue pas une caractérisation fiable de la latence réelle** ressentie par les visiteurs (variable selon leur position géographique et le CDN GitHub Pages). Aucun résultat réseau n'a été inventé au-delà de cette mesure unique.

- Aucune mesure Lighthouse n'a été effectuée sur l'URL publique elle-même (non demandé par le prompt de mission, qui limite Lighthouse à une version de production locale).

---

## 9. Liens ou routes vérifiés

- **9 routes générées**, correspondant exactement aux fichiers sous `src/pages/` (`/`, 5 pages métiers, 2 pages juridiques, `/404`).
- **Landing → 5 pages métiers + 2 pages juridiques** : liens présents et corrects (bandeau de métiers du Hero + footer).
- **Pages métiers/juridiques → landing** : lien « Accueil » (navbar + tiroir mobile + logo, `aria-label="Belkhir Dépannage — Accueil"`) présent sur toutes les pages testées, cible `#accueil` bien présente sur la landing.
- **Footer → pages juridiques** : présent et fonctionnel sur les 9 pages.
- **Footer → 5 métiers** : les 4 déjà corrigés lors de missions précédentes (Chauffage/Serrurerie/Vitrerie/Rideaux métalliques) + Plomberie, **corrigé pendant cet audit** (section 6).
- **« Vérifier mon secteur »** : renvoie vers `/belkhir-depannage/#zones-couvertes` (ancre réelle, vérifiée présente sur la landing) — **aucune page dédiée créée**, conforme à l'instruction du prompt.
- **0 lien/asset cassé** détecté sur les 235 références d'assets vérifiées et l'ensemble des `href` internes inspectés.

---

## 10. Roadmap SEO priorisée

### P0 — Avant mise en production définitive

- Domaine définitif (si un nom de domaine personnalisé remplace `spiritzen.github.io`, mettre à jour `site`/`base` dans `astro.config.mjs`)
- Hébergement LWS opérationnel + endpoint PHP sécurisé pour le formulaire de devis
- Canonical définitif (dépend du domaine ci-dessus, déjà correct pour la cible actuelle)
- Retrait **contrôlé** du `noindex` (jamais automatique — dépend des points ci-dessous)
- `robots.txt`/sitemap déjà prêts, à revalider après le retrait du `noindex`
- Numéro standard réel
- Mise à jour de la politique de confidentialité une fois le formulaire de devis réellement connecté (le texte actuel affirme l'absence de tout formulaire de collecte)
- Médiateur de la consommation et informations légales restantes
- Vérification finale de tous les CTA (devis, appel standard/urgence) avec les données définitives

### P1 — Lancement SEO

- Google Search Console + envoi du sitemap
- Cohérence avec la fiche Google Business Profile (avis, adresse, horaires)
- Données structurées `LocalBusiness`/`Organization` (une fois l'adresse et les numéros définitifs — voir section 3)
- Remplacer `og-default.svg` par une image de partage social PNG/JPEG (voir section 3)
- Indexation des pages métiers (suivi Search Console)
- Contrôle Core Web Vitals en conditions réelles (les scores locaux sont déjà bons — section 7)
- Suivi des erreurs d'indexation

### P2 — Développement du SEO local

- Pages des principales villes desservies, avec un **contenu réellement distinct par ville** (jamais des pages satellites produites en masse)
- Intentions de recherche croisées métier + urgence + localisation
- Maillage interne dédié, FAQ locales utiles
- Page/fonctionnalité **« Vérifier mon secteur »** — tâche différée connue, non réalisée dans ce sprint, à spécifier au moment venu
- Amélioration progressive pilotée par les données Search Console une fois le site indexé

---

## 11. Fichiers modifiés pendant cet audit

| Fichier                                                                 | Nature du changement                                                                                                                                        |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/layout/Footer.astro`                                    | Correction du lien mort « Plomberie » (section 6)                                                                                                           |
| `src/components/layout/Navbar.astro`                                    | `loading="eager"` sur le logo (section 6)                                                                                                                   |
| `tests/chauffage-sections.test.ts`                                      | Test mis à jour pour refléter le nouveau lien « Plomberie »                                                                                                 |
| `tests/plomberie-page.test.ts`                                          | Test mis à jour pour refléter le nouveau lien « Plomberie »                                                                                                 |
| `README.md`                                                             | Mise à jour complète (routes, composants partagés, `base` Astro, images, modale, déploiement réel, roadmap SEO résumée, suppression des mentions obsolètes) |
| `RAPPORT_AUDIT_AVANT_PUSH_SEO_PERFORMANCE.md`                           | Créé (ce rapport), puis complété par la passe P0 (section 2 bis)                                                                                            |
| `src/components/ui/QuoteModal.astro` — **P0**                           | Layout du `<dialog>` conditionné à `[open]` (section 2 bis)                                                                                                 |
| `src/layouts/BaseLayout.astro` — **P0**                                 | Ajout de `id="top"` sur `<body>` (section 2 bis)                                                                                                            |
| `src/data/landing.ts` — **P0**                                          | `homeHref` cible `#top` au lieu de `#accueil` (section 2 bis)                                                                                               |
| `tests/mentions-legales-page.test.ts` — **P0**                          | Test mis à jour (`#top` au lieu de `#accueil`)                                                                                                              |
| `tests/politique-confidentialite-page.test.ts` — **P0**                 | Test mis à jour (`#top` au lieu de `#accueil`)                                                                                                              |
| `tests/retouche-fonds-faq-interventions-footer-marque.test.ts` — **P0** | Test mis à jour (`#top` au lieu de `#accueil`)                                                                                                              |

Aucun changement visuel ni rédactionnel non demandé n'a été appliqué (conforme à l'instruction du prompt de mission).

---

## 12. Éléments volontairement différés (à ne pas compter comme bug)

- Page/fonctionnalité « Vérifier mon secteur » — non créée, comme demandé.
- Transmission réelle du formulaire de devis — non simulée, non connectée, comme demandé.
- Retrait du `noindex` — non effectué, décision P0 volontairement contrôlée.
- Ajustement des breakpoints d'images signalés par Lighthouse (`uses-responsive-images`) — déjà responsives, non « lourdes en PNG/JPEG », amélioration mineure différée.
- Inlining/allègement du CSS bloquant le rendu — optimisation d'architecture plus large qu'une correction ciblée, différée.
- Retrait de l'intégration `@astrojs/react` inutilisée — changement de dépendance plus large qu'une correction ciblée, différé.
- Ajout de données structurées `LocalBusiness` — dépend d'informations d'entreprise non encore définitives (adresse/numéro), différé en P1.
- Remplacement de `og-default.svg` par un visuel PNG/JPEG — nécessite un nouvel asset, différé en P1.

---

## Validation technique de ce sprint

**Audit initial** :

- Tests ciblés concernés par les modifications (Footer/Navbar et leurs consommateurs) : **248/248 passés** (11 fichiers).
- `npm run check` : **0 erreur, 0 avertissement** (102 fichiers).
- `npm run build` : **9 pages générées**, sitemap régénéré, aucune erreur.
- `git diff --check` : propre (seuls des avertissements LF/CRLF inoffensifs).

**Passe complémentaire P0 (dialog + retour accueil)** :

- Tests ciblés concernés (modale, Footer/Navbar et leurs consommateurs juridiques) : **131 + 214 = 345/345 passés** (17 fichiers).
- `npm run check` : **0 erreur, 0 avertissement** (102 fichiers).
- `npm run build` : **9 pages générées**, sitemap régénéré, aucune erreur.
- `git diff --check` : propre (seuls des avertissements LF/CRLF inoffensifs).
- Vérification comportementale sur `npm run preview` (jamais `astro dev`), desktop 1440 + mobile 390 : dialog fermé invisible et hors flux (section 2 bis), footer réellement dernier élément, `scrollY === 0` confirmé sur les 4 trajets de retour à l'accueil testés (landing→logo, landing→« Accueil », page métier→logo, page juridique→footer), bandeau supérieur visible à chaque fois, ancre de section « Dépannages » toujours correctement décalée sous la navbar sticky, les 4 mécanismes de fermeture de la modale et les selects re-testés sans régression.

Aucun commit, aucun push, aucun déploiement effectué, sur l'ensemble du sprint.
