-- =============================================================================
-- Mediapläne und Positionen (Verknüpfung mit Produktkatalog)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabelle: mediaplaene
-- -----------------------------------------------------------------------------
create table if not exists public.mediaplaene (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  client text not null,
  status text not null check (status in ('Aktiv', 'Entwurf', 'Abgeschlossen', 'Archiviert')),
  campaign text not null,
  date_range_start date,
  date_range_end date
);

alter table public.mediaplaene enable row level security;

create policy "Mediaplaene lesbar" on public.mediaplaene for select using (true);
create policy "Mediaplaene einfügen" on public.mediaplaene for insert with check (true);
create policy "Mediaplaene aktualisieren" on public.mediaplaene for update using (true);
create policy "Mediaplaene löschen" on public.mediaplaene for delete using (true);

-- -----------------------------------------------------------------------------
-- Tabelle: mediaplan_positionen (Positionen pro Mediaplan, optional aus Produktkatalog)
-- -----------------------------------------------------------------------------
create table if not exists public.mediaplan_positionen (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  mediaplan_id uuid not null references public.mediaplaene(id) on delete cascade,
  produkt_id uuid references public.produkte(id) on delete set null,
  title text not null,
  description text,
  tag text,
  brutto numeric,
  discount_text text,
  kundenpreis numeric,
  status_tags text[] default '{}',
  sort_order int not null default 0
);

create index if not exists idx_mediaplan_positionen_mediaplan_id on public.mediaplan_positionen(mediaplan_id);

alter table public.mediaplan_positionen enable row level security;

create policy "Mediaplan-Positionen lesbar" on public.mediaplan_positionen for select using (true);
create policy "Mediaplan-Positionen einfügen" on public.mediaplan_positionen for insert with check (true);
create policy "Mediaplan-Positionen aktualisieren" on public.mediaplan_positionen for update using (true);
create policy "Mediaplan-Positionen löschen" on public.mediaplan_positionen for delete using (true);

-- -----------------------------------------------------------------------------
-- Beispieldaten
-- -----------------------------------------------------------------------------
insert into public.mediaplaene (client, status, campaign, date_range_start, date_range_end) values
  ('Salt', 'Aktiv', 'Q1 2026 - Digitale Transformation', '2026-03-01', '2026-06-30'),
  ('FL1', 'Aktiv', 'Frühjahrs-Kampagne 2026', '2026-02-15', '2026-05-31'),
  ('VP Bank', 'Entwurf', 'Brand Awareness Initiative', '2026-04-01', '2026-07-31'),
  ('Salt', 'Abgeschlossen', 'Q4 2025 - Jahresendkampagne', '2025-10-01', '2025-12-31'),
  ('FL1', 'Entwurf', 'Sommer Special 2026', '2026-06-01', '2026-08-31');

-- Beispiel-Positionen für "Frühjahrs-Kampagne 2026"
insert into public.mediaplan_positionen (mediaplan_id, title, description, tag, brutto, discount_text, kundenpreis, status_tags, sort_order)
select id, 'Display Banner - Homepage Leaderboard', 'Frühlingsaktion - Welle 1, 2.500 CPM', 'Sichtbarkeit', 68250, '-10% (6.825,00 CHF)', 61875, array['Reporting','Offen'], 1 from public.mediaplaene where campaign = 'Frühjahrs-Kampagne 2026' limit 1;
insert into public.mediaplan_positionen (mediaplan_id, title, description, tag, brutto, discount_text, kundenpreis, status_tags, sort_order)
select id, 'Print - Tageszeitungen Inserat', 'Frühlingsaktion - Welle 1, 3 Schaltungen', 'Sichtbarkeit', 20160, '-5% (1.008,00 CHF)', 19152, array['Einbuchung','Rechnung'], 2 from public.mediaplaene where campaign = 'Frühjahrs-Kampagne 2026' limit 1;
insert into public.mediaplan_positionen (mediaplan_id, title, description, tag, brutto, discount_text, kundenpreis, status_tags, sort_order)
select id, 'TV Spot - Prime Time', 'Frühlingsaktion - Welle 2, 12 Spots', 'Sichtbarkeit', 110000, '-8% (7.600,00 CHF)', 103132, array['Reporting','Offen'], 3 from public.mediaplaene where campaign = 'Frühjahrs-Kampagne 2026' limit 1;
