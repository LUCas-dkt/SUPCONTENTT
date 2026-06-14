# Guide correcteur — SUPCONTENT

Projet fin d'année Culture Connect.

**Depot Git :** https://github.com/LUCas-dkt/SUPCONTENTT (prive jusqu'a la date limite Moodle)

**Archive zip :** lancer `npm run package:rendu` → fichier `SUPCONTENT-rendu.zip`

---

## Lancer le projet

Prerequis : Node.js 20+, Docker Desktop (allume), Git.

```powershell
git clone https://github.com/LUCas-dkt/SUPCONTENTT.git
cd SUPCONTENTT
npm install
copy .env.example .env
```

Mettre votre cle Last.fm dans `.env` (`LASTFM_API_KEY`). Compte gratuit sur https://www.last.fm/api/account/create

```powershell
npm run db:start
npm run db:reset
npm run dev:all
```

Controle rapide : `npm run dev:check`

- Site : http://localhost:3000
- API : http://localhost:4000/health
- BDD (Studio) : http://127.0.0.1:30004
- Mails test : http://127.0.0.1:30005

Pas de `.env` dans le depot : copier `.env.example` et remplir la cle Last.fm (on peut vous l'envoyer en prive).

---

## Comptes test

| Email | Role |
|-------|------|
| ldiakite641@gmail.com | Admin (`/admin`) |
| yazzeun91180@gmail.com | Utilisateur |
| ldiakite641+1@gmail.com | Utilisateur |

Mot de passe : compte deja cree par l'equipe ou inscription via `/auth/sign-up`. Apres `db:reset`, le seed promote ldiakite641@gmail.com en admin.

---

## Demo rapide

1. Accueil + recherche (sans connexion)
2. Se connecter
3. Ajouter un favori, une liste ou une critique sur un album
4. Suivre un autre user → notification
5. Messages (il faut etre abonnes mutuellement)
6. `/admin` pour la modération
7. `/settings` pour exporter ses donnees

Mobile (optionnel) : `npm run mobile:run` avec l'emulateur Android. Connexion email/mot de passe de preference.

---

## Docs

- Technique : `docs/DOCUMENTATION_TECHNIQUE.md`
- Utilisateur : `docs/MANUEL_UTILISATEUR.md`

Architecture : Next.js (3000) → API Express (4000) → Last.fm, et Supabase local (30001) pour auth + donnees sociales.
