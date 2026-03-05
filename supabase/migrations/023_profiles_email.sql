-- E-Mail in profiles für Auswahl Kundenberater (Agentur-User)
alter table public.profiles
  add column if not exists email text;

comment on column public.profiles.email is 'E-Mail des Benutzers (aus auth.users übernommen)';

-- Backfill aus auth.users (Migration läuft mit ausreichenden Rechten)
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and (p.email is null or p.email = '');

-- Trigger-Funktion erweitern: E-Mail beim Anlegen setzen
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

  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    user_role::public.user_role,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email
  );
  return new;
end;
$$;
