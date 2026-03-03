-- =============================================================================
-- Frischer Start: Alle Tabellen + RLS + Beispieldaten
-- Nach dem Zurücksetzen der Supabase-Datenbank: Im SQL Editor einmal ausführen.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabelle: produkte (vollständiges Schema für Produktkatalog)
-- -----------------------------------------------------------------------------
create table if not exists public.produkte (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  -- Kategorie & Basis
  category text,
  kategorie text,
  name text,
  produktvariante_titel text,
  verlag text,
  kanal text,
  produktgruppe text,
  -- Platzierung & Infos
  platzierung text,
  position text,
  spec text,
  placement text,
  zusatzinformationen text,
  ziel_eignung text,
  -- Creative
  beispiel_bild text,
  creative_farbe text,
  creative_dateityp text,
  creative_groesse text,
  creative_typ text,
  creative_deadline_tage integer,
  size text,
  -- Laufzeit & Preise
  laufzeit_pro_einheit text,
  duration text,
  preis_brutto_chf numeric,
  preis_netto_chf numeric,
  preis_agenturservice numeric,
  net_price text,
  net_total text,
  mindestbudget numeric,
  min_budget text,
  empfohlenes_medienbudget text,
  buchungsvoraussetzung text
);

alter table public.produkte enable row level security;

create policy "Produkte lesbar für alle"
  on public.produkte for select using (true);
create policy "Produkte einfügen"
  on public.produkte for insert with check (true);
create policy "Produkte aktualisieren"
  on public.produkte for update using (true);
create policy "Produkte löschen"
  on public.produkte for delete using (true);

-- 3 Beispielprodukte
insert into public.produkte (
  category, kategorie, name, produktvariante_titel, spec, platzierung, placement,
  size, creative_groesse, duration, laufzeit_pro_einheit,
  preis_netto_chf, net_price, net_total, mindestbudget, min_budget
)
values
  ('Aussenwerbung', 'Aussenwerbung', 'LIEWAND Screen-FL', 'LIEWAND Screen-FL', '2,9 x 2 Meter', 'Zollstrasse Schaan + Essanw...', 'Zollstrasse Schaan + Essanw...', '648 x 432 Pixel', '648 x 432 Pixel', '1 Woche', '1 Woche', 850.00, '850.00', '850.00', 100.00, '100.00'),
  ('Aussenwerbung', 'Aussenwerbung', 'Mega Screens Screen-CH', 'Mega Screens Screen-CH', 'Mega Screens', '15 Sek. Spotlänge', '15 Sek. Spotlänge', 'div.', 'div.', '1 Woche', '1 Woche', 13132.80, '13132.80', '13132.80', 0.00, '0.00'),
  ('KINO', 'KINO', 'CineMotion Kino-FL', 'CineMotion Kino-FL', '10 Sek. Spot', 'Kino FL', 'Kino FL', 'Full HD', 'Full HD', '1 Woche', '1 Woche', 2400.00, '2400.00', '2400.00', 1200.00, '1200.00');

-- -----------------------------------------------------------------------------
-- Tabelle: aufgaben (Dashboard)
-- -----------------------------------------------------------------------------
create table if not exists public.aufgaben (
  id uuid primary key default gen_random_uuid(),
  client text not null,
  campaign text not null,
  campaign_wave text,
  status text not null check (status in ('Offen', 'Erledigt', 'Nicht relevant')),
  task text not null,
  task_type_tag text check (task_type_tag in ('purple', 'orange', 'blue', 'green')),
  due_date text not null,
  assignee text not null,
  section text not null check (section in ('overdue', 'next7', 'allOpen')),
  created_at timestamptz default now()
);

alter table public.aufgaben enable row level security;

create policy "Aufgaben lesbar für alle"
  on public.aufgaben for select using (true);
create policy "Aufgaben einfügen"
  on public.aufgaben for insert with check (true);
create policy "Aufgaben aktualisieren"
  on public.aufgaben for update using (true);
create policy "Aufgaben löschen"
  on public.aufgaben for delete using (true);

-- Beispieldaten Aufgaben
insert into public.aufgaben (client, campaign, campaign_wave, status, task, task_type_tag, due_date, assignee, section)
values
  ('Acme Corp', 'Digitale Kampagne Q1', 'Frühlingsaktion - Welle 1', 'Offen', 'Kampagnenbriefing erstellen', 'purple', '15.02.2026', 'Sarah Müller', 'overdue'),
  ('TechStart GmbH', 'Social Media Paket', null, 'Offen', 'Einbuchung bei Verlag', 'orange', '17.02.2026', 'Mike Schmidt', 'overdue'),
  ('Global Solutions', 'Print-Medien', null, 'Erledigt', 'Kampagnensetup (intern)', 'blue', '25.02.2026', 'Emma Weber', 'next7'),
  ('RetailCo', 'TV-Spots', null, 'Offen', 'Freigabestatus prüfen', 'blue', '26.02.2026', 'Hans Meier', 'next7'),
  ('FinanceHub', 'Online-Banner', null, 'Nicht relevant', 'Einbuchung bei Verlag', 'orange', '05.03.2026', 'Sarah Müller', 'allOpen'),
  ('HealthPlus', 'Radio-Kampagne', null, 'Erledigt', 'Creatives bereitstellen', 'purple', '10.03.2026', 'Mike Schmidt', 'allOpen'),
  ('AutoDrive', 'Außenwerbung', null, 'Nicht relevant', 'Kampagnenbriefing erstellen', 'green', '15.03.2026', 'Emma Weber', 'allOpen');
