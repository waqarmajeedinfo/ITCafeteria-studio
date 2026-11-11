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
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  // Forgot Password interactive flow state
  const [forgotStep, setForgotStep] = useState<'REQUEST' | 'RESET'>('REQUEST');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Awaiting Admin Approval state after registration
  const [awaitingApproval, setAwaitingApproval] = useState<{
    username: string;
    email: string;
  } | null>(null);

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
        setSuccess(`Khush Amdeed, ${user.displayName}! Logged in successfully.`);
        setTimeout(() => onAuthenticated(user), 300);
      } else if (mode === 'SIGNUP') {
        if (!email.trim()) {
          setError('Email address is required for registration.');
          setIsLoading(false);
          return;
        }
        const cleanUser = username.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '');
        if (cleanUser.length < 3) {
          setError('Username must be at least 3 characters.');
          setIsLoading(false);
          return;
        }
        // Unified: Display Name is the Username itself
        setPendingVerification({
          username: cleanUser,
          displayName: cleanUser,
          email: email.trim(),
          password,
          isVerified: false
        });
        setSuccess(`Verification email sent to ${email.trim()}. Please confirm your email below.`);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestResetToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setError('Please enter your registered username or email.');
      return;
    }
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const res = await userAuthManager.requestPasswordReset(forgotIdentifier.trim());
      // STRICT REQUIREMENT: Token is sent to email only. Never auto-fill on screen!
      setResetTokenInput('');
      setForgotStep('RESET');
      setSuccess(`8-character verification reset code aapke registered email (${res.email}) par send kar diya gaya hai. Meharbani farma kar apna email check karein aur code yahan enter karein.`);
    } catch (err: any) {
      setError(err?.message || 'Could not find an account with that username or email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTokenInput.trim()) {
      setError('Reset token is required. Please check your email and enter the 8-character code.');
      return;
    }
    if (newPasswordInput.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const user = await userAuthManager.resetPassword(forgotIdentifier.trim(), resetTokenInput.trim(), newPasswordInput);
      setSuccess(`Password successfully reset! Khush Amdeed, ${user.displayName}.`);
      setTimeout(() => onAuthenticated(user), 350);
    } catch (err: any) {
      setError(err?.message || 'Password reset failed. Invalid or expired token.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckEmailVerification = async () => {
    if (!pendingVerification) return;
    setIsCheckingVerification(true);
    setError(null);

    try {
      await userAuthManager.register(
        pendingVerification.username,
        pendingVerification.password,
        pendingVerification.displayName,
        pendingVerification.email
      );
      const registeredUser = pendingVerification.username;
      const registeredEmail = pendingVerification.email;
      setPendingVerification(null);
      // New users start as Inactive & Pending Admin Approval
      setAwaitingApproval({
        username: registeredUser,
        email: registeredEmail
      });
      setSuccess(`Account kamyabi se ban gaya hai! Filhal Inactive hai aur Super Admin (Waqar Majeed) ki approval ka muntazir hai.`);
    } catch (err: any) {
      setError(err?.message || 'Registration error. Please check your details.');
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
            Please sign in or reset your password to access your secure creator studio.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 backdrop-blur-xl space-y-5 animate-in fade-in duration-300">
          {/* Tab Selector */}
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

          {/* Feedback Toasts */}
          {error && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in ${
              error.includes('Admin ki approval') || error.includes('Inactive')
                ? 'bg-amber-950/90 border border-amber-500/50 text-amber-200'
                : 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
            }`}>
              {error.includes('Admin ki approval') || error.includes('Inactive') ? (
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Awaiting Admin Approval View */}
          {awaitingApproval ? (
            <div className="p-5 bg-amber-950/30 border border-amber-500/40 rounded-2xl space-y-4 text-center animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                <ShieldAlert className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Account Created — Pending Admin Approval
                </h3>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Status: Inactive / Pending Approval
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                Shukriya <strong className="text-white font-mono">@{awaitingApproval.username}</strong>! Aapka account ban chuka hai lekin filhal <strong>Inactive</strong> hai.
                <br /><br />
                Super Admin <strong className="text-amber-300">Waqar Majeed</strong> ke account approve aur activate karne ke baad aap apne Username aur Password se Sign In kar sakenge.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAwaitingApproval(null);
                    setMode('LOGIN');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Go to Sign In Screen</span>
                </button>
              </div>
            </div>
          ) : pendingVerification ? (
            <div className="p-4 bg-cyan-950/60 border border-cyan-500/50 rounded-xl space-y-3.5 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                <Mail className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Verify Your Email Address</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Registration details confirmed for <strong className="text-white font-mono">{pendingVerification.email}</strong>. Click below to verify and complete account registration.
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
                      <span>Saving Account...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Verification &amp; Submit Account</span>
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
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>Interactive Password Recovery</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {forgotStep === 'REQUEST'
                    ? 'Enter your registered username or email to send a reset verification code.'
                    : 'Check your email inbox, enter the 8-character reset code, and set your new password.'}
                </p>
              </div>

              {forgotStep === 'REQUEST' ? (
                <form onSubmit={handleRequestResetToken} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Username or Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. waqarmajeedinfo or email"
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 pl-9 transition-colors font-mono"
                        required
                        autoFocus
                      />
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="submit"
                      disabled={isLoading || !forgotIdentifier.trim()}
                      className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Dispatching Code to Email...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Send Reset Code to Email</span>
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
                <form onSubmit={handleConfirmPasswordReset} className="space-y-3.5">
                  <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/30 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                      <Mail className="w-4 h-4 text-cyan-400" />
                      <span>Verification Code Dispatched to Email</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Humne 8-character verification reset code aapke registered email par send kar diya hai. Meharbani farma kar apna email inbox/spam folder check karein, code copy karein aur neeche paste karein.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Reset Code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. Enter 8-character code from email"
                        value={resetTokenInput}
                        onChange={(e) => setResetTokenInput(e.target.value.toUpperCase())}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono tracking-wider focus:outline-none focus:border-cyan-400 pl-9 transition-colors"
                        required
                        autoFocus
                      />
                      <KeyRound className="w-4 h-4 text-cyan-400 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      New Password (minimum 6 characters)
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 pl-9 transition-colors"
                        required
                      />
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 pl-9 transition-colors"
                        required
                      />
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="submit"
                      disabled={isLoading || !newPasswordInput || !resetTokenInput}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Set New Password &amp; Enter Studio</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep('REQUEST');
                        setError(null);
                        setSuccess(null);
                      }}
                      className="w-full text-center text-[11px] text-slate-400 hover:text-white cursor-pointer pt-1 block"
                    >
                      Request Different Reset Code
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 animate-in fade-in duration-300">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Username {mode === 'SIGNUP' && <span className="text-slate-400 font-normal">(Yeh hi aapka Display Name hoga)</span>}
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
