# AGENTS.md — GestionDesCompetences

## Project

React 19 SPA (skills management) built with Vite 8, JavaScript (not TypeScript), Tailwind CSS v4, shadcn/ui, Supabase backend, React Router v7.

## Commands

```
npm run dev       # Vite dev server with HMR
npm run build     # Production build → dist/
npm run lint      # ESLint (flat config)
npm run preview   # Serve dist/ locally
```

No test runner, no typecheck script.

## Architecture

- **Entry**: `src/main.jsx` → `src/App.jsx`
- **Auth**: `src/context/AuthContext.jsx` — Supabase Auth + `members` table profile (role: admin/member)
- **Routing**: `src/App.jsx` — public routes `/login`, `/register`, `/accept-invite`; protected routes wrapped in `<ProtectedRoute>`; admin-only routes (`/members`, `/skills`) also wrapped in `<AdminRoute>`
- **Pages**: `src/pages/` — Dashboard, Members, Skills, SkillMatrix, History, Profile
- **UI**: `src/components/ui/` — shadcn components (radix-nova style, JS, no TSX)
- **Supabase client**: `src/lib/supabase.js` — reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from env
- **Path alias**: `@/*` → `src/*` (configured in both `vite.config.js` and `jsconfig.json`)

## Supabase

- DB schema + RLS policies in `supabase/migrations/001_init.sql`
- Tables: `categories`, `skills`, `members`, `level_descriptions`, `skill_levels`, `skill_history`, `invitations`
- `handle_new_user()` trigger auto-creates a `members` row on auth signup
- RLS: read-all for most tables, write restricted to admin role
- `.env` points to a local Supabase instance (`192.168.2.220:8000`) — this is committed but `.env` is gitignored; adjust for your environment

## Docker

Multi-stage: `node:20-alpine` build → `nginx:alpine` serve.
Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build args.
SPA routing handled by nginx `try_files`.

## shadcn/ui

Config in `components.json`. Add components with:
```
npx shadcn@latest add <component>
```
Components land in `src/components/ui/`. Uses Lucide icons.

## Conventions

- JavaScript only (`.jsx`), no TypeScript
- ESLint flat config (`eslint.config.js`) — ignores `dist/`
- Tailwind v4 via `@tailwindcss/vite` plugin (no `tailwind.config.js`)
- French UI labels (application is in French)
