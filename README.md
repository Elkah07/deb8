# Deb8 — v21 modulaire

Cette version découpe vraiment le projet en plusieurs fichiers.

## Structure

```txt
deb8-v21-modulaire/
├── index.html
├── css/
│   ├── base.css
│   ├── light-mode.css
│   ├── layout.css
│   ├── screens.css
│   ├── shop-settings.css
│   ├── game.css
│   └── podium.css
├── js/
│   ├── 01-imposteur.js
│   ├── 02-core-state-navigation.js
│   ├── 03-shop-legal.js
│   ├── 04-game-debate-duel-tf.js
│   ├── 05-events-multiplayer-imposteur.js
│   ├── 06-multiplayer-debate-duel-tf.js
│   ├── 07-vocal-proximity-teams.js
│   └── 08-team-game-final.js
├── data/
│   └── questions.example.json
└── assets/
    └── images/
```

## Important

Les fichiers JS sont chargés dans l'ordre dans `index.html`.
Ne change pas l'ordre des `<script>` pour l'instant.

## Étape suivante recommandée

Sortir les questions du JS et les mettre dans `data/questions.json`.
