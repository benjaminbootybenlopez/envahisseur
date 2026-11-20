# ENVAHISSEUR

Mini jeu d'arcade néon qui se joue dans le navigateur. Tu pilotes une soucoupe alien et tu envahis la Terre, pendant que l'armée humaine riposte de plus en plus fort.

HTML, CSS et JavaScript natifs, sans dépendance ni étape de build.

## Jouer

Le jeu est un site statique prévu pour GitHub Pages. Il utilise des modules JavaScript (`import`/`export`), que les navigateurs refusent de charger depuis un fichier ouvert d'un double-clic : il faut le servir en HTTP.

En local, depuis la racine du dépôt :

```bash
python3 -m http.server 8000
```

puis ouvre http://localhost:8000 dans un navigateur récent (Chrome, Edge, Safari, Firefox).

Il faut un ordinateur avec un clavier et un trackpad ou une souris. Le jeu ne se joue pas sur téléphone.

## Contrôles

| Action | Contrôle |
|---|---|
| Bouger | Glisser sur le trackpad (ou bouger la souris). La soucoupe suit le geste et s'arrête avec lui. |
| Viser | Automatique, sur la cible la plus proche |
| Tirer | Espace (maintenir) |
| Dash | Z |
| Rayon tracteur | X (maintenir) |
| Pause | Échap |
| Couper le son | M |

Le dash et le rayon sont liés à la position des touches, pas à la lettre : ce sont les deux premières touches de la rangée du bas. Sur un clavier AZERTY, cela donne W et X ; sur un QWERTZ, Y et X. Le jeu affiche la lettre qui correspond à ton clavier.

Pendant la partie, le pointeur est capturé par le jeu. Échap le libère et met en pause.

## Déroulement d'une partie

- **10 vagues, puis un boss** : le Bastion, en trois phases. Une partie complète dure environ 8 minutes.
- **Une mutation après chaque vague** : tu en choisis une parmi trois, donc chaque partie est différente.
- **Deux difficultés** : « Détendue » (5 points de coque, tirs ennemis plus lents) et « Exigeante » (3 points de coque).
- **Record** sauvegardé dans le navigateur, un par difficulté.

## Mécaniques

- **Dash** : traverse et détruit les ennemis, efface les tirs sur son passage, et rend invincible le temps du dash. Chaque élimination le recharge plus vite.
- **Rayon tracteur** : débloqué à la vague 2. Il aspire les fantassins ; six humains aspirés réparent un point de coque.
- **Combo** : enchaîner les éliminations fait monter un multiplicateur de score, jusqu'à ×8. Se faire toucher le remet à zéro.

## Armée humaine

| Unité | Comportement |
|---|---|
| Fantassin | Avance et tire. Peut être aspiré par le rayon. |
| Tank | Lent et résistant, tire un obus après un bref signal lumineux. |
| Hélicoptère | Tourne autour de la soucoupe et tire en rafales. |
| Chasseur | Traverse l'écran sur une ligne annoncée à l'avance, en semant des tirs. |
| Batterie | S'installe au bord de l'arène et lance des missiles à tête chercheuse. |
| Le Bastion | Boss final : spirales, éventails, anneaux, missiles, renforts et rayon laser. |

## Mutations

Canons surcadencés, Plasma concentré, Canon jumelé, Tirs perforants, Bombes à plasma, Saut quantique, Réacteur de phase, Onde de choc, Coque renforcée, Nanoréparation, Rayon élargi, Assimilation, Drone orbital, Surcharge, Bouclier, Tirs guidés.

## Architecture

Chaque fichier a une seule responsabilité, décrite dans son commentaire d'en-tête.

```
index.html            structure des écrans, aucune logique ni style en ligne
css/
  base.css            variables de thème, remise à zéro, canvas
  screens.css         écrans superposés et leur mise en page
  components.css      cartes, boutons, aide des contrôles, statistiques
js/
  main.js             point d'entrée : branche les entrées et l'interface, boucle de jeu
  config.js           constantes : arène, couleurs, difficultés, vagues, réglages
  state.js            état mutable partagé (partie, joueur, entités, commandes)
  storage.js          meilleurs scores (localStorage)
  utils/              fonctions pures : maths, mise en forme
  audio/              moteur Web Audio, effets sonores, musique générative
  game/               logique de jeu, sans DOM : joueur, ennemis, boss, tirs, combat, vagues…
  render/             dessin sur le canvas : décor, entités, HUD, composition de l'image
  input/              clavier, trackpad, disposition du clavier
  ui/                 écrans HTML : menu, mutations, pause, fin
```

Les dépendances vont dans un seul sens, sans cycle :

- `game/` et `audio/` ne touchent jamais au DOM et ne connaissent ni l'interface ni les entrées.
- `game/update.js` signale la fin d'une vague ou de la partie par une valeur de retour ; c'est `main.js` qui ouvre l'écran correspondant.
- `input/` reçoit ses réactions (pause, son, choix de mutation) de `main.js`, au lieu d'importer l'interface.

## Développement

- Sons et musique synthétisés en direct avec Web Audio, sans fichier audio.
- `?wave=7` démarre directement à la vague 7 (de 1 à 10, ou 11 pour le boss).
- `?debug` expose l'état du jeu dans la console sous `window.__game`.
- Le fichier `.nojekyll` indique à GitHub Pages de servir les fichiers tels quels.

## Origine

Jeu conçu et codé avec Claude Code, comme test de création d'un mini jeu de bout en bout.
