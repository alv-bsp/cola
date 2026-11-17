-- Cola · modifica del 17/11/2026: dog sitter e pensioni
-- Per chi ha già eseguito schema.sql: da eseguire nel SQL Editor. schema.sql la contiene già.
-- Si può rieseguire senza danni.

create table if not exists public.cola_soggiorni (
  id        uuid primary key default gen_random_uuid(),
  tipo      text not null default 'dog-sitter' check (tipo in ('dog-sitter', 'pensione')),
  nome      text not null check (char_length(btrim(nome)) between 1 and 80),
  citta     text check (char_length(citta) <= 60),
  dal       date not null,
  al        date check (al is null or al >= dal),
  giudizio  text check (giudizio in ('su', 'medio', 'giu')),   -- vuoto = non ancora dato
  note      text check (char_length(note) <= 1000),
  creato_da uuid default auth.uid() references auth.users (id) on delete set null,
  creato_il timestamptz not null default now()
);
create index if not exists cola_soggiorni_dal_idx on public.cola_soggiorni (dal);

revoke all on public.cola_soggiorni from anon, authenticated;
grant select, insert, update, delete on public.cola_soggiorni to authenticated;
alter table public.cola_soggiorni enable row level security;
drop policy if exists "cola_soggiorni: membri" on public.cola_soggiorni;
create policy "cola_soggiorni: membri" on public.cola_soggiorni
  for all to authenticated using ((select public.cola_membro())) with check ((select public.cola_membro()));
