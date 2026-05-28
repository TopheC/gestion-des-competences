# AGENTS.md — GestionDesCompetences

## Project

React 19 SPA (skills management). Vite 8, JavaScript (no TypeScript), Tailwind CSS v4, shadcn/ui, Supabase backend, React Router v7 (`react-router-dom`). French UI labels, dark mode via `next-themes`.

## Commands

```
npm run dev         # Vite dev server (HMR)
npm run build       # Production build → dist/
npm run lint        # ESLint (flat config)
npm run preview     # Serve dist/ locally
npm run test        # Vitest (no tests yet)
npm run test:watch  # Vitest watch mode
```

No typecheck script.

## Architecture

- **Entry**: `src/main.jsx` → `<ThemeProvider>` → `src/App.jsx`
- **Auth**: `src/context/AuthContext.jsx` — Supabase Auth + `members` table (role: admin/member)
- **Routing**: React Router v7 in `src/App.jsx`. Public routes: `/login`, `/register`, `/accept-invite`. Protected routes wrapped in `<ProtectedRoute>`, admin-only (`/members`, `/skills`) also wrapped in `<AdminRoute>`. Lazy loading for admin pages via `React.lazy` + `<Suspense>`.
- **Error handling**: `<ErrorBoundary>` wraps all protected routes
- **Path alias**: `@/*` → `src/*` (in `vite.config.js` + `jsconfig.json`)

## Component structure

```
src/components/
├── ui/          shadcn components (avatar, badge, button, card, dialog, dropdown-menu, input, select, table, tabs)
├── layout/      Layout, ErrorBoundary, ProtectedRoute, SkillLevelBadge
└── features/
    ├── matrix/  SkillMatrix views (Table, Heatmap, BarChart, Graph, Radar, Scatter, Treemap + filters, form, switcher)
    ├── skills/  CategoryCard
    └── members/ InviteUserModal
```

## Data Layer

- Hooks in `src/hooks/` — `useMembers`, `useSkills`, `useCategories`, `useSkillLevels`, `useHistory`
- Hooks call Supabase directly (no API layer). No global state — hooks + local state only.
- `useSkillLevels` and `useHistory` have real-time subscriptions via `supabase.channel()`
- CSV exports available for Members and Matrix pages

## Supabase

- Migrations in `supabase/migrations/` (apply with `node scripts/apply-migrations.mjs`, seed with `node scripts/seed.mjs`)
- Tables: `categories`, `skills`, `members`, `level_descriptions`, `skill_levels`, `skill_history`, `invitations`
- `handle_new_user()` trigger auto-creates `members` row on signup
- RLS: read-all for most tables, write restricted to admin role. UPDATE policies include `WITH CHECK` matching `USING`.
- `invitations_read_admin` filters `expires_at > now()`
- Full-text search via GIN indexes on `skills.name` and `members.full_name`
- Realtime publication on `skill_levels` and `skill_history`

## Docker

Multi-stage: `node:20-alpine` build → `nginx:alpine` serve. `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build args. SPA routing via nginx `try_files`.

## Git

Pre-commit hook in `.githooks/pre-commit` scans staged diffs for secrets (Supabase keys, GitHub tokens, Stripe keys, AWS keys, private keys).

## Conventions

- JavaScript only (`.jsx`), no TypeScript
- ESLint flat config — ignores `dist/`, relaxed rules on `src/components/ui/`
- Tailwind v4 via `@tailwindcss/vite` plugin (no `tailwind.config.js`)
- French UI labels
- Dark mode via `next-themes` with class strategy
- Lucide icons, responsive sidebar (hamburger on mobile)
- shadcn components via `npx shadcn@latest add <component>` (config in `components.json`)
