-- Behebt "infinite recursion detected in policy for relation profiles":
-- Die Policy "Agentur liest alle Profile" hat per SELECT auf profiles geprüft,
-- was beim Lesen von profiles dieselbe Policy wieder auslöst.
-- Lösung: Prüfung in eine SECURITY DEFINER-Funktion auslagern (läuft ohne RLS).

create or replace function public.is_agency_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'agency'::public.user_role
  );
$$;

comment on function public.is_agency_user() is 'Prüft, ob der aktuelle User die Rolle agency hat. Für RLS-Policies, um Rekursion zu vermeiden.';

drop policy if exists "Agentur liest alle Profile" on public.profiles;

create policy "Agentur liest alle Profile"
  on public.profiles for select
  using (public.is_agency_user());
