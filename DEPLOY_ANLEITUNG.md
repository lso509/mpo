# App online bringen – Schritt für Schritt

## Voraussetzung
- Dein Projekt liegt in einem Ordner (z.B. `nextjs-app`)
- Du hast die Supabase-Datenbank eingerichtet (Migration `001_fresh_start.sql` ausgeführt)

---

## Schritt 1: Git-Repository anlegen (falls noch nicht geschehen)

1. Terminal im Projektordner öffnen:
   ```bash
   cd /Users/Lukas/dev/nextjs-app
   ```

2. Prüfen, ob schon ein Git-Repo existiert:
   ```bash
   git status
   ```
   - Wenn **kein** Repository existiert:
     ```bash
     git init
     ```

3. Alle Dateien zur ersten Version hinzufügen:
   ```bash
   git add .
   git commit -m "Erste Version für Deploy"
   ```

---

## Schritt 2: Repository zu GitHub pushen

1. Auf **https://github.com** einloggen (oder Account anlegen).

2. **Neues Repository** erstellen:
   - Klick auf **„+“** (oben rechts) → **„New repository“**
   - Name z.B.: **nextjs-app**
   - **Public** wählen
   - **„Create repository“** klicken (ohne README/ .gitignore hinzufügen)

3. Im Terminal dein lokales Repo mit GitHub verbinden und pushen  
   (die URL ersetzt du durch die URL von deinem neuen Repo, z.B. `https://github.com/DEIN-USERNAME/nextjs-app.git`):
   ```bash
   git remote add origin https://github.com/DEIN-USERNAME/nextjs-app.git
   git branch -M main
   git push -u origin main
   ```
   Falls du schon einen anderen Branch nutzt (z.B. `master`), nimm diesen statt `main`.

---

## Schritt 3: Vercel-Account und Projekt importieren

1. Auf **https://vercel.com** gehen und mit **GitHub** anmelden („Continue with GitHub“).

2. Nach dem Login:
   - **„Add New…“** → **„Project“** klicken

3. Dein Repository **nextjs-app** aus der Liste wählen → **„Import“**.

4. **Einstellungen** (meist so lassen):
   - Framework Preset: **Next.js**
   - Root Directory: leer
   - Build Command: `next build`
   - Output Directory: (leer, Standard)
   - **„Environment Variables“** erst im nächsten Schritt ausfüllen → zuerst **„Deploy“** nicht klicken.

---

## Schritt 4: Supabase-Umgebungsvariablen in Vercel eintragen

1. **Supabase Dashboard** öffnen: https://supabase.com/dashboard  
   → Dein Projekt wählen.

2. **Project Settings** (Zahnrad links unten) → **API**:
   - **Project URL** kopieren (z.B. `https://xxxxx.supabase.co`)
   - **anon public** Key kopieren (unter „Project API keys“)

3. Zurück zu **Vercel** (Import-Screen deines Projekts):
   - Bei **„Environment Variables“** auf **„Add“** oder die Felder ausklappen.

4. Zwei Variablen anlegen:

   | Name | Value | Environment |
   |------|--------|--------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | deine Project URL | Production (und ggf. Preview) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dein anon Key | Production (und ggf. Preview) |

   Für beide: Haken bei **Production** (und optional **Preview**) setzen, dann **Save**.

5. Jetzt **„Deploy“** klicken.

---

## Schritt 5: Deploy abwarten und URL öffnen

1. Vercel baut die App (ca. 1–2 Minuten).  
   Wenn der Build grün ist, siehst du **„Congratulations!“** und eine URL, z.B.  
   **https://nextjs-app-xxx.vercel.app**

2. URL im Browser öffnen – deine App läuft online.

3. **Spätere Updates:** Einfach Änderungen committen und nach GitHub pushen:
   ```bash
   git add .
   git commit -m "Beschreibung der Änderung"
   git push
   ```
   Vercel startet dann automatisch einen neuen Deploy.

---

## Schritt 6: Supabase für die Live-URL einstellen (wichtig bei Login/Auth)

Falls du später **Supabase Auth** (Login/Registrierung) nutzt:

1. **Supabase Dashboard** → **Authentication** → **URL Configuration**

2. **Site URL** auf deine Vercel-URL setzen, z.B.:  
   `https://nextjs-app-xxx.vercel.app`

3. Unter **Redirect URLs** die gleiche URL eintragen (und ggf. `https://*.vercel.app`), dann speichern.

---

## Kurz-Checkliste

- [ ] Git-Repo angelegt und erster Commit
- [ ] Repo zu GitHub gepusht
- [ ] Bei Vercel mit GitHub angemeldet
- [ ] Projekt „nextjs-app“ importiert
- [ ] `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel gesetzt
- [ ] Deploy gestartet und erfolgreich
- [ ] Live-URL getestet
- [ ] (Optional) Site URL in Supabase gesetzt

Wenn etwas nicht klappt: Bei welchem Schritt es hakt, kurz beschreiben (z.B. „Fehler beim git push“ oder „Build schlägt fehl“), dann können wir den Schritt gezielt durchgehen.
