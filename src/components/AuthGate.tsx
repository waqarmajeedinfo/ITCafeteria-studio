import React, { useState } from 'react';
import {
  Lock,
  User,
  KeyRound,
  LogIn,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  FolderGit2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { userAuthManager, type UserSessionProfile } from '../lib/userAuthStore';

interface AuthGateProps {
  onAuthenticated: (user: UserSessionProfile) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (mode === 'LOGIN') {
        const user = await userAuthManager.login(username, password);
        setSuccess(`Khush Amdeed, ${user.displayName}! Logged in as ${user.role === 'admin' ? 'Super Admin' : 'Standard User'}.`);
        setTimeout(() => onAuthenticated(user), 300);
      } else {
        const user = await userAuthManager.register(username, password, displayName, email);
        setSuccess(`Account kamyabi se create ho gaya! Logged in as @${user.username}.`);
        setTimeout(() => onAuthenticated(user), 300);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (role: 'admin' | 'standard') => {
    setError(null);
    if (role === 'admin') {
      setUsername('waqarmajeed');
      setPassword('waqar2026');
    } else {
      setUsername('noorwahid');
      setPassword('noor1234');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-cyan-400 font-semibold mb-1 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Autonomous IT Cafeteria Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Authentication Gateway
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Meharbani farma kar apna account login karein ya naya profile create karein taake aapke privileges ke mutabiq studio load ho sakay.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 backdrop-blur-xl space-y-5">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'LOGIN'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In (لاگ ان)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('SIGNUP');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'SIGNUP'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up (نیا اکاؤنٹ)</span>
            </button>
          </div>

          {/* Quick Demo Pre-fill for Waqar Majeed (Admin) & Noor Wahid */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              1-Click Instant Login (فوری رسائی):
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="p-2 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/60 text-purple-200 text-left cursor-pointer transition-all hover:scale-[1.02]"
              >
                <div className="font-bold flex items-center gap-1">
                  <span>👑 Waqar Majeed</span>
                </div>
                <div className="text-[10px] text-purple-400 font-mono">Super Admin (All Privileges)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('standard')}
                className="p-2 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-200 text-left cursor-pointer transition-all hover:scale-[1.02]"
              >
                <div className="font-bold flex items-center gap-1">
                  <span>👤 Noor Wahid</span>
                </div>
                <div className="text-[10px] text-cyan-400 font-mono">Standard User (Isolated)</div>
              </button>
            </div>
          </div>

          {/* Feedback Toasts */}
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Username (صارف کا نام)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. waqarmajeed"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400 pl-9 transition-colors"
                  required
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {mode === 'SIGNUP' && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Display Name (نمائشی نام)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Waqar Majeed / Content Creator"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Email Address (ای میل پتہ - Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. user@itcafeteria.studio"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Password (پاس ورڈ)
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 pl-9 transition-colors"
                  required
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full py-2.5 mt-2 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/60 cursor-pointer disabled:opacity-50 transition-all hover:scale-[1.01]"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : mode === 'LOGIN' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Enter Studio (اسٹوڈیو میں داخل ہوں)</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Register &amp; Launch (اکاؤنٹ بنائیں)</span>
                </>
              )}
            </button>
          </form>

          {/* Privacy & Isolation Notice */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <FolderGit2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Isolated GitHub Directory Sync</span>
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>RBAC Permissions Active</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
