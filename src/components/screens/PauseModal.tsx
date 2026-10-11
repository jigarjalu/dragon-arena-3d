import React from 'react';
import { Play, RotateCcw, Globe, Settings, Home } from 'lucide-react';
import { sound } from '../../services/sound';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onChangeArena: () => void;
  onOpenSettings: () => void;
  onReturnToLobby: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onChangeArena,
  onOpenSettings,
  onReturnToLobby,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none animate-fadeIn">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Wood Banner Header */}
        <div className="wood-banner px-8 py-2 rounded-2xl text-yellow-300 font-game text-3xl tracking-wider uppercase mb-3 shadow-2xl">
          PAUSED
        </div>

        {/* Action Buttons Box */}
        <div className="blue-panel w-full rounded-3xl p-5 flex flex-col gap-3">
          {/* Resume */}
          <button
            onClick={() => {
              sound.playClick();
              onResume();
            }}
            className="w-full btn-green py-3.5 rounded-2xl font-game text-xl tracking-wider text-white flex items-center justify-center gap-2 active:scale-95 shadow-md"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>Resume</span>
          </button>

          {/* Restart */}
          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="w-full btn-blue py-3.5 rounded-2xl font-game text-xl tracking-wider text-white flex items-center justify-center gap-2 active:scale-95 shadow-md"
          >
            <RotateCcw className="w-6 h-6" />
            <span>Restart</span>
          </button>

          {/* Change Arena */}
          <button
            onClick={() => {
              sound.playClick();
              onChangeArena();
            }}
            className="w-full btn-purple py-3.5 rounded-2xl font-game text-xl tracking-wider text-white flex items-center justify-center gap-2 active:scale-95 shadow-md"
          >
            <Globe className="w-6 h-6" />
            <span>Change Arena</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenSettings();
            }}
            className="w-full btn-blue py-3.5 rounded-2xl font-game text-xl tracking-wider text-white flex items-center justify-center gap-2 active:scale-95 shadow-md"
          >
            <Settings className="w-6 h-6" />
            <span>Settings</span>
          </button>

          {/* Return to Lobby */}
          <button
            onClick={() => {
              sound.playClick();
              onReturnToLobby();
            }}
            className="w-full btn-red py-3.5 rounded-2xl font-game text-xl tracking-wider text-white flex items-center justify-center gap-2 active:scale-95 shadow-md"
          >
            <Home className="w-6 h-6" />
            <span>Return to Lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
};
