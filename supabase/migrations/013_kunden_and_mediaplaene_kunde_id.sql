-- =============================================================================
-- Kunden table and mediaplaene.kunde_id (mediaplans assigned to Kunden)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabelle: kunden
-- -----------------------------------------------------------------------------
create table if not exists public.kunden (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null unique,
  industry text,
  status text check (status in ('Aktiv', 'Inaktiv')),
  notes text
);

alter table public.kunden enable row level security;

create policy "Kunden lesbar" on public.kunden for select using (true);
create policy "Kunden einfügen" on public.kunden for insert with check (true);
create policy "Kunden aktualisieren" on public.kunden for update using (true);
create policy "Kunden löschen" on public.kunden for delete using (true);

-- -----------------------------------------------------------------------------
-- mediaplaene: add kunde_id
-- -----------------------------------------------------------------------------
alter table public.mediaplaene
  add column if not exists kunde_id uuid references public.kunden(id) on delete set null;

create index if not exists idx_mediaplaene_kunde_id on public.mediaplaene(kunde_id);

comment on column public.mediaplaene.kunde_id is 'Kunde (Unternehmen), dem der Mediaplan zugeordnet ist; client bleibt für Anzeige/Override.';

-- -----------------------------------------------------------------------------
-- Seed: Kunden aus bestehenden mediaplaene.client-Werten
-- -----------------------------------------------------------------------------
insert into public.kunden (name, industry, status)
values
  ('Salt', 'Telekommunikation', 'Aktiv'),
  ('FL1', 'Energie', 'Aktiv'),
  ('VP Bank', 'Finanzen', 'Aktiv')
on conflict (name) do nothing;

-- Backfill kunde_id where client name matches (best-effort for existing data)
update public.mediaplaene m
set kunde_id = k.id
from public.kunden k
where m.kunde_id is null and trim(m.client) = k.name;
