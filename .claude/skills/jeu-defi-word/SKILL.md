---
name: jeu-defi-word
description: Développer et maintenir le jeu « Le Défi » (épreuves, solo et multijoueur, sources dans src/). À utiliser dès que l'utilisateur parle du Défi, d'une épreuve, des réglages, de l'admin, du mode en ligne, des tests ou de republier le jeu.
---

# Jeu « Le Défi »

1. Lire `CLAUDE.md` : il fait foi. Vérifier d'abord son **garde-fou tokens** (alerte au lieu d'exécuter si l'historique ou le prompt est trop lourd).
2. Ne jamais éditer `dist/` : `python3 build.py` le régénère depuis `src/`.
3. Réponses courtes, lecture ciblée (grep, sed -n), jamais tout le projet.
4. Coder toutes les demandes, puis `sh tester.sh <groupe>` une seule fois (groupes : donnees solo epreuves reglages admin enligne mobile), sortie filtrée `2>&1 | grep -A3 "ÉCHEC\|vérifications"`. Texte, dessin ou son seulement : `python3 build.py` suffit.
5. Toute nouveauté = une vérification ajoutée dans `tests/scenarios.py`.
6. Republier `dist/index.html` sur la page Artifact existante (même `url`) et pousser sur `main` pour GitHub Pages.
