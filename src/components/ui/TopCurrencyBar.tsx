import React from 'react';
import { Coins, Gem, ArrowLeft, X } from 'lucide-react';
import { PlayerProfile } from '../../types/game';
import { sound } from '../../services/sound';

import { DragonIcon } from './DragonIcon';

interface TopCurrencyBarProps {
  profile: PlayerProfile;
  title?: string;
  onBack?: () => void;
  onOpenAuth?: () => void;
  onOpenPayment?: (type: 'coins' | 'gems') => void;
  isSupabaseConnected?: boolean;
}

export const TopCurrencyBar: React.FC<TopCurrencyBarProps> = ({
  profile,
  title,
  onBack,
  onOpenPayment,
}) => {
  return (
    <div className="w-full flex items-center justify-between px-3 py-2 z-30 select-none">
      {/* Left Back or Title button + Dragon Profile Badge */}
      <div className="flex items-center gap-2">
        {onBack ? (
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 border-2 border-blue-400 flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-slate-950/85 border-2 border-emerald-500/70 rounded-full pl-1.5 pr-3 py-1 shadow-md">
            <DragonIcon size={30} withGlow={false} />
            <div className="flex flex-col">
              <span className="font-game text-xs sm:text-sm text-yellow-300 font-bold truncate max-w-[90px] sm:max-w-[130px] leading-tight">
                {profile.username || 'Rider'}
              </span>
              <span className="text-[9px] text-emerald-400 font-bold leading-none">
                Lv.{profile.level} Dragon
              </span>
            </div>
          </div>
        )}
        {title && (
          <div className="wood-banner px-4 py-1.5 rounded-xl text-yellow-300 font-game text-xl tracking-wider uppercase shadow-md flex items-center gap-2">
            <DragonIcon size={24} withGlow={false} />
            <span>{title}</span>
          </div>
        )}
      </div>

      {/* Right Currencies */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Coins Pill */}
        <div className="flex items-center bg-slate-950/85 border-2 border-yellow-500/70 rounded-full px-2.5 py-1 shadow-md">
          <div className="w-6 h-6 rounded-full bg-yellow-400 border border-yellow-200 flex items-center justify-center mr-1.5 shadow-inner">
            <Coins className="w-3.5 h-3.5 text-amber-900" />
          </div>
          <span className="font-game text-yellow-300 text-sm sm:text-base mr-1 tracking-wide">
            {profile.coins.toLocaleString()}
          </span>
          <button
            onClick={() => {
              sound.playClick();
              onOpenPayment?.('coins');
            }}
            className="w-5 h-5 rounded-full bg-emerald-500 hover:bg-emerald-400 border border-emerald-300 text-white font-bold text-xs flex items-center justify-center active:scale-90 transition-transform shadow cursor-pointer"
            title="Buy Coins (₹)"
          >
            +
          </button>
        </div>

        {/* Gems Pill */}
        <div className="flex items-center bg-slate-950/85 border-2 border-purple-500/70 rounded-full px-2.5 py-1 shadow-md">
          <div className="w-6 h-6 rounded-full bg-purple-500 border border-purple-300 flex items-center justify-center mr-1.5 shadow-inner">
            <Gem className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-game text-purple-300 text-sm sm:text-base mr-1 tracking-wide">
            {profile.gems.toLocaleString()}
          </span>
          <button
            onClick={() => {
              sound.playClick();
              onOpenPayment?.('gems');
            }}
            className="w-5 h-5 rounded-full bg-emerald-500 hover:bg-emerald-400 border border-emerald-300 text-white font-bold text-xs flex items-center justify-center active:scale-90 transition-transform shadow cursor-pointer"
            title="Buy Gems (₹)"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};
