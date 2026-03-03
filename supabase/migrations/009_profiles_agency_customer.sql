-- Benutzerprofile mit Unterscheidung Agentur-Mitarbeiter vs. Kunde
-- Rolle wird beim Signup über user_metadata.role gesetzt, Standard: customer

create type public.user_role as enum ('agency', 'customer');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index für Abfragen nach Rolle
create index if not exists profiles_role_idx on public.profiles(role);

alter table public.profiles enable row level security;

-- Nutzer können eigenes Profil lesen und aktualisieren (z. B. full_name)
create policy "Eigenes Profil lesen"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Eigenes Profil aktualisieren"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Agentur-Mitarbeiter können alle Profile lesen (für Kundenverwaltung)
create policy "Agentur liest alle Profile"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'agency'
    )
  );

-- Nur Agentur darf Rolle setzen/ändern (über Service-Role oder separaten Endpoint)
-- Einfacher Einstieg: Insert nur per Trigger; Rolle später im Dashboard änderbar
create policy "Profil einfügen (nur Trigger)"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger: Bei neuem Auth-User automatisch Profil anlegen
-- Rolle aus raw_user_meta_data.role (beim Signup setzbar), sonst 'customer'
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  user_role text;
begin
  user_role := coalesce(
    nullif(trim(new.raw_user_meta_data->>'role'), ''),
    'customer'
  );
  if user_role not in ('agency', 'customer') then
    user_role := 'customer';
  end if;

  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    user_role::public.user_role,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Bestehende Auth-User: Profile nachziehen (einmalig ausführbar)
insert into public.profiles (id, role, full_name)
select
  id,
  'customer'::public.user_role,
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name')
from auth.users
on conflict (id) do nothing;

comment on table public.profiles is 'Benutzerprofile: agency = Agentur-Mitarbeiter, customer = Kunde';
