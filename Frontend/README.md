# BuildTrack — Frontend

Construction Project Management & Site Monitoring Platform. Frontend built with
**React + TypeScript + Bootstrap 5 + Chart.js** (via `react-chartjs-2`).

The UI/UX follows the Figma design; all functional content — modules, fields,
labels, categories, roles, statuses and chart data — follows the project
reference document, which is authoritative wherever the two disagreed.

## Getting started

Run the FastAPI backend first (see `../backend/README.md`) — it serves on
`http://127.0.0.1:8000`. The Vite dev server proxies `/api` to it, so no
frontend env vars are needed.

```bash
npm install
npm run dev      # start the Vite dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run lint     # oxlint
```

If the backend runs elsewhere, set `VITE_API_PROXY_TARGET` (dev proxy target)
or `VITE_API_BASE_URL` (absolute API base) before starting Vite.

## Demo sign-in

Auth runs against the backend's JWT endpoints. Credentials match the backend
seed (`backend/app/seed.py`); the login screen has one-click role buttons that
autofill each account.

| Role            | Email                     | Password       |
| --------------- | ------------------------- | -------------- |
| Administrator   | admin@buildtrack.com      | admin123       |
| Project Manager | manager@buildtrack.com    | manager123     |
| Site Engineer   | engineer@buildtrack.com   | engineer123    |
| Contractor      | contractor@buildtrack.com | contractor123  |
| Worker          | worker@buildtrack.com     | worker123      |
| Client          | client@buildtrack.com     | client123      |

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
├── services/        API boundary (FastAPI for M2 modules; mock elsewhere)
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

## Backend integration

The Milestone 2 modules — **Projects, Resources, Inventory, Workforce** — are
wired to the FastAPI backend and render live data:

- `src/services/apiClient.ts` — `request()` performs JWT-authenticated calls
  against `/api/v1` (proxied to FastAPI in dev).
- `src/services/authService.ts` — login / register / session use the backend's
  `/auth` endpoints; the token is stored in `localStorage` and attached to
  every request.
- `src/services/mappers.ts` — adapts backend rows (snake_case, integer ids,
  thin enums) to the frontend view types (camelCase, rich unions).
- `src/services/index.ts` — `projectService`, `resourceService`,
  `inventoryService` and `workforceService` call the API, falling back to the
  bundled fixtures only if the backend is unreachable.

The pages fetch through these services with `useAsyncData` (loading/error
states). Later-milestone modules (site progress, procurement, analytics,
reports, budget, notifications) still serve bundled data until their backend
endpoints are consumed.

Supabase has been removed from this project; the backend owns auth and data.
