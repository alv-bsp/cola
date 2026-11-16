-- Cola · schema v1
-- Da eseguire una volta nel SQL Editor del progetto Supabase di Cosa mangiamo (tu e Giulia).
-- Tutto ha il prefisso cola_: la tabella kv di Cosa mangiamo e le sue policy non vengono toccate.
-- Le tabelle nuove non sono esposte alle API senza GRANT esplicito: i grant sono qui sotto.
--
-- I dati di Cola sono di casa, non di una persona: li vedono e li modificano tutti i membri (cola_membri).
-- In fondo al file i membri vengono presi da auth.users: con le registrazioni chiuse ci siete solo voi due.

-- ─── Membri ─────────────────────────────────────────────────────────
create table public.cola_membri (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  nome        text check (char_length(nome) <= 120),
  aggiunto_il timestamptz not null default now()
);

-- Vero se chi chiama è un membro. Gira con i permessi di chi chiama: legge solo la propria riga di cola_membri.
create function public.cola_membro() returns boolean
language sql stable set search_path = '' as $$
  select exists (select 1 from public.cola_membri m where m.user_id = (select auth.uid()))
$$;
revoke execute on function public.cola_membro() from public, anon;
grant execute on function public.cola_membro() to authenticated;

-- ─── Profilo: una riga sola ─────────────────────────────────────────
create table public.cola_profilo (
  id               smallint primary key default 1 check (id = 1),
  nome             text not null default 'Cola' check (char_length(btrim(nome)) between 1 and 40),
  nome_registrato  text check (char_length(nome_registrato) <= 80),
  razza            text check (char_length(razza) <= 60),
  sesso            text check (sesso in ('femmina', 'maschio')),
  nata_il          date,
  presa_il         date,
  provenienza      text check (char_length(provenienza) <= 120),
  microchip        text check (char_length(microchip) <= 40),
  passaporto       text check (char_length(passaporto) <= 40),     -- numero del passaporto europeo
  pedigree         text check (char_length(pedigree) <= 60),       -- numero ENCI / ROI
  sterilizzata_il  date,
  crocchette       text check (char_length(crocchette) <= 120),
  razione_g        smallint check (razione_g between 1 and 2000), -- grammi al giorno
  pasti            text check (char_length(pasti) <= 300),         -- quanti, a che ora, regole della ciotola
  garrese_cm       numeric(4, 1) check (garrese_cm between 5 and 120),
  garrese_il       date,
  collo_cm         numeric(4, 1) check (collo_cm between 5 and 100),
  peso_adulto_min  numeric(4, 1) check (peso_adulto_min between 1 and 100),
  peso_adulto_max  numeric(4, 1) check (peso_adulto_max between 1 and 100),
  foto             text,   -- percorso nel bucket "cola": profilo/<versione>.<webp|jpg>
  miniatura        text,   -- stesso schema, file -mini
  note             text check (char_length(note) <= 4000),
  modificato_il    timestamptz not null default now(),
  check (peso_adulto_min is null or peso_adulto_max is null or peso_adulto_min <= peso_adulto_max)
);

-- ─── Contatti ───────────────────────────────────────────────────────
create table public.cola_contatti (
  id        uuid primary key default gen_random_uuid(),
  ruolo     text not null default 'altro'
            check (ruolo in ('veterinario', 'clinica', 'ats', 'pet-sitter', 'toelettatura', 'addestratore', 'allevatore', 'altro')),
  nome      text not null check (char_length(btrim(nome)) between 1 and 80),
  telefono  text check (char_length(telefono) <= 40),
  email     text check (char_length(email) <= 120),
  indirizzo text check (char_length(indirizzo) <= 200),
  note      text check (char_length(note) <= 1000),
  creato_da uuid default auth.uid() references auth.users (id) on delete set null,
  creato_il timestamptz not null default now()
);

-- ─── Pesate ─────────────────────────────────────────────────────────
create table public.cola_pesi (
  id        uuid primary key default gen_random_uuid(),
  il        date not null,
  kg        numeric(4, 1) not null check (kg > 0 and kg < 100),
  nota      text check (char_length(nota) <= 300),
  creato_da uuid default auth.uid() references auth.users (id) on delete set null,
  creato_il timestamptz not null default now()
);
create index cola_pesi_il_idx on public.cola_pesi (il);

-- ─── Calori ─────────────────────────────────────────────────────────
-- fine vuota = in corso (o non segnata: dopo qualche settimana l'app la stima).
create table public.cola_calori (
  id        uuid primary key default gen_random_uuid(),
  inizio    date not null,
  fine      date check (fine is null or fine >= inizio),
  note      text check (char_length(note) <= 1000),
  creato_da uuid default auth.uid() references auth.users (id) on delete set null,
  creato_il timestamptz not null default now()
);
create index cola_calori_inizio_idx on public.cola_calori (inizio);

-- ─── Salute: vaccini, trattamenti, visite ───────────────────────────
-- Un evento per riga. prossimo_il è il richiamo o la prossima dose: la scadenza la dà l'ultimo evento
-- dello stesso tipo e nome.
create table public.cola_salute (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null
              check (tipo in ('vaccino', 'antiparassitario', 'vermifugo', 'filaria', 'farmaco', 'visita', 'esame', 'altro')),
  nome        text not null check (char_length(btrim(nome)) between 1 and 80),
  il          date not null,
  prossimo_il date check (prossimo_il is null or prossimo_il > il),
  veterinario text check (char_length(veterinario) <= 80),
  note        text check (char_length(note) <= 2000),
  creato_da   uuid default auth.uid() references auth.users (id) on delete set null,
  creato_il   timestamptz not null default now()
);
create index cola_salute_il_idx on public.cola_salute (il);

-- ─── Cose da fare ───────────────────────────────────────────────────
create table public.cola_cose (
  id        uuid primary key default gen_random_uuid(),
  testo     text not null check (char_length(btrim(testo)) between 1 and 160),
  entro     date,
  nota      text check (char_length(nota) <= 1000),
  fatta_il  timestamptz,
  fatta_da  uuid references auth.users (id) on delete set null,
  creato_da uuid default auth.uid() references auth.users (id) on delete set null,
  creato_il timestamptz not null default now()
);

-- ─── Diario: tappe e note ───────────────────────────────────────────
-- il vuoto = tappa ancora da datare (compare in cima al Diario finché non ha un giorno).
create table public.cola_diario (
  id        uuid primary key default gen_random_uuid(),
  il        date,
  titolo    text not null check (char_length(btrim(titolo)) between 1 and 120),
  testo     text check (char_length(testo) <= 4000),
  creato_da uuid default auth.uid() references auth.users (id) on delete set null,
  creato_il timestamptz not null default now()
);
create index cola_diario_il_idx on public.cola_diario (il);

-- ─── Data di modifica del profilo ───────────────────────────────────
create function public.cola_profilo_modificato() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.modificato_il := now();
  return new;
end $$;
revoke execute on function public.cola_profilo_modificato() from public, anon, authenticated;
create trigger cola_profilo_modificato before update on public.cola_profilo
  for each row execute function public.cola_profilo_modificato();

-- ─── Permessi (grant) ───────────────────────────────────────────────
-- Prima si toglie tutto, poi si concede il minimo. anon (chi non ha fatto login) non vede nessuna tabella.
revoke all on public.cola_membri, public.cola_profilo, public.cola_contatti, public.cola_pesi,
  public.cola_calori, public.cola_salute, public.cola_cose, public.cola_diario from anon, authenticated;
grant select                         on public.cola_membri   to authenticated;
grant select, insert, update         on public.cola_profilo  to authenticated;
grant select, insert, update, delete on public.cola_contatti to authenticated;
grant select, insert, update, delete on public.cola_pesi     to authenticated;
grant select, insert, update, delete on public.cola_calori   to authenticated;
grant select, insert, update, delete on public.cola_salute   to authenticated;
grant select, insert, update, delete on public.cola_cose     to authenticated;
grant select, insert, update, delete on public.cola_diario   to authenticated;

-- ─── Row Level Security ─────────────────────────────────────────────
alter table public.cola_membri   enable row level security;
alter table public.cola_profilo  enable row level security;
alter table public.cola_contatti enable row level security;
alter table public.cola_pesi     enable row level security;
alter table public.cola_calori   enable row level security;
alter table public.cola_salute   enable row level security;
alter table public.cola_cose     enable row level security;
alter table public.cola_diario   enable row level security;

-- Ognuno vede solo la propria riga: basta a cola_membro() per rispondere. I membri si cambiano dal SQL Editor.
create policy "cola_membri: la mia riga" on public.cola_membri
  for select to authenticated using (user_id = (select auth.uid()));

create policy "cola_profilo: membri" on public.cola_profilo
  for all to authenticated using ((select public.cola_membro())) with check ((select public.cola_membro()));
create policy "cola_contatti: membri" on public.cola_contatti
  for all to authenticated using ((select public.cola_membro())) with check ((select public.cola_membro()));
create policy "cola_pesi: membri" on public.cola_pesi
  for all to authenticated using ((select public.cola_membro())) with check ((select public.cola_membro()));
create policy "cola_calori: membri" on public.cola_calori
  for all to authenticated using ((select public.cola_membro())) with check ((select public.cola_membro()));
create policy "cola_salute: membri" on public.cola_salute
  for all to authenticated using ((select public.cola_membro())) with check ((select public.cola_membro()));
create policy "cola_cose: membri" on public.cola_cose
  for all to authenticated using ((select public.cola_membro())) with check ((select public.cola_membro()));
create policy "cola_diario: membri" on public.cola_diario
  for all to authenticated using ((select public.cola_membro())) with check ((select public.cola_membro()));

-- ─── Foto: bucket privato ───────────────────────────────────────────
-- Per ora solo la foto del profilo (profilo/<versione>.<webp|jpg>). Lettura solo con signed URL.
-- Niente update: una foto nuova è un file nuovo, la vecchia si cancella.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cola', 'cola', false, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

create policy "cola foto: i membri leggono" on storage.objects
  for select to authenticated using (bucket_id = 'cola' and (select public.cola_membro()));
create policy "cola foto: i membri caricano" on storage.objects
  for insert to authenticated with check (bucket_id = 'cola' and (select public.cola_membro()));
create policy "cola foto: i membri cancellano" on storage.objects
  for delete to authenticated using (bucket_id = 'cola' and (select public.cola_membro()));

-- ─── ping() per il keep-alive ───────────────────────────────────────
-- Se esiste già (stessa definizione di Armadio e Piante), "or replace" la lascia identica.
create or replace function public.ping() returns text
language sql stable set search_path = '' as $$ select 'pong'::text $$;
revoke execute on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;

-- ─── Membri: tu e Giulia ────────────────────────────────────────────
-- Prende gli utenti del progetto. Controlla nel risultato che ci siate solo voi due: se c'è qualcun altro,
-- toglilo con  delete from public.cola_membri where nome = '<email>';
insert into public.cola_membri (user_id, nome)
select id, email from auth.users
on conflict (user_id) do nothing
returning nome;
