-- =============================================================================
-- Beispielhafte Änderungshistorie: 3 Einträge pro Produkt
-- =============================================================================

insert into public.produkt_aenderungshistorie (produkt_id, changed_by, change_description, created_at)
select id, 'Sarah Müller', 'Preis Netto CHF: von 800 auf 850', now() - interval '10 days'
from public.produkte
union all
select id, 'Thomas Weber', 'Kategorie: von Kino auf Aussenwerbung', now() - interval '5 days'
from public.produkte
union all
select id, 'Sarah Müller', 'Laufzeit: von 1 Woche auf 2 Wochen', now() - interval '1 day'
from public.produkte;
