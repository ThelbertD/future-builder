-- NexusOS — inbound replies
--
-- The app could send and never receive. A prospect's reply landed in Gmail and
-- the conversation in here still read "1 message", which is the one thing an
-- inbox cannot get wrong.
--
-- Replies are pulled over IMAP, so each stored message keeps the mail server's
-- own Message-ID. That is what makes syncing repeatable: the same reply seen on
-- every poll is recognised and skipped rather than added again.

alter table messages
  add column if not exists external_id text;

create unique index if not exists messages_external_id_key
  on messages (workspace_id, external_id)
  where external_id is not null;

comment on column messages.external_id is
  'The mail server Message-ID for a received message. Unique per workspace, so repeated syncs cannot duplicate a reply.';

-- Where each mailbox poll left off, so a sync reads only what is new.
alter table workspaces
  add column if not exists inbox_synced_at timestamptz;

comment on column workspaces.inbox_synced_at is
  'When replies were last pulled from the mailbox. Null means never synced.';
