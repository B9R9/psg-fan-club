-- Squad / Effectif table
create table if not exists public.players (
  id              bigint generated always as identity primary key,
  name            text        not null,
  club            text,
  number          smallint,
  position        text        not null check (position in ('GK','DEF','MID','FWD')),
  -- Granular position for lineup display, e.g. LB, RCB, CDM, LW, CF
  position_detail text,
  nationality     text,
  photo_url       text,
  bio             text,
  historic        text,
  seasons         jsonb       not null default '[]'::jsonb,
  is_active       boolean     not null default true,
  display_order   smallint    not null default 0,
  created_at      timestamptz not null default now()
);

-- If the table already existed, add the column safely
alter table public.players
  add column if not exists position_detail text;

alter table public.players
  add column if not exists club text;

alter table public.players
  add column if not exists historic text;

alter table public.players
  add column if not exists seasons jsonb not null default '[]'::jsonb;

-- Prevent duplicate player names
alter table public.players
  add constraint if not exists players_name_unique unique (name);

-- Public read access
alter table public.players enable row level security;
drop policy if exists "public read players" on public.players;
create policy "public read players" on public.players
  for select using (true);

-- Admin app uses client-side auth in this project, so writes are open too
drop policy if exists "public insert players" on public.players;
create policy "public insert players" on public.players
  for insert with check (true);

drop policy if exists "public update players" on public.players;
create policy "public update players" on public.players
  for update using (true) with check (true);

drop policy if exists "public delete players" on public.players;
create policy "public delete players" on public.players
  for delete using (true);

-- Sample seed — safe to re-run: skips rows that already exist
insert into public.players (name, number, position, nationality, display_order) values
  ('Gianluigi Donnarumma',  99, 'GK',  'Italy',    1),
  ('Arnau Tenas',           18, 'GK',  'Spain',    2),
  ('Marquinhos',             5, 'DEF', 'Brazil',   1),
  ('Willian Pacho',         26, 'DEF', 'Ecuador',  2),
  ('Lucas Beraldo',         35, 'DEF', 'Brazil',   3),
  ('Nuno Mendes',           25, 'DEF', 'Portugal', 4),
  ('Achraf Hakimi',          2, 'DEF', 'Morocco',  5),
  ('João Neves',            87, 'MID', 'Portugal', 1),
  ('Vitinha',               17, 'MID', 'Portugal', 2),
  ('Fabian Ruiz',            8, 'MID', 'Spain',    3),
  ('Warren Zaïre-Emery',    33, 'MID', 'France',   4),
  ('Lee Kang-in',           19, 'MID', 'South Korea', 5),
  ('Ousmane Dembélé',       10, 'FWD', 'France',   1),
  ('Gonçalo Ramos',          9, 'FWD', 'Portugal', 2),
  ('Khvicha Kvaratskhelia',  7, 'FWD', 'Georgia',  3),
  ('Bradley Barcola',       29, 'FWD', 'France',   4)
on conflict (name) do nothing;
