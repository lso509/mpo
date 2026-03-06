-- Lieferanten / Werbeträger-Kontakte (aus werbetraeger_kontakte.xlsx)

create table if not exists public.lieferanten (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  firmenname text not null,
  strasse text,
  plz text,
  ort text,
  land text,
  telefon text,
  email text,
  website text,
  ansprechpartner text,
  kategorie_werbeform text
);

alter table public.lieferanten enable row level security;

create policy "Lieferanten lesbar für alle"
  on public.lieferanten for select using (true);
create policy "Lieferanten einfügen"
  on public.lieferanten for insert with check (true);
create policy "Lieferanten aktualisieren"
  on public.lieferanten for update using (true);
create policy "Lieferanten löschen"
  on public.lieferanten for delete using (true);

comment on table public.lieferanten is 'Medien-Lieferanten / Werbeträger-Kontakte';

-- Seed aus werbetraeger_kontakte.xlsx
insert into public.lieferanten (firmenname, strasse, plz, ort, land, telefon, email, website, ansprechpartner, kategorie_werbeform)
values
  ('APG|SGA Allgemeine Plakatgesellschaft AG', 'Giesshübelstrasse 4', '8027', 'Zürich', 'Schweiz', '+41 58 220 70 00', 'contact@apgsga.ch', 'https://www.apgsga.ch', 'Michael Sutter – Head of Sales Regions', 'OOH / DOOH / Plakatwerbung'),
  ('Vaduzer Medienhaus AG', 'Austrasse 81', '9490', 'Vaduz', 'Liechtenstein', '+423 236 16 16', 'info@medienhaus.li', 'https://www.medienhaus.li', 'Claudio Boss – Verkauf / Marketing', 'Print / Digital / OOH / Events'),
  ('Google Ireland Limited', 'Gordon House, Barrow Street', 'D04', 'Dublin', 'Irland', '+353 1 543 1000', null, 'https://ads.google.com', 'Account Manager über Google Ads', 'Digital Advertising (Search, Display)'),
  ('YouTube (Google Ireland Limited)', 'Gordon House, Barrow Street', 'D04', 'Dublin', 'Irland', '+353 1 543 1000', null, 'https://www.youtube.com/ads', 'Google Ads Account Manager', 'Digital Video Advertising'),
  ('Goldbach Group AG', 'Seestrasse 39', '8700', 'Küsnacht', 'Schweiz', '+41 44 914 91 00', 'info@goldbach.com', 'https://goldbach.com', 'Sales Team DOOH', 'DOOH / Mega Screens'),
  ('Progress Werbung AG', 'Förrlibuckstrasse 70', '8005', 'Zürich', 'Schweiz', '+41 44 308 25 00', 'info@progress.ch', 'https://www.progress.ch', 'Sales Team', 'OOH / Kulturplakate / DOOH'),
  ('Weischer.Cinema Schweiz GmbH', 'Hardstrasse 235', '8005', 'Zürich', 'Schweiz', '+41 44 500 16 00', 'info@weischer-cinema.ch', 'https://www.weischer-cinema.ch', 'Cinema Advertising Sales', 'Kinowerbung'),
  ('Spotify AB', 'Regeringsgatan 19', '11153', 'Stockholm', 'Schweden', null, null, 'https://ads.spotify.com', 'Spotify Advertising Team', 'Digital Audio Advertising'),
  ('Liechtensteiner Plakatgesellschaft AG', 'Im alten Riet 121', '9494', 'Schaan', 'Liechtenstein', '+423 388 11 88', 'info@lieplakate.li', 'https://www.lieplakate.li', 'Sales Team', 'OOH / Plakatwerbung'),
  ('ÖBB Werbung GmbH', 'Am Hauptbahnhof 2', '1100', 'Wien', 'Österreich', '+43 1 93000', 'werbung@oebb.at', 'https://werbung.oebb.at', 'Sales Team', 'OOH / DOOH Bahnhofswerbung');
