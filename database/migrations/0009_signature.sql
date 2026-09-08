-- NexusOS — email signature
--
-- A Gmail signature is added by the Gmail web client, not by the mail server.
-- Anything sent over SMTP therefore arrives without it, so outreach from here
-- went out unsigned while the same account signed everything sent by hand.
--
-- The signature belongs to the workspace rather than the message: it is appended
-- at send time, so changing it changes every mail that goes out next, and no
-- stored draft carries a stale copy.

alter table workspaces
  add column if not exists email_signature text;

comment on column workspaces.email_signature is
  'Plain-text signature appended to outbound email. Empty or null sends nothing.';
