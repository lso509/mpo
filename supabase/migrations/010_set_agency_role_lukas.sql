-- Lukas (lukas@co-agency.li) als Agentur-Mitarbeiter setzen
update public.profiles
set role = 'agency'::public.user_role, updated_at = now()
where id = (select id from auth.users where email = 'lukas@co-agency.li' limit 1);
