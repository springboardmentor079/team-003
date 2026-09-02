# BuildTrack — Frontend

Construction Project Management & Site Monitoring Platform. Frontend built with
**React + TypeScript + Bootstrap 5 + Chart.js** (via `react-chartjs-2`).

The UI/UX follows the Figma design; all functional content — modules, fields,
labels, categories, roles, statuses and chart data — follows the project
reference document, which is authoritative wherever the two disagreed.

## Getting started

```bash
npm install
npm run dev      # start the Vite dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run lint     # oxlint
```

## Demo sign-in

Mock authentication only. Password for every demo account: `buildtrack123`.
The login screen has one-click role buttons for all six roles.

| Role            | Email                     |
| --------------- | ------------------------- |
| Administrator   | admin@buildtrack.com      |
| Project Manager | manager@buildtrack.com    |
| Site Engineer   | engineer@buildtrack.com   |
| Contractor      | contractor@buildtrack.com |
| Worker          | worker@buildtrack.com     |
| Client          | client@buildtrack.com     |

## Structure

```
src/
├── components/
│   ├── common/      StatusBadge, SearchBar, FilterPanel, Modal, Pagination,
│   │                Toast, ProgressBar, PageHeader/SectionCard
│   ├── charts/      LineChart, BarChart, DoughnutChart, Sparkline + Chart.js setup
│   ├── dashboard/   StatCard, ChartCard, ActivityFeed, MilestoneTimeline, …
│   ├── forms/       FormField, NewProjectModal
│   ├── layout/      Sidebar, Topbar, NotificationPanel, Logo
│   └── tables/      DataTable (generic, sortable)
├── pages/           auth/ + app/ (one page per module) + Landing, NotFound
├── layouts/         AppLayout (session-guarded shell), AuthLayout, PublicLayout
├── routes/          AppRoutes, navigation config
├── services/        API boundary (mock data today, FastAPI-ready)
├── hooks/           useAuth, useAsyncData, useTableControls
├── data/            typed mock datasets per module
├── types/           shared domain types (all unions from the document)
├── utils/           formatting, validation, status → tone mapping
└── styles/          theme.css design tokens
```

## Modules (from the reference document)

Overview, Projects (+ detail), Site Progress, Resources, Inventory, Workforce,
Procurement, Budget & Cost, Analytics, Reports, Notifications, User Management,
Settings/Profile, plus Authentication (login, register, password reset).

## Figma corrections applied

The Figma mock used placeholder/invented content in several places. Notable
corrections made against the document:

- **Roles** — none appeared in Figma; the document's six roles now drive
  role-based navigation and access.
- **"Machine Utilization" → "Resource Utilization"**; **"New Deployment" →
  "New Project"**; **"Incident Log" → "Activity Log"**.
- **Resource Allocation / Asset Registry** — Figma listed "Tower Cranes",
  "Concrete Pumps" and mixed a person ("Welding Team Alpha") into an equipment
  table. Replaced with the document's six resource categories; workforce moved
  to its own module. Statuses corrected to Available / Allocated / Under
  Maintenance / Out of Service.
- **Milestones** — Figma's "Superstructure Erect" replaced with the document's
  six work categories (Foundation … Inspection Work).
- **Workforce Profile** — Figma showed 3 categories; all six restored and
  percentages recomputed.
- **"Site Telemetry" camera feed** — no basis in the document; replaced with
  Site Progress Monitoring (daily/weekly reports, completion, delay tracking).
- **Missing modules added** — Budget & Cost, Reports (PDF/Excel export),
  Notifications, Inventory, Procurement and the Registration / Password-reset
  screens, all absent from the Figma but required by the document.

## Supabase

Authentication is wired to **Supabase Auth**, and the full database schema
lives in `supabase/migrations/`.

Environment (`.env.local`, git-ignored — see `.env.example`):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

The client (`src/services/supabaseClient.ts`) initialises only when both vars
are present; without them the app falls back to bundled mock data, so it still
runs on a fresh checkout. **Vite reads env vars at startup — restart the dev
server after changing `.env.local`.**

### Auth

`src/services/authService.ts` uses Supabase Auth for sign-in, registration
(`signUp` with role in the metadata), password reset and session restore.
`useAuth` keeps the session in sync via `onAuthStateChange`. The six demo
accounts above are seeded into Supabase Auth (migration `0004`), so they log
in against the real backend; role and profile come from the `profiles` table.

### Database schema (migrations)

| Migration | Contents |
| --------- | -------- |
| `0001_auth_profiles_and_roles` | `profiles` table, `user_role`/`account_status` enums, `handle_new_user` trigger, `is_admin` / `can_manage` / `current_user_role` helpers, profile RLS |
| `0002_core_domain_tables` | 16 domain tables + enums for modules 2–11, `updated_at` triggers, indexes |
| `0003_row_level_security` | RLS on every table — read for all authenticated staff, writes gated by `can_manage()`; notifications private to recipient |
| `0004_seed_demo_users` | Six confirmed demo accounts (one per role) |
| `0005_harden_functions` | Pins search_path, revokes public/anon `EXECUTE` on SECURITY DEFINER functions |
| `0006_fix_seed_user_tokens` | Backfills `auth.users` token columns for the seeded rows |

Migrations were applied to the Supabase project via the Supabase MCP. To apply
elsewhere, run them in order through the SQL editor or `supabase db push`.

**Recommended (dashboard-only) hardening:** enable *Leaked Password Protection*
under Auth → Providers, which cannot be toggled from SQL.

### Data layer

Auth is fully on Supabase. The module data services (`projectService`,
`resourceService`, …) still return the bundled mock fixtures — the Postgres
tables now exist to back them, so each service can be pointed at
`supabase.from('<table>')` when you want live data. Set `VITE_API_BASE_URL`
instead if you route those through a separate FastAPI backend.
