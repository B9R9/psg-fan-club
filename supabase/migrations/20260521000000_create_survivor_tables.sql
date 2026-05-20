-- Survivors (sessions/tournois)
create table if not exists public.survivors (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  status text not null default 'active'
    check (status in ('pending', 'active', 'completed')),
  current_matchday bigint default 1,
  total_matchdays bigint default 38,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  created_by text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_survivors_status on public.survivors(status);
create index if not exists idx_survivors_created_at on public.survivors(created_at desc);

-- Participants (joueurs inscrits)
create table if not exists public.survivor_participants (
  id bigint generated always as identity primary key,
  survivor_id bigint not null references public.survivors(id) on delete cascade,
  participant_email text not null,
  participant_name text not null,
  status text not null default 'active'
    check (status in ('active', 'eliminated')),
  joined_at timestamptz not null default now(),
  eliminated_at timestamptz,
  unique(survivor_id, participant_email)
);

create index if not exists idx_survivor_participants_survivor_id on public.survivor_participants(survivor_id);
create index if not exists idx_survivor_participants_status on public.survivor_participants(status);

-- Predictions (pronostics)
create table if not exists public.survivor_predictions (
  id bigint generated always as identity primary key,
  survivor_id bigint not null references public.survivors(id) on delete cascade,
  participant_id bigint not null references public.survivor_participants(id) on delete cascade,
  match_id bigint not null references public.matches(id) on delete cascade,
  prediction text not null check (prediction in ('home', 'away')),
  is_correct boolean,
  created_at timestamptz not null default now(),
  unique(survivor_id, participant_id, match_id)
);

create index if not exists idx_survivor_predictions_survivor_id on public.survivor_predictions(survivor_id);
create index if not exists idx_survivor_predictions_participant_id on public.survivor_predictions(participant_id);
create index if not exists idx_survivor_predictions_match_id on public.survivor_predictions(match_id);

-- Teams used by participant (to prevent choosing same team twice)
create table if not exists public.survivor_teams_used (
  id bigint generated always as identity primary key,
  survivor_id bigint not null references public.survivors(id) on delete cascade,
  participant_id bigint not null references public.survivor_participants(id) on delete cascade,
  team_name text not null,
  match_id bigint not null references public.matches(id) on delete cascade,
  used_at timestamptz not null default now(),
  unique(survivor_id, participant_id, team_name)
);

create index if not exists idx_survivor_teams_used_survivor_id on public.survivor_teams_used(survivor_id);
create index if not exists idx_survivor_teams_used_participant_id on public.survivor_teams_used(participant_id);

-- Eliminations (historique)
create table if not exists public.survivor_eliminations (
  id bigint generated always as identity primary key,
  survivor_id bigint not null references public.survivors(id) on delete cascade,
  participant_id bigint not null references public.survivor_participants(id) on delete cascade,
  match_id bigint references public.matches(id) on delete set null,
  reason text,
  eliminated_at timestamptz not null default now()
);

create index if not exists idx_survivor_eliminations_survivor_id on public.survivor_eliminations(survivor_id);
create index if not exists idx_survivor_eliminations_participant_id on public.survivor_eliminations(participant_id);

-- Enable RLS
alter table public.survivors enable row level security;
alter table public.survivor_participants enable row level security;
alter table public.survivor_predictions enable row level security;
alter table public.survivor_teams_used enable row level security;
alter table public.survivor_eliminations enable row level security;

-- Policies (public read/write for now, can restrict later)
create policy "public read survivors" on public.survivors for select using (true);
create policy "public insert survivors" on public.survivors for insert with check (true);
create policy "public update survivors" on public.survivors for update using (true) with check (true);
create policy "public delete survivors" on public.survivors for delete using (true);

create policy "public read survivor_participants" on public.survivor_participants for select using (true);
create policy "public insert survivor_participants" on public.survivor_participants for insert with check (true);
create policy "public update survivor_participants" on public.survivor_participants for update using (true) with check (true);
create policy "public delete survivor_participants" on public.survivor_participants for delete using (true);

create policy "public read survivor_predictions" on public.survivor_predictions for select using (true);
create policy "public insert survivor_predictions" on public.survivor_predictions for insert with check (true);
create policy "public update survivor_predictions" on public.survivor_predictions for update using (true) with check (true);
create policy "public delete survivor_predictions" on public.survivor_predictions for delete using (true);

create policy "public read survivor_teams_used" on public.survivor_teams_used for select using (true);
create policy "public insert survivor_teams_used" on public.survivor_teams_used for insert with check (true);
create policy "public delete survivor_teams_used" on public.survivor_teams_used for delete using (true);

create policy "public read survivor_eliminations" on public.survivor_eliminations for select using (true);
create policy "public insert survivor_eliminations" on public.survivor_eliminations for insert with check (true);
