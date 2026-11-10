# Le Défi

Jeu de mots quotidien en 3 minutes : Wordle, Boggle, Sémantix et calcul mental.
Multijoueur (salon, classement) depuis la page claude.ai ; en mode solo ailleurs (GitHub Pages).

## Arborescence
```
src/index.html        squelette (marqueurs /*@CSS*/ et /*@JS*/)
src/css/style.css
src/ordre.txt         ordre de concaténation des scripts
src/js/reglages.js    durée de partie, délai admin
src/js/donnees/       lexique thématique, liste Wordle, dictionnaire (gzip base64), thèmes
src/js/moteur/        outils, génération des énigmes, température, état, connexion, partie partagée
src/js/ecrans/        salon, manche (chrono, écran de fin)
src/js/jeux/          wordle, boggle, semantix, calcul
src/js/clavier.js     clavier global + démarrage
build.py              assemble src/ → dist/index.html (page autonome)
tests/scenarios.py    tests Playwright
```

## Commandes
- `python3 build.py` : génère `dist/index.html` (ne jamais l'éditer à la main).
- `sh tester.sh` : build + tous les tests ; `sh tester.sh solo` pour un groupe (`donnees solo epreuves mobile`).

## Déploiement
Push sur `main` → GitHub Actions : tests, puis publication de `dist/` sur GitHub Pages
(Settings > Pages > Source : **GitHub Actions**) → https://yvanngn.github.io/defi-word/
