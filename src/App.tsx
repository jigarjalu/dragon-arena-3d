import React, { useState } from 'react';
import { ScreenState, ArenaId, DragonConfig, PlayerProfile, GameSettings, MatchResult } from './types/game';
import { INITIAL_PROFILE, INITIAL_SETTINGS, DRAGON_CATALOG, INITIAL_ARENAS } from './data/gameData';
import { supabaseService } from './services/supabase';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { WardrobeScreen } from './components/screens/WardrobeScreen';
import { ArenaSelectionScreen } from './components/screens/ArenaSelectionScreen';
import { GameplayScreen } from './components/screens/GameplayScreen';
import { PauseModal } from './components/screens/PauseModal';
import { GameOverModal } from './components/screens/GameOverModal';
import { ShopScreen } from './components/screens/ShopScreen';
import { LeaderboardScreen } from './components/screens/LeaderboardScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { AuthModal } from './components/screens/AuthModal';
import { PaymentModal } from './components/ui/PaymentModal';
import { MobileFrameWrapper } from './components/ui/MobileFrameWrapper';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('LOBBY');
  const [selectedArenaId, setSelectedArenaId] = useState<ArenaId>('forest');
  const [profile, setProfile] = useState<PlayerProfile>(() => supabaseService.loadProfile());
  const [settings, setSettings] = useState<GameSettings>(INITIAL_SETTINGS);

  // Equipped Dragon
  const [equippedDragon, setEquippedDragon] = useState<DragonConfig>(() => {
    const found = DRAGON_CATALOG.find((d) => d.id === profile.equippedSkinId);
    return found || DRAGON_CATALOG[0];
  });

  // Modals
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gameOverResult, setGameOverResult] = useState<MatchResult | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [paymentTab, setPaymentTab] = useState<'coins' | 'gems'>('coins');

  // Sync profile changes to storage / Supabase
  const handleUpdateProfile = (updated: PlayerProfile) => {
    setProfile(updated);
    supabaseService.saveProfile(updated);
  };

  const handleSelectDragon = (dragon: DragonConfig) => {
    setEquippedDragon(dragon);
  };

  const handleStartGame = () => {
    setIsPaused(false);
    setGameOverResult(null);
    setCurrentScreen('GAMEPLAY');
  };

  const handleGameOver = async (result: MatchResult) => {
    setGameOverResult(result);
    // Submit match stats to Supabase / Local storage
    const updatedProfile = await supabaseService.submitMatchRecord(result, profile);
    setProfile(updatedProfile);
  };

  const handleOpenPayment = (type: 'coins' | 'gems' = 'coins') => {
    setPaymentTab(type);
    setIsPaymentOpen(true);
  };

  const handleSuccessPurchase = (type: 'coins' | 'gems', amount: number) => {
    const updated: PlayerProfile = {
      ...profile,
      coins: type === 'coins' ? profile.coins + amount : profile.coins,
      gems: type === 'gems' ? profile.gems + amount : profile.gems,
    };
    handleUpdateProfile(updated);
  };

  return (
    <MobileFrameWrapper>
      {/* 1. Main Lobby (Screen 1) */}
      {currentScreen === 'LOBBY' && (
        <LobbyScreen
          profile={profile}
          dragonConfig={equippedDragon}
          onNavigate={(screen) => setCurrentScreen(screen)}
          onStartGame={handleStartGame}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenPayment={handleOpenPayment}
          isSupabaseConnected={supabaseService.isConnected()}
        />
      )}

      {/* 2. Wardrobe (Screen 2) */}
      {currentScreen === 'WARDROBE' && (
        <WardrobeScreen
          profile={profile}
          currentDragon={equippedDragon}
          onSelectDragon={handleSelectDragon}
          onUpdateProfile={handleUpdateProfile}
          onNavigate={(screen) => setCurrentScreen(screen)}
          onOpenPayment={handleOpenPayment}
        />
      )}

      {/* 3. Arena Selection (Screen 3) */}
      {currentScreen === 'ARENAS' && (
        <ArenaSelectionScreen
          profile={profile}
          selectedArenaId={selectedArenaId}
          onSelectArena={(arenaId) => setSelectedArenaId(arenaId)}
          onStartGame={handleStartGame}
          onNavigate={(screen) => setCurrentScreen(screen)}
        />
      )}

      {/* 4. Live 2.5D Gameplay (Screen 4) */}
      {currentScreen === 'GAMEPLAY' && (
        <div className="relative w-full h-full">
          <GameplayScreen
            arenaId={selectedArenaId}
            dragonConfig={equippedDragon}
            onPause={() => setIsPaused(true)}
            onGameOver={handleGameOver}
          />

          {/* 5. Pause Menu (Screen 5) */}
          {isPaused && (
            <PauseModal
              onResume={() => setIsPaused(false)}
              onRestart={handleStartGame}
              onChangeArena={() => {
                setIsPaused(false);
                setCurrentScreen('ARENAS');
              }}
              onOpenSettings={() => {
                setIsPaused(false);
                setCurrentScreen('SETTINGS');
              }}
              onReturnToLobby={() => {
                setIsPaused(false);
                setCurrentScreen('LOBBY');
              }}
            />
          )}

          {/* 6. Game Over / Victory Modal (Screen 6) */}
          {gameOverResult && (
            <GameOverModal
              result={gameOverResult}
              dragonConfig={equippedDragon}
              onPlayAgain={handleStartGame}
              onChangeArena={() => {
                setGameOverResult(null);
                setCurrentScreen('ARENAS');
              }}
              onOpenWardrobe={() => {
                setGameOverResult(null);
                setCurrentScreen('WARDROBE');
              }}
              onMainMenu={() => {
                setGameOverResult(null);
                setCurrentScreen('LOBBY');
              }}
            />
          )}
        </div>
      )}

      {/* 7. Shop Screen (Screen 7) */}
      {currentScreen === 'SHOP' && (
        <ShopScreen
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onEquipDragon={handleSelectDragon}
          onNavigate={(screen) => setCurrentScreen(screen)}
          onOpenPayment={handleOpenPayment}
        />
      )}

      {/* 8. Leaderboard Screen (Screen 8) */}
      {currentScreen === 'LEADERBOARD' && (
        <LeaderboardScreen
          profile={profile}
          onNavigate={(screen) => setCurrentScreen(screen)}
        />
      )}

      {/* 9. Player Profile Screen (Screen 9) */}
      {currentScreen === 'PROFILE' && (
        <ProfileScreen
          profile={profile}
          currentDragon={equippedDragon}
          onUpdateProfile={handleUpdateProfile}
          onNavigate={(screen) => setCurrentScreen(screen)}
        />
      )}

      {/* 10. Settings Screen (Screen 10) */}
      {currentScreen === 'SETTINGS' && (
        <SettingsScreen
          profile={profile}
          settings={settings}
          onUpdateSettings={setSettings}
          onNavigate={(screen) => setCurrentScreen(screen)}
        />
      )}

      {/* 11. Authentication Modal (Screen 11) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(username) => {
          handleUpdateProfile({ ...profile, username });
        }}
      />

      {/* 12. Payment System Modal (INR ₹ Currency Vault) */}
      <PaymentModal
        isOpen={isPaymentOpen}
        initialTab={paymentTab}
        profile={profile}
        onClose={() => setIsPaymentOpen(false)}
        onSuccessPurchase={handleSuccessPurchase}
      />
    </MobileFrameWrapper>
  );
}
