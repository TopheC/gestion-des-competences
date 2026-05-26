# AGENTS.md — GestionDesCompetences

## Project

React 19 SPA (skills management) built with Vite 8, JavaScript (not TypeScript), Tailwind CSS v4, shadcn/ui, Supabase backend, React Router v7.

## Commands

```
npm run dev       # Vite dev server with HMR
npm run build     # Production build → dist/
npm run lint      # ESLint (flat config)
npm run preview   # Serve dist/ locally
npm run test      # Vitest run (hooks tests)
npm run test:watch# Vitest watch mode
```

No typecheck script.

## Architecture

- **Entry**: `src/main.jsx` → wrapped in `<ThemeProvider>` (next-themes) → `src/App.jsx`
- **Auth**: `src/context/AuthContext.jsx` — Supabase Auth + `members` table profile (role: admin/member)
- **Routing**: `src/App.jsx` — public routes `/login`, `/register`, `/accept-invite`; protected routes wrapped in `<ProtectedRoute>`; admin-only routes (`/members`, `/skills`) also wrapped in `<AdminRoute>` + `<Suspense>` (React.lazy code splitting)
- **Error handling**: `<ErrorBoundary>` wraps all protected routes
- **Pages**: `src/pages/` — Dashboard, Members, Skills, SkillMatrix, History, Profile
- **UI**: `src/components/ui/` — shadcn components (radix-nova style, JS, no TSX)
- **Supabase client**: `src/lib/supabase.js` — reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from env
- **Path alias**: `@/*` → `src/*` (configured in both `vite.config.js` and `jsconfig.json`)

## Data Layer

### Custom hooks in `src/hooks/`

| Hook | Returns | Notes |
|---|---|---|
| `useMembers()` | `{ members, loading, refetch }` | Full-text search via GIN index |
| `useSkills()` | `{ skills, loading, refetch }` | Includes `category:category_id(name)` join |
| `useCategories()` | `{ categories, loading, refetch }` | Ordered by name |
| `useSkillLevels()` | `{ levels, loading, refetch, updateLevel, getAverageSkillRating }` | `levels` is a `{memberId-skillId → level}` map. Has real-time subscription |
| `useHistory()` | `{ history, loading, count, page, totalPages, filters, setFilter, nextPage, prevPage, refetch }` | Paginated (50/page), real-time on INSERT |

### Data fetching patterns
- Hooks call Supabase directly (no additional API layer)
- No global state management (hooks + local state only)
- Real-time subscriptions via `supabase.channel()` on `skill_levels` and `skill_history`

## Supabase

- DB schema + RLS policies in `supabase/migrations/001_init.sql`
- Tables: `categories`, `skills`, `members`, `level_descriptions`, `skill_levels`, `skill_history`, `invitations`
- `handle_new_user()` trigger auto-creates a `members` row on auth signup
- RLS: read-all for most tables, write restricted to admin role
- UPDATE policies include `WITH CHECK` matching the `USING` clause
- `invitations_read_admin` policy filters `expires_at > now()`
- Full-text search enabled via GIN indexes on `skills.name` and `members.full_name`
- Realtime publication enabled on `skill_levels` and `skill_history`
- `.env` points to a local Supabase instance (`vm-docker5.home.arpa:8000`) — this is committed but `.env` is gitignored; adjust for your environment

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
- Dark mode support via `next-themes` with class strategy
- Layout: Lucide icons, responsive sidebar (hamburger on mobile)
- CSV exports for Members and Matrix pages
