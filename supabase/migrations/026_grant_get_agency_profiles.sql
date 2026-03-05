-- RPC für authentifizierte Nutzer aufrufbar machen (für Kundenberater-Auswahl)
grant execute on function public.get_agency_profiles() to authenticated;
