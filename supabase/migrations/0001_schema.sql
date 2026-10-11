create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 20),
  avatar_url text,
  coins integer not null default 1000 check (coins >= 0),
  gems integer not null default 5 check (gems >= 0),
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  created_at timestamptz not null default now()
);

create table public.dragon_skins (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  rarity text not null check (rarity in ('common','rare','epic','legendary')),
  element text not null default 'nature',
  price_coins integer not null default 0 check (price_coins >= 0),
  price_gems integer not null default 0 check (price_gems >= 0),
  model_key text not null,
  is_available boolean not null default true
);

create table public.cosmetic_items (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  category text not null check (category in ('pattern','eyes','head_piece','body_piece','color','boost_effect','arena_theme')),
  name text not null,
  rarity text not null check (rarity in ('common','rare','epic','legendary')),
  price_coins integer not null default 0 check (price_coins >= 0),
  price_gems integer not null default 0 check (price_gems >= 0),
  config jsonb not null default '{}',
  is_available boolean not null default true
);

create table public.player_skins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skin_id uuid not null references public.dragon_skins(id),
  purchased_at timestamptz not null default now(),
  is_equipped boolean not null default false,
  loadout jsonb not null default '{}',
  unique (user_id, skin_id)
);
create unique index if not exists one_equipped_skin_per_user on public.player_skins(user_id) where is_equipped;

create table public.player_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.cosmetic_items(id),
  purchased_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table public.player_powerups (
  user_id uuid not null references public.profiles(id) on delete cascade,
  powerup text not null check (powerup in ('magnet','speed','zoom_in','zoom_out','shield','fire_charge')),
  quantity integer not null default 0 check (quantity >= 0),
  primary key (user_id, powerup)
);

create table public.arenas (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug in ('forest','desert','lava')),
  name text not null,
  description text not null default '',
  difficulty text not null check (difficulty in ('beginner','intermediate','advanced')),
  model_key text not null,
  unlock_level integer not null default 1,
  unlock_coins integer not null default 0 check (unlock_coins >= 0),
  objective_weight integer not null default 1000,
  max_score_per_second numeric not null default 60
);

create table public.player_arenas (
  user_id uuid not null references public.profiles(id) on delete cascade,
  arena_id uuid not null references public.arenas(id),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, arena_id)
);

create table public.match_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  arena_id uuid not null references public.arenas(id),
  seed bigint not null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  status text not null default 'active' check (status in ('active','completed','expired','rejected'))
);
create index if not exists match_sessions_user_status_idx on public.match_sessions(user_id, status);

create table public.game_matches (
  id uuid primary key default gen_random_uuid(),
  session_id uuid unique references public.match_sessions(id),
  user_id uuid references public.profiles(id) on delete cascade,
  arena_id uuid references public.arenas(id),
  score integer not null check (score >= 0),
  max_weight integer not null check (max_weight >= 0),
  food_collected integer not null check (food_collected >= 0),
  longest_length integer not null check (longest_length >= 0),
  kills integer not null default 0 check (kills >= 0),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  coins_earned integer not null default 0,
  gems_earned integer not null default 0,
  xp_earned integer not null default 0,
  won boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists game_matches_score_idx on public.game_matches(score desc);
create index if not exists game_matches_arena_score_idx on public.game_matches(arena_id, score desc);
create index if not exists game_matches_user_time_idx on public.game_matches(user_id, created_at desc);

create table public.player_stats (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  best_score integer not null default 0,
  best_weight integer not null default 0,
  longest_length integer not null default 0,
  total_matches integer not null default 0,
  total_food integer not null default 0,
  total_kills integer not null default 0,
  total_wins integer not null default 0,
  favorite_arena_id uuid references public.arenas(id),
  updated_at timestamptz not null default now()
);

create table public.player_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  settings jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  ref_id uuid,
  coins_delta integer not null default 0,
  gems_delta integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_created_idx on public.transactions(user_id, created_at desc);
