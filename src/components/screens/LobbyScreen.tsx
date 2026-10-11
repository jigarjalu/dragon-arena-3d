import React, { useRef, useEffect } from 'react';
import { Shirt, ShoppingBag, Settings, Trophy, Play, Home, Globe, Layers, User } from 'lucide-react';
import { PlayerProfile, DragonConfig, ScreenState } from '../../types/game';
import { TopCurrencyBar } from '../ui/TopCurrencyBar';
import { DragonIcon } from '../ui/DragonIcon';
import { sound } from '../../services/sound';
import { DragonPainter, DragonRenderState } from '../../game/DragonPainter';

interface LobbyScreenProps {
  profile: PlayerProfile;
  dragonConfig: DragonConfig;
  onNavigate: (screen: ScreenState) => void;
  onStartGame: () => void;
  onOpenAuth: () => void;
  onOpenPayment?: (type: 'coins' | 'gems') => void;
  isSupabaseConnected: boolean;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  profile,
  dragonConfig,
  onNavigate,
  onStartGame,
  onOpenAuth,
  onOpenPayment,
  isSupabaseConnected,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated background canvas with floating island and flying dragons
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      time += 0.025;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.45, '#7dd3fc');
      skyGrad.addColorStop(0.75, '#bae6fd');
      skyGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Parallax Floating Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 240 + time * 35) % (w + 200)) - 100;
        const cy = 60 + (i % 3) * 70;
        ctx.beginPath();
        ctx.arc(cx, cy, 40, 0, Math.PI * 2);
        ctx.arc(cx + 35, cy - 15, 50, 0, Math.PI * 2);
        ctx.arc(cx + 80, cy, 42, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Central Floating Island
      const islandX = w / 2;
      const islandY = h / 2 - 10 + Math.sin(time * 1.5) * 8; // gentle float bobbing

      // Island drop shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.beginPath();
      ctx.ellipse(islandX, islandY + 160, 220, 60, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rocky underside cone
      const rockGrad = ctx.createLinearGradient(islandX, islandY, islandX, islandY + 140);
      rockGrad.addColorStop(0, '#573419');
      rockGrad.addColorStop(0.6, '#382210');
      rockGrad.addColorStop(1, '#1e1108');
      ctx.fillStyle = rockGrad;
      ctx.beginPath();
      ctx.moveTo(islandX - 180, islandY);
      ctx.lineTo(islandX - 80, islandY + 110);
      ctx.lineTo(islandX, islandY + 145);
      ctx.lineTo(islandX + 90, islandY + 105);
      ctx.lineTo(islandX + 180, islandY);
      ctx.closePath();
      ctx.fill();

      // Lush grassy surface
      const grassGrad = ctx.createRadialGradient(islandX, islandY - 30, 20, islandX, islandY, 190);
      grassGrad.addColorStop(0, '#4ade80');
      grassGrad.addColorStop(0.6, '#22c55e');
      grassGrad.addColorStop(1, '#15803d');
      ctx.fillStyle = grassGrad;
      ctx.beginPath();
      ctx.ellipse(islandX, islandY, 185, 75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Trees and Flowers on the island
      [-90, -40, 50, 110].forEach((tx, idx) => {
        const ty = islandY - 15 + (idx % 2) * 15;
        // Tree trunk
        ctx.fillStyle = '#78350f';
        ctx.fillRect(islandX + tx - 4, ty - 25, 8, 25);
        // Foliage
        ctx.fillStyle = idx % 2 === 0 ? '#15803d' : '#16a34a';
        ctx.beginPath();
        ctx.arc(islandX + tx, ty - 35, 18, 0, Math.PI * 2);
        ctx.arc(islandX + tx - 10, ty - 28, 14, 0, Math.PI * 2);
        ctx.arc(islandX + tx + 10, ty - 28, 14, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Five Dragons circling the floating island in 2.5D with varying orbits and heights
      [
        { radiusX: 250, radiusY: 110, yOffset: -20, speed: 0.75, color: '#10b981', secColor: '#059669', wings: 'fin' as const, scale: 0.8 },
        { radiusX: 210, radiusY: 90, yOffset: 15, speed: -0.6, color: '#f59e0b', secColor: '#d97706', wings: 'bat' as const, scale: 0.75 },
        { radiusX: 290, radiusY: 130, yOffset: -45, speed: 0.5, color: '#ec4899', secColor: '#06b6d4', wings: 'none' as const, scale: 0.7 },
        { radiusX: 180, radiusY: 75, yOffset: 35, speed: 0.85, color: '#0284c7', secColor: '#0369a1', wings: 'fin' as const, scale: 0.65 },
        { radiusX: 320, radiusY: 140, yOffset: -10, speed: -0.45, color: '#ea580c', secColor: '#9a3412', wings: 'bat' as const, scale: 0.85 },
      ].forEach((d, idx) => {
        const dAngle = time * d.speed + (idx * (Math.PI * 2 / 5));
        const dx = islandX + Math.cos(dAngle) * d.radiusX;
        const dy = islandY + d.yOffset + Math.sin(dAngle) * d.radiusY;

        // Tangent heading angle
        const heading = dAngle + (d.speed > 0 ? Math.PI / 2 : -Math.PI / 2);

        // Generate segments
        const segments: { x: number; y: number; angle: number }[] = [];
        for (let i = 0; i < 22; i++) {
          const segAngle = dAngle - (i + 1) * 0.075 * Math.sign(d.speed);
          const sx = islandX + Math.cos(segAngle) * d.radiusX;
          const sy = islandY + d.yOffset + Math.sin(segAngle) * d.radiusY;
          segments.push({ x: sx, y: sy, angle: heading });
        }

        const state: DragonRenderState = {
          x: dx,
          y: dy,
          angle: heading,
          weight: 180,
          segments,
          wingFlapPhase: time * 4.5 + idx * 1.2,
        };

        const renderConfig: DragonConfig = {
          ...dragonConfig,
          primaryColor: d.color,
          secondaryColor: d.secColor,
          wings: d.wings,
        };

        DragonPainter.drawDragon(ctx, renderConfig, state, d.scale);
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [dragonConfig]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
      {/* Background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top Currency Bar */}
      <TopCurrencyBar
        profile={profile}
        onOpenAuth={onOpenAuth}
        onOpenPayment={onOpenPayment}
        isSupabaseConnected={isSupabaseConnected}
      />

      {/* Main Content Center */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-between px-4 py-2">
        {/* Logo Title with Official Dragon Icon Badge */}
        <div className="text-center pt-1 select-none pointer-events-none flex flex-col items-center">
          <div className="relative mb-0.5 sm:mb-1 drop-shadow-xl hover:scale-105 transition-transform">
            <DragonIcon size={72} withGlow={true} animate={true} />
          </div>
          <h1
            className="font-game text-3xl sm:text-5xl md:text-6xl font-black tracking-wider text-yellow-300 drop-shadow-[0_8px_0_#9a3412] leading-tight"
            style={{
              WebkitTextStroke: '2.5px #451a03',
              filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))',
            }}
          >
            DRAGON
            <span className="block text-amber-400 -mt-1 sm:-mt-2">ARENA 3D</span>
          </h1>
        </div>

        {/* Side Quick Access Buttons (Left & Right) */}
        <div className="w-full max-w-xl flex items-center justify-between px-2 sm:px-6">
          {/* Left Buttons: Wardrobe & Shop */}
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <button
              onClick={() => {
                sound.playClick();
                onNavigate('WARDROBE');
              }}
              className="btn-blue w-14 h-14 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center p-1 sm:p-1.5"
            >
              <Shirt className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300 drop-shadow" />
              <span className="font-game text-[10px] sm:text-sm text-white mt-0.5">Wardrobe</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onNavigate('SHOP');
              }}
              className="btn-purple w-14 h-14 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center p-1 sm:p-1.5"
            >
              <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300 drop-shadow" />
              <span className="font-game text-[10px] sm:text-sm text-white mt-0.5">Shop</span>
            </button>
          </div>

          {/* Right Buttons: Settings & Leaderboard */}
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <button
              onClick={() => {
                sound.playClick();
                onNavigate('SETTINGS');
              }}
              className="btn-blue w-14 h-14 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center p-1 sm:p-1.5"
            >
              <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300 drop-shadow" />
              <span className="font-game text-[10px] sm:text-sm text-white mt-0.5">Settings</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onNavigate('LEADERBOARD');
              }}
              className="btn-gold w-14 h-14 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center p-1 sm:p-1.5"
            >
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-amber-900 drop-shadow" />
              <span className="font-game text-[10px] sm:text-sm text-amber-950 mt-0.5">Ranks</span>
            </button>
          </div>
        </div>

        {/* Big Juicy PLAY Button */}
        <div className="mb-2 sm:mb-4">
          <button
            onClick={() => {
              sound.playClick();
              onStartGame();
            }}
            className="btn-gold px-10 sm:px-16 py-3 sm:py-4 rounded-3xl flex items-center gap-2.5 sm:gap-3 active:scale-95 transition-transform shadow-2xl"
          >
            <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-amber-950 text-amber-950" />
            <span className="font-game text-2xl sm:text-4xl text-amber-950 tracking-wider">
              PLAY
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="relative z-20 w-full bg-slate-950/90 border-t-2 border-blue-500/50 backdrop-blur-md px-4 py-2 flex items-center justify-around select-none">
        <button
          onClick={() => sound.playClick()}
          className="flex flex-col items-center text-yellow-400 font-game text-xs transition-transform active:scale-90"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 border border-blue-400 flex items-center justify-center shadow">
            <Home className="w-5 h-5 text-yellow-300" />
          </div>
          <span className="mt-1">Home</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onNavigate('ARENAS');
          }}
          className="flex flex-col items-center text-slate-300 hover:text-white font-game text-xs transition-transform active:scale-90"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-400" />
          </div>
          <span className="mt-1">Arenas</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onNavigate('SHOP');
          }}
          className="flex flex-col items-center text-slate-300 hover:text-white font-game text-xs transition-transform active:scale-90"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center">
            <Layers className="w-5 h-5 text-purple-400" />
          </div>
          <span className="mt-1">Collection</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onNavigate('PROFILE');
          }}
          className="flex flex-col items-center text-slate-300 hover:text-white font-game text-xs transition-transform active:scale-90"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="mt-1">Profile</span>
        </button>
      </div>
    </div>
  );
};
