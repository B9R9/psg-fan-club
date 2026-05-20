-- Add match_source column to survivors table
alter table public.survivors 
add column match_source text default 'club'
  check (match_source in ('club', 'world_cup'));

-- Create index on match_source
create index if not exists idx_survivors_match_source on public.survivors(match_source);

-- Update existing survivors to use 'club' as default (already set via default constraint)
-- No UPDATE needed since the DEFAULT takes effect for existing rows when queried

-- Note: The foreign key constraints on survivor_predictions, survivor_teams_used, 
-- and survivor_eliminations remain pointing to public.matches(id), but the application
-- layer will validate that match_id exists in the appropriate table (matches or wc_matches)
-- based on the survivor's match_source value.
