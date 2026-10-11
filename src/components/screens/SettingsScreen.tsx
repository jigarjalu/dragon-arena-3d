import React, { useState } from 'react';
import { Gamepad2, Monitor, Sliders, Volume2, Globe, User, Database, Check } from 'lucide-react';
import { PlayerProfile, GameSettings, ScreenState } from '../../types/game';
import { TopCurrencyBar } from '../ui/TopCurrencyBar';
import { supabaseService } from '../../services/supabase';
import { sound } from '../../services/sound';

interface SettingsScreenProps {
  profile: PlayerProfile;
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onNavigate: (screen: ScreenState) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  profile,
  settings,
  onUpdateSettings,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'Game' | 'Graphics' | 'Controls' | 'Audio' | 'Language' | 'Account'>('Game');
  const [current, setCurrent] = useState<GameSettings>(settings);

  // Supabase connection config
  const [supabaseUrl, setSupabaseUrl] = useState(supabaseService.getConfig().url);
  const [supabaseKey, setSupabaseKey] = useState(supabaseService.getConfig().anonKey);
  const [connMsg, setConnMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleToggle = (key: keyof GameSettings) => {
    sound.playClick();
    const updated = { ...current, [key]: !current[key] };
    setCurrent(updated);
    if (key === 'music') sound.setMusicEnabled(updated.music);
    if (key === 'sfx') sound.setSfxEnabled(updated.sfx);
    onUpdateSettings(updated);
  };

  const handleSave = () => {
    sound.playClick();
    onUpdateSettings(current);
  };

  const handleTestSupabase = async () => {
    setIsTesting(true);
    setConnMsg(null);
    supabaseService.setConfig(supabaseUrl.trim(), supabaseKey.trim());
    const res = await supabaseService.testConnection();
    setConnMsg({ text: res.message, success: res.success });
    setIsTesting(false);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 select-none overflow-y-auto">
      {/* Top Bar */}
      <TopCurrencyBar
        profile={profile}
        title="Settings"
        onBack={() => onNavigate('LOBBY')}
      />

      {/* Main Container */}
      <div className="flex-1 w-full max-w-4xl mx-auto p-3 sm:p-5 flex flex-col justify-between">
        <div className="blue-panel rounded-3xl p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left Vertical Tab Rails */}
          <div className="md:col-span-4 flex flex-row md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'Game', icon: Gamepad2 },
              { id: 'Graphics', icon: Monitor },
              { id: 'Controls', icon: Sliders },
              { id: 'Audio', icon: Volume2 },
              { id: 'Language', icon: Globe },
              { id: 'Account', icon: Database },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    sound.playClick();
                    setActiveTab(t.id as unknown as typeof activeTab);
                  }}
                  className={`w-full py-2.5 px-3 rounded-2xl font-game text-xs sm:text-sm flex items-center gap-2.5 transition-all text-left whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md border border-blue-400'
                      : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 text-cyan-300" />
                  <span>{t.id}</span>
                </button>
              );
            })}
          </div>

          {/* Right Tab Content */}
          <div className="md:col-span-8 bg-slate-950/80 rounded-2xl p-4 border border-blue-900/60 flex flex-col gap-4 text-xs sm:text-sm">
            {activeTab === 'Game' && (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="font-game text-white text-base">Background Music</div>
                    <div className="text-slate-400 text-xs">Play ambient arena music loops</div>
                  </div>
                  <button
                    onClick={() => handleToggle('music')}
                    className={`px-4 py-1.5 rounded-full font-game text-xs ${
                      current.music ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {current.music ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="font-game text-white text-base">Sound Effects</div>
                    <div className="text-slate-400 text-xs">Eat, boost, and fire sound feedback</div>
                  </div>
                  <button
                    onClick={() => handleToggle('sfx')}
                    className={`px-4 py-1.5 rounded-full font-game text-xs ${
                      current.sfx ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {current.sfx ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="font-game text-white text-base">Haptic Feedback</div>
                    <div className="text-slate-400 text-xs">Vibrate on pickups and collisions</div>
                  </div>
                  <button
                    onClick={() => handleToggle('vibration')}
                    className={`px-4 py-1.5 rounded-full font-game text-xs ${
                      current.vibration ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {current.vibration ? 'ON' : 'OFF'}
                  </button>
                </div>
              </>
            )}

            {activeTab === 'Graphics' && (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-game text-white text-base">Graphics Quality</span>
                  <select
                    value={current.graphicsQuality}
                    onChange={(e) => {
                      setCurrent({ ...current, graphicsQuality: e.target.value as unknown as typeof current.graphicsQuality });
                    }}
                    className="bg-slate-800 border border-slate-600 rounded-xl px-3 py-1 text-white font-game outline-none"
                  >
                    <option value="High">High (60 FPS + Glow)</option>
                    <option value="Medium">Medium (Balanced)</option>
                    <option value="Low">Low (Battery Saver)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-game text-white text-base">Camera Perspective</span>
                  <select
                    value={current.cameraPerspective}
                    onChange={(e) => {
                      setCurrent({ ...current, cameraPerspective: e.target.value as unknown as typeof current.cameraPerspective });
                    }}
                    className="bg-slate-800 border border-slate-600 rounded-xl px-3 py-1 text-white font-game outline-none"
                  >
                    <option value="Third Person">2.5D Angled Follow</option>
                    <option value="Top-Down">Top-Down Ortho</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-game text-white text-base">Reduce Motion</div>
                    <div className="text-slate-400 text-xs">Minimize camera zoom shakes</div>
                  </div>
                  <button
                    onClick={() => handleToggle('reduceMotion')}
                    className={`px-4 py-1.5 rounded-full font-game text-xs ${
                      current.reduceMotion ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {current.reduceMotion ? 'ON' : 'OFF'}
                  </button>
                </div>
              </>
            )}

            {activeTab === 'Controls' && (
              <>
                <div className="flex flex-col gap-1 pb-3 border-b border-slate-800">
                  <div className="flex justify-between font-game text-white">
                    <span>Camera Sensitivity</span>
                    <span className="text-yellow-300">{current.cameraSensitivity}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={current.cameraSensitivity}
                    onChange={(e) => setCurrent({ ...current, cameraSensitivity: Number(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1 pb-3 border-b border-slate-800">
                  <div className="flex justify-between font-game text-white">
                    <span>Control Sensitivity</span>
                    <span className="text-yellow-300">{current.controlSensitivity}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={current.controlSensitivity}
                    onChange={(e) => setCurrent({ ...current, controlSensitivity: Number(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-game text-white">Control Layout</span>
                  <div className="flex gap-1 bg-slate-900 p-1 rounded-xl">
                    <button
                      onClick={() => setCurrent({ ...current, controlScheme: 'joystick' })}
                      className={`px-3 py-1 rounded-lg text-xs font-game ${
                        current.controlScheme === 'joystick' ? 'bg-blue-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Joystick + Keys
                    </button>
                    <button
                      onClick={() => setCurrent({ ...current, controlScheme: 'swipe' })}
                      className={`px-3 py-1 rounded-lg text-xs font-game ${
                        current.controlScheme === 'swipe' ? 'bg-blue-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Touch / Mouse
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'Audio' && (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-game text-white text-base">Sound Master Volume</span>
                  <span className="font-mono text-yellow-300">100%</span>
                </div>
                <p className="text-xs text-slate-400">
                  Procedural retro chimes, coin sound, boost hum, and victory fanfares generated via HTML5 Web Audio API.
                </p>
              </div>
            )}

            {activeTab === 'Language' && (
              <div className="flex flex-col gap-2">
                <span className="font-game text-white text-base">Select Game Language</span>
                <div className="grid grid-cols-2 gap-2">
                  {['English', 'Español', 'Français', 'Deutsch', '日本語', '한국어'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        sound.playClick();
                        setCurrent({ ...current, language: lang });
                      }}
                      className={`p-2 rounded-xl text-xs font-game border ${
                        current.language === lang
                          ? 'border-yellow-400 bg-blue-700 text-white'
                          : 'border-slate-800 bg-slate-900 text-slate-300'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Account' && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span className="font-game text-white text-base">Supabase Database Integration</span>
                </div>
                <p className="text-xs text-slate-400">
                  Connect any real Supabase project to persist scores, inventory, and online leaderboards:
                </p>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase">Supabase URL</label>
                  <input
                    type="text"
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-blue-400 mt-0.5"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase">Supabase Anon Key</label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-blue-400 mt-0.5"
                  />
                </div>

                <button
                  onClick={handleTestSupabase}
                  disabled={isTesting}
                  className="btn-blue py-2 rounded-xl font-game text-xs text-white flex items-center justify-center gap-1.5 mt-1"
                >
                  <span>{isTesting ? 'Testing Connection...' : 'Save & Test Connection'}</span>
                </button>

                {connMsg && (
                  <div
                    className={`p-2 rounded-xl text-xs border ${
                      connMsg.success
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-amber-950/80 border-amber-500 text-amber-200'
                    }`}
                  >
                    {connMsg.text}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            onClick={() => {
              sound.playClick();
              onNavigate('LOBBY');
            }}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 font-game text-sm text-slate-300"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            className="btn-green px-8 py-2.5 rounded-xl font-game text-base text-white active:scale-95 shadow-lg"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
