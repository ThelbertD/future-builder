-- Future Builder AI — row level security
-- Members read and write only inside workspaces they belong to.
-- Viewers are read-only; owners and admins manage membership.

-- --------------------------------------------------------- helpers --------
create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from workspace_members m
    where m.workspace_id = target_workspace
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.can_write_workspace(target_workspace uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from workspace_members m
    where m.workspace_id = target_workspace
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'member')
  );
$$;

create or replace function public.can_admin_workspace(target_workspace uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from workspace_members m
    where m.workspace_id = target_workspace
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  );
$$;

-- ------------------------------------------------------ enable RLS --------
alter table workspaces enable row level security;
alter table profiles enable row level security;
alter table workspace_members enable row level security;
alter table companies enable row level security;
alter table contacts enable row level security;
alter table job_posts enable row level security;
alter table pipelines enable row level security;
alter table pipeline_stages enable row level security;
alter table leads enable row level security;
alter table ai_analyses enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table appointments enable row level security;
alter table campaigns enable row level security;
alter table campaign_steps enable row level security;
alter table activities enable row level security;
alter table notifications enable row level security;
alter table saved_searches enable row level security;
alter table integrations enable row level security;

-- ------------------------------------------------------- tenancy ---------
create policy "members read their workspaces"
  on workspaces for select
  using (public.is_workspace_member(id));

create policy "admins update their workspace"
  on workspaces for update
  using (public.can_admin_workspace(id))
  with check (public.can_admin_workspace(id));

create policy "authenticated users create workspaces"
  on workspaces for insert
  with check (auth.uid() is not null);

create policy "users read their own profile"
  on profiles for select
  using (id = auth.uid());

create policy "users update their own profile"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "members read workspace membership"
  on workspace_members for select
  using (user_id = auth.uid() or public.is_workspace_member(workspace_id));

create policy "admins manage membership"
  on workspace_members for all
  using (public.can_admin_workspace(workspace_id))
  with check (public.can_admin_workspace(workspace_id));

-- -------------------------------------------- workspace-scoped tables -----
-- Same shape for every tenant table: read for members, write for members
-- above viewer. Applied through a loop so no table is accidentally missed.
do $$
declare
  target text;
  tenant_tables text[] := array[
    'companies', 'contacts', 'job_posts', 'pipelines', 'pipeline_stages',
    'leads', 'ai_analyses', 'conversations', 'messages', 'appointments',
    'campaigns', 'campaign_steps', 'activities', 'saved_searches', 'integrations'
  ];
begin
  foreach target in array tenant_tables loop
    execute format(
      'create policy "members read %1$s" on %1$I for select using (public.is_workspace_member(workspace_id));',
      target
    );
    execute format(
      'create policy "members insert %1$s" on %1$I for insert with check (public.can_write_workspace(workspace_id));',
      target
    );
    execute format(
      'create policy "members update %1$s" on %1$I for update using (public.can_write_workspace(workspace_id)) with check (public.can_write_workspace(workspace_id));',
      target
    );
    execute format(
      'create policy "admins delete %1$s" on %1$I for delete using (public.can_admin_workspace(workspace_id));',
      target
    );
  end loop;
end;
$$;

-- Notifications are per-user inside a workspace.
create policy "users read their notifications"
  on notifications for select
  using (public.is_workspace_member(workspace_id) and (user_id is null or user_id = auth.uid()));

create policy "users update their notifications"
  on notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "members insert notifications"
  on notifications for insert
  with check (public.can_write_workspace(workspace_id));
