-- MM-Produkttyp: pricing_type, edition_type, min_charge + Tarif/Fixformat-Tabellen

alter table public.produkte
  add column if not exists pricing_type text not null default 'fixed',
  add column if not exists edition_type text not null default 'na',
  add column if not exists min_charge numeric;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'produkte_pricing_type_check'
      and conrelid = 'public.produkte'::regclass
  ) then
    alter table public.produkte
      add constraint produkte_pricing_type_check
      check (pricing_type in ('fixed', 'per_mm'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'produkte_edition_type_check'
      and conrelid = 'public.produkte'::regclass
  ) then
    alter table public.produkte
      add constraint produkte_edition_type_check
      check (edition_type in ('na', 'ga', 'both'));
  end if;
end $$;

create table if not exists public.product_mm_tariffs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.produkte(id) on delete cascade,
  category text not null,
  price_per_mm_na numeric,
  price_per_mm_ga numeric,
  column_widths jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_mm_tariffs enable row level security;

drop policy if exists "MM-Tarife lesbar für alle" on public.product_mm_tariffs;
drop policy if exists "MM-Tarife einfügen" on public.product_mm_tariffs;
drop policy if exists "MM-Tarife aktualisieren" on public.product_mm_tariffs;
drop policy if exists "MM-Tarife löschen" on public.product_mm_tariffs;

create policy "MM-Tarife lesbar für alle"
  on public.product_mm_tariffs for select using (true);
create policy "MM-Tarife einfügen"
  on public.product_mm_tariffs for insert with check (true);
create policy "MM-Tarife aktualisieren"
  on public.product_mm_tariffs for update using (true);
create policy "MM-Tarife löschen"
  on public.product_mm_tariffs for delete using (true);

create table if not exists public.product_fixed_formats (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.produkte(id) on delete cascade,
  format_name text not null,
  width_mm integer,
  height_mm integer,
  columns integer,
  price_na numeric,
  price_ga numeric,
  format_type text check (format_type in ('annonce', 'textanschluss')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_fixed_formats enable row level security;

drop policy if exists "Fixformate lesbar für alle" on public.product_fixed_formats;
drop policy if exists "Fixformate einfügen" on public.product_fixed_formats;
drop policy if exists "Fixformate aktualisieren" on public.product_fixed_formats;
drop policy if exists "Fixformate löschen" on public.product_fixed_formats;

create policy "Fixformate lesbar für alle"
  on public.product_fixed_formats for select using (true);
create policy "Fixformate einfügen"
  on public.product_fixed_formats for insert with check (true);
create policy "Fixformate aktualisieren"
  on public.product_fixed_formats for update using (true);
create policy "Fixformate löschen"
  on public.product_fixed_formats for delete using (true);
