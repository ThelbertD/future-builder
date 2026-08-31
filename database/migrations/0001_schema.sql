-- Future Builder AI — core schema
-- Every tenant-scoped table carries workspace_id. Row level security lives in 0002_rls.sql.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums ----
create type workspace_role as enum ('owner', 'admin', 'member', 'viewer');
create type member_status as enum ('active', 'invited', 'suspended');
create type company_status as enum ('prospect', 'engaged', 'client', 'archived');
create type company_size as enum ('1-10', '11-50', '51-200', '201-500', '500+');
create type engagement_type as enum ('Full-time', 'Part-time', 'Contract', 'Freelance', 'Retainer');
create type intent_level as enum ('hot', 'high', 'medium', 'low');
create type lead_status as enum (
  'new', 'qualified', 'ready', 'contacted', 'replied', 'interested',
  'booked', 'call_completed', 'proposal', 'negotiation', 'won', 'lost'
);
create type conversation_channel as enum ('email', 'linkedin', 'sms', 'web');
create type conversation_mode as enum ('ai', 'human');
create type message_author as enum ('ai', 'human', 'prospect', 'system');
create type appointment_status as enum ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
create type campaign_status as enum ('draft', 'active', 'paused', 'completed');
create type integration_status as enum ('connected', 'available', 'coming_soon', 'error');

-- ----------------------------------------------------------- tenancy ------
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text not null default 'starter',
  logo_url text,
  created_at timestamptz not null default now()
);

-- Mirrors auth.users; the trigger below keeps it in sync.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  avatar_url text,
  job_title text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

create table workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role workspace_role not null default 'member',
  status member_status not null default 'active',
  joined_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- --------------------------------------------------------- crm records ----
create table companies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  name text not null,
  domain text,
  website text,
  industry text,
  location text,
  country text,
  size company_size,
  employee_count integer,
  description text,
  linkedin_url text,
  status company_status not null default 'prospect',
  lead_score integer not null default 0 check (lead_score between 0 and 100),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  company_id uuid not null references companies (id) on delete cascade,
  full_name text not null,
  title text,
  email text,
  phone text,
  linkedin_url text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table job_posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  company_id uuid not null references companies (id) on delete cascade,
  title text not null,
  description text,
  source text not null,
  source_url text,
  location text,
  remote boolean not null default false,
  engagement_type engagement_type,
  budget_min numeric,
  budget_max numeric,
  budget_period text,
  skills text[] not null default '{}',
  posted_at timestamptz,
  captured_at timestamptz not null default now()
);

create table pipelines (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  pipeline_id uuid not null references pipelines (id) on delete cascade,
  name text not null,
  color_token text not null default 'chart-1',
  position integer not null default 0,
  probability integer not null default 0 check (probability between 0 and 100),
  is_won boolean not null default false,
  is_lost boolean not null default false
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  company_id uuid not null references companies (id) on delete cascade,
  contact_id uuid references contacts (id) on delete set null,
  job_post_id uuid references job_posts (id) on delete set null,
  stage_id uuid references pipeline_stages (id) on delete set null,
  status lead_status not null default 'new',
  score integer not null default 0 check (score between 0 and 100),
  score_breakdown jsonb not null default '{}'::jsonb,
  intent intent_level not null default 'low',
  owner_id uuid references profiles (id) on delete set null,
  tags text[] not null default '{}',
  estimated_value numeric not null default 0,
  notes text not null default '',
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  stage_entered_at timestamptz not null default now()
);

create table ai_analyses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  lead_id uuid not null references leads (id) on delete cascade,
  score integer not null check (score between 0 and 100),
  intent intent_level not null,
  opportunity_type text,
  recommended_services text[] not null default '{}',
  reasoning text,
  signals text[] not null default '{}',
  risks text[] not null default '{}',
  suggested_next_action text,
  confidence integer check (confidence between 0 and 100),
  model text,
  analyzed_at timestamptz not null default now()
);

-- ------------------------------------------------------- engagement -------
create table conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  lead_id uuid not null references leads (id) on delete cascade,
  company_id uuid not null references companies (id) on delete cascade,
  contact_id uuid references contacts (id) on delete set null,
  channel conversation_channel not null default 'email',
  subject text,
  mode conversation_mode not null default 'ai',
  unread_count integer not null default 0,
  needs_attention boolean not null default false,
  assignee_id uuid references profiles (id) on delete set null,
  last_message_preview text,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  conversation_id uuid not null references conversations (id) on delete cascade,
  author message_author not null,
  author_name text,
  body text not null,
  channel conversation_channel not null default 'email',
  sent_at timestamptz not null default now(),
  read_at timestamptz,
  ai_model text
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  lead_id uuid not null references leads (id) on delete cascade,
  company_id uuid not null references companies (id) on delete cascade,
  contact_id uuid references contacts (id) on delete set null,
  title text not null,
  meeting_type text,
  status appointment_status not null default 'scheduled',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  notes text,
  booked_by_ai boolean not null default false,
  created_at timestamptz not null default now()
);

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  name text not null,
  status campaign_status not null default 'draft',
  audience_summary text,
  min_score integer not null default 0,
  services text[] not null default '{}',
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table campaign_steps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  campaign_id uuid not null references campaigns (id) on delete cascade,
  day_offset integer not null default 0,
  channel conversation_channel not null default 'email',
  name text not null,
  subject text,
  preview text,
  sent integer not null default 0,
  opened integer not null default 0,
  replied integer not null default 0
);

-- ----------------------------------------------------------- signals ------
create table activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  type text not null,
  actor text not null default 'system',
  actor_name text,
  summary text not null,
  detail text,
  lead_id uuid references leads (id) on delete cascade,
  company_id uuid references companies (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  user_id uuid references profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table saved_searches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  name text not null,
  keywords text[] not null default '{}',
  location text,
  industry text,
  sources text[] not null default '{}',
  min_score integer not null default 0,
  cadence_hours integer not null default 24,
  last_run_at timestamptz,
  new_results integer not null default 0,
  created_at timestamptz not null default now()
);

create table integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  provider text not null,
  status integration_status not null default 'available',
  config jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  unique (workspace_id, provider)
);

-- ----------------------------------------------------------- indexes ------
create index on workspace_members (user_id);
create index on companies (workspace_id, status);
create index on contacts (workspace_id, company_id);
create index on job_posts (workspace_id, company_id);
create index on pipeline_stages (workspace_id, pipeline_id, position);
create index on leads (workspace_id, stage_id);
create index on leads (workspace_id, score desc);
create index on ai_analyses (workspace_id, lead_id);
create index on conversations (workspace_id, last_message_at desc);
create index on messages (workspace_id, conversation_id, sent_at);
create index on appointments (workspace_id, starts_at);
create index on activities (workspace_id, created_at desc);
create index on notifications (workspace_id, user_id, read);

-- ---------------------------------------------------------- triggers ------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_touch_updated_at
  before update on leads
  for each row execute function public.touch_updated_at();

create trigger campaigns_touch_updated_at
  before update on campaigns
  for each row execute function public.touch_updated_at();
