import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ShoppingBag, Check, Coins, Gem, Sparkles, Lock, AlertCircle, ArrowRight, ShieldCheck, Play, X } from 'lucide-react';
import { PlayerProfile, DragonConfig, ScreenState } from '../../types/game';
import { TopCurrencyBar } from '../ui/TopCurrencyBar';
import { DragonPreviewCanvas } from '../ui/DragonPreviewCanvas';
import { DRAGON_CATALOG, COIN_PACKS, GEM_PACKS } from '../../data/gameData';
import { sound } from '../../services/sound';

interface ShopScreenProps {
  profile: PlayerProfile;
  onUpdateProfile: (updated: PlayerProfile) => void;
  onEquipDragon: (dragon: DragonConfig) => void;
  onNavigate: (screen: ScreenState) => void;
  onOpenPayment?: (type: 'coins' | 'gems') => void;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({
  profile,
  onUpdateProfile,
  onEquipDragon,
  onNavigate,
  onOpenPayment,
}) => {
  const [activeTab, setActiveTab] = useState<'Skins' | 'Currency (₹)' | 'Boosts' | 'Accessories'>('Skins');
  const [toast, setToast] = useState<{ text: string; isError: boolean } | null>(null);

  // Modals for purchasing flow
  const [insufficientModalDragon, setInsufficientModalDragon] = useState<DragonConfig | null>(null);
  const [confirmModalDragon, setConfirmModalDragon] = useState<DragonConfig | null>(null);

  const handleCardClick = (dragon: DragonConfig) => {
    sound.playClick();
    const isOwned = profile.inventory.skins.includes(dragon.id);
    if (isOwned) {
      handleEquip(dragon);
      return;
    }

    // Check if player has sufficient funds
    const hasCoins = profile.coins >= dragon.priceCoins;
    const hasGems = profile.gems >= dragon.priceGems;

    if (!hasCoins || !hasGems) {
      // Show explicit Insufficient Funds dialog with balance breakdown
      setInsufficientModalDragon(dragon);
    } else {
      // Show Confirmation Dialog before deducting money
      setConfirmModalDragon(dragon);
    }
  };

  const handleConfirmPurchase = () => {
    if (!confirmModalDragon) return;
    const dragon = confirmModalDragon;

    sound.playCoin();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    const updated: PlayerProfile = {
      ...profile,
      coins: profile.coins - dragon.priceCoins,
      gems: profile.gems - dragon.priceGems,
      inventory: {
        ...profile.inventory,
        skins: [...profile.inventory.skins, dragon.id],
      },
      equippedSkinId: dragon.id,
    };

    onUpdateProfile(updated);
    onEquipDragon(dragon);
    setConfirmModalDragon(null);
    setToast({ text: `🎉 Successfully purchased and equipped ${dragon.name}!`, isError: false });
  };

  const handleEquip = (dragon: DragonConfig) => {
    sound.playClick();
    const updated: PlayerProfile = {
      ...profile,
      equippedSkinId: dragon.id,
    };
    onUpdateProfile(updated);
    onEquipDragon(dragon);
    setToast({ text: `Equipped ${dragon.name}!`, isError: false });
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 select-none overflow-y-auto">
      {/* Top Bar with clean Back button */}
      <TopCurrencyBar
        profile={profile}
        title="Dragon Vault & Shop"
        onBack={() => onNavigate('LOBBY')}
        onOpenPayment={onOpenPayment}
      />

      {/* Floating Status Toast */}
      {toast && (
        <div
          className={`mx-auto my-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 max-w-xl shadow-2xl animate-fadeIn ${
            toast.isError
              ? 'bg-red-950 border-2 border-red-500 text-red-200'
              : 'bg-emerald-950 border-2 border-emerald-500 text-emerald-200'
          }`}
        >
          {toast.isError ? (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 w-full max-w-6xl mx-auto p-3 sm:p-5 flex flex-col">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-blue-900/80 mb-3 overflow-x-auto">
          {(['Skins', 'Currency (₹)', 'Boosts', 'Accessories'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                sound.playClick();
                setActiveTab(tab);
                setToast(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl font-game text-xs sm:text-sm tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-emerald-500 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'Currency (₹)' ? '🪙 Buy Coins & Gems (₹)' : tab}
            </button>
          ))}
        </div>

        {/* Currency Quick Banner on Skins Tab */}
        {activeTab === 'Skins' && (
          <div className="bg-gradient-to-r from-amber-950/70 via-blue-950/70 to-purple-950/70 border-2 border-yellow-500/50 rounded-2xl p-3 mb-4 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center text-amber-950 shadow-inner">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <div className="font-game text-sm text-yellow-300">Your Vault Balance: {profile.coins.toLocaleString()} Coins · {profile.gems.toLocaleString()} Gems</div>
                <div className="text-xs text-slate-300">
                  Earn coins in the arena, or buy coins & gems (₹9 to ₹99,900). No free gems in arena!
                </div>
              </div>
            </div>
            <button
              onClick={() => onOpenPayment?.('coins')}
              className="btn-gold py-1.5 px-3.5 rounded-xl font-game text-xs text-amber-950 flex items-center gap-1 active:scale-95 shadow shrink-0 cursor-pointer"
            >
              <span>Add Currency (₹)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Skins Grid (Realistic Dragons) */}
        {activeTab === 'Skins' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
            {DRAGON_CATALOG.map((dragon) => {
              const isOwned = profile.inventory.skins.includes(dragon.id);
              const isEquipped = profile.equippedSkinId === dragon.id;
              const hasEnoughCoins = profile.coins >= dragon.priceCoins;
              const hasEnoughGems = profile.gems >= dragon.priceGems;
              const canAfford = hasEnoughCoins && hasEnoughGems;
              const missingCoins = Math.max(0, dragon.priceCoins - profile.coins);
              const missingGems = Math.max(0, dragon.priceGems - profile.gems);

              return (
                <div
                  key={dragon.id}
                  className={`blue-panel rounded-2xl p-3 flex flex-col justify-between transition-all relative border-2 ${
                    isEquipped
                      ? 'border-emerald-400 ring-2 ring-emerald-400/40'
                      : isOwned
                      ? 'border-blue-500/80'
                      : canAfford
                      ? 'border-yellow-500/80 hover:border-yellow-400'
                      : 'border-slate-800 opacity-90'
                  }`}
                >
                  {/* Rarity & Element Tag */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-full font-game text-[10px] uppercase tracking-wider border shadow ${
                        dragon.rarity === 'legendary'
                          ? 'bg-amber-600 border-amber-400 text-yellow-200'
                          : dragon.rarity === 'epic'
                          ? 'bg-purple-600 border-purple-400 text-purple-200'
                          : 'bg-blue-600 border-blue-400 text-cyan-200'
                      }`}
                    >
                      {dragon.rarity}
                    </span>
                    <span className="text-[10px] text-slate-300 font-bold uppercase">
                      {dragon.element}
                    </span>
                  </div>

                  {/* 3D Realistic Dragon Canvas Preview */}
                  <div className="w-full h-36 bg-slate-950/80 rounded-xl border border-blue-900/60 flex items-center justify-center overflow-hidden my-1 relative shadow-inner">
                    {!isOwned && (
                      <div className="absolute top-2 right-2 bg-black/75 rounded-full p-1.5 z-10 border border-slate-700">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                    )}
                    <DragonPreviewCanvas
                      config={dragon}
                      width={170}
                      height={145}
                      scale={0.78}
                      autoRotate={true}
                    />
                  </div>

                  {/* Title & Lore */}
                  <div className="my-1.5">
                    <h4 className="font-game text-base text-yellow-300 truncate">
                      {dragon.name}
                    </h4>
                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                      {dragon.description}
                    </p>
                  </div>

                  {/* Pricing Display */}
                  <div className="bg-slate-950/90 rounded-xl p-2 border border-slate-800 my-1 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Value:</span>
                    {dragon.priceCoins === 0 && dragon.priceGems === 0 ? (
                      <span className="text-emerald-400 font-bold font-game">FREE STARTER</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 font-game text-yellow-400">
                          <Coins className="w-3.5 h-3.5" />
                          <span>{dragon.priceCoins.toLocaleString()}</span>
                        </div>
                        {dragon.priceGems > 0 && (
                          <div className="flex items-center gap-1 font-game text-purple-400">
                            <Gem className="w-3.5 h-3.5" />
                            <span>{dragon.priceGems.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  {isEquipped ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-700 border border-slate-600 font-game text-xs text-slate-300 flex items-center justify-center gap-1 cursor-default shadow"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>EQUIPPED NOW</span>
                    </button>
                  ) : isOwned ? (
                    <button
                      onClick={() => handleCardClick(dragon)}
                      className="w-full btn-green py-2.5 rounded-xl font-game text-xs text-white flex items-center justify-center gap-1 active:scale-95 shadow cursor-pointer"
                    >
                      <span>EQUIP DRAGON</span>
                    </button>
                  ) : canAfford ? (
                    <button
                      onClick={() => handleCardClick(dragon)}
                      className="w-full btn-gold py-2.5 rounded-xl font-game text-xs text-amber-950 flex items-center justify-center gap-1.5 active:scale-95 shadow cursor-pointer font-bold"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>UNLOCK ({dragon.priceCoins.toLocaleString()} COINS)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCardClick(dragon)}
                      className="w-full py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-red-500/60 font-game text-xs text-red-300 flex items-center justify-center gap-1.5 active:scale-95 shadow cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-red-400" />
                      <span>INSUFFICIENT (NEED {missingCoins.toLocaleString()})</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Currency (₹) Tab with Direct INR Packs */}
        {activeTab === 'Currency (₹)' && (
          <div className="flex flex-col gap-5 pb-8">
            {/* Coins Packs Section */}
            <div>
              <div className="flex items-center gap-2 mb-2 font-game text-lg text-yellow-300">
                <Coins className="w-5 h-5 text-yellow-400" />
                <span>Coin Packs (Instant INR ₹ Checkout)</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Coins can be used to unlock dragons, arena stages, and stat boosts. Also earnable in arena matches!
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {COIN_PACKS.map((pack) => (
                  <div
                    key={pack.id}
                    onClick={() => onOpenPayment?.('coins')}
                    className="bg-slate-950/90 rounded-2xl p-3.5 border-2 border-yellow-500/70 hover:border-yellow-400 flex flex-col items-center justify-between cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-xl relative"
                  >
                    {pack.badge && (
                      <span className="absolute -top-2.5 font-game text-[10px] uppercase px-2 py-0.5 rounded-full bg-yellow-500 text-amber-950 font-bold shadow">
                        {pack.badge}
                      </span>
                    )}
                    <div className="w-12 h-12 rounded-xl bg-yellow-400 flex items-center justify-center text-amber-950 shadow my-2">
                      <Coins className="w-7 h-7" />
                    </div>
                    <div className="font-game text-xl text-white">+{pack.amount.toLocaleString()}</div>
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">Coins</div>
                    <div className="w-full btn-gold py-2 rounded-xl font-game text-sm text-amber-950 text-center mt-3 shadow font-bold">
                      ₹{pack.priceInr.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gems Packs Section */}
            <div>
              <div className="flex items-center gap-2 mb-2 font-game text-lg text-purple-300">
                <Gem className="w-5 h-5 text-purple-400" />
                <span>Gem Packs (Premium Currency - No Free Gems in Arena)</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Gems are exclusively obtainable via INR (₹) purchase. Same pricing as coins.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {GEM_PACKS.map((pack) => (
                  <div
                    key={pack.id}
                    onClick={() => onOpenPayment?.('gems')}
                    className="bg-slate-950/90 rounded-2xl p-3.5 border-2 border-purple-500/70 hover:border-purple-400 flex flex-col items-center justify-between cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-xl relative"
                  >
                    {pack.badge && (
                      <span className="absolute -top-2.5 font-game text-[10px] uppercase px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold shadow">
                        {pack.badge}
                      </span>
                    )}
                    <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow my-2">
                      <Gem className="w-7 h-7" />
                    </div>
                    <div className="font-game text-xl text-white">+{pack.amount.toLocaleString()}</div>
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">Gems</div>
                    <div className="w-full btn-purple py-2 rounded-xl font-game text-sm text-white text-center mt-3 shadow font-bold">
                      ₹{pack.priceInr.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Boosts Tab */}
        {activeTab === 'Boosts' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8">
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-blue-900 flex items-center justify-between">
              <div>
                <h4 className="font-game text-base text-yellow-300">Magnetic Orb Attractor</h4>
                <p className="text-xs text-slate-400">Pulls all arena orbs towards your dragon for 15s</p>
              </div>
              <button
                onClick={() => onOpenPayment?.('coins')}
                className="btn-gold py-1.5 px-3 rounded-xl font-game text-xs text-amber-950 font-bold"
              >
                100 Coins
              </button>
            </div>
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-blue-900 flex items-center justify-between">
              <div>
                <h4 className="font-game text-base text-purple-300">Divine Wyvern Shield</h4>
                <p className="text-xs text-slate-400">Protects against lethal hazard collisions once</p>
              </div>
              <button
                onClick={() => onOpenPayment?.('gems')}
                className="btn-purple py-1.5 px-3 rounded-xl font-game text-xs text-white font-bold"
              >
                25 Gems
              </button>
            </div>
          </div>
        )}

        {/* Accessories Tab */}
        {activeTab === 'Accessories' && (
          <div className="bg-slate-950/80 rounded-2xl p-6 text-center border border-blue-900">
            <Sparkles className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
            <h4 className="font-game text-lg text-white">Custom Accessories & Crests</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
              Visit the Wardrobe to equip customized horns, dragon armor, and ocular styles directly!
            </p>
            <button
              onClick={() => onNavigate('WARDROBE')}
              className="btn-blue py-2 px-6 rounded-xl font-game text-sm text-white"
            >
              Open Wardrobe
            </button>
          </div>
        )}
      </div>

      {/* 1. INSUFFICIENT MONEY MODAL */}
      {insufficientModalDragon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="blue-panel rounded-3xl p-5 max-w-md w-full flex flex-col relative shadow-2xl border-2 border-red-500/80">
            <button
              onClick={() => setInsufficientModalDragon(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-3">
              <div className="wood-banner inline-block px-5 py-1 rounded-xl font-game text-xl text-red-300 uppercase">
                INSUFFICIENT FUNDS
              </div>
              <h3 className="font-game text-2xl text-yellow-300 mt-2">
                Cannot Purchase {insufficientModalDragon.name}!
              </h3>
            </div>

            <div className="w-full h-32 bg-slate-950 rounded-2xl border border-blue-900 flex items-center justify-center mb-3">
              <DragonPreviewCanvas
                config={insufficientModalDragon}
                width={150}
                height={130}
                scale={0.75}
                autoRotate={true}
              />
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
                  {insufficientModalDragon.priceCoins.toLocaleString()} Coins ({insufficientModalDragon.priceGems.toLocaleString()} Gems)
                </span>
              </div>
              <div className="flex justify-between items-center text-red-400 font-bold border-t border-slate-800 pt-1.5">
                <span>Deficit:</span>
                <span>
                  Missing {Math.max(0, insufficientModalDragon.priceCoins - profile.coins).toLocaleString()} Coins
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setInsufficientModalDragon(null);
                  onOpenPayment?.('coins');
                }}
                className="btn-gold py-3 rounded-2xl font-game text-sm text-amber-950 flex items-center justify-center gap-2 active:scale-95 shadow font-bold cursor-pointer"
              >
                <Coins className="w-4 h-4" />
                <span>BUY COINS & GEMS (₹ INDIAN VAULT)</span>
              </button>

              <button
                onClick={() => {
                  setInsufficientModalDragon(null);
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
      {confirmModalDragon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="blue-panel rounded-3xl p-5 max-w-md w-full flex flex-col relative shadow-2xl border-2 border-yellow-500/80">
            <button
              onClick={() => setConfirmModalDragon(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-3">
              <div className="wood-banner inline-block px-5 py-1 rounded-xl font-game text-xl text-yellow-300 uppercase">
                CONFIRM PURCHASE
              </div>
              <h3 className="font-game text-2xl text-white mt-2">
                Unlock {confirmModalDragon.name}?
              </h3>
            </div>

            <div className="w-full h-32 bg-slate-950 rounded-2xl border border-blue-900 flex items-center justify-center mb-3">
              <DragonPreviewCanvas
                config={confirmModalDragon}
                width={150}
                height={130}
                scale={0.75}
                autoRotate={true}
              />
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
                <span>-{confirmModalDragon.priceCoins.toLocaleString()} Coins</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400 font-bold border-t border-slate-800 pt-1.5">
                <span>Remaining Balance:</span>
                <span>{(profile.coins - confirmModalDragon.priceCoins).toLocaleString()} Coins</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmModalDragon(null)}
                className="py-3 px-5 rounded-2xl bg-slate-800 text-slate-300 font-game text-xs active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurchase}
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
