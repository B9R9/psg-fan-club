-- ============================================================
-- Player History
-- ============================================================
-- Stores career timeline entries for each PSG player:
-- previous clubs, loan spells, international caps milestones,
-- personal achievements, injuries, etc.
-- Designed to be shown chronologically in the player modal.
-- ============================================================

create table if not exists public.player_history (
  id            bigint generated always as identity primary key,
  player_id     bigint       not null references public.players(id) on delete cascade,

  -- Season or year label, e.g. "2021–22", "2019"
  season        text,
  -- Short club / context name, e.g. "AC Milan", "PSG", "France U21"
  club          text,

  -- Category for grouping / icon display
  -- 'club'        : club spell (transfer, loan)
  -- 'international' : national team milestone
  -- 'achievement' : individual award, record, etc.
  -- 'injury'      : notable injury/absence
  -- 'milestone'   : e.g. 100th cap, 50th PSG goal
  category      text not null default 'club'
                  check (category in ('club','international','achievement','injury','milestone')),

  title         text not null,   -- e.g. "Joined PSG from Benfica — €60M"
  detail        text,            -- longer description (optional)

  -- Rich stats snapshot for a club spell (all optional)
  appearances   smallint,
  goals         smallint,
  assists       smallint,
  clean_sheets  smallint,        -- for GKs

  display_order smallint not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_player_history_player
  on public.player_history(player_id, display_order);

-- Public read access
alter table public.player_history enable row level security;
drop policy if exists "public read player_history" on public.player_history;
create policy "public read player_history"
  on public.player_history for select using (true);

drop policy if exists "public insert player_history" on public.player_history;
create policy "public insert player_history"
  on public.player_history for insert with check (true);

drop policy if exists "public update player_history" on public.player_history;
create policy "public update player_history"
  on public.player_history for update using (true) with check (true);

drop policy if exists "public delete player_history" on public.player_history;
create policy "public delete player_history"
  on public.player_history for delete using (true);

-- ============================================================
-- Example seed (run after players are inserted):
-- ============================================================
-- Assuming Donnarumma has id = 1:
--
-- insert into public.player_history
--   (player_id, season, club, category, title, detail, appearances, goals, clean_sheets, display_order)
-- values
--   (1, '2015–21', 'AC Milan',  'club', 'AC Milan', 'Turned professional at 16. Became starter immediately.', 251, 0, 96, 1),
--   (1, '2021–',   'PSG',       'club', 'PSG',      'Joined on a free transfer. Won Ligue 1 in first season.', 180, 0, 72, 2),
--   (1, NULL,      'Italy',     'international', 'EURO 2020 Winner', 'Player of the Tournament at EURO 2020.', NULL, NULL, NULL, 3),
--   (1, '2023',    NULL,        'milestone', '100th Ligue 1 appearance', NULL, NULL, NULL, NULL, 4);
