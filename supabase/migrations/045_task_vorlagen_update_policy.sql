-- Erlaubt das Aktualisieren von Task-Vorlagen über den Client (RLS)

alter table public.task_vorlagen enable row level security;

drop policy if exists "Task-Vorlagen aktualisierbar für alle" on public.task_vorlagen;
create policy "Task-Vorlagen aktualisierbar für alle"
on public.task_vorlagen
for update
using (true)
with check (true);
