-- Cola · modifica del 17/11/2026: scheda Addestramento
-- Per chi ha già eseguito schema.sql: da eseguire nel SQL Editor. schema.sql la contiene già.
-- In più rende facoltativo il giorno del diario (tappe da datare). Si può rieseguire senza danni.

alter table public.cola_diario alter column il drop not null;

-- Un trick per riga. Tre livelli di affidabilità, ognuno con il giorno in cui è arrivato.
create table if not exists public.cola_trick (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null check (char_length(btrim(nome)) between 1 and 60),
  comando         text check (char_length(comando) <= 80),        -- la parola o il gesto
  stato           text not null default 'da-iniziare' check (stato in ('da-iniziare', 'in-corso', 'imparato')),
  iniziato_il     date,
  casa_il         date,
  fuori_il        date,
  distrazioni_il  date,
  imparato_il     date,
  note            text check (char_length(note) <= 2000),
  creato_da       uuid default auth.uid() references auth.users (id) on delete set null,
  creato_il       timestamptz not null default now()
);

revoke all on public.cola_trick from anon, authenticated;
grant select, insert, update, delete on public.cola_trick to authenticated;
alter table public.cola_trick enable row level security;
drop policy if exists "cola_trick: membri" on public.cola_trick;
create policy "cola_trick: membri" on public.cola_trick
  for all to authenticated using ((select public.cola_membro())) with check ((select public.cola_membro()));
