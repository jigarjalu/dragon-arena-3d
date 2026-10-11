import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Coins, Gem, Check, ShieldCheck, CreditCard, QrCode, Smartphone, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { CurrencyPack, PlayerProfile } from '../../types/game';
import { COIN_PACKS, GEM_PACKS } from '../../data/gameData';
import { sound } from '../../services/sound';

interface PaymentModalProps {
  isOpen: boolean;
  initialTab?: 'coins' | 'gems';
  profile: PlayerProfile;
  onClose: () => void;
  onSuccessPurchase: (type: 'coins' | 'gems', amount: number, priceInr: number) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  initialTab = 'coins',
  profile,
  onClose,
  onSuccessPurchase,
}) => {
  const [activeTab, setActiveTab] = useState<'coins' | 'gems'>(initialTab);
  const [selectedPack, setSelectedPack] = useState<CurrencyPack | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPacks = activeTab === 'coins' ? COIN_PACKS : GEM_PACKS;

  const handleSelectPack = (pack: CurrencyPack) => {
    sound.playClick();
    setSelectedPack(pack);
    setPurchaseSuccess(null);
  };

  const handlePayNow = () => {
    if (!selectedPack) return;
    sound.playClick();
    setIsProcessing(true);

    // Simulate instant bank payment processing
    setTimeout(() => {
      setIsProcessing(false);
      if (selectedPack.type === 'coins') {
        sound.playCoin();
      } else {
        sound.playGem();
      }

      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
      });

      onSuccessPurchase(selectedPack.type, selectedPack.amount, selectedPack.priceInr);
      setPurchaseSuccess(`Payment of ₹${selectedPack.priceInr.toLocaleString()} successful! Credited +${selectedPack.amount.toLocaleString()} ${selectedPack.type.toUpperCase()}!`);
      setSelectedPack(null);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 select-none overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-xl blue-panel rounded-3xl p-4 sm:p-6 flex flex-col relative shadow-2xl my-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-red-600 hover:bg-red-500 border-2 border-red-400 flex items-center justify-center text-white active:scale-95 transition-transform z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-3">
          <div className="wood-banner inline-block px-7 py-1.5 rounded-2xl text-yellow-300 font-game text-2xl sm:text-3xl uppercase tracking-wider mb-1">
            Currency Vault
          </div>
          <p className="text-xs text-blue-200">
            Official in-game payment system · Secure Instant UPI & Card checkout (INR ₹)
          </p>
        </div>

        {/* Success Alert Banner */}
        {purchaseSuccess && (
          <div className="mb-3 p-3 rounded-2xl bg-emerald-950 border-2 border-emerald-500 text-emerald-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg animate-fadeIn">
            <Check className="w-5 h-5 text-emerald-400" />
            <span>{purchaseSuccess}</span>
          </div>
        )}

        {/* Tab Switcher (Buy Coins / Buy Gems) */}
        {!selectedPack && (
          <div className="flex bg-slate-950/80 rounded-2xl p-1.5 border border-blue-900 mb-4">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('coins');
              }}
              className={`flex-1 py-2 rounded-xl font-game text-sm flex items-center justify-center gap-2 transition-all ${
                activeTab === 'coins'
                  ? 'bg-amber-500 text-amber-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Buy Coins (₹)</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('gems');
              }}
              className={`flex-1 py-2 rounded-xl font-game text-sm flex items-center justify-center gap-2 transition-all ${
                activeTab === 'gems'
                  ? 'bg-purple-600 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gem className="w-4 h-4" />
              <span>Buy Gems (₹)</span>
            </button>
          </div>
        )}

        {/* PACK SELECTION VIEW */}
        {!selectedPack && (
          <div className="grid grid-cols-2 gap-3 pb-2">
            {currentPacks.map((pack) => {
              const isCoins = pack.type === 'coins';
              return (
                <div
                  key={pack.id}
                  onClick={() => handleSelectPack(pack)}
                  className={`bg-slate-950/90 rounded-2xl p-3 sm:p-4 border-2 transition-all cursor-pointer relative flex flex-col justify-between hover:scale-[1.02] active:scale-95 shadow-lg ${
                    pack.isPopular
                      ? 'border-yellow-400 ring-2 ring-yellow-400/50'
                      : 'border-blue-900/80 hover:border-blue-600'
                  }`}
                >
                  {/* Badge */}
                  {pack.badge && (
                    <span
                      className={`absolute -top-2.5 right-3 font-game text-[10px] uppercase px-2 py-0.5 rounded-full border shadow ${
                        pack.badge === 'MAX PACK'
                          ? 'bg-red-600 border-red-400 text-white'
                          : pack.isPopular
                          ? 'bg-yellow-500 border-yellow-300 text-amber-950 font-black'
                          : 'bg-blue-600 border-blue-400 text-white'
                      }`}
                    >
                      {pack.badge}
                    </span>
                  )}

                  {/* Icon & Amount */}
                  <div className="flex flex-col items-center my-2 text-center">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner mb-2 ${
                        isCoins
                          ? 'bg-gradient-to-tr from-yellow-500 to-amber-300 border-2 border-yellow-200'
                          : 'bg-gradient-to-tr from-purple-600 to-pink-500 border-2 border-purple-300'
                      }`}
                    >
                      {isCoins ? (
                        <Coins className="w-8 h-8 text-amber-950" />
                      ) : (
                        <Gem className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <span className="font-game text-xl sm:text-2xl text-white">
                      +{pack.amount.toLocaleString()}
                    </span>
                    <span className="text-[11px] uppercase font-bold text-slate-400 -mt-0.5">
                      {isCoins ? 'Coins' : 'Gems'}
                    </span>
                  </div>

                  {/* Price Button (INR ₹) */}
                  <div
                    className={`w-full py-2.5 rounded-xl font-game text-center text-sm sm:text-base tracking-wide flex items-center justify-center gap-1 shadow ${
                      isCoins ? 'btn-gold text-amber-950 font-bold' : 'btn-purple text-white'
                    }`}
                  >
                    <span>₹{pack.priceInr.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CHECKOUT STEP VIEW */}
        {selectedPack && (
          <div className="flex flex-col gap-3 py-1">
            {/* Selected Pack Summary */}
            <div className="bg-slate-950/80 rounded-2xl p-3 border-2 border-yellow-500/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedPack.type === 'coins' ? 'bg-amber-400 text-amber-950' : 'bg-purple-600 text-white'
                  }`}
                >
                  {selectedPack.type === 'coins' ? <Coins className="w-6 h-6" /> : <Gem className="w-6 h-6" />}
                </div>
                <div>
                  <div className="font-game text-lg text-white">
                    +{selectedPack.amount.toLocaleString()} {selectedPack.type.toUpperCase()}
                  </div>
                  <div className="text-xs text-slate-400">Official Game Pack</div>
                </div>
              </div>
              <div className="font-game text-xl text-yellow-300 font-bold">
                ₹{selectedPack.priceInr.toLocaleString()}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="flex flex-col gap-1.5">
              <span className="font-game text-xs text-slate-300 uppercase tracking-wider">
                Select Indian Payment Gateway
              </span>

              {/* UPI */}
              <div
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-emerald-500 bg-emerald-950/30'
                    : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-xs text-white">UPI / QR (Instant)</div>
                    <div className="text-[10px] text-slate-400">Google Pay, PhonePe, Paytm, BHIM</div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'upi' ? 'border-emerald-400 bg-emerald-500' : 'border-slate-600'}`}>
                  {paymentMethod === 'upi' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>

              {/* Card */}
              <div
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'card'
                    ? 'border-emerald-500 bg-emerald-950/30'
                    : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="font-semibold text-xs text-white">Debit / Credit Card</div>
                    <div className="text-[10px] text-slate-400">RuPay, Visa, Mastercard</div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-emerald-400 bg-emerald-500' : 'border-slate-600'}`}>
                  {paymentMethod === 'card' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>

              {/* NetBanking */}
              <div
                onClick={() => setPaymentMethod('netbanking')}
                className={`p-3 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'netbanking'
                    ? 'border-emerald-500 bg-emerald-950/30'
                    : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <QrCode className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="font-semibold text-xs text-white">Indian Net Banking</div>
                    <div className="text-[10px] text-slate-400">SBI, HDFC Bank, ICICI Bank, Axis Bank, PNB</div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'netbanking' ? 'border-emerald-400 bg-emerald-500' : 'border-slate-600'}`}>
                  {paymentMethod === 'netbanking' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 mt-2">
              <button
                onClick={() => setSelectedPack(null)}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-300 active:scale-95"
              >
                Back
              </button>
              <button
                onClick={handlePayNow}
                disabled={isProcessing}
                className="flex-1 btn-green py-3.5 rounded-2xl font-game text-lg tracking-wider text-white flex items-center justify-center gap-2 active:scale-95 shadow-xl"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-emerald-200" />
                    <span>PAY ₹{selectedPack.priceInr.toLocaleString()} SECURELY</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Security Trust Footer */}
        <div className="mt-3 pt-2 border-t border-blue-900/40 flex items-center justify-center gap-2 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>256-Bit Encrypted Payments · No Free Arena Gems</span>
        </div>
      </div>
    </div>
  );
};
