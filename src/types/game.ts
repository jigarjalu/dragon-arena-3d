export type ScreenState = 
  | 'LOBBY' 
  | 'WARDROBE' 
  | 'ARENAS' 
  | 'GAMEPLAY' 
  | 'SHOP' 
  | 'LEADERBOARD' 
  | 'PROFILE' 
  | 'SETTINGS' 
  | 'AUTH';

export type ArenaId = 'forest' | 'desert' | 'lava' | 'frozen' | 'candy' | 'crystal' | 'sky';

export interface ArenaConfig {
  id: ArenaId;
  name: string;
  subtitle: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'LOCKED';
  themeColor: string;
  accentColor: string;
  unlockLevel: number;
  unlockCoins: number;
  objectiveWeight: number;
  objectiveDesc: string;
  bestScore: number;
  isUnlocked: boolean;
  bgDesc: string;
  hazards: string[];
}

export type HeadShape = 'wyrm' | 'drake' | 'serpent' | 'lord';
export type DragonPattern = 'plain' | 'stripes' | 'dots' | 'scales' | 'flames';
export type WingType = 'none' | 'fin' | 'bat' | 'feather';
export type TailType = 'point' | 'fan' | 'spade';

export interface DragonConfig {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  element: 'nature' | 'sweet' | 'electric' | 'water' | 'fire' | 'royal' | 'ice' | 'rainbow';
  priceCoins: number;
  priceGems: number;
  headShape: HeadShape;
  pattern: DragonPattern;
  primaryColor: string;
  secondaryColor: string;
  bellyColor: string;
  eyeColor: string;
  eyeStyle: number;
  horns: number;
  spikes: number;
  wings: WingType;
  tail: TailType;
  bodyPieces: string[];
  headPieces: string[];
  unlocked: boolean;
  description: string;
}

export interface CurrencyPack {
  id: string;
  type: 'coins' | 'gems';
  amount: number;
  priceInr: number;
  badge?: string;
  isPopular?: boolean;
}

export interface PlayerProfile {
  id: string;
  username: string;
  avatarUrl: string;
  level: number;
  xp: number;
  xpMax: number;
  coins: number;
  gems: number;
  equippedSkinId: string;
  equippedLoadout: {
    pattern?: DragonPattern;
    headPiece?: string;
    bodyPiece?: string;
    eyeStyle?: number;
    colorSwatch?: string;
  };
  favoriteArena: ArenaId;
  bestScore: number;
  gamesPlayed: number;
  totalFood: number;
  totalKills: number;
  totalWins: number;
  recentMatches: MatchHistoryItem[];
  inventory: {
    skins: string[];
    items: string[];
    powerups: Record<string, number>;
  };
}

export interface MatchHistoryItem {
  id: string;
  arenaId: ArenaId;
  arenaName: string;
  score: number;
  date: string;
  result: 'Win' | 'Loss';
}

export interface MatchResult {
  won: boolean;
  finalScore: number;
  bestScore: number;
  foodCollected: number;
  timeSurvivedSeconds: number;
  longestLength: number;
  coinsEarned: number;
  gemsEarned: number;
  xpEarned: number;
  arenaName: string;
  kills: number;
  maxWeight: number;
  isNewBest: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  length: number;
  arenaName: string;
  avatarColor: string;
  isPlayer?: boolean;
}

export interface GameSettings {
  music: boolean;
  sfx: boolean;
  graphicsQuality: 'High' | 'Medium' | 'Low';
  cameraPerspective: 'Third Person' | 'Top-Down';
  cameraSensitivity: number; // 0-100
  controlSensitivity: number; // 0-100
  reduceMotion: boolean;
  vibration: boolean;
  language: string;
  controlScheme: 'joystick' | 'swipe';
}

export interface PowerUpInventory {
  magnet: number;
  speed: number;
  zoom_in: number;
  zoom_out: number;
  shield: number;
  fire_breath: number;
}
