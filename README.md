# Future Builder AI

**AI Client Acquisition OS** — find companies that are already hiring for what you sell, qualify them with AI, work them in a custom pipeline, hold the conversation, and book the call.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Radix primitives, Recharts, dnd-kit, and Supabase-ready data access.

---

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. The app runs entirely on the bundled demo dataset, so no database or API key is required to explore it.

| Route | What it is |
| --- | --- |
| `/` | Marketing landing page |
| `/login`, `/signup` | Auth screens |
| `/dashboard` | Executive overview |
| `/finder` | Lead discovery and saved searches |
| `/leads`, `/leads/[id]` | Lead table and detail |
| `/pipeline` | Drag-and-drop kanban |
| `/companies`, `/companies/[id]` | Company directory and detail |
| `/conversations` | AI inbox |
| `/outreach` | Campaigns and sequences |
| `/appointments` | Month / week / day / agenda calendar |
| `/analytics` | Funnel, source, outreach and AI performance |
| `/ai-settings`, `/integrations`, `/settings` | System configuration |

Press `Ctrl K` (`⌘ K` on macOS) anywhere for the command menu.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run seed       # push the demo dataset into Supabase
```

## Architecture

```
app/
  (auth)/          login, signup
  (dashboard)/     the application shell and every workspace page
  api/             route handlers (leads, companies, conversations, appointments, ai)
components/
  ui/              shadcn-style primitives built on Radix
  layout/          app shell, sidebar, topbar, command menu, mobile nav
  dashboard/ leads/ pipeline/ conversations/ appointments/ analytics/
  companies/ outreach/ settings/ ai/ marketing/ common/
lib/
  mock/            the bundled demo dataset (30 companies, 50 contacts,
                   75 opportunities, 40 leads, 20 conversations, 15 appointments)
  supabase/        browser / server / admin clients and the data access layer
  constants.ts     navigation, taxonomies, brand
  utils.ts         formatting and the fixed demo clock
hooks/             media query, mounted, platform, local storage
types/             the full domain model
database/
  migrations/      0001_schema.sql, 0002_rls.sql
  seed/            seed.ts
```

### Design system

All colour, radius and typography values are semantic CSS variables defined once in `app/globals.css` and exposed to Tailwind through `@theme inline`. Components reference tokens (`bg-card`, `text-muted-foreground`, `var(--chart-1)`) and never hard-coded hex values, so light and dark mode are a single source swap. Dark is the default; the topbar toggles it.

### Data access

Pages read through `lib/supabase/queries.ts`. Today every function returns records from `lib/mock`; once the schema is migrated and seeded, swap each mock branch for a Supabase query — the return types already match the domain model in `types/`.

The demo dataset is generated against a fixed clock (`MOCK_NOW` in `lib/utils.ts`) so server and client renders always agree and relative timestamps stay stable.

## Supabase

1. Create a project and run the migrations in order:
   - `database/migrations/0001_schema.sql`
   - `database/migrations/0002_rls.sql`
2. Copy `.env.example` to `.env.local` and fill in the values.
3. Seed the demo data:

   ```bash
   npm run seed
   ```

4. Set `NEXT_PUBLIC_USE_MOCK_DATA=false` once the query layer is pointed at Supabase.

### Multi-tenancy

Every tenant table carries `workspace_id`. Row level security restricts reads to active members of the workspace, writes to `owner`/`admin`/`member`, and deletes to `owner`/`admin` — viewers are read-only. Membership is resolved through `public.is_workspace_member()`, `can_write_workspace()` and `can_admin_workspace()`.

### Security

- The browser only ever receives `NEXT_PUBLIC_SUPABASE_URL` and the anon key.
- `SUPABASE_SERVICE_ROLE_KEY` and AI provider keys are read server-side only (`lib/supabase/admin.ts` is marked `server-only`).
- API route input is validated with zod before it is used.
- AI qualification runs in a route handler so provider credentials never reach the client.

## Build phases

| Phase | Status |
| --- | --- |
| 1. Design system, shell, dashboard, mock data, responsive | Complete |
| 2. Lead finder, leads, lead detail, companies, pipeline | Complete |
| 3. Conversations, AI assistant, appointments, analytics | Complete |
| 4. Supabase integration, auth, database, RLS | Schema, RLS, clients and seed ready; auth wiring pending |
| 5. AI provider integration | Interfaces and route handler ready |
| 6. Scraper integration | Not started |
| 7. Outreach sending | UI complete, sending not wired |
| 8. Production hardening | Not started |

The previous static marketing site is preserved under `legacy/`.
