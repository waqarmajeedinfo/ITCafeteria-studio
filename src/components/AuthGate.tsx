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
  AlertCircle,
  Mail,
  ChevronDown,
  ChevronUp
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
  const [showDemoAccess, setShowDemoAccess] = useState(false);

  // Email Verification Flow State for Sign Up
  const [pendingVerificationUser, setPendingVerificationUser] = useState<{
    username: string;
    displayName: string;
    email: string;
    password: string;
  } | null>(null);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

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
        // Sign Up requires email verification step as requested by admin
        if (!email.trim()) {
          setError('Sign up ke liye valid Email Address lazmi hai taake verification link bheja ja sakay.');
          setIsLoading(false);
          return;
        }
        setPendingVerificationUser({
          username,
          displayName: displayName || username,
          email,
          password
        });
        setSuccess(`Verification link sent to ${email}. Baraye mehrbani link par click karke account activate karein.`);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailClick = async () => {
    if (!pendingVerificationUser) return;
    setIsVerifyingEmail(true);
    setError(null);
    try {
      // Register standard user upon email verification click
      const user = await userAuthManager.register(
        pendingVerificationUser.username,
        pendingVerificationUser.password,
        pendingVerificationUser.displayName,
        pendingVerificationUser.email
      );
      setSuccess(`Email verified successfully! Standard User account @${user.username} activated.`);
      setPendingVerificationUser(null);
      setTimeout(() => onAuthenticated(user), 400);
    } catch (err: any) {
      setError(err?.message || 'Email verification failed');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleQuickFill = (role: 'admin' | 'standard' | 'admininfo') => {
    setError(null);
    if (role === 'admin') {
      setUsername('waqarmajeed');
      setPassword('waqar2026');
    } else if (role === 'admininfo') {
      setUsername('waqarmajeedinfo');
      setPassword('WM2info$');
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
                setPendingVerificationUser(null);
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
                setPendingVerificationUser(null);
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

          {/* Collapsible Demo Quick Access (Hidden by default from random public visitors as requested) */}
          <div className="border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDemoAccess(!showDemoAccess)}
              className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 hover:text-white cursor-pointer bg-slate-900/50 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-cyan-400" />
                <span>Developer / Admin Quick Access (Optional)</span>
              </span>
              {showDemoAccess ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDemoAccess && (
              <div className="p-3 space-y-2 border-t border-slate-800/80 bg-slate-950 animate-in fade-in">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
                  Test Credentials:
                </span>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admininfo')}
                    className="p-2 rounded-lg bg-purple-950/60 hover:bg-purple-900/70 border border-purple-800/60 text-purple-200 text-left cursor-pointer transition-all"
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>👑 Waqar Majeed Info (Requested Admin)</span>
                      <span className="text-[9px] font-mono bg-purple-900/80 px-1.5 py-0.5 rounded">waqarmajeedinfo</span>
                    </div>
                    <div className="text-[10px] text-purple-300 font-mono mt-0.5">Password: WM2info$</div>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickFill('admin')}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-left cursor-pointer"
                    >
                      <div className="font-bold text-[11px]">Waqar (Super Admin)</div>
                      <div className="text-[9px] text-slate-400 font-mono">waqarmajeed / waqar2026</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickFill('standard')}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 text-left cursor-pointer"
                    >
                      <div className="font-bold text-[11px]">Noor Wahid (Standard)</div>
                      <div className="text-[9px] text-cyan-400 font-mono">noorwahid / noor1234</div>
                    </button>
                  </div>
                </div>
              </div>
            )}
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

          {/* Pending Email Verification Box */}
          {pendingVerificationUser ? (
            <div className="p-4 bg-cyan-950/50 border border-cyan-500/40 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                <Mail className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Email Verification Required (ای میل تصدیق)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Ek verification link <strong className="text-white font-mono">{pendingVerificationUser.email}</strong> par bhej diya gaya hai. Standard User account ko activate karne ke liye neeche diye gaye button par click karein:
              </p>
              <button
                type="button"
                onClick={handleVerifyEmailClick}
                disabled={isVerifyingEmail}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isVerifyingEmail ? 'Verifying...' : '📩 Click Verification Link & Activate Standard User'}</span>
              </button>
              <button
                type="button"
                onClick={() => setPendingVerificationUser(null)}
                className="w-full text-center text-[10px] text-slate-400 hover:text-white underline cursor-pointer pt-1"
              >
                Cancel / Edit Registration
              </button>
            </div>
          ) : (
            /* Main Form */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Username (صارف کا نام)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. waqarmajeedinfo"
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
                      Email Address (ای میل پتہ - Required for Verification)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="e.g. creator@itcafeteria.studio"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 pl-9 transition-colors"
                        required
                      />
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
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
                    <span>Register &amp; Send Verification (اکاؤنٹ بنائیں)</span>
                  </>
                )}
              </button>
            </form>
          )}

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
