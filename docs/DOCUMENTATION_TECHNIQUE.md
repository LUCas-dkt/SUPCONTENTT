# Documentation technique — SUPCONTENT

## 1. Choix technologiques

| Composant | Choix | Justification |
|-----------|-------|---------------|
| Média | **Last.fm** | API publique gratuite, métadonnées riches (artistes, albums, morceaux, images) |
| API serveur | **Express (Node.js)** | Léger, REST, cache en mémoire, déployable en Docker |
| Client web | **Next.js 16** | SSR, Server Actions, UX fluide pour critiques longues |
| Client mobile | **Flutter** (`mobile/`) — WebView vers l'app Next.js | Réutilise 100 % du web ; pas d'appel direct Last.fm |
| Base de données | **PostgreSQL (Supabase)** | SQL, RLS, auth intégrée, temps réel messagerie |
| Auth | **Supabase Auth** | Email/mot de passe + Google OAuth2 |

## 2. Prérequis et clé API Last.fm

1. Créer un compte sur [last.fm/join](https://www.last.fm/join)
2. Aller sur [last.fm/api/account/create](https://www.last.fm/api/account/create)
3. Copier les variables dans `.env` et `.env.local` :

```
LASTFM_API_KEY=votre_cle
SUPCONTENT_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:30001
NEXT_PUBLIC_SUPABASE_ANON_KEY=cle_depuis_npm_run_db_status
```

**Rendu correcteur** : le fichier `.env` peut etre versionne **uniquement si le depot Git reste prive** (consigne enseignant). Ne jamais mettre de secrets en dur dans le code source.

## 3. Installation

```bash
git clone <url-depot-prive>
cd content-discovery-platform
npm install
cp .env.example .env.local
npm run db:start
npm run db:reset
npm run dev:all
```

Ou deux terminaux : `npm run api:dev` puis `npm run dev`.

Mailpit (emails locaux) : http://127.0.0.1:30005  
Studio Supabase : http://127.0.0.1:30004

## 4. Déploiement

### Docker Compose

```bash
docker compose up --build -d
```

| Service | Port | Description |
|---------|------|-------------|
| web | 3000 | Application Next.js |
| api | 4000 | API REST + proxy Last.fm |
| database | 5432 | PostgreSQL |

Variables requises : voir `.env.example`.

### Production

- Héberger l'API et le web sur un PaaS (Railway, Render, Vercel + API séparée)
- Utiliser Supabase Cloud pour auth et BDD
- Configurer les URIs OAuth Google pour l'environnement de production

## 5. Schéma base de données

```mermaid
erDiagram
  profiles ||--o{ library_items : possede
  profiles ||--o{ reviews : ecrit
  profiles ||--o{ lists : cree
  profiles ||--o{ follows : suit
  reviews ||--o{ review_likes : recoit
  reviews ||--o{ review_comments : a
  profiles ||--o{ notifications : recoit
  profiles ||--o{ activities : genere
  lists ||--o{ list_items : contient
  conversations ||--o{ messages : contient
```

Tables principales : `profiles`, `library_items` (statuts), `reviews`, `review_likes`, `review_comments`, `lists`, `follows`, `activities`, `notifications`, `reports`, `media_cache`, messagerie (`conversations`, `messages`).

Migrations : `supabase/migrations/`.

## 6. Cas d'utilisation (extrait)

```mermaid
graph LR
  Visiteur -->|consulter| Web
  Utilisateur -->|noter/critiquer| Web
  Utilisateur -->|consulter rapide| Mobile
  Web --> API
  Mobile --> API
  API --> LastFM
  Web --> Supabase
  API --> Supabase
```

## 7. Séquence — recherche d'un album

```mermaid
sequenceDiagram
  participant N as Next.js
  participant A as API SUPCONTENT
  participant L as Last.fm
  participant Cache as Cache API

  C->>N: GET /api/lastfm/search?q=...
  N->>A: GET /api/lastfm/search (proxy)
  A->>Cache: lookup
  alt cache miss
    A->>L: artist.search / album.search
    L-->>A: JSON métadonnées
    A->>Cache: store TTL 1h
  end
  A-->>N: artistes, albums, morceaux
  N-->>C: JSON normalise
```

## 8. Sécurité

- Secrets uniquement via variables d'environnement
- RLS Supabase sur toutes les tables utilisateur
- Messagerie : abonnement mutuel requis (RPC `get_or_create_direct_conversation`)
- Modération : rôle `is_admin` sur `profiles`

## 9. Structure du dépôt

```
├── app/              # Next.js (client web)
├── server/           # API Express
├── mobile/           # Client Flutter (WebView)
├── supabase/         # Migrations SQL
├── docs/             # Documentation
├── docker-compose.yml
└── Dockerfile
```
