# CONTEXT.md — Belkhir Dépannage

> Document d’onboarding destiné aux développeurs, assistants IA, rédacteurs SEO et personnes amenées à intervenir sur le nouveau site de **Belkhir Dépannage**.
>
> **État de référence :** cadrage initial, 30 août 2026. Le dépôt technique n’est pas encore décrit comme initialisé ou livré dans ce document.
>
> Ce fichier distingue volontairement quatre notions qui ne doivent jamais être confondues : **faits confirmés**, **décisions validées**, **hypothèses à vérifier** et **travaux futurs**.

> **Révision V2 — 31 août 2026 (sprint landing visuelle) :** de nouvelles décisions client remplacent des hypothèses antérieures de ce document pour la landing V1 :
>
> - présenter **Belkhir Dépannage comme une équipe** (« notre équipe », « nous »), jamais Fouad comme individu, dans les contenus visibles par les visiteurs ;
> - afficher clairement **24h/24 et 7j/7** comme engagement de disponibilité (volonté commerciale confirmée) — cela ne dit rien d'un délai d'intervention garanti, qui reste inconnu (voir §4.4) ;
> - présenter les **Hauts-de-France comme territoire principal** de la landing V1, sans centrer le discours sur Amiens (qui reste la base de vie confirmée, voir §8.1) ;
> - prévoir **deux lignes d'appel officielles** (standard, et portable d'urgence extrême) au lieu d'un numéro unique (voir §9.1).
>
> Le détail de ces décisions est dans `PROMPT_CLAUDE_CODE_LANDING_VISUELLE_V1(1).txt`. Les autres faits et inconnues de ce document restent valables.

---

## 0. Comment utiliser ce document

Ce fichier donne la carte du projet. Il doit permettre à une nouvelle personne ou à un nouvel assistant de comprendre rapidement :

- pourquoi le site doit être reconstruit ;
- ce qui est réellement connu sur l’activité de Fouad ;
- ce qui reste à confirmer avant publication ;
- les objectifs commerciaux et SEO ;
- les choix techniques retenus ;
- les garde-fous de contenu, de qualité et de déploiement.

En cas de contradiction, l’ordre d’autorité est le suivant :

1. les décisions explicites et récentes de Sébastien et de Fouad ;
2. les documents professionnels fournis par Fouad : identité de l’entreprise, assurances, qualifications, prestations, zones, horaires et tarifs ;
3. le code réellement présent sur la branche de référence ;
4. les tests automatisés et résultats de CI exécutés sur ce même état ;
5. les données effectivement visibles dans Google Business Profile et Search Console ;
6. le présent `CONTEXT.md` ;
7. le [`README.md`](./README.md) ;
8. les anciens rapports, prompts, maquettes et notes de travail.

L’ancien site ne constitue **jamais** une source d’autorité métier. Il peut servir de référence d’audit, mais ses numéros, promesses, adresses, textes et prestations ne doivent pas être recopiés sans validation.

Avant toute intervention importante :

- lire ce document et le `README.md` ;
- vérifier la branche et l’état Git ;
- lire les fichiers réellement concernés ;
- distinguer ce qui est livré de ce qui est seulement prévu ;
- annoncer toute hypothèse non confirmée ;
- préserver les travaux existants et les fichiers hors périmètre ;
- définir les preuves attendues avant de modifier le code.

---

## 1. Belkhir Dépannage en une phrase

**Belkhir Dépannage est un service de dépannage d’urgence basé à Amiens et intervenant professionnellement dans les Hauts-de-France, dont le nouveau site doit transformer les recherches locales et régionales en appels téléphoniques qualifiés.**

La promesse produit du site est :

> Trouver rapidement le bon service, comprendre ce qui peut être pris en charge et joindre immédiatement Fouad sur un numéro fiable.

Cette promesse commande les choix du projet :

- le téléphone est le parcours de conversion principal ;
- le référencement naturel est une exigence structurante, pas une finition ;
- la rapidité et le mobile sont prioritaires ;
- aucune promesse commerciale ne doit être inventée ;
- les pages locales doivent être utiles et uniques ;
- le site doit rester simple à maintenir et à enrichir.

---

## 2. Origine du projet

Fouad dispose déjà d’un ancien site public :

- `https://belkhir-depannage80.fr/`

Le projet de reconstruction est né d’un défaut commercial critique :

- le numéro affiché ou le mécanisme de redirection téléphonique de l’ancien site ne permet pas aux appels d’arriver correctement sur le téléphone de Fouad ;
- Fouad ne s’en est pas rendu compte immédiatement ;
- lorsqu’il a identifié le problème, l’ancien développeur n’était plus joignable ;
- Fouad n’a plus accès à l’administration de l’ancien site depuis environ deux ans ;
- l’ancien site ne peut donc pas être considéré comme réparable dans le calendrier actuel.

Conséquence : **un nouveau site doit être créé indépendamment de l’ancien**, sur une infrastructure et avec des accès appartenant à Fouad.

Fouad dispose en revanche des accès liés à son environnement Google, notamment :

- Google Business Profile ;
- Google Search Console ;
- les autres propriétés Google éventuelles restent à inventorier.

Le projet ne consiste pas à renommer l’entreprise sur Google. L’intention connue est de :

1. conserver l’identité **Belkhir Dépannage** ;
2. publier un nouveau site sur un domaine contrôlé par Fouad ;
3. remplacer l’ancienne URL du site dans la fiche Google professionnelle ;
4. rattacher et suivre le nouveau site dans Search Console.

---

## 3. Objectifs du projet

### 3.1 Objectif commercial principal

Obtenir des demandes de dépannage qualifiées, principalement par téléphone.

Le parcours nominal doit être :

```text
Recherche Google → page correspondant au besoin → réassurance → appel → qualification → intervention
```

### 3.2 Objectifs secondaires

- présenter clairement les prestations réellement assurées ;
- donner confiance avant l’appel ;
- expliquer la zone d’intervention ;
- permettre une demande non urgente si ce besoin est confirmé ;
- valoriser les réalisations, avis et preuves professionnelles disponibles ;
- construire un actif numérique que Fouad contrôle réellement ;
- mesurer les pages et requêtes qui génèrent des contacts.

### 3.3 Objectif SEO

Développer progressivement une visibilité durable sur :

- les recherches de dépannage d’urgence ;
- les recherches par prestation ;
- Amiens comme point d’ancrage principal ;
- les départements et villes prioritaires des Hauts-de-France ;
- les recherches à intention immédiate d’appel ou de devis.

Le SEO ne doit jamais être présenté comme une garantie de première position. Le projet garantit une méthode, une architecture propre, des contenus utiles et un suivi ; il ne garantit pas une place déterminée dans Google.

---

## 4. Périmètre de vérité métier

### 4.1 Faits confirmés à ce jour

- responsable opérationnel : **Fouad Belkhir** ;
- nom commercial utilisé : **Belkhir Dépannage** ;
- début d’activité communiqué : **2023** ;
- base de vie actuelle communiquée : **Amiens** ;
- territoire professionnel annoncé : **ensemble des Hauts-de-France** ;
- métier : service de dépannage et réparation ;
- priorité commerciale : répondre au maximum de demandes qu’il peut réellement prendre en charge ;
- priorité numérique : référencement naturel ;
- conversion principale : appel téléphonique ;
- Fouad dispose de ses accès Google ;
- l’ancien site et son développeur ne sont plus sous contrôle opérationnel de Fouad.

### 4.2 Prestations évoquées lors du premier entretien

- plomberie ;
- dépannage d’urgence ;
- chauffage ;
- recherche ou traitement d’anomalies ;
- fuites ;
- serrurerie ;
- rideaux métalliques ;
- vitrerie.

Cette liste décrit les prestations évoquées. Elle ne signifie pas encore que chacune doit disposer d’une page commerciale au lancement.

Pour chaque prestation, il reste à confirmer :

- les interventions précises acceptées ;
- les interventions refusées ou sous-traitées ;
- les limites techniques ;
- les qualifications nécessaires et réellement détenues ;
- la couverture par l’assurance professionnelle ;
- les horaires et délais possibles ;
- le matériel fourni ;
- le mode de tarification ;
- le territoire réaliste d’intervention.

### 4.3 Motivations exprimées

Fouad souhaite travailler davantage pour ses propres clients afin de :

- résoudre directement leurs problèmes ;
- proposer un rapport qualité-prix qu’il maîtrise ;
- fidéliser sa clientèle ;
- développer son activité ;
- obtenir une réussite professionnelle plus autonome ;
- répondre à davantage d’appels et prendre en charge les besoins qu’il peut exécuter.

### 4.4 Informations encore inconnues

Les éléments suivants ne doivent jamais être inventés :

- numéro officiel définitif ;
- nouveau nom de domaine ;
- adresse légale à afficher ;
- horaires normaux et astreintes ;
- disponibilité réelle 24 h/24 et 7 j/7 (le principe d'affichage 24h/24 et 7j/7 est désormais une décision commerciale confirmée pour la landing V1 — voir la révision V2 en tête de document — mais les horaires opérationnels précis, l'organisation des astreintes et tout délai d'intervention restent inconnus et ne doivent jamais être promis) ;
- délai d’intervention garanti ;
- conditions de majoration ;
- prix ou fourchettes tarifaires ;
- liste définitive des prestations ;
- ordre de priorité des prestations ;
- liste des villes prioritaires ;
- rayon et délais réalistes par zone ;
- clientèle prioritaire : particuliers, professionnels ou les deux ;
- certifications, labels et qualifications ;
- assurances et garanties ;
- moyens de paiement ;
- politique de devis ;
- photos et droits d’utilisation ;
- propriété et réutilisabilité des avis existants ;
- mentions légales complètes ;
- hébergeur et domaine définitifs ;
- formulaire, WhatsApp, SMS ou demande de rappel ;
- outil de mesure d’audience et de conversion.

---

## 5. État réel du projet

### 5.1 Acquis de cadrage

- problème commercial principal identifié ;
- besoin d’une reconstruction complète confirmé ;
- priorité SEO confirmée ;
- Amiens identifié comme ancrage principal ;
- couverture régionale Hauts-de-France annoncée ;
- premières prestations recensées ;
- accès Google annoncés comme disponibles ;
- stack cible proposée ;
- premier entretien métier réalisé partiellement ;
- deuxième entretien prévu pour approfondir clients, territoire, besoins numériques et éléments existants.

### 5.2 Non livré ou non prouvé

- dépôt de code initialisé ;
- domaine réservé ;
- accès domaine et hébergement ;
- maquette validée ;
- identité visuelle validée ;
- arborescence SEO validée ;
- recherche de mots-clés réalisée ;
- benchmark concurrentiel réalisé ;
- contenus approuvés par Fouad ;
- numéro testé de bout en bout ;
- pages développées ;
- tests automatisés ;
- audit Lighthouse ;
- conformité juridique des contenus ;
- déploiement ;
- modification de la fiche Google ;
- propriété Search Console du nouveau domaine ;
- suivi post-lancement.

La présence d’une tâche dans une roadmap ou d’un fichier prévu dans une architecture ne vaut jamais livraison.

---

## 6. Audit de l’ancien site : enseignements à conserver

L’ancien site peut être étudié pour comprendre les intentions passées, mais il ne doit pas être copié.

### 6.1 Éléments intéressants

- activité comprise rapidement ;
- appel téléphonique mis en avant ;
- présence de pages par prestation ;
- présence de pages géographiques ;
- avis comme élément de réassurance ;
- positionnement autour du dépannage d’urgence ;
- structure visuelle globalement professionnelle.

### 6.2 Défauts critiques observés

- incohérences téléphoniques ;
- redirection d’appel défaillante ;
- informations de contact non fiables ;
- absence de contrôle par Fouad ;
- incohérences dans les documents juridiques et coordonnées ;
- promesses potentiellement non validées ;
- pages géographiques et listes de mots-clés à ne pas reproduire automatiquement ;
- dépendance à un prestataire devenu injoignable.

### 6.3 Règle de migration

Tant que l’ancien domaine n’est pas récupéré :

- ne pas promettre de redirections `301` ;
- ne pas annoncer que l’ancien site disparaîtra ;
- ne pas importer ses textes comme s’ils appartenaient nécessairement à Fouad ;
- ne pas réutiliser ses numéros ;
- ne pas dépendre de son WordPress, de ses extensions ou de son hébergement.

Le nouveau projet doit fonctionner même si l’ancien site reste en ligne.

---

## 7. Utilisateurs et intentions de recherche

Les segments exacts restent à confirmer au deuxième entretien. Le site doit néanmoins être préparé pour distinguer les intentions suivantes.

### 7.1 Urgence immédiate

Le visiteur :

- rencontre une fuite, une panne, une fermeture bloquée, une vitre endommagée ou une autre urgence réelle ;
- consulte principalement son téléphone ;
- veut savoir si le problème est pris en charge ;
- veut appeler sans chercher longtemps ;
- a besoin d’être rassuré sur la zone, la disponibilité et le sérieux.

### 7.2 Dépannage planifiable

Le visiteur :

- cherche une réparation ou un diagnostic ;
- compare plusieurs professionnels ;
- souhaite comprendre le service ;
- peut accepter un formulaire, une demande de rappel ou l’envoi de photos.

### 7.3 Client professionnel

Ce segment reste à valider. Il peut inclure :

- commerces ;
- syndics ;
- bailleurs ;
- agences immobilières ;
- entreprises ;
- gestionnaires de locaux.

Les pages ne doivent pas affirmer que Fouad dessert ces profils tant que cela n’est pas confirmé.

---

## 8. Territoire

### 8.1 Ancrage principal

Amiens constitue l’ancrage éditorial, commercial et SEO principal communiqué pour le nouveau site.

### 8.2 Portée régionale annoncée

La couverture professionnelle annoncée concerne les Hauts-de-France :

- Aisne ;
- Nord ;
- Oise ;
- Pas-de-Calais ;
- Somme.

Cette couverture régionale ne justifie pas la création immédiate d’une page pour chaque commune.

### 8.3 Informations géographiques à obtenir

- communes réellement desservies en priorité ;
- distance ou durée maximale de déplacement ;
- différences entre urgence et rendez-vous ;
- frais de déplacement ;
- délai moyen par zone ;
- prestations disponibles ou indisponibles selon la distance ;
- zones refusées malgré leur appartenance administrative à la région ;
- capacité à gérer plusieurs demandes simultanées ;
- réseau éventuel de partenaires ou sous-traitants.

### 8.4 Garde-fou SEO local

Une page locale n’est autorisée que si elle apporte une information propre et utile, par exemple :

- services réellement disponibles ;
- délai ou organisation d’intervention ;
- contraintes locales ;
- réalisations dans la zone ;
- témoignages associés ;
- accès ou secteur couvert ;
- FAQ réellement pertinente.

La génération automatique de toutes les combinaisons `service × ville` est interdite sans validation éditoriale et commerciale.

---

## 9. Stratégie de conversion

### 9.1 Téléphone comme action principale

Les numéros sont une donnée critique de production.

**Mise à jour V2 :** le site prévoit **deux lignes d’appel officielles**, chacune avec son propre rôle : un numéro **standard** (demandes, devis, suivi) et un numéro **urgence extrême** (portable d’urgence). Ce n’est plus un numéro unique.

Règles absolues :

1. deux sources de vérité centralisées dans la configuration, une par ligne d’appel (standard, urgence extrême) ;
2. un format d’affichage lisible pour chacune ;
3. un format international normalisé pour les liens `tel:` ;
4. aucun numéro écrit manuellement dans plusieurs composants — toujours via la configuration centrale ;
5. tous les CTA d’une ligne donnée utilisent la même donnée ;
6. tests automatisés sur la génération des deux liens ;
7. tests réels d’appel avant mise en ligne, sur les deux lignes ;
8. vérification depuis plusieurs téléphones et opérateurs si possible ;
9. contrôle après chaque modification de téléphonie ou de domaine ;
10. aucun numéro de l’ancien site réutilisé sans confirmation de Fouad ;
11. si un numéro n’est pas encore validé, afficher un libellé explicite (« à renseigner ») plutôt qu’un faux lien `tel:`.

### 9.2 Actions secondaires possibles

À valider avant développement :

- demande de rappel ;
- formulaire de contact ;
- ajout de photos ;
- SMS ;
- WhatsApp ;
- e-mail ;
- demande de devis non urgente.

Le site ne doit pas multiplier les canaux si Fouad n’est pas capable de les suivre rapidement.

### 9.3 Réassurance avant l’appel

Les preuves possibles sont :

- avis Google réels ;
- photos de réalisations avec droits confirmés ;
- identité du professionnel ;
- assurances ;
- qualifications ;
- explication du déroulement d’une intervention ;
- devis et transparence tarifaire ;
- zone et horaires réels ;
- réponses aux questions fréquentes.

---

## 10. Stratégie SEO

### 10.1 Principes

- répondre d’abord à l’intention de recherche ;
- une page = une intention principale clairement définie ;
- contenu unique, utile et validé ;
- hiérarchie `H1` à `H6` cohérente, avec un `H1` principal ;
- maillage interne contextuel ;
- URL stables, courtes, minuscules, sans accent et séparées par des tirets ;
- canonique absolue sur chaque page indexable ;
- sitemap XML ;
- `robots.txt` cohérent ;
- métadonnées uniques ;
- images locales optimisées et correctement décrites ;
- données structurées conformes au contenu visible ;
- performance mobile ;
- accessibilité ;
- suivi Search Console après publication.

### 10.2 Architecture éditoriale envisagée

Cette architecture est une cible de travail, pas une liste de pages déjà validées.

- accueil ;
- pages de prestations prioritaires ;
- page générale des zones d’intervention ;
- page Amiens ;
- pages départementales ou villes prioritaires après étude ;
- réalisations ou cas d’intervention ;
- présentation de Fouad et de sa méthode ;
- avis et preuves ;
- FAQ ;
- contact ;
- mentions légales ;
- politique de confidentialité ;
- politique de cookies si nécessaire.

### 10.3 Arborescence indicative

```text
/
/depannages/
/depannages/<service>/
/zones-intervention/
/zones-intervention/amiens/
/zones-intervention/<zone-prioritaire>/
/realisations/
/realisations/<intervention>/
/a-propos/
/contact/
/mentions-legales/
/confidentialite/
```

Les slugs définitifs seront choisis après recherche de mots-clés et validation des services.

### 10.4 Contenu local autorisé

Une page locale doit pouvoir répondre clairement :

- quel problème est pris en charge ?
- dans quelle zone exacte ?
- comment contacter Fouad ?
- quels éléments préparer avant l’appel ?
- quelles preuves locales sont disponibles ?
- quelles limites ou conditions s’appliquent ?

Une simple substitution du nom de ville dans un texte générique est interdite.

### 10.5 Données structurées envisagées

Uniquement si elles correspondent au contenu visible :

- `LocalBusiness` avec sous-type pertinent ;
- `Service` ;
- `BreadcrumbList` ;
- `FAQPage` ;
- `Article` pour un contenu éditorial réel ;
- informations de contact et zones desservies.

Ne jamais baliser :

- de faux avis ;
- une note agrégée sans source légitime ;
- des horaires non confirmés ;
- une adresse non destinée au public ;
- des services absents de la page ;
- une FAQ invisible ;
- une zone non réellement desservie.

---

## 11. Stack cible

La stack est choisie pour un site vitrine riche en contenu, rapide, indexable et maintenable.

| Couche        | Choix cible                        | Rôle                                             |
| ------------- | ---------------------------------- | ------------------------------------------------ |
| Génération    | Astro 7, version stable compatible | Pages statiques et composants serveur            |
| Langage       | TypeScript strict                  | Données et utilitaires typés                     |
| Rendu         | Statique par défaut                | HTML produit au build et servi rapidement        |
| Interactivité | React en îlots ciblés              | Menu mobile ou interactions complexes uniquement |
| Animations    | CSS natif et JavaScript léger      | Effets visuels sans transformer le site en SPA   |
| Styles        | CSS natif                          | Tokens, responsive, états et animations          |
| Images        | `astro:assets`                     | Dimensions et variantes optimisées               |
| Sitemap       | `@astrojs/sitemap`                 | Découverte des URL canoniques                    |
| Tests         | Vitest                             | Utilitaires, données et garde-fous SEO           |
| Vérification  | Astro Check                        | Validation Astro et TypeScript                   |
| Qualité       | ESLint + Prettier                  | Cohérence et analyse statique                    |
| Dépendances   | npm + `package-lock.json`          | Installation reproductible                       |

### 11.1 Ce que signifie « statique »

Le rendu statique ne signifie pas que le site sera immobile.

Le site pourra contenir :

- transitions ;
- apparitions au scroll ;
- menu animé ;
- carrousel ;
- vidéo ;
- effets de profondeur ;
- accordéons ;
- composants React ciblés.

« Statique » signifie que le contenu principal est généré en HTML au moment du build au lieu d’être reconstruit par un serveur à chaque visite.

### 11.2 Hors périmètre initial

Ne pas introduire sans besoin validé :

- backend applicatif ;
- base SQL ;
- authentification ;
- espace client ;
- CMS ;
- paiement ;
- tableau de bord ;
- framework CSS ;
- bibliothèque d’animation lourde ;
- rendu serveur permanent.

Un formulaire pourra utiliser ultérieurement un service ou une fonction serveur ciblée. Cela ne justifie pas aujourd’hui un backend complet.

---

## 12. Architecture technique cible

L’arborescence finale dépendra du socle réellement créé. La cible conceptuelle est :

```text
src/
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── sections/
│   ├── seo/
│   └── ui/
├── content/
├── data/
├── layouts/
├── lib/
├── pages/
├── styles/
└── types/

public/
├── favicon/
├── fonts/
└── images/

tests/
```

### 12.1 Sources de vérité attendues

Les données répétées doivent être centralisées et typées :

- identité du site ;
- téléphone ;
- e-mail ;
- domaine ;
- horaires ;
- réseaux ;
- services ;
- zones ;
- métadonnées par défaut ;
- navigation ;
- liens légaux.

Le téléphone, le domaine et les coordonnées ne doivent jamais être dupliqués manuellement dans plusieurs fichiers.

### 12.2 Modèles de contenu envisagés

Les modèles suivants sont des structures éditoriales, pas des tables SQL :

- `SiteConfig` ;
- `Service` ;
- `Zone` ;
- `Realisation` ;
- `FaqItem` ;
- `Temoignage` ;
- `SeoMetadata` ;
- `NavigationItem`.

Leur schéma définitif doit être fondé sur le contenu réellement obtenu de Fouad.

---

## 13. Direction artistique

La direction artistique définitive n’est pas encore validée.

Le futur univers doit transmettre :

- urgence maîtrisée ;
- sérieux ;
- proximité ;
- lisibilité ;
- compétence technique ;
- confiance ;
- disponibilité réelle, sans surpromesse.

L’ancien site peut inspirer la clarté du hero et la visibilité du téléphone. Il ne doit pas dicter la nouvelle identité.

> **Couleur phare de Belkhir Dépannage : orange de marque `#FF6900`** (décision retouche 02, 31/08/2026 — token `--color-brand` dans `src/styles/tokens.css`). Utilisée pour l'instant sur les initiales « B » et « D » de la navbar ; aucune harmonisation globale des autres couleurs de la landing n'a été engagée à ce stade.

Principes provisoires :

- conception mobile-first ;
- CTA téléphonique visible sans agressivité ;
- contrastes forts ;
- iconographie cohérente ;
- photographies authentiques privilégiées ;
- animations sobres et performantes ;
- aucun faux compteur, faux badge ou fausse certification ;
- aucune image de métier incohérente avec le service décrit.

---

## 14. Performance, accessibilité et robustesse

### 14.1 Performance

- JavaScript client limité ;
- image principale dimensionnée et chargée avec la bonne priorité ;
- images hors écran différées ;
- formats modernes lorsque pertinents ;
- polices auto-hébergées et sous-ensembles limités ;
- dimensions réservées pour réduire les décalages ;
- dépendances tierces évaluées avant ajout ;
- aucune vidéo lourde lancée sans stratégie mobile ;
- budget de performance contrôlé avant publication.

### 14.2 Accessibilité

- HTML sémantique ;
- navigation clavier ;
- focus visible ;
- lien d’évitement ;
- menu mobile accessible ;
- libellés explicites ;
- alternatives textuelles utiles ;
- contrastes suffisants ;
- cibles tactiles adaptées ;
- respect de `prefers-reduced-motion` ;
- formulaires utilisables sans dépendre uniquement de la couleur ;
- états d’erreur annoncés clairement.

### 14.3 Résilience commerciale

- téléphone testé avant publication ;
- CTA disponibles même si une animation échoue ;
- contenu principal lisible sans JavaScript ;
- formulaire secondaire, jamais unique voie de contact ;
- page 404 utile ;
- absence d’erreur de console bloquante ;
- aucune dépendance à l’ancien domaine pour fonctionner.

---

## 15. Google et mesure

### 15.1 Comptes

Fouad doit rester propriétaire des comptes et actifs :

- domaine ;
- hébergement ;
- Google Business Profile ;
- Search Console ;
- Analytics ou Tag Manager si retenus ;
- boîte e-mail professionnelle.

Sébastien doit être ajouté avec son propre compte et le rôle nécessaire. Les mots de passe et codes de double authentification ne doivent pas être partagés.

### 15.2 Mise en ligne

Après validation du nouveau site :

1. publier le domaine définitif ;
2. tester les appels et formulaires ;
3. vérifier les canoniques, robots et sitemap ;
4. créer ou vérifier la propriété Search Console ;
5. envoyer le sitemap ;
6. remplacer l’ancienne URL dans Google Business Profile ;
7. contrôler le téléphone, les services et la zone ;
8. surveiller l’indexation et les erreurs.

### 15.3 Mesures utiles

Si un outil de mesure est validé, suivre au minimum :

- clics sur téléphone ;
- envois de formulaire ;
- demandes de rappel ;
- pages d’entrée ;
- requêtes Search Console ;
- positions et impressions par zone ;
- conversions par prestation ;
- erreurs 404 ;
- état des pages indexées.

Ne pas installer un outil de suivi avant d’avoir défini le besoin, le consentement applicable et la politique de confidentialité.

---

## 16. Honnêteté commerciale et éditoriale

Les formulations suivantes nécessitent une preuve explicite avant publication :

- « 24 h/24 et 7 j/7 » ;
- « intervention en moins d’une heure » ;
- « prix le moins cher » ;
- « meilleur dépanneur » ;
- « équipe de professionnels » si Fouad travaille seul ;
- « agréé » sans organisme et preuve ;
- « certifié » sans certification ;
- « garantie » sans conditions ;
- « toutes interventions » ;
- « toute la région en moins d’une heure » ;
- avis, notes ou volumes non vérifiés.

Règles rédactionnelles :

- écrire pour le client avant le moteur de recherche ;
- expliquer concrètement ;
- ne pas surcharger les textes de villes et mots-clés ;
- ne pas masquer les limites ;
- employer le « nous » uniquement si la réalité de l’organisation le justifie ;
- ne pas inventer d’historique, d’anecdote, de réalisation ou de témoignage ;
- faire valider par Fouad les textes engageant sa responsabilité.

---

## 17. Sécurité et données personnelles

Même sans backend complet :

- ne jamais versionner de secret ;
- utiliser `.env.example` sans valeur sensible ;
- protéger le formulaire contre le spam si un formulaire est ajouté ;
- collecter uniquement les données nécessaires ;
- ne pas demander de détails sensibles dans une zone libre ;
- définir la durée et le destinataire des demandes ;
- ne pas publier l’adresse personnelle sans décision explicite ;
- ne pas exposer les accès Google dans le dépôt ou les rapports ;
- ne pas journaliser les codes ou identifiants d’accès ;
- vérifier les licences et droits des photos, polices et icônes.

---

## 18. Tests et qualité

### 18.1 Garde-fous automatisés attendus

- validation Astro et TypeScript ;
- lint ;
- formatage ;
- tests unitaires ;
- build de production ;
- validation de la configuration ;
- test de normalisation du téléphone ;
- test des canoniques ;
- test d’unicité des slugs ;
- test des métadonnées obligatoires ;
- test de non-indexation tant que la publication n’est pas autorisée ;
- contrôle des liens internes critiques ;
- contrôle des images ou données manquantes ;
- `git diff --check`.

### 18.2 Contrôles manuels attendus

- responsive mobile, tablette et desktop ;
- navigation clavier ;
- lecteur d’écran sur les parcours principaux ;
- réduction des animations ;
- appel réel depuis chaque CTA ;
- formulaire et réception réelle si livré ;
- affichage sans JavaScript du contenu essentiel ;
- métadonnées et partage social ;
- page 404 ;
- audit Lighthouse ;
- inspection Search Console après publication.

### 18.3 Définition minimale du vert

Une étape n’est GREEN que si :

- le périmètre est respecté ;
- les faits utilisés sont validés ;
- les tests ciblés passent ;
- la suite globale passe ou son absence est justifiée ;
- le build passe ;
- le diff est propre ;
- aucun contenu fictif n’a été ajouté ;
- aucun secret ou fichier local parasite n’est versionné ;
- les réserves sont écrites clairement.

---

## 19. Workflow de développement

### 19.1 Principes

- travailler par micro-sprints bornés ;
- une mission = un objectif principal ;
- reconnaissance avant modification ;
- préserver l’existant ;
- ne pas mélanger refonte visuelle, SEO, contenu et infrastructure sans nécessité ;
- dépendances ajoutées uniquement avec justification ;
- tests et preuves avant déclaration de réussite ;
- prompts et rapports longs conservés en `.txt` et ignorés par Git lorsqu’ils sont purement locaux ;
- `CONTEXT.md` et `README.md` sont versionnés et maintenus.

### 19.2 Git

Avant une mission :

```bash
git branch --show-current
git status -sb
git log -3 --oneline --decorate
git diff --check
```

Un assistant ne doit jamais exécuter sans autorisation explicite :

- `git add` ;
- `git commit` ;
- `git push` ;
- création ou fusion de PR ;
- `merge` ;
- `rebase` ;
- `reset` destructif ;
- suppression de branche ;
- suppression de fichiers hors périmètre.

### 19.3 Rapport de sprint

Pour une mission significative, le rapport doit préciser :

1. branche et état initial ;
2. reconnaissance effectuée ;
3. objectif et critères d’acceptation ;
4. fichiers créés ou modifiés ;
5. décisions prises ;
6. comportement avant et après ;
7. tests ajoutés ou adaptés ;
8. résultats exacts des commandes ;
9. limites et risques ;
10. `git status --short` final ;
11. déclaration honnête : GREEN, AMBER ou RED.

---

## 20. Roadmap de référence

### P0 — Cadrage et propriété des actifs

- confirmer le numéro officiel ;
- sélectionner le nouveau domaine ;
- faire acheter le domaine par Fouad ;
- inventorier les accès Google ;
- récupérer documents, preuves, photos et avis ;
- confirmer services, zones et horaires ;
- réaliser le deuxième entretien.

### P1 — Socle technique

- initialiser Astro 7 ;
- configurer TypeScript strict ;
- intégrer React de façon ciblée ;
- configurer CSS, assets, sitemap et robots ;
- installer les contrôles qualité ;
- centraliser la configuration ;
- maintenir l’indexation désactivée.

### P2 — Recherche SEO et architecture

- analyser Search Console existante ;
- analyser Google Business Profile ;
- étudier les concurrents ;
- construire la carte des intentions ;
- prioriser services et zones ;
- valider les slugs et le maillage ;
- définir le plan éditorial.

### P3 — Direction artistique et composants

- moodboard ;
- identité visuelle ;
- typographies ;
- tokens ;
- header ;
- navigation ;
- CTA téléphone ;
- footer ;
- composants de réassurance ;
- responsive et accessibilité.

### P4 — Pages stratégiques

- accueil ;
- services prioritaires ;
- Amiens ;
- zone Hauts-de-France ;
- à propos ;
- contact ;
- pages légales.

### P5 — Déploiement SEO régional

- départements ou villes prioritaires ;
- réalisations ;
- FAQ ;
- contenus uniques ;
- maillage interne ;
- données structurées validées.

### P6 — Conversion et mesure

- appel permanent sur mobile ;
- formulaire ou rappel si validé ;
- mesure des clics ;
- confidentialité et consentement ;
- tests réels de réception.

### P7 — Préproduction

- validation complète par Fouad ;
- audit contenu ;
- audit technique ;
- audit accessibilité ;
- audit performance ;
- recette téléphonique ;
- sauvegarde des preuves.

### P8 — Mise en ligne

- publication ;
- DNS et HTTPS ;
- tests de production ;
- Search Console et sitemap ;
- remplacement de l’URL sur Google Business Profile ;
- contrôle d’indexation.

### P9 — Suivi

- surveillance 404 et indexation ;
- analyse des requêtes ;
- suivi des appels ;
- amélioration des pages existantes ;
- création de nouvelles pages seulement sur la base de données réelles.

---

## 21. Risques principaux

| Risque                          | Conséquence                        | Réponse attendue                                    |
| ------------------------------- | ---------------------------------- | --------------------------------------------------- |
| Téléphone incorrect             | Perte directe de clients           | Source unique + tests réels                         |
| Ancien site toujours indexé     | Confusion et appels perdus         | Nouveau domaine cohérent + fiche Google mise à jour |
| Pages locales dupliquées        | Faible valeur SEO                  | Contenus uniques et priorisation                    |
| Promesses non vérifiées         | Risque commercial et réputationnel | Validation écrite par Fouad                         |
| Couverture régionale trop large | Délais irréalistes                 | Zones et conditions explicites                      |
| Dépendance à un prestataire     | Nouvelle perte de contrôle         | Comptes détenus par Fouad                           |
| Photos sans droits              | Risque juridique                   | Provenance et autorisation tracées                  |
| Site trop animé ou lourd        | Perte mobile et SEO                | Budget performance + réduction de mouvement         |
| Formulaire non suivi            | Prospects perdus                   | Canal testé et responsable identifié                |
| Mesure non conforme             | Risque vie privée                  | Minimisation et consentement adapté                 |

---

## 22. Questions ouvertes prioritaires

### Identité et accès

- Quel est le numéro officiel ?
- Quel nouveau domaine sera choisi ?
- Quelle adresse peut être publiée ?
- Quelle boîte e-mail professionnelle sera utilisée ?
- Quels outils Google existent réellement ?

### Prestations

- Quelles sont les trois prestations prioritaires ?
- Quelles interventions exactes sont acceptées ?
- Quelles interventions sont refusées ?
- Quelles prestations nécessitent une qualification ou assurance particulière ?
- Fouad intervient-il seul ou avec des partenaires ?

### Territoire

- Quelles villes génèrent actuellement des missions ?
- Quelles zones sont prioritaires ?
- Quel déplacement est réaliste pour une urgence ?
- Existe-t-il une tarification par distance ?

### Organisation commerciale

- Quels sont les horaires réels ?
- Comment les appels sont-ils qualifiés ?
- Comment le prix est-il annoncé ?
- Quand le devis est-il produit ?
- Quel canal secondaire Fouad consultera-t-il ?

### Preuves

- Quels avis peuvent être affichés ?
- Quelles photos appartiennent à Fouad ?
- Quelles assurances et qualifications peuvent être citées ?
- Existe-t-il des devis, factures ou réalisations anonymisables ?

---

## 23. Checklist d’onboarding rapide

Avant de proposer du code :

- [ ] lire `CONTEXT.md` ;
- [ ] lire `README.md` ;
- [ ] inspecter le dépôt et la branche ;
- [ ] distinguer cible et état réellement livré ;
- [ ] vérifier si les données utilisées sont confirmées ;
- [ ] identifier les fichiers hors périmètre ;
- [ ] définir des critères d’acceptation observables ;
- [ ] définir les validations à exécuter ;
- [ ] ne pas inventer de contenu métier.

Avant de remettre le travail :

- [ ] diff limité au périmètre ;
- [ ] tests ciblés verts ;
- [ ] validation globale verte ou réserve explicite ;
- [ ] build vert ;
- [ ] `git diff --check` propre ;
- [ ] responsive vérifié ;
- [ ] accessibilité essentielle préservée ;
- [ ] aucun secret ;
- [ ] aucun numéro non validé ;
- [ ] rapport final exploitable.

---

## 24. Glossaire

| Terme             | Définition opérationnelle                                                              |
| ----------------- | -------------------------------------------------------------------------------------- |
| CTA               | Action proposée au visiteur, principalement l’appel téléphonique                       |
| GBP               | Google Business Profile, fiche professionnelle visible dans Google et Maps             |
| Search Console    | Outil Google de suivi de l’indexation et des performances organiques                   |
| SEO local         | Optimisation visant les recherches liées à une zone et un besoin réel                  |
| Rendu statique    | HTML généré au build, compatible avec animations et îlots interactifs                  |
| Îlot React        | Composant interactif hydraté séparément dans une page Astro                            |
| Canonique         | URL officielle déclarée pour éviter les doublons                                       |
| Sitemap           | Fichier listant les URL destinées aux moteurs de recherche                             |
| NAP               | Cohérence entre nom, adresse ou zone, et téléphone                                     |
| Donnée structurée | Balisage JSON-LD décrivant explicitement une entité ou un contenu                      |
| Doorway page      | Page locale créée principalement pour capter une requête sans valeur propre suffisante |

---

## 25. Maintenance de ce document

Mettre à jour `CONTEXT.md` lorsqu’un changement touche :

- la promesse du site ;
- les prestations ;
- les zones ;
- le numéro ou les coordonnées ;
- la stack ;
- l’architecture SEO ;
- une règle de conversion ;
- une dépendance structurante ;
- le déploiement ;
- la propriété des comptes ;
- une obligation juridique ou de confidentialité ;
- le statut livré ou non livré d’une brique majeure.

Ne pas le modifier pour chaque détail CSS ou renommage local.

Lors de chaque révision importante, inscrire en tête :

- la date ;
- la branche ou le commit observé ;
- la phase du projet ;
- les éléments en cours hors de la branche de référence ;
- les hypothèses devenues confirmées ou abandonnées.

Le cap reste : **un site rapide, honnête et visible, qui transforme une recherche urgente en appel réellement reçu par Fouad.**
