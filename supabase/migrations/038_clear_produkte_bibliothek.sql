-- Produktbibliothek vollständig leeren (einmaliger Stand vor Neuimport).
-- mediaplan_positionen: produkt_id → NULL (on delete set null)
-- produkt_task_vorlagen, product_mm_tariffs, product_fixed_formats, produkt_aenderungshistorie → cascade

delete from public.produkte;
