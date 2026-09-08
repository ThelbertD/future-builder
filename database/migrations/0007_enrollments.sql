-- NexusOS — campaign enrolment
--
-- A campaign had no way to hold the leads it was working. The enrolled count on
-- the Outreach page was a literal zero in the mapper rather than a count of
-- anything, and "Resume" resumed nothing, because there was nothing enrolled to
-- move through the sequence.
--
-- One row per lead per campaign. The unique constraint is what makes enrolling
-- twice safe: a second run adds whatever is new and leaves the rest alone,
-- rather than sending the same person the same sequence again.

create table if not exists campaign_enrollments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  campaign_id uuid not null references campaigns (id) on delete cascade,
  lead_id uuid not null references leads (id) on delete cascade,
  -- active while the sequence is running, stopped once the prospect replies or
  -- books, completed after the final step has gone out.
  status text not null default 'active',
  -- How far through the sequence this lead is: 0 means nothing sent yet.
  current_step integer not null default 0,
  enrolled_at timestamptz not null default now(),
  last_sent_at timestamptz,
  unique (campaign_id, lead_id)
);

create index if not exists campaign_enrollments_campaign_idx
  on campaign_enrollments (workspace_id, campaign_id, status);

create index if not exists campaign_enrollments_lead_idx
  on campaign_enrollments (workspace_id, lead_id);

alter table campaign_enrollments enable row level security;

-- Same shape as every other tenant table: members read and write, admins delete.
create policy "members read campaign_enrollments"
  on campaign_enrollments for select
  using (public.is_workspace_member(workspace_id));

create policy "members insert campaign_enrollments"
  on campaign_enrollments for insert
  with check (public.can_write_workspace(workspace_id));

create policy "members update campaign_enrollments"
  on campaign_enrollments for update
  using (public.can_write_workspace(workspace_id))
  with check (public.can_write_workspace(workspace_id));

create policy "admins delete campaign_enrollments"
  on campaign_enrollments for delete
  using (public.can_admin_workspace(workspace_id));

comment on table campaign_enrollments is
  'Leads working through a campaign sequence. Unique per (campaign, lead), so enrolling twice is safe.';
