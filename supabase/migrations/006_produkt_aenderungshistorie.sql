-- =============================================================================
-- Änderungshistorie pro Produkt (wer, was, wann)
-- =============================================================================

create table if not exists public.produkt_aenderungshistorie (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  produkt_id uuid not null references public.produkte(id) on delete cascade,
  changed_by text,
  change_description text not null
);

create index if not exists idx_produkt_aenderungshistorie_produkt_id
  on public.produkt_aenderungshistorie(produkt_id);

alter table public.produkt_aenderungshistorie enable row level security;

create policy "Produkt-Aenderungshistorie lesbar"
  on public.produkt_aenderungshistorie for select using (true);
create policy "Produkt-Aenderungshistorie einfügen"
  on public.produkt_aenderungshistorie for insert with check (true);
