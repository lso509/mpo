-- Avatar-URL (Google/Provider-Profilbild) für Kundenberater-Auswahl mitliefern.
-- Quelle: auth.users.raw_user_meta_data (picture / avatar_url von OAuth).
-- Return-Type geändert (avatar_url hinzugefügt) → Funktion zuerst droppen.

drop function if exists public.get_agency_profiles();

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
  if not public.is_agency_user() then
    return;
  end if;
  return query
    select
      p.id,
      p.full_name,
      p.email,
      (
        select coalesce(
          u.raw_user_meta_data->>'avatar_url',
          u.raw_user_meta_data->>'picture'
        )
        from auth.users u
        where u.id = p.id
        limit 1
      )
    from public.profiles p
    where p.role = 'agency'::public.user_role
    order by p.full_name nulls last, p.email nulls last;
end;
$$;

comment on function public.get_agency_profiles() is 'Gibt alle Profile mit Rolle agency inkl. Avatar-URL (Google/OAuth) zurück.';

grant execute on function public.get_agency_profiles() to authenticated;
