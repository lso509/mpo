# Storage-Buckets (produkt-bilder, produkt-dateien)

Die Buckets werden von der Migration `029_storage_produkte.sql` angelegt.

## Option A: Supabase CLI (empfohlen)

```bash
supabase db push
```

(Oder nur die fehlenden Migrationen ausführen.)

## Option B: Manuell im Supabase Dashboard

1. **Supabase Dashboard** → dein Projekt → **SQL Editor**
2. Neuen Query anlegen und den Inhalt von `029_storage_produkte.sql` einfügen
3. **Run** ausführen

Danach existieren die Buckets `produkt-bilder` und `produkt-dateien` und Bild-/Datei-Uploads funktionieren.
