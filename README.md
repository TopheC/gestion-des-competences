# Gestion Des Compétences

**Version 0.2.0** — Application SPA de gestion et suivi des compétences par membre.

Matrice de compétences interactive, historique des évolutions, tableau de bord, gestion des membres et invitations. Destinée aux équipes techniques.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 19, Vite 8, JavaScript (ESM modules) |
| UI | Tailwind CSS v4, shadcn/ui, Lucide icons |
| Graphiques | Recharts, D3-force |
| Backend | Supabase (PostgreSQL, Auth, Realtime) |
| Routing | React Router v7 |
| Tests | Vitest |
| CI/CD | Docker multi-stage (nginx:alpine) |

## Fonctionnalités

- **Matrice des compétences** — 7 vues interconnectées : tableau, heatmap, radar, treemap, scatter, barres, graphe de relations
- **Édition inline** — les admins modifient les niveaux directement dans les vues tableau et heatmap
- **Filtres** — par catégorie, membre, niveau minimum, avec navigation entre vues
- **Export CSV** — matrice et liste des membres
- **Tableau de bord** — statistiques (membres, compétences, catégories), top 5 compétences, dernières évolutions
- **Gestion des membres** — CRUD, rôles (admin / member), invitation par email
- **Gestion des catégories et compétences** — CRUD réservé aux admins
- **Authentification** — inscription, connexion, acceptation d'invitation par token
- **Historique** — paginé, filtrable par membre et compétence, mise à jour en temps réel
- **Mode sombre** — via `next-themes`, stratégie `class`

## Architecture

```
src/
├── App.jsx                  ← Routage React Router v7
├── main.jsx                 ← Point d'entrée
├── data/                    ← Modules de données (JS pur, testables sans React)
│   ├── skillLevels.js       ← Module skillLevels (profondeur : interface étroite)
│   └── adapters/
│       ├── supabaseSkillLevels.js    ← Adaptateur production (Supabase)
│       └── memorySkillLevels.js      ← Adaptateur test (mémoire)
├── hooks/                   ← Hooks React fins (délèguent aux modules de données)
│   ├── useSkillLevels.js
│   ├── useHistory.js
│   ├── useMembers.js
│   ├── useSkills.js
│   └── useCategories.js
├── components/
│   ├── ui/                  ← Composants shadcn
│   ├── layout/              ← Layout, ProtectedRoute, AdminRoute, ErrorBoundary
│   └── features/
│       ├── matrix/          ← 7 vues + filtres + formulaire membre
│       ├── skills/          ← CategoryCard
│       └── members/         ← InviteUserModal
├── pages/                   ← Pages de l'application
│   ├── Dashboard.jsx
│   ├── SkillMatrix.jsx
│   ├── History.jsx
│   ├── Members.jsx
│   ├── Skills.jsx
│   ├── Profile.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   └── AcceptInvite.jsx
├── context/
│   └── AuthContext.jsx      ← Auth (Supabase Auth)
└── lib/
    ├── supabase.js          ← Client Supabase
    └── utils.js             ← cn() (shadcn)
```

### Data Module Pattern

La logique métier vit dans des modules **JS purs** (`src/data/`) testables via leur interface. Chaque module expose un adaptateur injecté (Supabase en production, mémoire en test) — deux adaptateurs justifient la couture (seam). Les hooks React sont des couches fines qui branchent le module au cycle de vie React.

```
Module JS pur ← seam → Adaptateur Supabase (production)
                      → Adaptateur mémoire (tests)
              ↑
         Hook React (état + re-rendu)
```

Actuellement déployé : `skillLevels` (niveaux + historique). Domaines suivants : `categories`, `skills`, `members`, `invitations`.

### Temps réel

Les souscriptions Supabase Realtime sont gérées dans le module de données via `subscribe(callback) → unsubscribe()`. Le hook React enregistre le callback et le nettoie au démontage. Pas de mise à jour incrémentale — le module re-fetch l'ensemble des données sur changement.

## Premiers pas

### Prérequis

- Node.js 20+
- Un projet Supabase (local avec `supabase start` ou cloud)

### Installation

```bash
git clone <url>
cd gestiondescompetences

# Configuration
cp .env.example .env
# Éditer .env avec les valeurs de votre projet Supabase

npm install
npm run dev
```

### Supabase local

```bash
# Appliquer les migrations
node scripts/apply-migrations.mjs

# (Optionnel) Données de démonstration
node scripts/seed.mjs
```

### Commandes

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement Vite (HMR) |
| `npm run build` | Build production → `dist/` |
| `npm run preview` | Prévisualiser le build localement |
| `npm run lint` | ESLint (flat config) |
| `npm test` | Vitest (run) |
| `npm run test:watch` | Vitest (watch) |

## Supabase

### Schéma

7 tables : `categories`, `skills`, `members`, `level_descriptions`, `skill_levels`, `skill_history`, `invitations`.

- `skill_levels(member_id, skill_id, level)` — niveau unique par couple (membre, compétence)
- `skill_history(member_id, skill_id, old_level, new_level, changed_by)` — horodaté, immuable
- Les niveaux sont contraints CHECK (1–4)
- Trigger `handle_new_user()` crée automatiquement une ligne `members` à l'inscription

### Sécurité (RLS)

- Lecture : publique (toutes les tables)
- Écriture : réservée aux admins, sauf exceptions :
  - Un membre peut modifier son propre profil (`full_name`)
  - Un membre peut insérer/mettre à jour ses propres niveaux
  - Acceptation d'invitation par token (sans session admin)

## Docker

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=<url> \
  --build-arg VITE_SUPABASE_ANON_KEY=<key> \
  -t gestion-competences .

docker run -p 8080:80 gestion-competences
```

Build multi-stage : `node:20-alpine` compile → `nginx:alpine` sert les fichiers statiques. Le routage SPA est géré par `try_files` dans nginx. Le cache des assets (`/assets/`) est configuré à 1 an avec `immutable`.

## Versioning

Semver (`MAJEUR.MINEUR.CORRECTIF`). La version est synchronisée entre `package.json` et le fichier `version` à la racine du projet.

## Conventions

- JavaScript uniquement (`.jsx`), pas de TypeScript
- ESLint flat config (relâché sur `src/components/ui/`)
- Tailwind v4 via le plugin `@tailwindcss/vite` (pas de `tailwind.config.js`)
- Labels d'interface en français
- Mode sombre via `next-themes` (stratégie `class`)
- Icônes Lucide
- Composants shadcn ajoutés via `npx shadcn@latest add`

---

*Documentation générée depuis AGENTS.md et le code source.*
