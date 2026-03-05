-- =============================================================================
-- Änderungshistorie pro Mediaplan (wer, was, wann) – wie bei Produkten
-- =============================================================================

create table if not exists public.mediaplan_aenderungshistorie (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  mediaplan_id uuid not null references public.mediaplaene(id) on delete cascade,
  changed_by text,
  change_description text not null
);

create index if not exists idx_mediaplan_aenderungshistorie_mediaplan_id
  on public.mediaplan_aenderungshistorie(mediaplan_id);

alter table public.mediaplan_aenderungshistorie enable row level security;

create policy "Mediaplan-Aenderungshistorie lesbar"
  on public.mediaplan_aenderungshistorie for select using (true);
create policy "Mediaplan-Aenderungshistorie einfügen"
  on public.mediaplan_aenderungshistorie for insert with check (true);
