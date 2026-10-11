import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { RotateCw, Check, Sparkles, ChevronLeft, ChevronRight, Lock, AlertCircle, Coins, Gem, X, Play } from 'lucide-react';
import { PlayerProfile, DragonConfig, ScreenState } from '../../types/game';
import { TopCurrencyBar } from '../ui/TopCurrencyBar';
import { DragonPreviewCanvas } from '../ui/DragonPreviewCanvas';
import { DragonIcon } from '../ui/DragonIcon';
import { DRAGON_CATALOG } from '../../data/gameData';
import { sound } from '../../services/sound';

interface WardrobeScreenProps {
  profile: PlayerProfile;
  currentDragon: DragonConfig;
  onSelectDragon: (dragon: DragonConfig) => void;
  onUpdateProfile: (updated: PlayerProfile) => void;
  onNavigate: (screen: ScreenState) => void;
  onOpenPayment?: (type: 'coins' | 'gems') => void;
}

export const WardrobeScreen: React.FC<WardrobeScreenProps> = ({
  profile,
  currentDragon,
  onSelectDragon,
  onUpdateProfile,
  onNavigate,
  onOpenPayment,
}) => {
  const [activeTab, setActiveTab] = useState<'types' | 'patterns' | 'eyes'>('types');
  const [rotation, setRotation] = useState<number>(0);
  const [notification, setNotification] = useState<{ text: string; isError: boolean } | null>(null);

  // Modals for purchasing flow
  const [showInsufficientModal, setShowInsufficientModal] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const [selectedDragonIndex, setSelectedDragonIndex] = useState<number>(() => {
    const idx = DRAGON_CATALOG.findIndex((d) => d.id === currentDragon.id);
    return idx >= 0 ? idx : 0;
  });

  const previewDragon = DRAGON_CATALOG[selectedDragonIndex];

  // Swatch colors
  const colorSwatches = [
    '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
    '#ec4899', '#f97316', '#eab308', '#ef4444',
  ];

  const handleRotate = () => {
    sound.playClick();
    setRotation((r) => r + Math.PI / 4);
  };

  const handlePrevDragon = () => {
    sound.playClick();
    setSelectedDragonIndex((i) => (i > 0 ? i - 1 : DRAGON_CATALOG.length - 1));
    setNotification(null);
  };

  const handleNextDragon = () => {
    sound.playClick();
    setSelectedDragonIndex((i) => (i < DRAGON_CATALOG.length - 1 ? i + 1 : 0));
    setNotification(null);
  };

  const isEquipped = profile.equippedSkinId === previewDragon.id;
  const isOwned = profile.inventory.skins.includes(previewDragon.id);

  // Strict money check: must have enough coins AND enough gems
  const hasEnoughCoins = profile.coins >= previewDragon.priceCoins;
  const hasEnoughGems = profile.gems >= previewDragon.priceGems;
  const canAfford = hasEnoughCoins && hasEnoughGems;
  const missingCoins = Math.max(0, previewDragon.priceCoins - profile.coins);
  const missingGems = Math.max(0, previewDragon.priceGems - profile.gems);

  const handleEquip = () => {
    sound.playClick();
    const updated: PlayerProfile = {
      ...profile,
      equippedSkinId: previewDragon.id,
    };
    onUpdateProfile(updated);
    onSelectDragon(previewDragon);
    setNotification({ text: `Equipped ${previewDragon.name}!`, isError: false });
  };

  const handleUnlockClick = () => {
    sound.playClick();
    if (!canAfford) {
      setShowInsufficientModal(true);
    } else {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmUnlock = () => {
    sound.playCoin();
    confetti({
      particleCount: 75,
      spread: 65,
      origin: { y: 0.6 },
    });

    const updated: PlayerProfile = {
      ...profile,
      coins: profile.coins - previewDragon.priceCoins,
      gems: profile.gems - previewDragon.priceGems,
      inventory: {
        ...profile.inventory,
        skins: [...profile.inventory.skins, previewDragon.id],
      },
      equippedSkinId: previewDragon.id,
    };

    onUpdateProfile(updated);
    onSelectDragon(previewDragon);
    setShowConfirmModal(false);
    setNotification({ text: `🎉 Successfully unlocked and equipped ${previewDragon.name}!`, isError: false });
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-900 select-none overflow-y-auto">
      {/* Top Bar with title */}
      <TopCurrencyBar
        profile={profile}
        title="Wardrobe"
        onBack={() => onNavigate('LOBBY')}
        onOpenPayment={onOpenPayment}
      />

      {/* Money / Purchase Notification Banner */}
      {notification && (
        <div
          className={`mx-auto my-1 px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 max-w-lg shadow-lg animate-fadeIn ${
            notification.isError
              ? 'bg-red-950/90 border border-red-500 text-red-200'
              : 'bg-emerald-950/90 border border-emerald-500 text-emerald-200'
          }`}
        >
          {notification.isError ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Main Wardrobe Workspace */}
      <div className="flex-1 w-full max-w-5xl mx-auto p-2 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Left Column: Left Dragon selector rail + 3D Pedestal Preview (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center bg-blue-950/40 rounded-3xl p-3 border-2 border-blue-900/50 shadow-inner relative min-h-[360px]">
          {/* Left mini skin selector thumbnails (Shows ALL 12 dragons) */}
          <div className="absolute left-2 top-3 bottom-3 flex flex-col gap-1.5 z-20 overflow-y-auto pr-1 max-h-[340px]">
            {DRAGON_CATALOG.map((d, idx) => {
              const active = idx === selectedDragonIndex;
              const isDragonOwned = profile.inventory.skins.includes(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedDragonIndex(idx);
                    setNotification(null);
                  }}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border-2 transition-transform active:scale-90 relative cursor-pointer ${
                    active
                      ? 'border-yellow-400 shadow-md ring-2 ring-yellow-400/50'
                      : 'border-blue-900 bg-blue-950/90 hover:border-blue-700'
                  }`}
                  style={{ backgroundColor: d.primaryColor }}
                  title={d.name}
                >
                  {!isDragonOwned && (
                    <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-white/90" />
                    </div>
                  )}
                  {active && <Sparkles className="w-4 h-4 text-white drop-shadow" />}
                </button>
              );
            })}
          </div>

          {/* Carousel Arrows */}
          <button
            onClick={handlePrevDragon}
            className="absolute left-14 sm:left-16 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-700/80 hover:bg-blue-600 border border-blue-400 flex items-center justify-center z-20 shadow-lg active:scale-90 cursor-pointer"
            title="Previous Dragon"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={handleNextDragon}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-700/80 hover:bg-blue-600 border border-blue-400 flex items-center justify-center z-20 shadow-lg active:scale-90 cursor-pointer"
            title="Next Dragon"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Center 3D Dragon Canvas on Stone Pedestal */}
          <div className="my-2 flex flex-col items-center">
            <DragonPreviewCanvas
              config={previewDragon}
              width={260}
              height={240}
              scale={1.0}
              manualRotation={rotation}
              autoRotate={true}
              interactiveRotate={true}
            />

            {/* Dragon Name & Rarity badge */}
            <div className="mt-1 text-center">
              <h2 className="font-game text-2xl text-yellow-300 drop-shadow flex items-center justify-center gap-2">
                <span>{previewDragon.name}</span>
                {!isOwned && <Lock className="w-4 h-4 text-amber-400" />}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-0.5">
                <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-blue-900/80 border border-blue-600 text-cyan-300">
                  {previewDragon.rarity} · {previewDragon.element}
                </span>
                {!isOwned && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-950 border border-yellow-500 text-yellow-300">
                    🪙 {previewDragon.priceCoins.toLocaleString()} Coins
                    {previewDragon.priceGems > 0 ? ` · 💎 ${previewDragon.priceGems.toLocaleString()} Gems` : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Rotate Button */}
            <button
              onClick={handleRotate}
              className="mt-2.5 px-4 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold flex items-center gap-1.5 text-slate-200 active:scale-95 shadow cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rotate 360°</span>
            </button>
          </div>
        </div>

        {/* Right Column: Customization Controls Panel (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          {/* Top Sub-tabs (Skin Types, Body Patterns, Eyes) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-blue-900">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('types');
              }}
              className={`flex-1 py-1.5 rounded-xl font-game text-xs sm:text-sm tracking-wide transition-all cursor-pointer ${
                activeTab === 'types'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Skin Types
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('patterns');
              }}
              className={`flex-1 py-1.5 rounded-xl font-game text-xs sm:text-sm tracking-wide transition-all cursor-pointer ${
                activeTab === 'patterns'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dorsal Armor
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('eyes');
              }}
              className={`flex-1 py-1.5 rounded-xl font-game text-xs sm:text-sm tracking-wide transition-all cursor-pointer ${
                activeTab === 'eyes'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Eyes & Embers
            </button>
          </div>

          {/* Sub-tab 1: Skin Species Selector Grid */}
          {activeTab === 'types' && (
            <div className="bg-slate-950/80 rounded-2xl p-3 border border-blue-900/60 max-h-56 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {DRAGON_CATALOG.map((d, idx) => {
                  const isSelected = idx === selectedDragonIndex;
                  const isSkinOwned = profile.inventory.skins.includes(d.id);
                  return (
                    <div
                      key={d.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedDragonIndex(idx);
                        setNotification(null);
                      }}
                      className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-yellow-400 bg-blue-900/50'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {d.id === 'emerald' ? (
                          <DragonIcon size={22} withGlow={false} />
                        ) : (
                          <div
                            className="w-5 h-5 rounded-full border border-white/50 shrink-0"
                            style={{ backgroundColor: d.primaryColor }}
                          />
                        )}
                        <span className="font-game text-xs text-white truncate max-w-[100px]">
                          {d.name}
                        </span>
                      </div>
                      {!isSkinOwned && <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-tab 2: Body Patterns */}
          {activeTab === 'patterns' && (
            <div className="bg-slate-950/80 rounded-2xl p-3 border border-blue-900/60 flex flex-col gap-2">
              <span className="text-xs text-slate-300 font-bold">Osteoderm Armor Style</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['Diamond Scales', 'Volcanic Fissures', 'Keratin Plates', 'Prismatic Crystals'].map((p) => (
                  <div
                    key={p}
                    className="p-2.5 rounded-xl border border-blue-800 bg-blue-950/40 text-cyan-300 font-semibold flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-tab 3: Eyes & Embers */}
          {activeTab === 'eyes' && (
            <div className="bg-slate-950/80 rounded-2xl p-3 border border-blue-900/60 flex flex-col gap-2">
              <span className="text-xs text-slate-300 font-bold">Slit Reptile Eye Color</span>
              <div className="flex items-center gap-2">
                {['#f59e0b', '#dc2626', '#10b981', '#38bdf8', '#c084fc'].map((col) => (
                  <div
                    key={col}
                    className="w-8 h-8 rounded-full border-2 border-white/60 shadow flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Color Swatches Grid */}
          <div className="bg-slate-950/80 rounded-2xl p-3 border border-blue-900/60">
            <span className="text-xs text-slate-300 font-bold block mb-2">Pigment Swatches</span>
            <div className="flex items-center justify-between gap-1">
              {colorSwatches.map((color) => (
                <div
                  key={color}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl border-2 border-slate-700 hover:border-white transition-all cursor-pointer shadow"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Bottom Action Buttons (EQUIP & UNLOCK with money verification) */}
          <div className="flex items-center gap-3 pt-1">
            {isOwned ? (
              <button
                onClick={handleEquip}
                disabled={isEquipped}
                className={`flex-1 py-3.5 rounded-2xl font-game text-xl tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                  isEquipped
                    ? 'bg-slate-700 text-slate-300 cursor-default border-2 border-slate-600'
                    : 'btn-green text-white active:scale-95'
                }`}
              >
                <Check className="w-6 h-6 text-white" />
                <span>{isEquipped ? 'EQUIPPED' : 'EQUIP DRAGON'}</span>
              </button>
            ) : canAfford ? (
              <button
                onClick={handleUnlockClick}
                className="flex-1 btn-gold py-3.5 rounded-2xl font-game text-xl tracking-wider flex items-center justify-center gap-2 text-amber-950 active:scale-95 shadow-xl cursor-pointer font-bold"
              >
                <Coins className="w-5 h-5" />
                <span>UNLOCK FOR {previewDragon.priceCoins.toLocaleString()} COINS</span>
              </button>
            ) : (
              <div className="flex-1 flex gap-2">
                <button
                  onClick={handleUnlockClick}
                  className="flex-1 py-3 rounded-2xl font-game text-xs sm:text-sm tracking-wide flex items-center justify-center gap-1.5 bg-slate-800 border-2 border-red-500/70 text-red-300 hover:bg-slate-750 active:scale-95 shadow-lg cursor-pointer"
                  title={`You need ${missingCoins.toLocaleString()} more coins!`}
                >
                  <Lock className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    NEED {missingCoins.toLocaleString()} COINS
                  </span>
                </button>
                <button
                  onClick={() => onOpenPayment?.('coins')}
                  className="btn-gold px-4 py-3 rounded-2xl font-game text-xs sm:text-sm tracking-wide flex items-center justify-center gap-1.5 text-amber-950 active:scale-95 shadow-xl shrink-0 cursor-pointer font-bold"
                  title="Open Currency Vault"
                >
                  <Coins className="w-4 h-4" />
                  <span>GET COINS (₹)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1. INSUFFICIENT FUNDS MODAL */}
      {showInsufficientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="blue-panel rounded-3xl p-5 max-w-md w-full flex flex-col relative shadow-2xl border-2 border-red-500/80">
            <button
              onClick={() => setShowInsufficientModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-3">
              <div className="wood-banner inline-block px-5 py-1 rounded-xl font-game text-xl text-red-300 uppercase">
                INSUFFICIENT FUNDS
              </div>
              <h3 className="font-game text-2xl text-yellow-300 mt-2">
                Cannot Purchase {previewDragon.name}!
              </h3>
            </div>

            {/* Money Comparison Table */}
            <div className="bg-slate-950/90 rounded-2xl p-3 border border-slate-800 flex flex-col gap-2 text-xs mb-4">
              <div className="flex justify-between items-center text-slate-300">
                <span>Your Current Balance:</span>
                <span className="font-game text-yellow-300 text-sm">
                  {profile.coins.toLocaleString()} Coins · {profile.gems.toLocaleString()} Gems
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300 border-t border-slate-800 pt-1.5">
                <span>Dragon Cost:</span>
                <span className="font-game text-amber-400 text-sm">
                  {previewDragon.priceCoins.toLocaleString()} Coins ({previewDragon.priceGems.toLocaleString()} Gems)
                </span>
              </div>
              <div className="flex justify-between items-center text-red-400 font-bold border-t border-slate-800 pt-1.5">
                <span>Shortfall:</span>
                <span>Missing {missingCoins.toLocaleString()} Coins</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowInsufficientModal(false);
                  onOpenPayment?.('coins');
                }}
                className="btn-gold py-3 rounded-2xl font-game text-sm text-amber-950 flex items-center justify-center gap-2 active:scale-95 shadow font-bold cursor-pointer"
              >
                <Coins className="w-4 h-4" />
                <span>BUY COINS & GEMS (₹ INDIAN VAULT)</span>
              </button>

              <button
                onClick={() => {
                  setShowInsufficientModal(false);
                  onNavigate('ARENAS');
                }}
                className="btn-green py-3 rounded-2xl font-game text-sm text-white flex items-center justify-center gap-2 active:scale-95 shadow cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>PLAY ARENA MATCH TO EARN COINS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONFIRM PURCHASE MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="blue-panel rounded-3xl p-5 max-w-md w-full flex flex-col relative shadow-2xl border-2 border-yellow-500/80">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-3">
              <div className="wood-banner inline-block px-5 py-1 rounded-xl font-game text-xl text-yellow-300 uppercase">
                CONFIRM PURCHASE
              </div>
              <h3 className="font-game text-2xl text-white mt-2">
                Unlock {previewDragon.name}?
              </h3>
            </div>

            {/* Deduction Breakdown */}
            <div className="bg-slate-950/90 rounded-2xl p-3 border border-slate-800 flex flex-col gap-2 text-xs mb-4">
              <div className="flex justify-between items-center text-slate-300">
                <span>Current Balance:</span>
                <span className="font-game text-yellow-300">
                  {profile.coins.toLocaleString()} Coins
                </span>
              </div>
              <div className="flex justify-between items-center text-amber-400 font-bold border-t border-slate-800 pt-1.5">
                <span>Purchase Price:</span>
                <span>-{previewDragon.priceCoins.toLocaleString()} Coins</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400 font-bold border-t border-slate-800 pt-1.5">
                <span>Remaining Balance:</span>
                <span>{(profile.coins - previewDragon.priceCoins).toLocaleString()} Coins</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="py-3 px-5 rounded-2xl bg-slate-800 text-slate-300 font-game text-xs active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnlock}
                className="flex-1 btn-green py-3 rounded-2xl font-game text-sm text-white flex items-center justify-center gap-2 active:scale-95 shadow font-bold cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>CONFIRM & EQUIP NOW</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
