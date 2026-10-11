import React, { useEffect, useRef, useState } from 'react';
import { Pause, Zap, Flame, Magnet, Compass, ZoomIn, ZoomOut, Shield, Apple, Coins, Trophy } from 'lucide-react';
import { ArenaId, DragonConfig, MatchResult } from '../../types/game';
import { GameEngine } from '../../game/GameEngine';
import { sound } from '../../services/sound';
import { DragonIcon } from '../ui/DragonIcon';

interface GameplayScreenProps {
  arenaId: ArenaId;
  dragonConfig: DragonConfig;
  onPause: () => void;
  onGameOver: (result: MatchResult) => void;
}

export const GameplayScreen: React.FC<GameplayScreenProps> = ({
  arenaId,
  dragonConfig,
  onPause,
  onGameOver,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [showLeaderboardMobile, setShowLeaderboardMobile] = useState(false);

  // HUD State synced from GameEngine
  const [hudState, setHudState] = useState({
    score: 0,
    weight: 100,
    applesEaten: 0,
    stamina: 100,
    topPlayers: [
      { name: 'Jigar', score: 0, isPlayer: true },
      { name: 'SnakeKing', score: 1980, isPlayer: false },
      { name: 'CoolDude', score: 1760, isPlayer: false },
      { name: 'QueenSnek', score: 1420, isPlayer: false },
      { name: 'Frosty', score: 980, isPlayer: false },
    ],
    playerRank: 1,
    powerupTimers: { magnet: 0, speed: 0, shield: false },
    minimapData: {
      player: { x: 0, y: 0 },
      bots: [] as { x: number; y: number }[],
      radius: 2400,
    },
  });

  // Joystick touch tracking
  const joystickContainerRef = useRef<HTMLDivElement>(null);
  const [joystickThumb, setJoystickThumb] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Resize canvas
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Initialize Game Engine
    const engine = new GameEngine(canvas, arenaId, dragonConfig);
    engineRef.current = engine;

    engine.onUpdateHud = (state) => {
      setHudState(state);
    };

    engine.onGameOverCallback = (result) => {
      onGameOver(result);
    };

    engine.start();

    return () => {
      engine.destroy();
      window.removeEventListener('resize', handleResize);
    };
  }, [arenaId, dragonConfig, onGameOver]);

  // Virtual Joystick touch handlers
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsJoystickActive(true);
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickContainerRef.current) return;
    const rect = joystickContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxDist = rect.width / 2;

    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, maxDist);

    const thumbX = Math.cos(angle) * clampedDist;
    const thumbY = Math.sin(angle) * clampedDist;

    setJoystickThumb({ x: thumbX, y: thumbY });

    if (engineRef.current) {
      engineRef.current.setJoystickVector(thumbX / maxDist, thumbY / maxDist);
    }
  };

  const handleTouchEnd = () => {
    setIsJoystickActive(false);
    setJoystickThumb({ x: 0, y: 0 });
    if (engineRef.current) {
      engineRef.current.setJoystickVector(0, 0);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none touch-none bg-slate-950">
      {/* Game Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* 1. TOP-LEFT: Top Players Leaderboard (Responsive: Collapsible pill on mobile, full table on desktop) */}
      <div className="absolute top-2.5 left-2.5 z-30">
        {/* Mobile quick rank badge */}
        <div className="sm:hidden">
          <button
            onClick={() => {
              sound.playClick();
              setShowLeaderboardMobile(!showLeaderboardMobile);
            }}
            className="bg-slate-950/90 border-2 border-yellow-500/80 rounded-xl px-2 py-1 shadow-xl backdrop-blur-sm flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <DragonIcon size={20} withGlow={false} />
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span className="font-game text-yellow-300 text-xs">#{hudState.playerRank}</span>
          </button>
          {showLeaderboardMobile && (
            <div className="mt-1.5 bg-slate-950/95 border-2 border-blue-900/90 rounded-2xl p-2 shadow-2xl backdrop-blur-md min-w-[160px]">
              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wide border-b border-blue-900/60 pb-1 mb-1">
                Top Players (Arena: 23)
              </div>
              <div className="flex flex-col gap-0.5 text-[11px]">
                {hudState.topPlayers.map((p, idx) => (
                  <div
                    key={p.name + idx}
                    className={`flex items-center justify-between px-1.5 py-0.5 rounded font-game ${
                      p.isPlayer
                        ? 'bg-yellow-500/25 text-yellow-300 font-bold border border-yellow-500/40'
                        : 'text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className={idx === 0 ? 'text-yellow-400' : 'text-slate-400'}>
                        {idx + 1}.
                      </span>
                      <span className="truncate max-w-[80px]">{p.name}</span>
                    </div>
                    <span className="font-mono text-[10px]">{p.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Desktop persistent card */}
        <div className="hidden sm:block pointer-events-none bg-slate-950/85 border-2 border-blue-900/80 rounded-2xl p-2.5 shadow-2xl backdrop-blur-sm min-w-[170px] sm:min-w-[190px]">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wide border-b border-blue-900/60 pb-1 mb-1">
            Top Players (Arena: 23)
          </div>
          <div className="flex flex-col gap-0.5 text-xs">
            {hudState.topPlayers.map((p, idx) => (
              <div
                key={p.name + idx}
                className={`flex items-center justify-between px-1.5 py-0.5 rounded font-game ${
                  p.isPlayer
                    ? 'bg-yellow-500/25 text-yellow-300 font-bold border border-yellow-500/40'
                    : 'text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={idx === 0 ? 'text-yellow-400' : 'text-slate-400'}>
                    {idx + 1}.
                  </span>
                  <span className="truncate max-w-[90px]">{p.name}</span>
                </div>
                <span className="font-mono text-xs">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. TOP-CENTER: Objective Progress Bar */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center max-w-[48vw] sm:max-w-none">
        <div className="bg-slate-950/90 border-2 border-emerald-500/70 rounded-xl sm:rounded-2xl px-2 sm:px-3.5 py-1 sm:py-1.5 shadow-2xl backdrop-blur-sm flex flex-col items-center w-full min-w-0 sm:min-w-[220px]">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-game text-yellow-300 truncate max-w-full">
            <DragonIcon size={18} withGlow={false} />
            <Apple className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400 shrink-0" />
            <span className="truncate">Eat Apples ({Math.min(10, hudState.applesEaten)}/10)</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 sm:h-2.5 bg-slate-800 rounded-full mt-1 overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (hudState.applesEaten / 10) * 100)}%` }}
            />
          </div>
          <div className="text-[9px] sm:text-[10px] text-emerald-300 font-semibold mt-0.5 truncate">
            Weight: {hudState.weight} / 1000
          </div>
        </div>
      </div>

      {/* 3. TOP-RIGHT: Score & Pause Button */}
      <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1.5 sm:gap-2">
        {/* Score pill */}
        <div className="bg-slate-950/85 border-2 border-yellow-500/80 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-1 sm:py-1.5 shadow-xl backdrop-blur-sm flex items-center gap-1.5">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-yellow-400 flex items-center justify-center text-amber-950 font-bold text-[10px] sm:text-xs shadow-inner shrink-0">
            <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-yellow-400/80 leading-none hidden xs:inline">Score</span>
            <span className="font-game text-white text-sm sm:text-base leading-tight">
              {hudState.score}
            </span>
          </div>
        </div>

        {/* Pause Button */}
        <button
          onClick={() => {
            sound.playClick();
            if (engineRef.current) engineRef.current.pause();
            onPause();
          }}
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-500 border-2 border-blue-400 flex items-center justify-center shadow-xl active:scale-90 transition-transform"
          title="Pause Game"
        >
          <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>
      </div>

      {/* 4. RIGHT SIDE: Minimap Radar & Power-up Buttons */}
      <div className="absolute right-2.5 top-16 sm:top-20 z-30 flex flex-col items-center gap-2 sm:gap-3">
        {/* Minimap Circle */}
        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-slate-950/80 border-2 border-blue-500/60 shadow-xl relative overflow-hidden backdrop-blur-sm pointer-events-none">
          {/* Arena border ring */}
          <div className="absolute inset-0.5 sm:inset-1 rounded-full border border-blue-400/30" />
          {/* Bots dots */}
          {hudState.minimapData.bots.slice(0, 15).map((b, idx) => {
            const nx = 50 + (b.x / hudState.minimapData.radius) * 40;
            const ny = 50 + (b.y / hudState.minimapData.radius) * 40;
            return (
              <div
                key={idx}
                className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-400 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${nx}%`, top: `${ny}%` }}
              />
            );
          })}
          {/* Player green dot */}
          <div
            className="absolute w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 border border-white shadow-sm -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${50 + (hudState.minimapData.player.x / hudState.minimapData.radius) * 40}%`,
              top: `${50 + (hudState.minimapData.player.y / hudState.minimapData.radius) * 40}%`,
            }}
          />
        </div>

        {/* Power-up Buttons Stack */}
        <div className="flex flex-col gap-1.5 sm:gap-2">
          {/* Magnet */}
          <button
            onClick={() => engineRef.current?.activatePowerUp('magnet')}
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center shadow-lg relative active:scale-90 transition-transform ${
              hudState.powerupTimers.magnet > 0
                ? 'bg-blue-600 border-yellow-400 ring-2 ring-yellow-400'
                : 'bg-blue-900/90 border-blue-400 hover:bg-blue-800'
            }`}
          >
            <Magnet className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white font-game text-[9px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center border border-white">
              {hudState.powerupTimers.magnet > 0 ? hudState.powerupTimers.magnet : 5}
            </span>
          </button>

          {/* Speed */}
          <button
            onClick={() => engineRef.current?.activatePowerUp('speed')}
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center shadow-lg relative active:scale-90 transition-transform ${
              hudState.powerupTimers.speed > 0
                ? 'bg-emerald-600 border-yellow-400 ring-2 ring-yellow-400'
                : 'bg-emerald-900/90 border-emerald-400 hover:bg-emerald-800'
            }`}
          >
            <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white font-game text-[9px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center border border-white">
              {hudState.powerupTimers.speed > 0 ? hudState.powerupTimers.speed : 3}
            </span>
          </button>

          {/* Shield */}
          <button
            onClick={() => engineRef.current?.activatePowerUp('shield')}
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center shadow-lg relative active:scale-90 transition-transform ${
              hudState.powerupTimers.shield
                ? 'bg-cyan-600 border-yellow-400 ring-2 ring-yellow-400'
                : 'bg-cyan-900/90 border-cyan-400 hover:bg-cyan-800'
            }`}
          >
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white font-game text-[9px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center border border-white">
              2
            </span>
          </button>

          {/* Zoom In & Zoom Out */}
          <div className="flex gap-1">
            <button
              onClick={() => engineRef.current?.activatePowerUp('zoom_in')}
              className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-slate-900/90 border border-slate-600 hover:bg-slate-800 flex items-center justify-center active:scale-90 shadow"
            >
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </button>
            <button
              onClick={() => engineRef.current?.activatePowerUp('zoom_out')}
              className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-slate-900/90 border border-slate-600 hover:bg-slate-800 flex items-center justify-center active:scale-90 shadow"
            >
              <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM-LEFT: Virtual Joystick for touch / mouse */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-30">
        <div
          ref={joystickContainerRef}
          onMouseDown={handleTouchStart}
          onMouseMove={isJoystickActive ? handleTouchMove : undefined}
          onMouseUp={handleTouchEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-slate-950/70 border-4 border-blue-500/60 shadow-2xl relative flex items-center justify-center backdrop-blur-sm cursor-pointer"
        >
          {/* Center Joystick Thumb Knob */}
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-b from-blue-400 to-blue-700 border-2 border-white shadow-xl flex items-center justify-center transition-transform"
            style={{
              transform: `translate(${joystickThumb.x}px, ${joystickThumb.y}px)`,
            }}
          >
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white/40" />
          </div>
        </div>
      </div>

      {/* 6. BOTTOM-RIGHT: Action Buttons (Boost & Fire Breath) */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 flex items-center gap-2 sm:gap-3">
        {/* Fire Breath Button */}
        <button
          onClick={() => engineRef.current?.activateFireBreath()}
          className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl sm:rounded-3xl btn-red flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-transform"
          title="Fire Breath (Key: F)"
        >
          <Flame className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-300 drop-shadow" />
          <span className="font-game text-[9px] sm:text-[10px] text-white">FIRE</span>
        </button>

        {/* Large Boost Button */}
        <button
          onMouseDown={() => engineRef.current?.setBoost(true)}
          onMouseUp={() => engineRef.current?.setBoost(false)}
          onTouchStart={() => engineRef.current?.setBoost(true)}
          onTouchEnd={() => engineRef.current?.setBoost(false)}
          className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl sm:rounded-3xl btn-gold flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-transform relative"
          title="Wing Dash Boost (Spacebar)"
        >
          <Zap className="w-8 h-8 sm:w-9 sm:h-9 text-amber-950 fill-amber-950" />
          <span className="font-game text-[11px] sm:text-xs text-amber-950 -mt-0.5 sm:-mt-1 font-black">
            BOOST
          </span>

          {/* Stamina Meter circular progress around button */}
          <div className="absolute -bottom-1.5 sm:-bottom-2 px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-900 border border-yellow-500 text-[9px] sm:text-[10px] text-yellow-300 font-mono">
            {hudState.stamina}%
          </div>
        </button>
      </div>
    </div>
  );
};
