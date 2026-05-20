-- Support World Cup fixtures in survivor tables.
-- Existing schema only supports match_id -> matches(id), which breaks for wc_matches ids.

alter table public.survivor_predictions
  add column if not exists wc_match_id bigint references public.wc_matches(id) on delete cascade;

alter table public.survivor_teams_used
  add column if not exists wc_match_id bigint references public.wc_matches(id) on delete cascade;

alter table public.survivor_predictions
  alter column match_id drop not null;

alter table public.survivor_teams_used
  alter column match_id drop not null;

-- Replace the old unique constraint with source-specific partial unique indexes.
alter table public.survivor_predictions
  drop constraint if exists survivor_predictions_survivor_id_participant_id_match_id_key;

alter table public.survivor_predictions
  add constraint survivor_predictions_survivor_participant_match_unique
  unique (survivor_id, participant_id, match_id);

alter table public.survivor_predictions
  add constraint survivor_predictions_survivor_participant_wc_match_unique
  unique (survivor_id, participant_id, wc_match_id);

create index if not exists idx_survivor_predictions_wc_match_id
  on public.survivor_predictions (wc_match_id);

create index if not exists idx_survivor_teams_used_wc_match_id
  on public.survivor_teams_used (wc_match_id);
