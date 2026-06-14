# Guide correcteur — SUPCONTENT

> **Depot Git PRIVE.** Ne commitez pas `.env` (GitHub bloque les secrets Google). Utilisez `.env.example`.

## Demarrage en 4 commandes

```powershell
npm install
npm run db:start
npm run db:reset
npm run dev:all
```

Verification : `npm run dev:check`

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:4000/health |
| Studio BDD | http://127.0.0.1:30004 |
| Emails (Mailpit) | http://127.0.0.1:30005 |

Les variables sont dans **`.env.example`** — copiez vers `.env` à la racine :

```powershell
copy .env.example .env
# Editez .env : LASTFM_API_KEY (obligatoire), GOOGLE_* (optionnel, OAuth)
```

## Comptes de demonstration

| Email | Profil | Role |
|-------|--------|------|
| `ldiakite641@gmail.com` | @ldiakite641 | **Administrateur** (`/admin`) |
| `yazzeun91180@gmail.com` | @yazzeun91180 | Utilisateur (tests follow / messages) |
| `ldiakite641+1@gmail.com` | @ldiakite6411 | Utilisateur secondaire |

Les mots de passe ne sont pas stockes en clair (auth Supabase). Pour tester : creer un compte via `/auth/sign-up` ou utiliser un compte existant connu de l'equipe.

Apres `npm run db:reset`, le compte `ldiakite641@gmail.com` est automatiquement promu admin (`supabase/seed.sql`).

## Parcours demo (5 min)

1. Accueil + recherche sans compte
2. Connexion `ldiakite641@gmail.com`
3. Favori / liste / critique sur un album
4. Follow @yazzeun91180 → notification
5. Messages (abonnement mutuel requis entre 2 comptes)
6. `/admin` — moderation, coups de coeur
7. `/settings` — export JSON/CSV

## Mobile emulateur

```powershell
npm run mobile:emulator
npm run mobile:run
```

Connexion par **email/mot de passe** (pas Google en WebView).

## Architecture

```
Web / WebView → Next.js :3000 → API Express :4000 → Last.fm
              ↘ Supabase :30001 (auth + social)
```

## Documentation

- [Documentation technique](docs/DOCUMENTATION_TECHNIQUE.md)
- [Manuel utilisateur](docs/MANUEL_UTILISATEUR.md)
