-- Grösse-Einheit (px/mm/cm) und Währung (CHF/EUR) für Produkte
alter table public.produkte add column if not exists creative_groesse_einheit text default 'px';
alter table public.produkte add column if not exists waehrung text default 'CHF';
