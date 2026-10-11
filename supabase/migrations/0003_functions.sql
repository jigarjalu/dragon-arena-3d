-- Security definer stored procedures and triggers
create or replace function public.handle_new_user()
returns trigger as $$
declare
  starter_skin_id uuid;
  forest_arena_id uuid;
begin
  -- Generate unique username
  insert into public.profiles (id, username, coins, gems, xp, level)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'Dragon#' || substr(new.id::text, 1, 6)),
    1000,
    5,
    0,
    1
  );

  insert into public.player_stats (user_id) values (new.id);
  insert into public.player_settings (user_id) values (new.id);

  -- Starter powerups
  insert into public.player_powerups (user_id, powerup, quantity) values
    (new.id, 'magnet', 3),
    (new.id, 'speed', 3),
    (new.id, 'shield', 2),
    (new.id, 'fire_charge', 2);

  -- Starter forest arena
  select id into forest_arena_id from public.arenas where slug = 'forest' limit 1;
  if forest_arena_id is not null then
    insert into public.player_arenas (user_id, arena_id) values (new.id, forest_arena_id);
  end if;

  -- Starter Emerald Dragon skin
  select id into starter_skin_id from public.dragon_skins where slug = 'emerald' limit 1;
  if starter_skin_id is not null then
    insert into public.player_skins (user_id, skin_id, is_equipped) values (new.id, starter_skin_id, true);
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger on auth.users (if deployed in Supabase auth environment)
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute function public.handle_new_user();

-- Leaderboard function
create or replace function public.get_leaderboard(
  p_period text default 'global',
  p_limit int default 50
)
returns table (
  rank bigint,
  username text,
  avatar_url text,
  score integer,
  longest_length integer,
  won boolean
) as $$
begin
  return query
  select
    row_number() over (order by m.score desc) as rank,
    p.username,
    p.avatar_url,
    m.score,
    m.longest_length,
    m.won
  from public.game_matches m
  join public.profiles p on p.id = m.user_id
  order by m.score desc
  limit p_limit;
end;
$$ language plpgsql security definer set search_path = public;
