# AGENTS.md — GestionDesCompetences

## Projet

Application React 19 SPA (gestion des compétences). Vite 8, JavaScript (pas de TypeScript), Tailwind CSS v4, shadcn/ui, backend Supabase, React Router v7 (`react-router-dom`). Interface en français, mode sombre via `next-themes`.

## Commandes

```
npm run dev         # Serveur de développement Vite (HMR)
npm run build       # Build production → dist/
npm run lint        # ESLint (flat config)
npm run preview     # Sert dist/ en local
npm run test        # Vitest (pas encore de tests)
npm run test:watch  # Vitest mode watch
```

Pas de script typecheck.

## Architecture

- **Point d'entrée** : `src/main.jsx` → `<ThemeProvider>` → `src/App.jsx`
- **Auth** : `src/context/AuthContext.jsx` — Supabase Auth + table `members` (rôle : admin/member)
- **Routage** : React Router v7 dans `src/App.jsx`. Routes publiques : `/login`, `/register`, `/accept-invite`. Routes protégées encapsulées dans `<ProtectedRoute>`, réservées aux admin (`/members`, `/skills`) également encapsulées dans `<AdminRoute>`. Chargement différé des pages admin via `React.lazy` + `<Suspense>`.
- **Gestion d'erreurs** : `<ErrorBoundary>` encadre toutes les routes protégées
- **Alias de chemin** : `@/*` → `src/*` (dans `vite.config.js` + `jsconfig.json`)

## Structure des composants

```
src/components/
├── ui/          Composants shadcn (avatar, badge, button, card, dialog, dropdown-menu, input, select, table, tabs)
├── layout/      Layout, ErrorBoundary, ProtectedRoute, SkillLevelBadge
└── features/
    ├── matrix/  Vues SkillMatrix (Table, Heatmap, BarChart, Graph, Radar, Scatter, Treemap + filtres, formulaire, sélecteur)
    ├── skills/  CategoryCard
    └── members/ InviteUserModal
```

## Couche de données

- Hooks dans `src/hooks/` — `useMembers`, `useSkills`, `useCategories`, `useSkillLevels`, `useHistory`
- Les hooks appellent Supabase directement (pas de couche API). Pas d'état global — hooks + état local uniquement.
- `useSkillLevels` et `useHistory` ont des abonnements temps réel via `supabase.channel()`
- Exports CSV disponibles pour les pages Membres et Matrice

## Supabase

- Migrations dans `supabase/migrations/` (appliquer avec `node scripts/apply-migrations.mjs`, seed avec `node scripts/seed.mjs`)
- Tables : `categories`, `skills`, `members`, `level_descriptions`, `skill_levels`, `skill_history`, `invitations`
- Le trigger `handle_new_user()` crée automatiquement une ligne `members` à l'inscription
- RLS : lecture pour tous pour la plupart des tables, écriture réservée au rôle admin. Les politiques UPDATE incluent `WITH CHECK` correspondant à `USING`.
- `invitations_read_admin` filtre `expires_at > now()`
- Recherche plein texte via index GIN sur `skills.name` et `members.full_name`
- Publication temps réel sur `skill_levels` et `skill_history`

## Docker

Multi-étapes : `node:20-alpine` build → `nginx:alpine` serve. `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` comme arguments de build. Routage SPA via nginx `try_files`.

## Documentation

- La documentation du projet (README.md, AGENTS.md, etc.) doit être maintenue **à jour systématiquement avant chaque commit**.
- Toute fonctionnalité ajoutée, modifiée ou supprimée doit être reflétée dans le README.md (installation, usage, architecture, etc.).

## Git

Hook pre-commit dans `.githooks/pre-commit` qui analyse les diffs stagés pour détecter des secrets (clés Supabase, tokens GitHub, clés Stripe, clés AWS, clés privées).

## Versionning

- Le fichier `version` à la racine du projet et le champ `"version"` dans `package.json` doivent **toujours** être synchronisés. Toute modification de version doit être répercutée dans les deux fichiers.
- Format de version : semver (`MAJEUR.MINEUR.CORRECTIF`).

## Conventions

- Toute la documentation du projet (README.md, AGENTS.md, etc.) doit être rédigée **uniquement en Français**
- JavaScript uniquement (`.jsx`), pas de TypeScript
- ESLint flat config — ignore `dist/`, règles assouplies sur `src/components/ui/`
- Tailwind v4 via le plugin `@tailwindcss/vite` (pas de `tailwind.config.js`)
- Labels d'interface en français
- Mode sombre via `next-themes` avec stratégie par classe
- Icônes Lucide, sidebar responsive (hamburger sur mobile)
- Composants shadcn via `npx shadcn@latest add <component>` (config dans `components.json`)
