alter table public.profiles enable row level security;
alter table public.dragon_skins enable row level security;
alter table public.cosmetic_items enable row level security;
alter table public.player_skins enable row level security;
alter table public.player_items enable row level security;
alter table public.player_powerups enable row level security;
alter table public.arenas enable row level security;
alter table public.player_arenas enable row level security;
alter table public.match_sessions enable row level security;
alter table public.game_matches enable row level security;
alter table public.player_stats enable row level security;
alter table public.player_settings enable row level security;
alter table public.transactions enable row level security;

-- Catalogs: readable by everyone, writable by no client
create policy "catalog read" on public.dragon_skins for select using (true);
create policy "catalog read" on public.cosmetic_items for select using (true);
create policy "catalog read" on public.arenas for select using (true);

-- Matches: readable by everyone for leaderboard display
create policy "matches public read" on public.game_matches for select using (true);

-- Own data: read only (all writes go through RPC / Edge Functions)
create policy "own profile read" on public.profiles for select using (auth.uid() = id);
create policy "own skins read" on public.player_skins for select using (auth.uid() = user_id);
create policy "own items read" on public.player_items for select using (auth.uid() = user_id);
create policy "own powerups read" on public.player_powerups for select using (auth.uid() = user_id);
create policy "own arenas read" on public.player_arenas for select using (auth.uid() = user_id);
create policy "own sessions read" on public.match_sessions for select using (auth.uid() = user_id);
create policy "own stats read" on public.player_stats for select using (auth.uid() = user_id);
create policy "own transactions read" on public.transactions for select using (auth.uid() = user_id);

-- Settings: user may read and write their own
create policy "own settings read" on public.player_settings for select using (auth.uid() = user_id);
create policy "own settings insert" on public.player_settings for insert with check (auth.uid() = user_id);
create policy "own settings update" on public.player_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
