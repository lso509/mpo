-- Optional: Spalte für archivierte Produkte (Filter in der App)
alter table public.produkte add column if not exists archived boolean default false;
