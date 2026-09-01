<div align="center">

# 🔧 Belkhir Dépannage

### Maquette d’un site de dépannage d’urgence dans les Hauts-de-France

**Identifier le problème · Sécuriser · Rassurer · Mettre en relation**

[![Portfolio](https://img.shields.io/badge/Portfolio-Sébastien_Cantrelle-ff6a00?style=for-the-badge)](https://spiritzen.github.io/portfolio/)
[![GitHub](https://img.shields.io/badge/GitHub-Spiritzen-181717?style=for-the-badge&logo=github)](https://github.com/Spiritzen)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/sebastien-cantrelle-26b695106/)

<br>

![Statut](https://img.shields.io/badge/Statut-Maquette_MVP-f59e0b?style=flat-square)
![Validation](https://img.shields.io/badge/Validation_client-En_cours-f59e0b?style=flat-square)
![Astro](https://img.shields.io/badge/Astro-7-BC52EE?style=flat-square&logo=astro)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript)
![Rendu](https://img.shields.io/badge/Rendu-Statique-10b981?style=flat-square)
![Publication](https://img.shields.io/badge/GitHub_Pages-Prévue-222222?style=flat-square&logo=githubpages)

</div>

---

> [!IMPORTANT]
> Ce dépôt présente une **maquette fonctionnelle en cours de conception** destinée à permettre à Fouad de découvrir, tester et valider la future expérience du site Belkhir Dépannage.
>
> Il ne s’agit **ni du site officiel, ni d’une version de production**. Les contenus, chiffres, avis, zones, horaires, prestations, mentions juridiques et informations commerciales restent soumis à validation avant toute publication officielle.

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

## ✅ État du projet — 1er septembre 2026

> Phase actuelle : **MVP visuel et fonctionnel de la landing page**.
>
> La page principale est suffisamment avancée pour être présentée à Fouad sous la forme d’une démonstration GitHub Pages. Cette publication intermédiaire sert à recueillir ses retours ; elle ne vaut pas validation commerciale, juridique ou éditoriale.

| Périmètre                    | Statut                       | État actuel                                                 |
| ---------------------------- | ---------------------------- | ----------------------------------------------------------- |
| Direction artistique         | ✅ **Maquettée**             | Noir profond, blanc abricot et orange de sécurité           |
| Navigation desktop           | ✅ **Maquettée**             | Barre sticky et accès directs aux sections principales      |
| Navigation mobile            | ✅ **Maquettée**             | Menu hamburger accessible et appels dédiés                  |
| Hero                         | ✅ **Maquetté**              | Offre, disponibilité, métiers, devis et réassurance         |
| Orientation d’urgence        | ✅ **Maquettée**             | Six situations avec conseils introductifs et visuels dédiés |
| Domaines d’intervention      | ✅ **Maquettés**             | Grille visuelle 3 × 2 sur desktop                           |
| Processus de prise en charge | ✅ **Maquetté**              | Parcours en quatre étapes, animé et rassurant               |
| Avis Google                  | 🟡 **Structure prête**       | Données et lien officiels à contrôler avant production      |
| Pourquoi nous choisir        | ✅ **Maquetté**              | Arguments, photographie, compteurs et animations au scroll  |
| Interventions récentes       | 🟡 **Présentation prête**    | Contenus authentiques à fournir et valider                  |
| Couverture géographique      | ✅ **Maquettée**             | Hauts-de-France et cinq départements représentés            |
| FAQ                          | 🟡 **Présentation prête**    | Réponses métier à confirmer avec Fouad                      |
| Footer responsive            | ✅ **Maquetté**              | Navigation compacte et appels séparés                       |
| Numéro d’urgence             | ✅ **Activé pour les tests** | `06 49 62 16 19` — lien `tel:` fonctionnel attendu          |
| Numéro standard              | ⏳ **À renseigner**          | Doit rester clairement identifié comme non disponible       |
| Pages détaillées             | ⏳ **À construire**          | Urgences, métiers, zones et informations juridiques         |
| Audit prépublication         | 🔍 **À exécuter**            | Vérifications techniques, responsive, SEO et GitHub Pages   |
| Déploiement de démonstration | ⏳ **À réaliser**            | GitHub Pages après audit satisfaisant                       |
| Publication officielle       | ⛔ **Hors périmètre actuel** | Domaine, contenus et recette finale non validés             |

---

## 🧭 Sections de la landing page

### 1. Navigation et appel

- identité Belkhir Dépannage ;
- navigation sticky ;
- numéro standard distinct du numéro d’urgence ;
- menu mobile ;
- barre d’appel permanente sur téléphone.

Le numéro d’urgence communiqué pour les tests est le **06 49 62 16 19**. Son format fonctionnel est :

```text
tel:+33649621619
```

Le numéro standard n’étant pas encore fourni, il ne doit jamais être remplacé par un faux numéro ni devenir cliquable par erreur.

### 2. Hero

Le premier écran met immédiatement en avant :

- le dépannage d’urgence 24 h/24 et 7 j/7 ;
- la couverture des Hauts-de-France ;
- les cinq métiers prioritaires ;
- une demande de devis ;
- la preuve Google intégrée dans la direction artistique.

Les deux numéros ne sont pas répétés dans le hero : ils restent accessibles dans la navigation sticky et dans les dispositifs mobiles permanents.

### 3. Votre sécurité d’abord

La section **« Quelle est votre urgence ? »** aide le visiteur à reconnaître sa situation :

- fuite d’eau ;
- chauffage en panne ;
- porte bloquée ;
- vitre cassée ;
- rideau métallique bloqué ;
- autre urgence.

Chaque carte doit conduire, à terme, vers une page dédiée présentant :

- les premiers gestes sûrs ;
- les actions à ne surtout pas réaliser ;
- la protection des personnes en priorité ;
- les moyens raisonnables de limiter les dégâts matériels ;
- les informations à préparer avant l’appel ;
- le contact adapté.

> Les conseils publiés ne devront jamais encourager un visiteur à manipuler une installation électrique, un mécanisme, une chaudière, une vitre ou tout autre équipement dangereux.

### 4. Nos domaines d’intervention

Une grille immersive en six cartes présente :

- plomberie ;
- fuites et anomalies ;
- chauffage ;
- serrurerie ;
- vitrerie ;
- rideaux métalliques.

Sur desktop, les cartes utilisent le survol et le focus clavier. Sur mobile, aucune information essentielle ne doit dépendre d’un `hover` inexistant.

### 5. Prise en charge

Le processus est expliqué en quatre étapes :

1. le client contacte la ligne adaptée ;
2. l’équipe qualifie la situation ;
3. la solution et les conditions sont expliquées ;
4. l’intervention est réalisée puis contrôlée.

Cette section doit rassurer sans promettre de délai universel ni de résultat non vérifié.

### 6. Confiance et expertise

La landing comporte plusieurs niveaux de réassurance :

- avis Google ;
- arguments « Pourquoi choisir Belkhir Dépannage ? » ;
- animations de compteurs ;
- interventions récentes ;
- couverture régionale ;
- FAQ.

Les compteurs, avis et réalisations restent des données sensibles : toute valeur affichée devra être attribuable et approuvée avant la mise en production.

---

## 🎨 Direction artistique

La maquette suit une direction **« urgence maîtrisée + technicien premium »** :

- noir et anthracite pour la maîtrise et le contraste ;
- blanc abricot pour réchauffer les sections claires ;
- orange de sécurité pour les actions, accents et éléments de marque ;
- lueurs orangées très légères dans les sections sombres ;
- grands visuels métier ;
- cartes arrondies et hiérarchie typographique forte ;
- animations brèves, lisibles et rejouables lorsque cela apporte du sens.

La signature de marque colore notamment le **B** de _Belkhir_ et le **D** de _Dépannage_ en orange.

### Médias temporaires

La V1 réutilise provisoirement :

- le logo du site existant ;
- l’image actuelle du hero ;
- les photographies historiques de services et d’activités ;
- certains principes d’animation de l’ancien site.

Les médias sont intégrés localement au projet, sans hotlinking. Leur maintien dans la version officielle dépendra de la validation du client et des droits d’utilisation.

---

## 🛠 Stack technique

| Couche                       | Technologie       | Rôle                                        |
| ---------------------------- | ----------------- | ------------------------------------------- |
| Génération                   | Astro 7           | Production de pages statiques rapides       |
| Langage                      | TypeScript strict | Données et composants typés                 |
| Interactivité                | React             | Îlots ciblés, notamment pour le menu mobile |
| Styles                       | CSS natif         | Tokens, responsive et animations            |
| Images                       | `astro:assets`    | Optimisation et dimensions explicites       |
| Tests                        | Vitest            | Garde-fous fonctionnels et techniques       |
| Vérification                 | Astro Check       | Validation Astro et TypeScript              |
| Hébergement de démonstration | GitHub Pages      | Présentation de la maquette à Fouad         |

### Principes d’architecture

- rendu statique par défaut ;
- JavaScript client limité aux interactions utiles ;
- données commerciales centralisées ;
- numéros d’appel non dupliqués manuellement ;
- composants réutilisables ;
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

### Build de production

```bash
npm run build
npm run preview
```

Les scripts de contrôle complémentaires doivent être exécutés d’après le `package.json` réellement présent dans le dépôt. L’audit prépublication doit confirmer leur disponibilité et leurs résultats avant le premier déploiement.

---

## 🧪 Qualité et recette

La maquette ne doit pas être déclarée publiable sur la seule base de son rendu visuel.

L’audit prépublication doit vérifier au minimum :

- installation reproductible avec `npm ci` ;
- Astro Check, lint, tests et build ;
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

Le rapport doit produire un verdict clair :

| Verdict       | Signification                                             |
| ------------- | --------------------------------------------------------- |
| 🟢 **VERT**   | Démonstration publiable sans anomalie bloquante           |
| 🟠 **ORANGE** | Publication possible uniquement après arbitrage documenté |
| 🔴 **ROUGE**  | Déploiement à interrompre jusqu’à correction              |

---

## 🌐 Déploiement de démonstration

Le dépôt cible est :

```text
belkhir-depannage
```

L’URL GitHub Pages envisagée est :

```text
https://spiritzen.github.io/belkhir-depannage/
```

Cette URL aura pour seul objectif de permettre à Fouad de consulter la maquette sur desktop et mobile.

Avant le déploiement, il faudra notamment confirmer :

- la valeur `site` d’Astro ;
- le chemin de base `/belkhir-depannage` ;
- le fonctionnement des images et liens depuis un sous-répertoire ;
- la sensibilité à la casse sous Linux ;
- le workflow GitHub Actions ;
- l’absence d’indexation ou l’ajout d’un avertissement explicite de démonstration.

> La publication GitHub Pages ne constitue pas le lancement officiel du site Belkhir Dépannage et ne remplace pas le futur domaine professionnel.

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

## 🚧 Limites assumées du MVP

Cette version ne comprend pas encore :

- les pages détaillées de premiers gestes ;
- les pages métiers complètes ;
- les pages locales et départementales ;
- un formulaire réellement connecté ;
- un back-office ;
- une base de données ;
- une prise de rendez-vous ;
- un système de paiement ;
- une mesure fiable des conversions ;
- les mentions légales définitives ;
- la validation éditoriale et juridique finale ;
- le domaine officiel et la configuration SEO de production.

Les boutons non reliés à une destination réelle doivent rester désactivés, être redirigés vers une section existante ou porter un libellé honnête. Aucun faux parcours ne doit être présenté comme fonctionnel.

---

## 📋 Prochaines étapes

### Démonstration

- [ ] Exécuter l’audit prépublication complet
- [ ] Corriger les anomalies bloquantes
- [ ] Vérifier le `.gitignore` et l’absence de secrets
- [ ] Initialiser le dépôt `belkhir-depannage`
- [ ] Configurer GitHub Pages
- [ ] Déployer la maquette
- [ ] Tester l’URL depuis desktop et mobile
- [ ] Présenter la landing à Fouad

### Validation client

- [ ] Recueillir les retours de Fouad
- [ ] Valider le numéro standard
- [ ] Confirmer tous les horaires et niveaux de disponibilité
- [ ] Valider les prestations et exclusions
- [ ] Valider les zones réellement couvertes
- [ ] Vérifier la note, le nombre d’avis et le lien Google
- [ ] Remplacer les contenus temporaires par des preuves authentiques
- [ ] Confirmer les droits sur les médias

### Version officielle

- [ ] Créer les pages d’urgence avec premiers gestes sécurisés
- [ ] Créer les pages métiers prioritaires
- [ ] Construire l’architecture SEO locale sans pages artificielles
- [ ] Finaliser les pages juridiques
- [ ] Réaliser les audits SEO, accessibilité et performance
- [ ] Choisir et configurer le domaine officiel
- [ ] Tester tous les canaux de contact en conditions réelles
- [ ] Obtenir la recette finale de Fouad
- [ ] Publier le site officiel

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
