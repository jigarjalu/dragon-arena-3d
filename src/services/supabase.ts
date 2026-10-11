import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PlayerProfile, MatchResult, LeaderboardEntry } from '../types/game';
import { INITIAL_PROFILE, MOCK_LEADERBOARD } from '../data/gameData';

const LOCAL_STORAGE_KEY_PROFILE = 'dragon_arena_profile_zero_start_v1';
const LOCAL_STORAGE_KEY_SUPABASE_CONFIG = 'dragon_arena_supabase_config_v3';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig = {
    url: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '',
    anonKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '',
  };

  constructor() {
    this.loadSavedConfig();
    this.initClient();
  }

  private loadSavedConfig() {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SUPABASE_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.url && parsed.anonKey) {
          this.config = parsed;
        }
      }
    } catch {
      // safe fallback
    }
  }

  private initClient() {
    if (this.config.url && this.config.anonKey) {
      try {
        this.client = createClient(this.config.url, this.config.anonKey);
      } catch (e) {
        console.warn('Failed to initialize Supabase client:', e);
        this.client = null;
      }
    }
  }

  public isConnected(): boolean {
    return !!this.client;
  }

  public getConfig(): SupabaseConfig {
    return { ...this.config };
  }

  public setConfig(url: string, anonKey: string): boolean {
    this.config = { url, anonKey };
    localStorage.setItem(LOCAL_STORAGE_KEY_SUPABASE_CONFIG, JSON.stringify(this.config));
    try {
      if (url && anonKey) {
        this.client = createClient(url, anonKey);
        return true;
      } else {
        this.client = null;
        return true;
      }
    } catch {
      return false;
    }
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.client) {
      return { success: false, message: 'Supabase URL or Anon Key is missing.' };
    }
    try {
      const { data, error } = await this.client.from('dragon_skins').select('slug').limit(1);
      if (error) {
        return { success: false, message: `Database query failed: ${error.message}` };
      }
      return { success: true, message: `Connected to Supabase! Found ${data ? data.length : 0} skins in database.` };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown connection error';
      return { success: false, message: msg };
    }
  }

  // Profile Management (Syncs between local guest storage and Supabase if connected)
  public loadProfile(): PlayerProfile {
    try {
      const resetKey = 'dragon_arena_zero_start_enforced_v2';
      const hasReset = localStorage.getItem(resetKey);
      if (!hasReset) {
        localStorage.setItem(resetKey, 'true');
        // Strictly start with 0 coins and 0 gems
        const cleanProfile: PlayerProfile = {
          ...INITIAL_PROFILE,
          coins: 0,
          gems: 0,
          inventory: {
            ...INITIAL_PROFILE.inventory,
            skins: ['emerald'],
          },
        };
        localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(cleanProfile));
        return cleanProfile;
      }

      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_PROFILE,
          ...parsed,
          coins: typeof parsed.coins === 'number' ? parsed.coins : 0,
          gems: typeof parsed.gems === 'number' ? parsed.gems : 0,
          inventory: {
            ...INITIAL_PROFILE.inventory,
            ...(parsed.inventory || {}),
            skins: parsed.inventory?.skins || ['emerald'],
            powerups: {
              ...INITIAL_PROFILE.inventory.powerups,
              ...((parsed.inventory && parsed.inventory.powerups) || {}),
            },
          },
        };
      }
    } catch {
      // safe fallback
    }
    return { ...INITIAL_PROFILE, coins: 0, gems: 0 };
  }

  public saveProfile(profile: PlayerProfile): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch {
      // safe fallback
    }

    if (this.client) {
      // Debounce/async sync to remote profile if user is authenticated
        Promise.resolve(
          this.client
            .from('profiles')
            .upsert({
              id: profile.id,
              username: profile.username,
              avatar_url: profile.avatarUrl,
              coins: profile.coins,
              gems: profile.gems,
              xp: profile.xp,
              level: profile.level,
            })
        )
          .then(() => {})
          .catch(() => {});
      }
    }

  public async submitMatchRecord(result: MatchResult, currentProfile: PlayerProfile): Promise<PlayerProfile> {
    const newCoins = currentProfile.coins + result.coinsEarned;
    const newGems = currentProfile.gems + result.gemsEarned;
    const newXp = currentProfile.xp + result.xpEarned;
    const newBest = Math.max(currentProfile.bestScore, result.finalScore);
    const newGamesPlayed = currentProfile.gamesPlayed + 1;
    const newTotalFood = currentProfile.totalFood + result.foodCollected;
    const newTotalKills = currentProfile.totalKills + result.kills;
    const newTotalWins = currentProfile.totalWins + (result.won ? 1 : 0);

    // Compute new level if XP threshold reached
    let level = currentProfile.level;
    let xp = newXp;
    let xpMax = currentProfile.xpMax;
    while (xp >= xpMax) {
      xp -= xpMax;
      level += 1;
      xpMax = Math.round(xpMax * 1.25);
    }

    const updatedProfile: PlayerProfile = {
      ...currentProfile,
      coins: newCoins,
      gems: newGems,
      xp,
      xpMax,
      level,
      bestScore: newBest,
      gamesPlayed: newGamesPlayed,
      totalFood: newTotalFood,
      totalKills: newTotalKills,
      totalWins: newTotalWins,
      recentMatches: [
        {
          id: 'm_' + Date.now(),
          arenaId: 'forest',
          arenaName: result.arenaName,
          score: result.finalScore,
          date: new Date().toLocaleDateString('en-GB'),
          result: result.won ? 'Win' : 'Loss',
        },
        ...currentProfile.recentMatches.slice(0, 7),
      ],
    };

    this.saveProfile(updatedProfile);

    if (this.client) {
      try {
        await this.client.from('game_matches').insert({
          score: result.finalScore,
          max_weight: result.maxWeight,
          food_collected: result.foodCollected,
          longest_length: result.longestLength,
          kills: result.kills,
          duration_seconds: result.timeSurvivedSeconds,
          coins_earned: result.coinsEarned,
          gems_earned: result.gemsEarned,
          xp_earned: result.xpEarned,
          won: result.won,
        });
      } catch (err) {
        console.warn('Supabase match insert skipped/failed:', err);
      }
    }

    return updatedProfile;
  }

  public async fetchLeaderboard(arenaFilter: string = 'all'): Promise<LeaderboardEntry[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('game_matches')
          .select('score, longest_length, won, profiles(username)')
          .order('score', { ascending: false })
          .limit(20);

        if (!error && data && data.length > 0) {
          return data.map((item, idx) => ({
            rank: idx + 1,
            username: (item.profiles as unknown as { username: string })?.username || `DragonLord#${idx + 10}`,
            score: item.score,
            length: item.longest_length || 35,
            arenaName: arenaFilter === 'all' ? 'Enchanted Forest' : arenaFilter,
            avatarColor: ['#10b981', '#06b6d4', '#ec4899', '#f59e0b', '#8b5cf6'][idx % 5],
          }));
        }
      } catch {
        // Fallback to local leaderboard
      }
    }

    return MOCK_LEADERBOARD;
  }
}

export const supabaseService = new SupabaseService();
