alter table public.players
  add column if not exists player_status text not null default 'psg_squad';

alter table public.players
  drop constraint if exists players_player_status_check;

alter table public.players
  add constraint players_player_status_check
  check (player_status in ('psg_squad', 'match_player'));

update public.players
set player_status = case
  when coalesce(display_order, 0) = 999 or coalesce(club, '') = 'MATCH_PLAYER' then 'match_player'
  else 'psg_squad'
end;
