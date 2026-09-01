-- Future Builder AI — booking link
--
-- The scheduling URL a workspace hands to prospects. Kept on the workspace
-- rather than in an environment variable so each tenant owns its own, and so it
-- can be edited from Settings without a redeploy.

alter table workspaces
  add column if not exists booking_url text;

comment on column workspaces.booking_url is
  'Public scheduling link (Calendly, Cal.com, etc.) included in outreach.';
