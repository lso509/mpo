-- RPC: Liste aller Agentur-User (id, full_name, email) für Kundenberater-Auswahl.
-- Nur für eingeloggte User mit Rolle agency aufrufbar; umgeht Filter auf reserviertes Spaltenwort "role".

create or replace function public.get_agency_profiles()
returns table (
  id uuid,
  full_name text,
  email text,
  avatar_url text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_agency_user() then return; end if;
  return query
    select
      p.id,
      p.full_name,
      p.email,
      (select coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture') from auth.users u where u.id = p.id limit 1)
    from public.profiles p
    where p.role = 'agency'::public.user_role
    order by p.full_name nulls last, p.email nulls last;
end;
$$;

comment on function public.get_agency_profiles() is 'Gibt alle Profile mit Rolle agency zurück. Nur aufrufbar für User mit Rolle agency.';
