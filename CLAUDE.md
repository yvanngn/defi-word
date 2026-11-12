# Le Défi — règles de travail

## Garde-fou tokens (prioritaire, vérifié AVANT d'exécuter chaque prompt)
Si un seuil est atteint : **ne rien exécuter**, répondre seulement par l'alerte (2-3 lignes) et attendre. En cas de doute, ne pas alerter.

**1. Historique trop lourd → nouvelle conversation** (un seul seuil suffit) : plus de ~40 échanges ; plus de ~15 lancements de tests ou ~30 lectures de fichiers ; historique résumé/compacté ou détail donné plus tôt introuvable.
Alerte : « ⚠️ Historique lourd : chaque prompt recharge tout. Ouvre une nouvelle conversation et repars du dépôt GitHub. » + résumé de reprise de 5 lignes max (partie en cours, dernières modifs, reste à faire).

**2. Prompt trop gourmand → le découper** (un seul seuil suffit) : plus de 6 demandes indépendantes ; plus de 3 groupes de tests touchées à la fois ; texte collé de plus de ~2 pages, ou demande qui oblige à relire des fichiers entiers / lancer tous les tests sans nécessité.
Alerte : « ⚠️ Prompt coûteux : [raison]. Propose de découper en : 1) … 2) … » (rien d'exécuté).

Exception : si l'utilisateur écrit « force », exécuter quand même.

## Économie et tests
- Réponses courtes ; lire seulement les fichiers utiles (grep, sed -n). Ne jamais éditer `dist/`.
- Tout coder, puis tester une seule fois à la fin : `sh tester.sh <groupe>` (donnees solo epreuves reglages admin enligne mobile ; `mobile` après un changement de CSS). Sortie : `2>&1 | grep -A3 "ÉCHEC\|vérifications"`.
- Ne rejouer que les groupes modifiés ; `sh tester.sh` complet seulement sur demande (GitHub Actions le fait au push). Tests longs : sous-agent léger (`model: "haiku"`) qui ne renvoie que les échecs, si l'outil Agent existe.
- **Pas de tests** quand on ne fait que remplacer du texte, retoucher un dessin ou un son : `python3 build.py` suffit, puis push. Exception : un texte attendu par `tests/scenarios.py` (vérifier avec `grep`).
- Ne rejouer que les groupes modifiés dans ce prompt, jamais les autres « par sécurité ».
- Les attentes de dialogue/animation sont coûteuses : préparer l'état directement plutôt que rejouer chaque étape.
- Ne jamais tester l'absence d'un élément supprimé.
- Pas de capture d'écran sauf nouvel écran ou demande explicite. Zip, exports, skill empaqueté : seulement sur demande.
- Toute fonctionnalité ou correction = un test dans `tests/scenarios.py` (table `GROUPES`).
- Republier : `dist/index.html` sur la page Artifact existante (même `url`), et push sur `main` pour GitHub Pages.
- Le multijoueur passe par `window.claude` (db, user, room) : il n'existe que sur claude.ai ; ailleurs, Supabase (`moteur/enligne.js`, table `defi_docs`, voir README) ; sans réseau, mode solo.

## Interface (skill `interface-jeu`)
- Clic droit : jamais le menu du navigateur dans le jeu (écouteur `contextmenu` sur `#app`, dans `src/js/clavier.js`), sauf dans les champs de saisie. Testé dans le groupe du menu.
