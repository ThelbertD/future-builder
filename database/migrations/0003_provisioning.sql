-- Future Builder AI — workspace provisioning
--
-- A brand-new user cannot insert their own first workspace_members row: the
-- insert policy requires an existing admin membership, which does not exist
-- yet. This SECURITY DEFINER function performs the whole bootstrap atomically
-- (workspace, owner membership, default pipeline and stages) and is the only
-- supported way to create a workspace.

-- Direct inserts are no longer needed now that provisioning goes through the
-- function below.
drop policy if exists "authenticated users create workspaces" on workspaces;

create or replace function public.create_workspace(
  workspace_name text,
  workspace_slug text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  new_workspace_id uuid;
  new_pipeline_id uuid;
  final_slug text;
begin
  if actor is null then
    raise exception 'Not authenticated';
  end if;

  if coalesce(trim(workspace_name), '') = '' then
    raise exception 'Workspace name is required';
  end if;

  final_slug := coalesce(
    nullif(trim(workspace_slug), ''),
    regexp_replace(lower(trim(workspace_name)), '[^a-z0-9]+', '-', 'g')
  );
  final_slug := trim(both '-' from final_slug);

  if final_slug = '' or exists (select 1 from workspaces w where w.slug = final_slug) then
    final_slug := final_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end if;

  insert into workspaces (name, slug)
  values (trim(workspace_name), final_slug)
  returning id into new_workspace_id;

  insert into workspace_members (workspace_id, user_id, role, status)
  values (new_workspace_id, actor, 'owner', 'active');

  insert into pipelines (workspace_id, name, is_default)
  values (new_workspace_id, 'Client Acquisition', true)
  returning id into new_pipeline_id;

  insert into pipeline_stages
    (workspace_id, pipeline_id, name, color_token, position, probability, is_won, is_lost)
  values
    (new_workspace_id, new_pipeline_id, 'New',                 'chart-5',  0,   5, false, false),
    (new_workspace_id, new_pipeline_id, 'AI Qualified',        'chart-1',  1,  15, false, false),
    (new_workspace_id, new_pipeline_id, 'Ready to Contact',    'chart-1',  2,  20, false, false),
    (new_workspace_id, new_pipeline_id, 'Contacted',           'chart-1',  3,  30, false, false),
    (new_workspace_id, new_pipeline_id, 'Replied',             'chart-3',  4,  40, false, false),
    (new_workspace_id, new_pipeline_id, 'Interested',          'chart-3',  5,  55, false, false),
    (new_workspace_id, new_pipeline_id, 'Appointment Booked',  'chart-2',  6,  65, false, false),
    (new_workspace_id, new_pipeline_id, 'Call Completed',      'chart-2',  7,  72, false, false),
    (new_workspace_id, new_pipeline_id, 'Proposal Sent',       'chart-4',  8,  80, false, false),
    (new_workspace_id, new_pipeline_id, 'Negotiation',         'chart-4',  9,  88, false, false),
    (new_workspace_id, new_pipeline_id, 'Won',                 'chart-2', 10, 100, true,  false),
    (new_workspace_id, new_pipeline_id, 'Lost',                'chart-5', 11,   0, false, true);

  return new_workspace_id;
end;
$$;

revoke all on function public.create_workspace(text, text) from public;
grant execute on function public.create_workspace(text, text) to authenticated;

-- Convenience for the seed script: attach an existing user to a workspace as
-- owner. Runs as the service role only.
create or replace function public.attach_workspace_owner(
  target_workspace uuid,
  target_user uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into workspace_members (workspace_id, user_id, role, status)
  values (target_workspace, target_user, 'owner', 'active')
  on conflict (workspace_id, user_id)
  do update set role = 'owner', status = 'active';
end;
$$;

revoke all on function public.attach_workspace_owner(uuid, uuid) from public;
revoke all on function public.attach_workspace_owner(uuid, uuid) from authenticated;
