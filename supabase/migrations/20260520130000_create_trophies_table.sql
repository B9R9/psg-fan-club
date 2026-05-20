create table if not exists public.trophies (
  id bigint generated always as identity primary key,
  season_label text not null,
  competition_name text not null,
  competition_type text not null default 'Domestic'
    check (competition_type in ('Domestic', 'Continental', 'Worldwide')),
  image_url text,
  created_at timestamptz not null default now(),
  unique (season_label, competition_name)
);

-- Remove duplicates that differ only by season separator or case
with ranked as (
  select
    id,
    row_number() over (
      partition by
        regexp_replace(trim(season_label), '[–—-]', '/', 'g'),
        lower(trim(competition_name))
      order by id
    ) as rn
  from public.trophies
)
delete from public.trophies t
using ranked r
where t.id = r.id
  and r.rn > 1;

-- Normalize separators for existing data if any (2023-24 or 2023–24 -> 2023/24)
update public.trophies
set season_label = regexp_replace(season_label, '[–—-]', '/', 'g')
where season_label ~ '[–—-]';

alter table public.trophies
  drop constraint if exists trophies_season_label_format_check;

alter table public.trophies
  add constraint trophies_season_label_format_check
  check (season_label ~ '^\\d{4}/\\d{2}$');

create index if not exists idx_trophies_season on public.trophies(season_label);
create index if not exists idx_trophies_comp on public.trophies(competition_name);

alter table public.trophies enable row level security;

drop policy if exists "public read trophies" on public.trophies;
create policy "public read trophies"
  on public.trophies for select using (true);

drop policy if exists "public insert trophies" on public.trophies;
create policy "public insert trophies"
  on public.trophies for insert with check (true);

drop policy if exists "public update trophies" on public.trophies;
create policy "public update trophies"
  on public.trophies for update using (true) with check (true);

drop policy if exists "public delete trophies" on public.trophies;
create policy "public delete trophies"
  on public.trophies for delete using (true);
