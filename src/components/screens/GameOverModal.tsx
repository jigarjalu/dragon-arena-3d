import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Play, Globe, Shirt, Home, Trophy, Apple, Clock, Coins, Sparkles, Award } from 'lucide-react';
import { MatchResult, DragonConfig } from '../../types/game';
import { DragonPreviewCanvas } from '../ui/DragonPreviewCanvas';
import { sound } from '../../services/sound';

interface GameOverModalProps {
  result: MatchResult;
  dragonConfig: DragonConfig;
  onPlayAgain: () => void;
  onChangeArena: () => void;
  onOpenWardrobe: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  result,
  dragonConfig,
  onPlayAgain,
  onChangeArena,
  onOpenWardrobe,
  onMainMenu,
}) => {
  useEffect(() => {
    if (result.won || result.isNewBest) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [result]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 select-none overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-2xl flex flex-col items-center my-auto">
        {/* Wood Banner Header */}
        <div
          className={`wood-banner px-8 py-2.5 rounded-2xl font-game text-3xl sm:text-4xl tracking-wider uppercase mb-3 shadow-2xl ${
            result.won ? 'text-green-300' : 'text-yellow-300'
          }`}
        >
          {result.won ? 'VICTORY!' : 'GAME OVER'}
        </div>

        {/* Main Results Panel */}
        <div className="blue-panel w-full rounded-3xl p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Left Column: Dragon Trophy & Status */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-blue-950/60 rounded-2xl p-3 border-2 border-blue-900 shadow-inner">
            <DragonPreviewCanvas
              config={dragonConfig}
              width={200}
              height={190}
              scale={0.9}
              autoRotate={true}
            />

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400 text-amber-950 font-game text-sm mt-1 shadow-md">
              <Trophy className="w-4 h-4 fill-amber-950" />
              <span>{result.isNewBest ? '★ NEW BEST SCORE!' : 'MATCH SUMMARY'}</span>
            </div>
          </div>

          {/* Right Column: Score Breakdown Stats */}
          <div className="md:col-span-7 flex flex-col gap-2">
            <div className="bg-slate-950/80 rounded-2xl p-3 border border-blue-900/60 flex flex-col gap-1.5 text-xs sm:text-sm">
              {/* Final Score */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-game">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-yellow-400" />
                  Final Score
                </span>
                <span className="text-yellow-300 text-lg font-bold">{result.finalScore}</span>
              </div>

              {/* Best Score */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Best Score</span>
                <span className="text-white font-mono">{result.bestScore}</span>
              </div>

              {/* Food Collected */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Apple className="w-3.5 h-3.5 text-red-400" />
                  Food Collected
                </span>
                <span className="text-white font-mono">{result.foodCollected}</span>
              </div>

              {/* Time Survived */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Time Survived
                </span>
                <span className="text-white font-mono">{formatTime(result.timeSurvivedSeconds)}</span>
              </div>

              {/* Longest Length */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Longest Length</span>
                <span className="text-white font-mono">{result.longestLength} segs</span>
              </div>

              {/* Coins Earned */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  Coins Earned
                </span>
                <span className="text-yellow-400 font-bold font-mono">+{result.coinsEarned}</span>
              </div>

              {/* Arena Name */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Arena</span>
                <span className="text-blue-300 font-semibold">{result.arenaName}</span>
              </div>

              {/* XP Gained */}
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  XP Gained
                </span>
                <span className="text-purple-300 font-bold font-mono">+{result.xpEarned} XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full mt-3">
          <button
            onClick={() => {
              sound.playClick();
              onPlayAgain();
            }}
            className="btn-green py-3 rounded-2xl font-game text-base sm:text-lg text-white flex items-center justify-center gap-1.5 active:scale-95 shadow-lg"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Play Again</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onChangeArena();
            }}
            className="btn-blue py-3 rounded-2xl font-game text-base sm:text-lg text-white flex items-center justify-center gap-1.5 active:scale-95 shadow-lg"
          >
            <Globe className="w-5 h-5" />
            <span>Arenas</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenWardrobe();
            }}
            className="btn-purple py-3 rounded-2xl font-game text-base sm:text-lg text-white flex items-center justify-center gap-1.5 active:scale-95 shadow-lg"
          >
            <Shirt className="w-5 h-5" />
            <span>Wardrobe</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onMainMenu();
            }}
            className="bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 py-3 rounded-2xl font-game text-base sm:text-lg text-white flex items-center justify-center gap-1.5 active:scale-95 shadow-lg"
          >
            <Home className="w-5 h-5" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
