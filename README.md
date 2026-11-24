# PopArena

Jeux de soirée sur la pop culture, en français, pensés pour le téléphone.
Premier jeu : **l’Imposteur** (mode « un seul téléphone », qui marche hors ligne).

## Lancer le projet

Il faut [Node.js](https://nodejs.org) version 20.19 ou plus récente (prends la version LTS).

```bash
npm install        # une seule fois (télécharge environ 100 Mo de dépendances)
npm run dev        # lance le site sur http://localhost:5173
npm test           # lance les tests de la logique du jeu et des listes de mots
npm run build      # fabrique la version finale dans dist/
npm run preview    # sert la version finale (pour tester le hors ligne)
```

### Tester sur ton téléphone (même Wi-Fi)

```bash
npm run dev -- --host
```

Vite affiche deux adresses. Ouvre celle marquée **Network** (par exemple `http://192.168.1.23:5173`)
dans le navigateur du téléphone, connecté au même Wi-Fi que l’ordinateur.

- Sur Windows, si la page ne s’ouvre pas, autorise Node.js dans le pare-feu (réseaux privés).
- Le partage de connexion du téléphone vers l’ordinateur marche aussi : c’est alors le même réseau.
- En `http://` sur le réseau local, le navigateur n’active pas le mode hors ligne ni l’installation
  (il exige `https`). Pour tester ça, il faut la version en ligne (GitHub Pages, voir plus bas).

## Architecture

```
data/imposteur/          anime.json, vie-reelle.json : les paires de mots (modifiables à la main)
src/
├─ main.tsx              point d'entrée + enregistrement du service worker (hors ligne)
├─ index.css             thème : couleurs, animations
├─ app/                  la coquille de l'app
│  ├─ App.tsx            choisit l'écran selon l'URL (#/ ou #/jeu/<id>)
│  ├─ routeur.ts         mini routeur basé sur le « # » de l'URL
│  ├─ Hub.tsx            page d'accueil : les cartes des jeux
│  └─ installation.ts    bouton « Installer l'app »
├─ shared/               ce qui sert à tous les jeux
│  ├─ ui.tsx             boutons, écrans, dialogues, interrupteurs…
│  ├─ retours.ts         sons (générés, sans fichier audio) et vibrations
│  ├─ preferences.ts     réglages son / vibration
│  └─ stockage.ts        sauvegarde sur le téléphone (localStorage)
└─ games/
   ├─ registry.ts        LA liste des jeux affichés dans le hub
   └─ imposteur/
      ├─ config.ts       barème de points, limites, répartition conseillée
      ├─ logic/          ⚠️ logique pure, sans React (réutilisée par le serveur en phase 2)
      │  ├─ types.ts     types + machine à états (phases)
      │  ├─ partie.ts    création d'une partie + reducer (état, action) → nouvel état
      │  ├─ paires.ts    tirage des paires sans répétition
      │  ├─ hasard.ts    générateur aléatoire à graine (reducer pur, tests reproductibles)
      │  └─ *.test.ts    tests Vitest
      ├─ mots.ts         charge les fichiers JSON
      ├─ session.ts      ce qui dure entre les manches (scores, paires jouées)
      ├─ index.tsx       relie l'interface au reducer
      └─ ui/             un fichier par écran (Distribution, Indices, Vote…)
```

**L’idée clé** : l’interface n’a pas le droit de modifier une partie elle-même. Elle envoie une
action (`{ type: 'VOTER', votantId, cibleId }`) et le reducer renvoie le nouvel état. Toutes les
règles (qui peut voter, égalités, victoire, Mr. White) vivent dans `logic/`, testées sans navigateur.
En phase 2, le serveur importera exactement ces fichiers.

### La machine à états d’une manche

```
distribution → indices → discussion → vote → resultat-vote
resultat-vote : égalité → revote entre ex æquo → encore égalité → personne ne sort → indices
resultat-vote : éliminé → revelation → (Mr. White ? dernière chance) → fin ou tour suivant
```

## Modifier les mots

Chaque paire dans `data/imposteur/*.json` a cette forme :

```json
{
  "id": "an-f-001",
  "motA": "Titans",
  "motB": "Démons",
  "categorie": "Créatures",
  "difficulte": "facile",
  "lien": "Ce que les deux mots ont en commun.",
  "piege": "Ce qui les distingue et peut trahir l'imposteur."
}
```

- `difficulte` vaut `facile`, `moyen` ou `difficile`.
- `id` doit être unique (convention : `an-f-…`, `an-m-…`, `an-d-…` pour l’Anime, `vr-…` pour la Vie réelle).
- Après une modification, lance `npm test` : un test vérifie chaque paire (champs vides, doublons,
  mots identiques, un mot qui contient l’autre…) et te dit laquelle corriger.

## Ajouter un jeu

1. Crée `src/games/<id>/index.tsx` avec un composant exporté par défaut.
2. Ajoute une entrée dans `src/games/registry.ts` avec `statut: 'disponible'`.

Le hub l’affiche tout seul, et son code n’est téléchargé que quand on ouvre le jeu.

## Mettre en ligne gratuitement (GitHub Pages)

1. Pousse le projet dans un dépôt GitHub.
2. Dans le dépôt : **Settings > Pages > Source : GitHub Actions**.
3. À chaque push sur `main`, le fichier `.github/workflows/deploy.yml` lance les tests, construit
   le site et le publie sur `https://<ton-pseudo>.github.io/<nom-du-depot>/`.

Aucune carte bancaire n’est demandée. Une fois ouvert une première fois en ligne, le site marche
hors ligne et peut s’installer sur l’écran d’accueil du téléphone.
