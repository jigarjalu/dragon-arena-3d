import React from 'react';
import { Lock, Trophy, Play, Check } from 'lucide-react';
import { PlayerProfile, ArenaConfig, ArenaId, ScreenState } from '../../types/game';
import { TopCurrencyBar } from '../ui/TopCurrencyBar';
import { INITIAL_ARENAS } from '../../data/gameData';
import { sound } from '../../services/sound';

interface ArenaSelectionScreenProps {
  profile: PlayerProfile;
  selectedArenaId: ArenaId;
  onSelectArena: (arenaId: ArenaId) => void;
  onStartGame: () => void;
  onNavigate: (screen: ScreenState) => void;
}

export const ArenaSelectionScreen: React.FC<ArenaSelectionScreenProps> = ({
  profile,
  selectedArenaId,
  onSelectArena,
  onStartGame,
  onNavigate,
}) => {
  const topArenas = INITIAL_ARENAS.slice(0, 3);
  const bottomArenas = INITIAL_ARENAS.slice(3);

  const handleSelect = (arena: ArenaConfig) => {
    sound.playClick();
    if (arena.isUnlocked || arena.id === 'forest' || arena.id === 'desert') {
      onSelectArena(arena.id);
      onStartGame();
    } else if (arena.id === 'lava') {
      // Lava can be unlocked or selected
      onSelectArena(arena.id);
      onStartGame();
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 select-none overflow-y-auto">
      {/* Top Currency Bar */}
      <TopCurrencyBar
        profile={profile}
        title="Arenas"
        onBack={() => onNavigate('LOBBY')}
      />

      {/* Main Content */}
      <div className="flex-1 w-full max-w-5xl mx-auto p-3 sm:p-5 flex flex-col justify-between">
        {/* Top 3 Primary Featured Floating Island Arenas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-auto">
          {topArenas.map((arena) => {
            const isSelected = selectedArenaId === arena.id;
            return (
              <div
                key={arena.id}
                className={`blue-panel rounded-3xl p-3 flex flex-col justify-between transition-all transform hover:-translate-y-1 ${
                  isSelected ? 'ring-4 ring-yellow-400' : ''
                }`}
              >
                {/* Island Graphic Header */}
                <div
                  className="w-full h-36 rounded-2xl relative overflow-hidden border-2 border-slate-900 flex items-center justify-center shadow-inner"
                  style={{
                    background:
                      arena.id === 'forest'
                        ? 'linear-gradient(180deg, #166534 0%, #14532d 100%)'
                        : arena.id === 'desert'
                        ? 'linear-gradient(180deg, #b45309 0%, #78350f 100%)'
                        : 'linear-gradient(180deg, #991b1b 0%, #450a0a 100%)',
                  }}
                >
                  {/* Procedural Island Visuals */}
                  {arena.id === 'forest' && (
                    <div className="text-center">
                      <span className="text-5xl block">🌲🏰🌳</span>
                      <div className="text-emerald-300 font-bold text-xs mt-1">Lush Grassland & Sprites</div>
                    </div>
                  )}
                  {arena.id === 'desert' && (
                    <div className="text-center">
                      <span className="text-5xl block">🏜️🏛️🌵</span>
                      <div className="text-amber-300 font-bold text-xs mt-1">Dunes & Ancient Pyramids</div>
                    </div>
                  )}
                  {arena.id === 'lava' && (
                    <div className="text-center">
                      <span className="text-5xl block">🌋🔥🌋</span>
                      <div className="text-orange-300 font-bold text-xs mt-1">Volcanic Obsidian & Magma</div>
                    </div>
                  )}

                  {/* Difficulty Tag */}
                  <div
                    className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full font-game text-xs tracking-wider border shadow-md ${
                      arena.difficulty === 'BEGINNER'
                        ? 'bg-emerald-600 border-emerald-400 text-white'
                        : arena.difficulty === 'INTERMEDIATE'
                        ? 'bg-amber-600 border-amber-400 text-white'
                        : 'bg-red-600 border-red-400 text-white'
                    }`}
                  >
                    {arena.difficulty}
                  </div>
                </div>

                {/* Arena Info */}
                <div className="my-3 text-center">
                  <h3 className="font-game text-xl text-yellow-300 tracking-wide">
                    {arena.name}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-blue-200 mt-1 font-semibold">
                    <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Best Score: {arena.bestScore.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Target: {arena.objectiveWeight} Weight
                  </div>
                </div>

                {/* Select / Unlock Button */}
                <button
                  onClick={() => handleSelect(arena)}
                  className={`w-full py-2.5 rounded-xl font-game text-lg tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-md ${
                    isSelected ? 'btn-green text-white' : 'btn-blue text-white'
                  }`}
                >
                  {isSelected ? <Check className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                  <span>{isSelected ? 'SELECTED' : 'SELECT'}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Secondary Locked Arenas Carousel */}
        <div className="mt-4 pt-3 border-t border-blue-900/40">
          <span className="font-game text-xs text-blue-300 tracking-wider uppercase block mb-2 text-center">
            Upcoming Expansion Islands
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {bottomArenas.map((arena) => (
              <div
                key={arena.id}
                className="bg-slate-950/70 border border-slate-800 rounded-2xl p-2.5 flex flex-col items-center justify-between opacity-80"
              >
                <div className="w-full h-16 rounded-xl bg-slate-900 flex items-center justify-center mb-1.5 relative border border-slate-800">
                  <Lock className="w-6 h-6 text-slate-500" />
                </div>
                <span className="font-game text-xs text-slate-300 text-center">
                  {arena.name}
                </span>
                <span className="text-[10px] text-amber-400/90 font-bold mt-0.5">
                  Unlock Lv. {arena.unlockLevel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
