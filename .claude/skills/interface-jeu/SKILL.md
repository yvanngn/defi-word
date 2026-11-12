---
name: interface-jeu
description: Règles d’interface et de style communes aux jeux point and click d’Yvan (Un Noël au Vietnam, Low Kanta, Day in the Life, Défi…) : clic droit sans menu du navigateur, mini-jeux lancés par tous les verbes, curseur animé, style graphique laqué et doré, personnages de profil quand ils marchent. À appliquer dès qu’on touche aux clics, au curseur, aux fenêtres, aux mini-jeux, au style, aux personnages ou qu’on crée un nouveau jeu.
---

# Règles d'interface des jeux

## Clic droit : jamais le menu du navigateur
- Le clic droit sert au jeu (examiner un objet). Le menu du navigateur ne doit **jamais** s'afficher, nulle part : scène, inventaire, fenêtres de mini-jeux, choix de dialogue, boutons, panneaux.
- Un seul écouteur sur le conteneur du jeu, qui couvre aussi les fenêtres ajoutées plus tard :
  ```js
  // pas de menu du navigateur au clic droit, nulle part dans le jeu, sauf dans les champs de saisie
  document.getElementById('game').addEventListener('contextmenu',e=>{ if(!e.target.closest('input,textarea')) e.preventDefault(); });
  ```
- Garder le menu dans les champs de saisie (mot de passe, pseudo) pour pouvoir coller.
- Test : envoyer un `contextmenu` (bubbles, cancelable) sur un bouton d'une fenêtre ouverte, sur le panneau du bas et sur l'écran par-dessus la scène ; vérifier `defaultPrevented`.

## Objet qui lance un mini-jeu : tous les verbes le lancent
- Le joueur ne sait pas s'il doit examiner, utiliser ou ouvrir : examiner, ouvrir, prendre, utiliser et parler lancent tous le jeu. « Donner » et « utiliser X avec » gardent leur réaction propre.
- Dans Un Noël au Vietnam : propriété `jeu:()=>…` sur l'objet, fonction de lancement nommée `playXxx()` ou `xxxJouer()` ; le groupe de tests `jeux` parcourt toutes les salles et échoue si un objet lance un jeu par un seul verbe.

## Curseur (repris de Day in the Life)
- Sur ordinateur (`@media (hover:hover) and (pointer:fine)`), le curseur système est caché sur la scène et remplacé par un élément `#cur` qui suit la souris : petite croix blanche cernée de noir.
- Sur un objet cliquable : quatre coins jaunes apparaissent autour de la croix et le tout **pulse** (animation `scale(1)→scale(1.4)`, ~0,55 s, aller-retour).
- Sur une **sortie** (porte, chemin, accès) sans verbe ni objet choisi : coins et croix **verts**.
- Objet de l'inventaire sélectionné (Utiliser/Donner X avec…) : son **icône** s'affiche en petit à droite sous la croix.
- Sur tactile (`hover:none` ou `pointer:coarse`) : pas de curseur personnalisé. Le curseur disparaît quand la souris quitte la scène.
- Mise à jour au `mousemove` de la scène : `updCursor(e, objetSurvolé)` bascule les classes `hot` / `exit` et l'icône.

## Style graphique commun (esprit Low Kanta)
- Palette laquée et dorée : fond brun-noir, panneaux en dégradé `#2b1d12 → #1a120c`, bordures dorées `#f0b23c`, verbe actif jaune `#ffd84a` sur texte brun, phrase d'action en vert jade.
- Boutons en relief : ombre intérieure en bas (`inset 0 -4px 0 rgba(0,0,0,.35)`), reflet clair en haut, texte ombré ; ils s'enfoncent de 2 px au clic.
- Inventaire : cases vides en pointillés sombres, cases pleines en dégradé brun avec bordure dorée.
- Logo du menu : police `Rubik Dirt`, dégradé jaune → orange → rouge, contour noir, ombre portée et halo de feu, légèrement penché (−3°), avec un slogan doré espacé.
- Bulles de dialogue : fond sombre semi-transparent, coins arrondis, texte cerné de noir.
- Scène : **ombre portée** elliptique sous chaque personnage ; calque d'**ambiance** dessiné par-dessus (lumière chaude en haut, assombrissement violet en bas, vignettage sur les bords, fines lignes de balayage) mis en cache dans un canvas.
- Textes de dialogue écrits lettre à lettre ; un clic termine le texte d'un coup, un second passe à la suite.

## Personnages : de profil quand ils bougent
- À l'arrêt, le personnage est dessiné **de face**. Dès qu'il marche, il passe **de profil**, tourné dans le sens de la marche (miroir horizontal `scale(-1,1)` vers la gauche), avec une animation de marche (jambes qui alternent sur 4 étapes, bras qui balance).
- Dans le moteur du Vietnam : `drawFront` à l'arrêt, `drawSide(spec, frame, opt)` en marche, `a.dir` pour le sens. Tout nouveau personnage jouable ou PNJ qui se déplace a une vue de profil.
- Test : faire marcher le héros vers la gauche puis la droite et vérifier que la vue de profil est utilisée et le sens retourné.
