import React, { useState, useEffect } from 'react';
import { Crown, Trophy, RefreshCw } from 'lucide-react';
import { PlayerProfile, LeaderboardEntry, ScreenState } from '../../types/game';
import { TopCurrencyBar } from '../ui/TopCurrencyBar';
import { supabaseService } from '../../services/supabase';
import { sound } from '../../services/sound';

interface LeaderboardScreenProps {
  profile: PlayerProfile;
  onNavigate: (screen: ScreenState) => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  profile,
  onNavigate,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'Global' | 'Daily' | 'Weekly' | 'Friends'>('Global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const data = await supabaseService.fetchLeaderboard();
    setEntries(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const top1 = entries[0];
  const top2 = entries[1];
  const top3 = entries[2];
  const restRanks = entries.slice(3);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 select-none overflow-y-auto">
      {/* Top Bar */}
      <TopCurrencyBar
        profile={profile}
        title="Leaderboard"
        onBack={() => onNavigate('LOBBY')}
      />

      {/* Main Container */}
      <div className="flex-1 w-full max-w-4xl mx-auto p-3 sm:p-5 flex flex-col">
        {/* Period Tabs (Global, Daily, Weekly, Friends) */}
        <div className="flex items-center justify-between gap-2 p-1 bg-slate-900/90 rounded-2xl border border-blue-900/80 mb-3">
          {(['Global', 'Daily', 'Weekly', 'Friends'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                sound.playClick();
                setFilterPeriod(tab);
              }}
              className={`flex-1 py-1.5 rounded-xl font-game text-xs sm:text-sm tracking-wide transition-all ${
                filterPeriod === tab
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
          <button
            onClick={loadData}
            className="p-2 rounded-xl text-slate-400 hover:text-white active:rotate-180 transition-transform"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Top 3 Podium (2nd Silver, 1st Gold Center, 3rd Bronze Right) */}
        {entries.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end mb-4 pt-4 px-2">
            {/* 2nd Place (Silver) */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-700 border-2 border-slate-300 flex items-center justify-center shadow-lg relative -mb-3 z-10">
                <span className="font-game text-xl sm:text-2xl text-white">2</span>
              </div>
              <div className="w-full bg-gradient-to-t from-slate-800 to-slate-700 border-2 border-slate-500 rounded-2xl pt-5 pb-3 px-2 flex flex-col items-center text-center shadow-xl">
                <span className="font-game text-xs sm:text-sm text-slate-200 truncate max-w-full">
                  {top2.username}
                </span>
                <span className="font-mono text-yellow-300 text-xs sm:text-sm font-bold mt-0.5">
                  {top2.score}
                </span>
                <span className="text-[10px] text-slate-400">{top2.arenaName}</span>
              </div>
            </div>

            {/* 1st Place (Gold, Highest) */}
            <div className="flex flex-col items-center">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-amber-500 border-3 border-yellow-200 flex flex-col items-center justify-center shadow-2xl relative -mb-4 z-10">
                <Crown className="w-5 h-5 text-yellow-100 fill-yellow-200 -mt-1" />
                <span className="font-game text-2xl sm:text-3xl text-amber-950 font-black">1</span>
              </div>
              <div className="w-full bg-gradient-to-t from-amber-700 to-amber-600 border-2 border-yellow-400 rounded-2xl pt-7 pb-4 px-2 flex flex-col items-center text-center shadow-2xl">
                <span className="font-game text-sm sm:text-base text-yellow-100 truncate max-w-full">
                  {top1.username}
                </span>
                <span className="font-mono text-yellow-300 text-sm sm:text-base font-black mt-0.5">
                  {top1.score}
                </span>
                <span className="text-[10px] text-yellow-200/80">{top1.arenaName}</span>
              </div>
            </div>

            {/* 3rd Place (Bronze) */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-900 border-2 border-amber-600 flex items-center justify-center shadow-lg relative -mb-3 z-10">
                <span className="font-game text-xl sm:text-2xl text-amber-200">3</span>
              </div>
              <div className="w-full bg-gradient-to-t from-amber-950 to-amber-900 border-2 border-amber-700 rounded-2xl pt-5 pb-3 px-2 flex flex-col items-center text-center shadow-xl">
                <span className="font-game text-xs sm:text-sm text-amber-200 truncate max-w-full">
                  {top3.username}
                </span>
                <span className="font-mono text-yellow-300 text-xs sm:text-sm font-bold mt-0.5">
                  {top3.score}
                </span>
                <span className="text-[10px] text-amber-400/80">{top3.arenaName}</span>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Rank List */}
        <div className="blue-panel rounded-2xl p-2 sm:p-3 flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-[300px]">
          {restRanks.map((item) => (
            <div
              key={item.rank}
              className={`flex items-center justify-between p-2 rounded-xl text-xs sm:text-sm transition-colors ${
                item.isPlayer
                  ? 'bg-yellow-500/25 border border-yellow-400/60 text-yellow-200 font-bold'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-game text-slate-400 w-5 text-center">#{item.rank}</span>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-inner"
                  style={{ backgroundColor: item.avatarColor }}
                >
                  {item.username[0]}
                </div>
                <span className="font-semibold">{item.username}</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="hidden sm:inline text-xs text-slate-400">{item.arenaName}</span>
                <span className="text-xs text-slate-400">{item.length} segs</span>
                <span className="font-mono text-yellow-300 font-bold min-w-[55px] text-right">
                  {item.score}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Fixed Player Current Rank Footer */}
        <div className="mt-3 p-3 bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl border-2 border-yellow-400 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="font-game text-sm text-white">Your Rank: #5</span>
          </div>
          <span className="font-mono text-yellow-300 font-bold text-sm">
            Best Score: {profile.bestScore.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
