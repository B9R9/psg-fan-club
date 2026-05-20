-- ============================================================
-- Match Card — Lineup + Events
-- ============================================================
--
-- Strategy:
--   • For PSG players: link to public.players via psg_player_id (optional FK)
--   • For opponent players: store plain text name — no need to maintain
--     a full rival squad table.
--   • team = 'home' | 'away' — always relative to the match row in
--     public.matches (which already has home_team_id / away_team_id).
-- ============================================================

-- ------------------------------------------------------------
-- 1. match_lineups
--    One row per player per match (starters + bench).
-- ------------------------------------------------------------
create table if not exists public.match_lineups (
  id                 bigint generated always as identity primary key,
  match_id           bigint not null references public.matches(id) on delete cascade,
  team               text   not null check (team in ('home','away')),

  -- Player identity
  player_name        text   not null,
  psg_player_id      bigint references public.players(id) on delete set null,
  shirt_number       smallint,

  -- Position (broad + detail)
  -- broad:  GK | DEF | MID | FWD
  -- detail: GK | LB | LCB | CB | RCB | RB | LWB | RWB
  --         CDM | CM | CAM | LM | RM | LW | RW | CF | SS | ST
  position           text,
  position_detail    text,

  -- Lineup state
  is_starter         boolean not null default true,
  -- Order within the bench (null = starter)
  bench_order        smallint,

  created_at         timestamptz not null default now(),

  unique (match_id, team, player_name)
);

-- ------------------------------------------------------------
-- 2. match_events
--    One row per notable event: goal, assist, card, substitution.
-- ------------------------------------------------------------
create table if not exists public.match_events (
  id                      bigint generated always as identity primary key,
  match_id                bigint not null references public.matches(id) on delete cascade,

  -- When
  minute                  smallint not null,  -- 1–90 (+extra time notation via extra_minute)
  extra_minute            smallint,           -- e.g. 90+3 → minute=90, extra_minute=3
  period                  text not null default 'regular'
                            check (period in ('regular','extra_time','penalties')),

  -- What
  event_type              text not null check (event_type in (
    'goal',           -- regular goal
    'own_goal',       -- own goal (team = team that conceded)
    'penalty_goal',   -- penalty converted
    'penalty_missed', -- penalty saved / off target
    'assist',         -- pass leading to goal (linked to a goal event)
    'yellow_card',
    'second_yellow',  -- 2nd yellow → red
    'red_card',
    'sub_in',         -- player entering
    'sub_out'         -- player leaving (pair with sub_in via related_*)
  )),

  -- Who and which side
  team                    text not null check (team in ('home','away')),
  player_name             text not null,
  psg_player_id           bigint references public.players(id) on delete set null,

  -- Related player (e.g. assist player, or the player being replaced in a sub)
  related_player_name     text,
  related_psg_player_id   bigint references public.players(id) on delete set null,

  -- Link goal ↔ assist (assist row references the goal row id)
  linked_event_id         bigint references public.match_events(id) on delete set null,

  notes                   text,
  created_at              timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Indexes for fast per-match queries
-- ------------------------------------------------------------
create index if not exists idx_match_lineups_match  on public.match_lineups(match_id);
create index if not exists idx_match_events_match   on public.match_events(match_id);
create index if not exists idx_match_events_type    on public.match_events(match_id, event_type);

-- ------------------------------------------------------------
-- RLS — public read, authenticated write
-- ------------------------------------------------------------
alter table public.match_lineups enable row level security;
alter table public.match_events  enable row level security;

create policy "public read match_lineups"
  on public.match_lineups for select using (true);

create policy "public read match_events"
  on public.match_events for select using (true);

-- ------------------------------------------------------------
-- Example: PSG 4–0 Marseille (fictional match id = 1)
--
-- INSERT INTO match_lineups (match_id, team, player_name, shirt_number, position, position_detail, is_starter)
-- VALUES
--   (1, 'home', 'Donnarumma',  99, 'GK',  'GK',  true),
--   (1, 'home', 'Hakimi',       2, 'DEF', 'RB',  true),
--   ...
--
-- INSERT INTO match_events (match_id, minute, event_type, team, player_name, related_player_name)
-- VALUES
--   (1, 23, 'goal',   'home', 'Dembélé',     NULL),
--   (1, 23, 'assist', 'home', 'Nuno Mendes', NULL), -- link to goal row above
--   (1, 55, 'sub_in', 'home', 'Barcola',     'Lee Kang-in'),
--   ...
-- ------------------------------------------------------------
