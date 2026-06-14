# SUPCONTENT — Client mobile (Flutter)

Application mobile développée par l'équipe. Elle encapsule l'**application web** SUPCONTENT dans une WebView native (Flutter), ce qui garantit :

- Les mêmes fonctionnalités que le web (auth, bibliothèque, messages, etc.)
- Aucun appel direct à Last.fm depuis le mobile
- Une seule base de code métier (Next.js + Supabase)

## Prérequis

- [Flutter SDK](https://docs.flutter.dev/get-started/install) 3.12+
- Le **serveur web** doit tourner : `npm run dev` à la racine du monorepo (port **3000**)
- Pour les données musicales via l'API dédiée (optionnel si le web suffit) : `npm run api:dev` (port **4000**)

## Configuration de l'URL

L'URL du site web se configure via `--dart-define` :

| Environnement | Commande |
|---------------|----------|
| **Émulateur Android** (PC = localhost) | `flutter run --dart-define=WEB_APP_URL=http://10.0.2.2:3000` |
| **Appareil physique** (même Wi‑Fi) | `flutter run --dart-define=WEB_APP_URL=http://VOTRE_IP:3000` |
| **iOS Simulator** | `flutter run --dart-define=WEB_APP_URL=http://localhost:3000` |

Trouver votre IP Windows : `ipconfig` → adresse IPv4 (ex. `192.168.1.42`).

> **Important :** ne commitez pas d'IP personnelle dans le code. Utilisez toujours `WEB_APP_URL` au lancement.

## Lancement (sans configurer le PATH)

**Méthode la plus simple** — à la racine du projet :

```powershell
# Terminal 1
npm run dev

# Terminal 2
npm run mobile:run
```

Ou depuis `mobile/` :

```powershell
.\run.bat
# telephone reel : .\run.bat http://192.168.1.42:3000
```

**Si `flutter` est dans le PATH** (terminal redemarre) :

```bash
cd mobile
flutter pub get
flutter run --dart-define=WEB_APP_URL=http://10.0.2.2:3000
```

**Chemin direct** (toujours fonctionnel) :

```powershell
C:\Users\ldiak\flutter\bin\flutter.bat run --dart-define=WEB_APP_URL=http://10.0.2.2:3000
```

Build release Android :

```bash
flutter build apk --dart-define=WEB_APP_URL=https://votre-domaine-production.com
```

## Architecture dans le monorepo

```
content-discovery-platform/
├── app/          # Client web (Next.js) — chargé par la WebView
├── server/       # API Last.fm (optionnel, utilisée par le web)
├── supabase/     # Base de données + auth (partagée web/mobile)
└── mobile/       # Ce client Flutter
```

## Dépannage

| Problème | Solution |
|----------|----------|
| Écran blanc / erreur réseau | Vérifiez `WEB_APP_URL`, firewall, `npm run dev` actif |
| Connexion Google échoue | Utilisez l'IP LAN, pas `localhost`, sur appareil physique |
| HTTP bloqué | Android : `usesCleartextTraffic` déjà activé pour le dev local |

## Équipe

Code source mobile intégré depuis le dépôt `supcontent_mobile` (Culture Connect / SUPCONTENT).
