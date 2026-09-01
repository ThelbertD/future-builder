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
| `/pipeline` | Drag-and-drop kanban, multiple pipelines, add contacts per stage |
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
npm run supabase:check  # verify credentials, schema and RLS
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

The app runs on the bundled dataset out of the box. Connecting Supabase takes five steps.

### 1. Create a project

Create a free project at [supabase.com/dashboard](https://supabase.com/dashboard). Pick a region close to you and save the database password somewhere safe.

### 2. Run the migrations

Open **SQL Editor** in the Supabase dashboard and run these files in order, one at a time:

| File | What it creates |
| --- | --- |
| `database/migrations/0001_schema.sql` | Enums, 19 tables, indexes, the profile trigger |
| `database/migrations/0002_rls.sql` | Row level security and the membership helper functions |
| `database/migrations/0003_provisioning.sql` | `create_workspace()`, which bootstraps a workspace, its owner, and the default pipeline |

### 3. Add your credentials

Copy `.env.example` to `.env.local` and fill in the values from **Settings → API**:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
SEED_OWNER_EMAIL=you@example.com
NEXT_PUBLIC_USE_MOCK_DATA=false
```

`.env.local` is gitignored. The service role key is only ever read by the seed script and never reaches the browser.

### 4. Create your account

Run `npm run dev` and sign up at `/signup`. Signing up creates your profile, a workspace, and the twelve default pipeline stages in one transaction.

If email confirmation is enabled (the Supabase default), confirm the email before signing in. To skip that while developing, turn off **Authentication → Sign In / Providers → Confirm email**.

### 5. Load the demo data (optional)

```bash
npm run seed
```

This writes the 30 companies, 50 contacts, 75 opportunities, 40 leads, 20 conversations and 15 appointments into your project, and makes `SEED_OWNER_EMAIL` an owner of that demo workspace so row level security lets you see it. Re-running updates the same rows instead of duplicating them.

### Deploying

Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_USE_MOCK_DATA=false` to your hosting environment variables. Leave `SUPABASE_SERVICE_ROLE_KEY` out unless a server-side job needs it.

### Multi-tenancy

Every tenant table carries `workspace_id`. Row level security restricts reads to active members of the workspace, writes to `owner`/`admin`/`member`, and deletes to `owner`/`admin` — viewers are read-only. Membership is resolved through `public.is_workspace_member()`, `can_write_workspace()` and `can_admin_workspace()`.

A brand-new user cannot insert their own first membership row (the insert policy requires an existing admin), so workspace creation goes through the `create_workspace()` security-definer function instead.

### Security

- The browser only ever receives `NEXT_PUBLIC_SUPABASE_URL` and the anon key.
- `SUPABASE_SERVICE_ROLE_KEY` and AI provider keys are read server-side only; `lib/supabase/admin.ts` and the query layer are marked `server-only`.
- Reads run as the signed-in user, so RLS is the real boundary — the explicit `workspace_id` filter in every query is a second line of defence.
- API route input is validated with zod before use.
- Middleware refreshes the session on every request and redirects unauthenticated visitors away from workspace routes once Supabase is configured.

## Build phases

| Phase | Status |
| --- | --- |
| 1. Design system, shell, dashboard, mock data, responsive | Complete |
| 2. Lead finder, leads, lead detail, companies, pipeline | Complete |
| 3. Conversations, AI assistant, appointments, analytics | Complete |
| 4. Supabase integration, auth, database, RLS | Complete — schema, RLS, provisioning, auth, query layer, seed |
| 5. AI provider integration | Interfaces and route handler ready; no provider call yet |
| 6. Scraper integration | Not started |
| 7. Outreach sending | UI complete, sending not wired |
| 8. Production hardening | Not started |

### What still reads demo data

Aggregate analytics (the activity time series, funnel rates, source performance, AI performance) are computed from the bundled dataset even when Supabase is connected — they need event history the schema does not record yet. Dashboard counters, every list, and every detail page read live records.
