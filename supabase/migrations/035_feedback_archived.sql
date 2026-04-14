alter table public.feedback_eintraege
  add column if not exists archived boolean not null default false;

create index if not exists feedback_eintraege_archived_idx
  on public.feedback_eintraege(archived);
