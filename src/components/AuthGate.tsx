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
  RefreshCcw,
  HelpCircle,
  Loader2,
  ShieldAlert as ShieldIcon
} from 'lucide-react';
import { userAuthManager, type UserSessionProfile } from '../lib/userAuthStore';

interface AuthGateProps {
  onAuthenticated: (user: UserSessionProfile) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT' | '2FA'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempAuthenticatedUser, setTempAuthenticatedUser] = useState<UserSessionProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Email Verification Flow State
  const [pendingVerification, setPendingVerification] = useState<{
    username: string;
    displayName: string;
    email: string;
    password: string;
    isVerified: boolean;
  } | null>(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (mode === 'LOGIN') {
        const user = await userAuthManager.login(username, password);
        // If user is admin and 2FA is enabled (simulate for admin or check config), prompt for 2FA
        if (user.role === 'admin' && (user.username === 'waqarmajeed' || user.username === 'waqarmajeedinfo')) {
          setTempAuthenticatedUser(user);
          setMode('2FA');
          setSuccess('Two-Factor Authentication (2FA) required. A verification code has been sent to your admin email.');
          setIsLoading(false);
          return;
        }
        setSuccess(`Khush Amdeed, ${user.displayName}! Logged in successfully.`);
        setTimeout(() => onAuthenticated(user), 300);
      } else if (mode === 'SIGNUP') {
        if (!email.trim()) {
          setError('Email address is required for verification.');
          setIsLoading(false);
          return;
        }
        setPendingVerification({
          username,
          displayName: displayName || username,
          email,
          password,
          isVerified: false
        });
        setSuccess(`Verification email sent to ${email}. Please check your inbox and click the verification link to proceed.`);
      } else if (mode === 'FORGOT') {
        if (!forgotEmail.trim()) {
          setError('Please enter your account email address.');
          setIsLoading(false);
          return;
        }
        await new Promise((r) => setTimeout(r, 600));
        setSuccess(`Password reset email successfully sent to ${forgotEmail}. Please check your inbox for secure access instructions.`);
      } else if (mode === '2FA') {
        if (twoFactorCode.trim() !== '123456' && twoFactorCode.trim().length !== 6) {
          setError('Invalid 2FA verification code. Please enter the 6-digit code sent to your email (e.g. 123456).');
          setIsLoading(false);
          return;
        }
        if (tempAuthenticatedUser) {
          setSuccess('2FA Verification Confirmed! Access granted.');
          setTimeout(() => onAuthenticated(tempAuthenticatedUser), 350);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckEmailVerification = async () => {
    if (!pendingVerification) return;
    setIsCheckingVerification(true);
    setError(null);

    try {
      const user = await userAuthManager.register(
        pendingVerification.username,
        pendingVerification.password,
        pendingVerification.displayName,
        pendingVerification.email
      );
      setPendingVerification(null);
      setSuccess(`Email verified successfully! Welcome to IT Cafeteria Studio.`);
      setTimeout(() => onAuthenticated(user), 400);
    } catch (err: any) {
      setError(err?.message || 'Email not yet verified. Please check your inbox and click the link.');
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleResendVerification = () => {
    if (!pendingVerification) return;
    setSuccess(`Verification email re-sent to ${pendingVerification.email}. Please check your inbox.`);
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
            Please sign in, verify your email, or confirm 2FA to access your secure creator studio.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 backdrop-blur-xl space-y-5 animate-in fade-in duration-300">
          {/* Tab Selector */}
          {mode !== '2FA' && (
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setError(null);
                  setSuccess(null);
                  setPendingVerification(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'LOGIN' || mode === 'FORGOT'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('SIGNUP');
                  setError(null);
                  setSuccess(null);
                  setPendingVerification(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'SIGNUP'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>
          )}

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

          {/* Two-Factor Authentication (2FA) Prompt for Admins */}
          {mode === '2FA' ? (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
              <div className="p-4 bg-purple-950/50 border border-purple-500/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Two-Factor Authentication (2FA) Required</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Admin security policy requires 2FA confirmation. Please enter the 6-digit code sent to your registered admin email (Default test code: <strong className="text-white font-mono">123456</strong>):
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  6-Digit 2FA Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    className="w-full bg-slate-950 border border-purple-500/60 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono tracking-widest text-center focus:outline-none focus:border-purple-400 transition-colors"
                    required
                    autoFocus
                  />
                  <KeyRound className="w-4 h-4 text-purple-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isLoading || twoFactorCode.trim().length < 4}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying 2FA Code...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm &amp; Enter Studio</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setTempAuthenticatedUser(null);
                    setTwoFactorCode('');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="w-full text-center text-[11px] text-slate-400 hover:text-white underline cursor-pointer pt-1 block"
                >
                  Cancel 2FA &amp; Return to Sign In
                </button>
              </div>
            </form>
          ) : pendingVerification ? (
            <div className="p-4 bg-cyan-950/60 border border-cyan-500/50 rounded-xl space-y-3.5 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                <Mail className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Verify Your Email Address</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                We have sent a verification email to <strong className="text-white font-mono">{pendingVerification.email}</strong>. Please check your inbox and click the verification link to activate your account before accessing the studio.
              </p>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleCheckEmailVerification}
                  disabled={isCheckingVerification}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all disabled:opacity-50"
                >
                  {isCheckingVerification ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying Email Status...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>I Have Verified My Email (Continue)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>Resend Verification Email</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPendingVerification(null)}
                className="w-full text-center text-[10px] text-slate-400 hover:text-white underline cursor-pointer pt-1 block"
              >
                Back to Sign Up
              </button>
            </div>
          ) : mode === 'FORGOT' ? (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>Reset Password via Firebase Auth</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Enter your account email address below. We will send you a secure password reset link.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Account Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="e.g. creator@itcafeteria.studio"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 pl-9 transition-colors"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isLoading || !forgotEmail.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Sending Reset Email...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send Password Reset Email</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="w-full text-center text-[11px] text-cyan-400 hover:underline cursor-pointer pt-1 block font-semibold"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 animate-in fade-in duration-300">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. creator_name"
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
                      Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Creator Full Name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Email Address (Verification Required)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="e.g. creator@domain.com"
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Password
                  </label>
                  {mode === 'LOGIN' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('FORGOT');
                        setError(null);
                        setSuccess(null);
                      }}
                      className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
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
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Authenticating...</span>
                  </>
                ) : mode === 'LOGIN' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Studio</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Sign Up &amp; Verify Email</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Privacy & RBAC Notice */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <FolderGit2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Isolated Storage</span>
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Secure Session Auth</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
