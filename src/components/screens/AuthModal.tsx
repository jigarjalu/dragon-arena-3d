import React, { useState } from 'react';
import { X, Mail, Lock, UserCheck, Database, LogIn } from 'lucide-react';
import { sound } from '../../services/sound';
import { supabaseService } from '../../services/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (username: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    // Simulate login and session persistence
    setTimeout(() => {
      setIsLoading(false);
      const username = email.split('@')[0] || 'DragonMaster';
      onLoginSuccess(username);
      onClose();
    }, 600);
  };

  const handleGuest = () => {
    sound.playClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none animate-fadeIn">
      <div className="w-full max-w-md blue-panel rounded-3xl p-5 sm:p-6 flex flex-col relative shadow-2xl">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-red-600 hover:bg-red-500 border border-red-400 flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title */}
        <div className="text-center mb-4">
          <div className="wood-banner inline-block px-6 py-1.5 rounded-xl text-yellow-300 font-game text-2xl uppercase tracking-wider mb-1">
            {tab === 'signin' ? 'Sign In' : 'Create Account'}
          </div>
          <p className="text-xs text-blue-200">
            Sync progress, skins, and climb the global leaderboards
          </p>
        </div>

        {/* Switch Tabs */}
        <div className="flex bg-slate-950/80 rounded-xl p-1 border border-blue-900 mb-4">
          <button
            onClick={() => {
              sound.playClick();
              setTab('signin');
            }}
            className={`flex-1 py-1.5 rounded-lg font-game text-xs sm:text-sm transition-all ${
              tab === 'signin' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setTab('signup');
            }}
            className={`flex-1 py-1.5 rounded-lg font-game text-xs sm:text-sm transition-all ${
              tab === 'signup' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dragon.rider@example.com"
                className="w-full bg-slate-950/90 border border-blue-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950/90 border border-blue-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="text-red-400 text-xs font-semibold text-center">{errorMsg}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-green w-full py-3 rounded-2xl font-game text-lg tracking-wider text-white mt-1 active:scale-95 shadow-md flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            <span>{isLoading ? 'Connecting...' : tab === 'signin' ? 'Sign In' : 'Sign Up'}</span>
          </button>
        </form>

        {/* Social Login Buttons (Google / Discord) */}
        <div className="flex items-center gap-2 my-3">
          <div className="h-[1px] bg-blue-900/80 flex-1" />
          <span className="text-[10px] text-slate-400 uppercase font-bold">Or continue with</span>
          <div className="h-[1px] bg-blue-900/80 flex-1" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onLoginSuccess('DragonGoogleRider');
              onClose();
            }}
            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 active:scale-95 shadow"
          >
            <span>Google</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onLoginSuccess('DragonDiscordHero');
              onClose();
            }}
            className="py-2 px-3 rounded-xl bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 active:scale-95 shadow"
          >
            <span>Discord</span>
          </button>
        </div>

        {/* Continue as Guest */}
        <button
          onClick={handleGuest}
          className="mt-3 text-center text-xs text-blue-300 hover:text-white underline"
        >
          Continue as Guest (Local Profile)
        </button>
      </div>
    </div>
  );
};
