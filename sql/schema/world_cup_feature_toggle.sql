-- Enable admin toggle for showing World Cup section on Home page
alter table if exists public.settings
add column if not exists world_cup_enabled boolean not null default false;

update public.settings
set world_cup_enabled = coalesce(world_cup_enabled, false)
where id = 1;
