/* ================= Données ================= */
const LEXICON = `mer>plage,poisson,vacances: vague maree houle ecume courant / voilier navire barque ferry paquebot / port quai phare digue jetee / marin pirate capitaine matelot corsaire
plage>mer,ete,vacances: sable dune galet rocher crique / parasol serviette maillot bouee transat / coquillage crabe mouette meduse algue / bronzage baignade nageur plongeon surf
poisson>mer,cuisine: requin baleine dauphin orque phoque / saumon thon sardine truite morue / poulpe calamar homard crevette huitre / peche hamecon filet canne appat
ete>plage,vacances,meteo: chaleur canicule secheresse moiteur fournaise / juillet aout solstice estival saison / sorbet granite limonade pasteque melon / ventilateur eventail sieste hamac terrasse
hiver>neige,meteo,vetement: froid gel givre frimas verglas / decembre janvier fevrier hivernal grisaille / manteau echarpe bonnet gant moufle / cheminee radiateur chauffage couette bouillotte
neige>hiver,montagne: flocon poudreuse congere avalanche blizzard / ski luge snowboard raquette patin / bonhomme igloo boule glissade traineau / chalet station telesiege dameuse moniteur
montagne>neige,randonnee: sommet cime pic falaise crete / vallee col gorge glacier moraine / alpiniste grimpeur sherpa guide cordee / chamois marmotte bouquetin aigle vautour
randonnee>montagne,foret,vacances: sentier chemin balise boussole carte / sac gourde baton chaussure tente / marcheur randonneur promeneur scout campeur / bivouac refuge camping campement abri
foret>randonnee,arbre,insecte: bois futaie clairiere bosquet taillis / champignon cepe girolle morille truffe / cerf biche sanglier renard ecureuil / bucheron garde chasseur hache tronconneuse
arbre>foret,jardin: chene hetre sapin bouleau erable / feuille branche tronc racine ecorce / noisette marron chataigne gland pigne / saule peuplier palmier cypres olivier
jardin>arbre,legume,insecte: pelouse gazon haie massif parterre / rateau pelle beche arrosoir tondeuse / rose tulipe jonquille marguerite lilas / jardinier potager serre brouette compost
legume>jardin,cuisine,fruit: carotte navet radis betterave panais / tomate courgette aubergine poivron concombre / salade epinard chou poireau celeri / haricot lentille pois feve oignon
fruit>legume,dessert: pomme poire peche abricot prune / fraise framboise cerise myrtille groseille / banane ananas mangue kiwi papaye / orange citron pamplemousse mandarine clementine
cuisine>legume,restaurant,dessert: casserole poele marmite cocotte fouet / cuisinier chef commis marmiton patissier / recette cuisson friture grillade sauce / four frigo evier cuisiniere hotte
dessert>fruit,boulangerie,cuisine: gateau tarte flan mousse crepe / chocolat cacao praline ganache nougat / caramel sucre miel confiture creme / bonbon sucette guimauve reglisse dragee
boulangerie>dessert,petitdej: pain baguette brioche croissant ficelle / farine levain levure petrin fournil / miette croute mie tartine biscotte / eclair macaron chouquette meringue madeleine
petitdej>boulangerie,boisson: cafe the jus lait tisane / cereale muesli yaourt omelette bacon / beurre marmelade compote pancake gaufre / matin reveil aurore aube matinee / bol tasse theiere cafetiere mug
boisson>petitdej,fete,restaurant: eau soda sirop cola orangeade / vin biere cidre champagne whisky / verre bouteille carafe gobelet paille / bar bistrot cave tonneau brasserie
restaurant>cuisine,boisson: serveur sommelier client convive gerant / menu addition pourboire reservation commande / entree plat aperitif digestif fromage / table nappe couvert assiette fourchette
fete>boisson,musique,jeu: anniversaire bougie cadeau surprise invite / ballon guirlande confetti cotillon serpentin / soiree bal gala reveillon carnaval / noel paques halloween mariage bapteme
musique>fete,instrument,danse: chanson melodie refrain couplet rythme / concert festival scene tournee spectacle / chanteur musicien groupe orchestre chorale / note partition solfege accord gamme
instrument>musique: piano orgue clavier synthe accordeon / guitare violon violoncelle harpe banjo / trompette saxophone flute clarinette trombone / batterie tambour cymbale xylophone triangle
danse>musique,fete: valse tango salsa samba rumba / ballet ballerine danseur choregraphe tutu / disco discotheque boum guinguette techno / pirouette entrechat claquettes hiphop breakdance
cinema>television,theatre: film documentaire comedie thriller western / acteur actrice realisateur scenariste figurant / ecran salle seance projection popcorn / camera tournage studio plateau montage
television>cinema,informatique: serie episode feuilleton sitcom emission / chaine programme publicite telecommande zapping / animateur presentateur journaliste chroniqueur speakerine / journal meteo reportage interview direct
theatre>cinema,livre,cirque: piece acte tirade replique monologue / rideau coulisse loge estrade decor / comedien troupe souffleur spectateur public / tragedie drame farce vaudeville opera
livre>ecole,theatre,conte: roman conte fable poeme nouvelle / page chapitre couverture reliure marquepage / auteur ecrivain editeur libraire lecteur / bibliotheque librairie etagere lecture dictionnaire
ecole>livre,science: eleve classe professeur maitresse directeur / cahier cartable trousse stylo crayon / cours lecon devoir exercice dictee / recreation cantine preau college lycee
science>ecole,espace,sante: physique chimie biologie geologie astronomie / laboratoire microscope eprouvette pipette experience / atome molecule cellule electron neutron / savant chercheur scientifique inventeur genie
espace>science,meteo: planete etoile galaxie comete asteroide / fusee navette satellite sonde capsule / astronaute cosmonaute extraterrestre martien ovni / lune soleil mars jupiter saturne
meteo>espace,hiver,ete: pluie averse bruine crachin ondee / orage eclair tonnerre foudre tempete / nuage brouillard brume ciel arcenciel / vent rafale bourrasque tornade ouragan
ferme>savane,animaux,legume: vache cochon mouton chevre cheval / poule coq canard oie dinde / fermier tracteur grange etable foin / oeuf laine fumier ble moisson
savane>ferme,animaux,vacances: lion tigre leopard guepard panthere / singe gorille chimpanze babouin lemurien / elephant girafe zebre rhinoceros hippopotame / serpent crocodile perroquet toucan cameleon
animaux>ferme,savane: chat chaton minou matou felin / chien chiot toutou caniche labrador / hamster lapin cobaye souris perruche / croquette laisse collier niche litiere
insecte>jardin,foret: abeille guepe frelon bourdon taon / papillon chenille libellule coccinelle sauterelle / fourmi termite cafard puce pou / araignee scorpion moustique mouche limace
sport>corps,sante: football rugby tennis basket handball / natation cyclisme athletisme marathon triathlon / stade terrain gymnase piscine arene / raquette but medaille trophee podium / joueur arbitre entraineur equipe supporter
transport>route,ville,vacances: voiture auto camion moto scooter / train tramway metro bus autocar / avion helicoptere planeur dirigeable montgolfiere / velo trottinette skateboard roller patinette
route>transport,ville: volant pneu moteur frein klaxon / autoroute carrefour giratoire parking peage / conducteur chauffeur pieton cycliste motard / essence garage permis embouteillage radar
ville>route,maison: rue avenue boulevard ruelle place / mairie eglise musee cathedrale monument / trottoir lampadaire egout banc fontaine / habitant citadin passant voisin touriste
maison>ville,meuble,outils: salon chambre grenier couloir veranda / toit mur porte fenetre volet / cle serrure sonnette verrou poignee / escalier palier etage marche balcon
meuble>maison: canape fauteuil chaise tabouret pouf / bureau commode armoire buffet vaisselier / lit matelas oreiller drap couverture / lampe miroir tapis coussin cadre
vetement>hiver: pantalon jean short jupe robe / chemise pull tshirt veste blouson / basket botte sandale chausson escarpin / chapeau casquette ceinture cravate lunettes
corps>sante,sport: tete visage front joue menton / bras main doigt coude poignet / jambe genou pied cheville orteil / coeur poumon estomac foie cerveau
sante>corps,science: medecin docteur infirmier chirurgien dentiste / hopital clinique urgence ambulance pharmacie / maladie grippe rhume fievre toux / medicament pilule vaccin pansement pommade
informatique>television,science,travail: ordinateur tablette smartphone imprimante routeur / logiciel application navigateur systeme fichier / internet web reseau wifi serveur / code bug algorithme pixel octet
argent>travail: euro billet monnaie centime dollar / banque compte credit pret epargne / riche fortune tresor heritage salaire / achat vente prix soldes facture
travail>argent,informatique,outils: emploi metier poste carriere stage / patron collegue employe stagiaire salarie / reunion projet dossier rapport planning / entreprise usine atelier societe startup
vacances>ete,plage,transport,pays: voyage valise passeport bagage visa / hotel auberge gite motel palace / excursion visite croisiere safari circuit / conge weekend pont repos detente
chateau>conte: roi reine prince princesse duc / chevalier armure epee bouclier lance / chateau donjon rempart pontlevis douve / tournoi banquet bouffon trone
conte>chateau,livre: dragon fee sorciere magicien licorne / ogre geant lutin elfe gnome / potion sortilege grimoire chaudron balai / citrouille pantoufle carrosse marraine nain
couleur>art: rouge rose bordeaux carmin vermillon / bleu azur marine turquoise cyan / vert emeraude kaki jade menthe / jaune dore ocre moutarde safran
art>couleur,ville: peintre sculpteur artiste dessinateur graveur / pinceau palette chevalet aquarelle gouache / sculpture statue fresque mosaique portrait / galerie exposition vernissage oeuvre chefdoeuvre
emotion>fete: joie bonheur gaiete rire sourire / tristesse chagrin larme peine melancolie / colere rage fureur haine rancune / peur angoisse frayeur panique terreur
jeu>fete,cirque: jouet poupee peluche toupie yoyo / puzzle domino echecs belote poker / console manette joystick arcade jeuvideo / de pion plateau partie score
cirque>fete,jeu,theatre: clown acrobate jongleur dompteur trapeziste / chapiteau gradin roulotte manege fanfare / trapeze monocycle cerceau trampoline echasse
outils>maison,travail: marteau clou vis tournevis perceuse / scie rabot lime ciseau burin / metre niveau equerre compas etau / bricoleur menuisier plombier electricien macon
calendrier>ete,hiver: lundi mardi mercredi jeudi vendredi / avril mai juin septembre octobre / heure minute seconde journee semaine / hier demain veille lendemain avenir
pays>vacances: france espagne italie allemagne portugal / japon chine inde coree vietnam / bresil mexique canada argentine perou / afrique europe asie amerique oceanie`;
