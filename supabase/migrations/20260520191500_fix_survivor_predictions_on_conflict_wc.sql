-- Fix ON CONFLICT for world cup survivor predictions.
-- PostgREST requires a matching UNIQUE/EXCLUSION constraint for
-- on_conflict=survivor_id,participant_id,wc_match_id.

-- Remove duplicate rows if they exist before adding unique constraints.
with ranked_match as (
  select
    id,
    row_number() over (
      partition by survivor_id, participant_id, match_id
      order by id
    ) as rn
  from public.survivor_predictions
  where match_id is not null
)
delete from public.survivor_predictions p
using ranked_match r
where p.id = r.id
  and r.rn > 1;

with ranked_wc as (
  select
    id,
    row_number() over (
      partition by survivor_id, participant_id, wc_match_id
      order by id
    ) as rn
  from public.survivor_predictions
  where wc_match_id is not null
)
delete from public.survivor_predictions p
using ranked_wc r
where p.id = r.id
  and r.rn > 1;

-- Partial indexes cannot always be inferred by on conflict in PostgREST;
-- enforce explicit unique constraints instead.
drop index if exists survivor_predictions_unique_match_idx;
drop index if exists survivor_predictions_unique_wc_match_idx;

alter table public.survivor_predictions
  add constraint survivor_predictions_survivor_participant_match_unique
  unique (survivor_id, participant_id, match_id);

alter table public.survivor_predictions
  add constraint survivor_predictions_survivor_participant_wc_match_unique
  unique (survivor_id, participant_id, wc_match_id);

notify pgrst, 'reload schema';
