---
name: interface-jeu
description: Règles d'interface communes aux jeux point and click d'Yvan (Un Noël au Vietnam, Low Kanta, Day in the Life, Défi…) : clic droit sans menu du navigateur, objets qui lancent un mini-jeu avec n'importe quel verbe. À appliquer dès qu'on touche aux clics, aux fenêtres, aux mini-jeux ou qu'on crée un nouveau jeu.
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
