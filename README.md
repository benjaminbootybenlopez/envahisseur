# ENVAHISSEUR

Mini jeu d'arcade néon qui se joue dans le navigateur. Tu pilotes une soucoupe alien et tu envahis la Terre, pendant que l'armée humaine riposte de plus en plus fort.

Le jeu tient dans un seul fichier, `envahisseur.html`, sans dépendance ni installation.

## Jouer

Télécharge `envahisseur.html` et ouvre-le d'un double-clic. Il fonctionne hors connexion dans un navigateur récent (Chrome, Edge, Safari, Firefox).

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

## Technique

- HTML, CSS et JavaScript dans un seul fichier, rendu sur un `<canvas>` 2D.
- Sons et musique synthétisés en direct avec Web Audio, sans fichier audio.
- Pour tester une vague précise, ajoute `?wave=7` à l'adresse (de 1 à 10, ou 11 pour le boss).

## Origine

Jeu conçu et codé avec Claude Code, comme test de création d'un mini jeu de bout en bout.
