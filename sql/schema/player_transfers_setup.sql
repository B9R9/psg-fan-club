-- ============================================================
-- Player Transfers
-- ============================================================
-- Records every transfer event (in/out/loan) for PSG players.
-- Side-effects handled by the admin UI:
--   - type 'in'       → set players.is_active = true
--   - type 'out'      → set players.is_active = false
--   - type 'loan_out' → optionally set is_active = false (on loan)
--   - type 'loan_in'  → insert new temporary player row
-- ============================================================

create table if not exists public.player_transfers (
  id            bigint generated always as identity primary key,

  -- Linked PSG player (null if incoming player not yet in players table)
  player_id     bigint references public.players(id) on delete set null,
  -- Plain name fallback (used when player_id is null or for display only)
  player_name   text not null,

  -- Direction
  transfer_type text not null check (transfer_type in ('in','out','loan_in','loan_out','loan_return')),

  -- Clubs
  from_club     text,
  to_club       text,

  -- Economics
  fee_euros     numeric(12,0),   -- transfer fee in €, null = undisclosed / free
  fee_label     text,            -- e.g. "Free", "Undisclosed", "€60M"

  -- Timing
  transfer_date date,
  season        text,            -- e.g. "2024–25", "Summer 2025"

  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_player_transfers_player
  on public.player_transfers(player_id);

create index if not exists idx_player_transfers_date
  on public.player_transfers(transfer_date desc);

-- Public read
alter table public.player_transfers enable row level security;
create policy "public read player_transfers"
  on public.player_transfers for select using (true);
