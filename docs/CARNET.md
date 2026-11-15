# Carnet — Le Défi

Mémoire du projet (skill `carnet-de-projet`). À lire avant chaque séance, à compléter à la fin. On n'efface rien.
Légende : ✅ fait · 🔨 en cours · ⏳ à faire · 💡 idée de Claude (à valider) · ❌ abandonné

Règles techniques : `CLAUDE.md`. Jeu en solo : https://yvanngn.github.io/defi-word/ ; multijoueur depuis la page claude.ai.

## 1. Le jeu (résumé)
Un défi de mots quotidien en 3 minutes (`TOTAL = 180` s), à jouer seul ou à plusieurs dans un salon avec un classement. Pas d'histoire, de personnages ni d'inventaire : ce n'est pas un point and click.

## 2. Épreuves
| Épreuve | Fichier | État |
|---|---|---|
| Wordle | `jeux/wordle.js` | ✅ |
| Boggle | `jeux/boggle.js` | ✅ |
| Sémantix (avec température) | `jeux/semantix.js`, `moteur/temperature.js` | ✅ |
| Calcul mental | `jeux/calcul.js` | ✅ |
| Pendu | `jeux/pendu.js` | ✅ (codé et compté dans les énigmes restantes) |

## 3. Ce qui existe
- Salon multijoueur et classement : `window.claude` sur claude.ai, sinon Supabase (table `defi_docs`), sinon mode solo.
- Mode admin : clôture automatique de la partie après `GRACE = 15` s.
- Énigmes déjà jouées mémorisées (`meta/used`) pour ne pas resservir les mêmes ; le salon affiche combien il en reste.
- Thèmes, lexique thématique et dictionnaire compressé.

## 4. Contradictions et points à vérifier
- Le **README** annonce « Wordle, Boggle, Sémantix et calcul mental » mais le jeu contient aussi le **Pendu**.
- Le **nom du dépôt** est `defi-word` alors que le jeu s'appelle « Le Défi » (et « Défi Jour » dans le skill `optimisation-jeux`).

## 5. Idées de Claude (💡 à valider)
- (aucune en attente)

## 6. Abandonné
- (rien de noté pour l'instant)
