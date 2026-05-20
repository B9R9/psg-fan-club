-- ============================================================
-- player_seasons
-- One row = one player × one PSG season.
-- Used to build the squad roster for any given season.
-- Stats (appearances, goals, etc.) can be added later.
-- ============================================================

create table if not exists public.player_seasons (
  id           bigint generated always as identity primary key,

  player_id    bigint not null references public.players(id) on delete cascade,

  -- Season label, e.g. "2024-25", "1984-85"
  season       text   not null,

  -- Shirt number can change every season
  shirt_number smallint,

  -- True = still at club mid-season / end of season as primary squad member
  is_current   boolean not null default false,

  -- Optional loan flag
  is_on_loan   boolean not null default false,

  -- Stats — all nullable, add when available
  appearances  smallint,
  goals        smallint,
  assists      smallint,
  clean_sheets smallint,

  -- Free-text note for the season (e.g. "Captain", "Loan", "Coupe de France winner")
  note         text,

  created_at   timestamptz not null default now(),

  -- A player can only appear once per season
  unique (player_id, season)
);

create index if not exists idx_player_seasons_player
  on public.player_seasons(player_id);

create index if not exists idx_player_seasons_season
  on public.player_seasons(season);

-- RLS
alter table public.player_seasons enable row level security;

drop policy if exists "public read player_seasons"  on public.player_seasons;
create policy "public read player_seasons"
  on public.player_seasons for select using (true);

drop policy if exists "public insert player_seasons" on public.player_seasons;
create policy "public insert player_seasons"
  on public.player_seasons for insert with check (true);

drop policy if exists "public update player_seasons" on public.player_seasons;
create policy "public update player_seasons"
  on public.player_seasons for update using (true) with check (true);

drop policy if exists "public delete player_seasons" on public.player_seasons;
create policy "public delete player_seasons"
  on public.player_seasons for delete using (true);
