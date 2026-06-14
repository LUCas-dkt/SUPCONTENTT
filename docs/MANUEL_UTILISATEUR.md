# Manuel utilisateur — SUPCONTENT

SUPCONTENT sert a decouvrir de la musique (via Last.fm), noter des albums, suivre d'autres membres et discuter.

## Demarrer

Ouvrez le site (en local : http://localhost:3000). Sans compte vous pouvez deja parcourir l'accueil, les tendances, la recherche et les fiches artistes/albums.

Pour sauvegarder des favoris, ecrire des critiques ou envoyer des messages : creez un compte (**S'inscrire**). En dev local, le mail de confirmation arrive dans Mailpit (http://127.0.0.1:30005).

## Compte et profil

Inscription par email/mot de passe ou Google. Ensuite, menu profil → **Parametres** pour changer le nom affiche, la bio, le theme (clair/sombre) et les notifications.

## Musique

Sur une fiche album ou morceau :
- statuts **A ecouter**, **En cours**, **Termine**, **Abandonne** (menu Bibliotheque)
- **Favoris** et **Collections**
- **Listes** (publiques ou privees)
- **Critique** : note sur 10 + texte

Tout est retrouvable dans **Bibliotheque**, **Favoris**, **Collections**, **Listes**.

## Communaute

- **Decouvrir** : chercher des utilisateurs
- **Suivre** quelqu'un depuis son profil
- Fil d'activite sur l'accueil quand vous etes connecte
- **Messages** : uniquement si vous vous suivez mutuellement
- **Notifications** (icone cloche)

La recherche du header permet aussi de trouver des **utilisateurs** et des **listes publiques**.

## Admin

Page `/admin` pour les comptes administrateur : signalements, coups de coeur sur les critiques.

## Mobile

L'app Flutter ouvre le meme site en WebView. Meme compte, memes fonctions. Sur emulateur, connexion email/mot de passe conseillee.

## Export

**Parametres** → export JSON ou CSV de vos donnees.

Donnees musicales : Last.fm. Probleme technique : contacter l'equipe projet.
