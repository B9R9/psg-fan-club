-- Run this once in Supabase SQL Editor if PlayersTab says a column is missing.

alter table public.players
  add column if not exists club text;

alter table public.players
  add column if not exists historic text;

alter table public.players
  add column if not exists seasons jsonb not null default '[]'::jsonb;

create unique index if not exists players_name_unique_idx
on public.players (name);

-- Backfill seasons from historic when seasons is empty.
-- Expected historic format: "24/25:PSG, 23/24:FC Barcelone"
update public.players p
set seasons = coalesce(parsed.seasons_json, '[]'::jsonb)
from (
  select
    p2.id,
    jsonb_agg(
      jsonb_build_object(
        'season', trim(split_part(token.entry, ':', 1)),
        'club', trim(split_part(token.entry, ':', 2))
      )
      order by token.ord
    ) as seasons_json
  from public.players p2
  cross join lateral regexp_split_to_table(coalesce(p2.historic, ''), '\s*,\s*') with ordinality as token(entry, ord)
  where token.entry like '%:%'
    and nullif(trim(split_part(token.entry, ':', 1)), '') is not null
    and nullif(trim(split_part(token.entry, ':', 2)), '') is not null
  group by p2.id
) parsed
where p.id = parsed.id
  and coalesce(trim(p.historic), '') <> ''
  and (
    p.seasons is null
    or jsonb_typeof(p.seasons) <> 'array'
    or jsonb_array_length(p.seasons) = 0
  );

-- Ask PostgREST to refresh schema cache immediately.
notify pgrst, 'reload schema';
