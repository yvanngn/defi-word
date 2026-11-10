# Le Défi — règles de travail
- Réponses courtes ; lire seulement les fichiers utiles (grep, sed -n). Ne jamais éditer `dist/`.
- Tout coder, puis tester une seule fois à la fin : `sh tester.sh <groupe>` (donnees solo epreuves reglages admin enligne mobile ; `mobile` après un changement de CSS). Sortie : `2>&1 | grep -A3 "ÉCHEC\|vérifications"`.
- Toute fonctionnalité ou correction = un test dans `tests/scenarios.py` (table `GROUPES`).
- Republier : `dist/index.html` sur la page Artifact existante (même `url`), et push sur `main` pour GitHub Pages.
- Le multijoueur passe par `window.claude` (db, user, room) : il n'existe que sur claude.ai ; ailleurs, Supabase (`moteur/enligne.js`, table `defi_docs`, voir README) ; sans réseau, mode solo.
