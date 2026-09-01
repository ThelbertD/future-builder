-- Future Builder AI — outreach drafts
--
-- A generated first message is not a sent message. Marking drafts explicitly
-- keeps them out of reply counts and lets the inbox show what is waiting for
-- review versus what has already gone out.

alter table messages
  add column if not exists is_draft boolean not null default false;

create index if not exists messages_drafts_idx
  on messages (workspace_id, is_draft)
  where is_draft;

comment on column messages.is_draft is
  'True while the message is a generated draft awaiting review. Never sent.';
