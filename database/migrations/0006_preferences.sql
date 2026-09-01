-- Future Builder AI — user and workspace preferences
--
-- Notification choices belong to a person; AI behaviour belongs to a workspace.
-- Both are small, sparse and read as a unit, so jsonb beats a column per
-- toggle: adding a setting later needs no migration.

alter table profiles
  add column if not exists notification_prefs jsonb not null default '{}'::jsonb;

alter table workspaces
  add column if not exists ai_settings jsonb not null default '{}'::jsonb;

comment on column profiles.notification_prefs is
  'Per-user notification toggles, keyed by notification kind.';

comment on column workspaces.ai_settings is
  'Model, prompt, tone and automation rules for this workspace.';
