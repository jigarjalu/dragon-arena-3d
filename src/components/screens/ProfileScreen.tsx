import React, { useState } from 'react';
import { Edit2, Check, Trophy, Play, Apple, Skull, Award, Sparkles } from 'lucide-react';
import { PlayerProfile, DragonConfig, ScreenState } from '../../types/game';
import { TopCurrencyBar } from '../ui/TopCurrencyBar';
import { DragonPreviewCanvas } from '../ui/DragonPreviewCanvas';
import { DRAGON_CATALOG } from '../../data/gameData';
import { sound } from '../../services/sound';

interface ProfileScreenProps {
  profile: PlayerProfile;
  currentDragon: DragonConfig;
  onUpdateProfile: (updated: PlayerProfile) => void;
  onNavigate: (screen: ScreenState) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  currentDragon,
  onUpdateProfile,
  onNavigate,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [usernameInput, setUsernameInput] = useState(profile.username);
  const [activeTab, setActiveTab] = useState<'matches' | 'skins'>('matches');

  const handleSaveName = () => {
    sound.playClick();
    if (usernameInput.trim()) {
      onUpdateProfile({ ...profile, username: usernameInput.trim() });
    }
    setIsEditingName(false);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 select-none overflow-y-auto">
      {/* Top Bar */}
      <TopCurrencyBar
        profile={profile}
        title="Profile"
        onBack={() => onNavigate('LOBBY')}
      />

      {/* Main Container */}
      <div className="flex-1 w-full max-w-4xl mx-auto p-3 sm:p-5 flex flex-col gap-3">
        {/* User Card Header */}
        <div className="blue-panel rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Dragon Avatar circle */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 border-2 border-yellow-400 flex items-center justify-center shadow-lg relative overflow-hidden">
              <span className="text-3xl">🐲</span>
            </div>

            {/* User name & Level */}
            <div>
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      maxLength={18}
                      className="bg-slate-900 border border-blue-400 rounded-lg px-2 py-0.5 text-white font-game text-lg outline-none"
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="font-game text-2xl text-yellow-300 tracking-wide">
                      {profile.username}
                    </h2>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setIsEditingName(true);
                      }}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <span className="bg-blue-600 text-white font-game text-xs px-2 py-0.5 rounded-full border border-blue-400">
                  Lv. {profile.level}
                </span>
              </div>

              {/* XP Progress Bar */}
              <div className="w-48 sm:w-56 h-3 bg-slate-950 rounded-full mt-1.5 overflow-hidden border border-slate-700 relative">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (profile.xp / profile.xpMax) * 100)}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-white leading-none">
                  {profile.xp} / {profile.xpMax} XP
                </span>
              </div>
            </div>
          </div>

          {/* Quick Dragon & Favorite Arena Previews */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950/70 border border-blue-900/60 rounded-2xl p-2 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Equipped</span>
              <div className="w-14 h-12 flex items-center justify-center">
                <DragonPreviewCanvas config={currentDragon} width={65} height={55} scale={0.35} autoRotate={false} />
              </div>
              <span className="text-[10px] font-game text-yellow-300">{currentDragon.name}</span>
            </div>

            <div className="bg-slate-950/70 border border-blue-900/60 rounded-2xl p-2 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Favorite</span>
              <span className="text-2xl my-1">🌲</span>
              <span className="text-[10px] font-game text-emerald-300 capitalize">Forest</span>
            </div>
          </div>
        </div>

        {/* Stats Grid Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-900/80 border border-blue-900/70 rounded-2xl p-3 flex flex-col items-center">
            <Trophy className="w-5 h-5 text-yellow-400 mb-1" />
            <span className="text-[10px] text-slate-400 uppercase font-bold">Best Score</span>
            <span className="font-game text-lg text-yellow-300">{profile.bestScore.toLocaleString()}</span>
          </div>

          <div className="bg-slate-900/80 border border-blue-900/70 rounded-2xl p-3 flex flex-col items-center">
            <Play className="w-5 h-5 text-blue-400 mb-1" />
            <span className="text-[10px] text-slate-400 uppercase font-bold">Matches Played</span>
            <span className="font-game text-lg text-white">{profile.gamesPlayed}</span>
          </div>

          <div className="bg-slate-900/80 border border-blue-900/70 rounded-2xl p-3 flex flex-col items-center">
            <Apple className="w-5 h-5 text-red-400 mb-1" />
            <span className="text-[10px] text-slate-400 uppercase font-bold">Total Food</span>
            <span className="font-game text-lg text-emerald-400">{profile.totalFood.toLocaleString()}</span>
          </div>

          <div className="bg-slate-900/80 border border-blue-900/70 rounded-2xl p-3 flex flex-col items-center">
            <Skull className="w-5 h-5 text-purple-400 mb-1" />
            <span className="text-[10px] text-slate-400 uppercase font-bold">Kills / Wins</span>
            <span className="font-game text-lg text-purple-300">{profile.totalKills} / {profile.totalWins}</span>
          </div>
        </div>

        {/* Lower Sub-tabs (Recent Matches / Owned Skins) */}
        <div className="blue-panel rounded-2xl p-3 flex-1 flex flex-col">
          <div className="flex items-center gap-2 border-b border-blue-900/60 pb-2 mb-2">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('matches');
              }}
              className={`font-game text-sm px-3 py-1 rounded-xl transition-all ${
                activeTab === 'matches' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Recent Matches
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('skins');
              }}
              className={`font-game text-sm px-3 py-1 rounded-xl transition-all ${
                activeTab === 'skins' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Owned Skins ({profile.inventory.skins.length})
            </button>
          </div>

          {activeTab === 'matches' && (
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[220px]">
              {profile.recentMatches.map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-game text-slate-200">{m.arenaName}</span>
                    <span className="text-[10px] text-slate-500">{m.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-yellow-300">{m.score}</span>
                    <span
                      className={`font-game text-[10px] px-2 py-0.5 rounded-full uppercase ${
                        m.result === 'Win' ? 'bg-emerald-600/80 text-emerald-200' : 'bg-red-600/80 text-red-200'
                      }`}
                    >
                      {m.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'skins' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 overflow-y-auto max-h-[220px]">
              {DRAGON_CATALOG.filter((d) => profile.inventory.skins.includes(d.id)).map((dragon) => (
                <div key={dragon.id} className="bg-slate-950/70 border border-blue-900/50 rounded-xl p-2 flex flex-col items-center">
                  <div className="w-16 h-14 flex items-center justify-center">
                    <DragonPreviewCanvas config={dragon} width={70} height={60} scale={0.4} autoRotate={false} />
                  </div>
                  <span className="font-game text-xs text-yellow-300 mt-1">{dragon.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
