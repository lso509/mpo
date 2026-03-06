-- Storage-Buckets für Produktbilder und Mediadatenblätter
insert into storage.buckets (id, name, public)
values
  ('produkt-bilder', 'produkt-bilder', true),
  ('produkt-dateien', 'produkt-dateien', false)
on conflict (id) do update set public = excluded.public;

-- RLS Policies Storage (storage.objects)
drop policy if exists "Produktbilder lesen" on storage.objects;
drop policy if exists "Produktbilder hochladen" on storage.objects;
drop policy if exists "Produktbilder löschen" on storage.objects;
drop policy if exists "Produktdateien lesen" on storage.objects;
drop policy if exists "Produktdateien hochladen" on storage.objects;
drop policy if exists "Produktdateien löschen" on storage.objects;

-- Produkt-Bilder: jeder kann lesen, nur Agency darf hochladen/löschen
create policy "Produktbilder lesen"
  on storage.objects for select
  using (bucket_id = 'produkt-bilder');

create policy "Produktbilder hochladen"
  on storage.objects for insert
  with check (
    bucket_id = 'produkt-bilder'
    and (select public.is_agency_user())
  );

create policy "Produktbilder löschen"
  on storage.objects for delete
  using (
    bucket_id = 'produkt-bilder'
    and (select public.is_agency_user())
  );

-- Produkt-Dateien: nur eingeloggte User
create policy "Produktdateien lesen"
  on storage.objects for select
  using (
    bucket_id = 'produkt-dateien'
    and auth.role() = 'authenticated'
  );

create policy "Produktdateien hochladen"
  on storage.objects for insert
  with check (
    bucket_id = 'produkt-dateien'
    and auth.role() = 'authenticated'
  );

create policy "Produktdateien löschen"
  on storage.objects for delete
  using (
    bucket_id = 'produkt-dateien'
    and auth.role() = 'authenticated'
  );

-- Spalten in produkte für Bild-URL und Datei-Metadaten
alter table public.produkte
  add column if not exists bild_url text,
  add column if not exists dateien jsonb default '[]'::jsonb;

comment on column public.produkte.bild_url is 'Öffentliche URL des Produktbilds (Supabase Storage produkt-bilder)';
comment on column public.produkte.dateien is 'Mediadatenblätter: [{ name, url, path, size, type, uploaded_at }]';
