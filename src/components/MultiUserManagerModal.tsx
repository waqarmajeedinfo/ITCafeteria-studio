import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  ShieldAlert,
  ShieldCheck,
  FolderGit2,
  Lock,
  Unlock,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Database,
  Radio,
  FileCode2,
  Send,
  Eye,
  LogOut,
  UserPlus,
  LogIn,
  Sliders,
  Sparkles,
  History,
  HardDrive,
  GitCommit,
  Clock,
  ArrowRight,
  Trash2,
  Pencil,
  Plus,
  Shield,
  SlidersHorizontal,
  FolderTree
} from 'lucide-react';
import {
  userAuthManager,
  USER_AUTH_UPDATED_EVENT,
  USER_ACTIVITY_UPDATED_EVENT,
  type UserSessionProfile,
  type AuditLogItem,
  type UserSessionActivity,
  type UserPermissions
} from '../lib/userAuthStore';
import {
  syncLogger,
  SYNC_LOGGER_UPDATED_EVENT,
  type SyncLogRecord,
  type UserSyncSummary
} from '../lib/syncLogger';

interface MultiUserManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Component to display the last 5 actions performed by current user
 */
const UserRecentActionsWidget: React.FC<{ username?: string }> = ({ username }) => {
  const [actions, setActions] = useState<UserSessionActivity[]>(() => userAuthManager.getLastUserActions(5));

  useEffect(() => {
    const handleActivity = () => {
      setActions(userAuthManager.getLastUserActions(5));
    };
    window.addEventListener(USER_ACTIVITY_UPDATED_EVENT, handleActivity);
    return () => window.removeEventListener(USER_ACTIVITY_UPDATED_EVENT, handleActivity);
  }, [username]);

  if (actions.length === 0) {
    return (
      <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
        <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-wider">
          <History className="w-4 h-4 text-cyan-400" />
          <span>Last 5 User Actions (Session Activity History)</span>
        </div>
        <p className="text-[11px] text-slate-500 italic">Is session mein abhi tak koi actions record nahi huway.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h5 className="font-bold text-white text-xs uppercase tracking-wider">
            Last 5 User Actions (Session Activity History)
          </h5>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-bold">
          Active: @{username || 'guest'}
        </span>
      </div>

      <div className="space-y-2">
        {actions.map((act) => (
          <div
            key={act.id}
            className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg flex items-start justify-between gap-3 text-xs hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                act.status === 'SUCCESS' ? 'bg-emerald-400' : act.status === 'FAILED' ? 'bg-rose-400' : 'bg-amber-400'
              }`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">{act.action}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-800 text-slate-400">
                    {act.category}
                  </span>
                </div>
                {act.details && (
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{act.details}</p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono text-slate-500 block">{act.timestamp}</span>
              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                act.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {act.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export const MultiUserManagerModal: React.FC<MultiUserManagerModalProps> = ({ isOpen, onClose }) => {
  const [currentUser, setCurrentUser] = useState<UserSessionProfile | null>(userAuthManager.getUser());
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'ISOLATED_STORAGE' | 'WEBHOOK_LOGS' | 'ADMIN_SUPERUSER' | 'PERMISSION_OVERVIEW' | 'AUDIT_LOG_DETAILS'>('PROFILE');

  // Auth Forms
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Storage and Audit data
  const [userFiles, setUserFiles] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [inspectUserData, setInspectUserData] = useState<any>(null);
  const [inspectingUsername, setInspectingUsername] = useState<string | null>(null);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLogRecord[]>(() => syncLogger.getSyncLogs(currentUser?.username));

  // Admin User Management State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [adjustingUserPermissions, setAdjustingUserPermissions] = useState<any | null>(null);

  // Form states for Admin Creating User
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminDisplayName, setNewAdminDisplayName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'standard'>('standard');

  // Form state for Editing User
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'standard'>('standard');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Form state for Adjusting Permissions & Feature limits
  const [permissionToggles, setPermissionToggles] = useState<UserPermissions>({
    canUseAutopilot: true,
    canEditChannels: true,
    canUseThumbnailStudio: true,
    canPublishScheduledPosts: true,
    canExportData: false,
    canUseVoiceScriptGenerator: true,
    maxChannelsAllowed: 5,
    dailyGenerationLimit: 25
  });

  useEffect(() => {
    const handleAuthUpdate = (e: any) => {
      setCurrentUser(e.detail);
      setSyncLogs(syncLogger.getSyncLogs(e.detail?.username));
    };

    const handleSyncUpdate = (e: any) => {
      setSyncLogs(e.detail || syncLogger.getSyncLogs(currentUser?.username));
    };

    window.addEventListener(USER_AUTH_UPDATED_EVENT, handleAuthUpdate);
    window.addEventListener(SYNC_LOGGER_UPDATED_EVENT, handleSyncUpdate);
    syncLogger.fetchServerSyncLogs().then(() => {
      setSyncLogs(syncLogger.getSyncLogs(currentUser?.username));
    }).catch(() => {});

    return () => {
      window.removeEventListener(USER_AUTH_UPDATED_EVENT, handleAuthUpdate);
      window.removeEventListener(SYNC_LOGGER_UPDATED_EVENT, handleSyncUpdate);
    };
  }, [currentUser?.username]);

  useEffect(() => {
    if (isOpen) {
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
      loadTabContent();
      setSyncLogs(syncLogger.getSyncLogs(currentUser?.username));
      return () => {
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
      };
    }
  }, [isOpen, activeTab, currentUser]);

  const loadTabContent = async () => {
    if (activeTab === 'ISOLATED_STORAGE') {
      const data = await userAuthManager.loadUserFiles();
      setUserFiles(data);
    } else if (activeTab === 'WEBHOOK_LOGS' || activeTab === 'AUDIT_LOG_DETAILS') {
      const logs = await userAuthManager.fetchAuditLogs();
      setAuditLogs(logs);
    } else if ((activeTab === 'ADMIN_SUPERUSER' || activeTab === 'PERMISSION_OVERVIEW') && userAuthManager.isAdmin()) {
      const usersData = await userAuthManager.fetchAdminUsers();
      if (usersData?.users) setAdminUsers(usersData.users);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsLoading(true);
    try {
      const u = await userAuthManager.login(usernameInput, passwordInput);
      setAuthSuccess(`Khush Amdeed, ${u.displayName}! Logged in as ${u.role === 'admin' ? 'Super Admin' : 'Standard User'}.`);
      setUsernameInput('');
      setPasswordInput('');
    } catch (err: any) {
      setAuthError(err?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsLoading(true);
    try {
      const u = await userAuthManager.register(usernameInput, passwordInput, displayNameInput);
      setAuthSuccess(`Account kamyabi se ban gaya! Dedicated GitHub directory "${u.dedicatedRepoPath}" create ho gayi.`);
      setUsernameInput('');
      setPasswordInput('');
      setDisplayNameInput('');
    } catch (err: any) {
      setAuthError(err?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSwitch = async (role: 'admin' | 'standard') => {
    setAuthError(null);
    setAuthSuccess(null);
    setIsLoading(true);
    try {
      if (role === 'admin') {
        await userAuthManager.login('waqarmajeed', 'waqar2026');
        setAuthSuccess('Switched to Super Admin (Waqar Majeed)');
      } else {
        await userAuthManager.login('noorwahid', 'noor1234');
        setAuthSuccess('Switched to Standard User (Noor Wahid)');
      }
    } catch (e: any) {
      setAuthError(e?.message || 'Switch failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    const start = Date.now();
    try {
      const res = await userAuthManager.syncWithGitHub();
      setSyncStatus(`✅ ${res.message}`);
      syncLogger.recordSyncOperation({
        operation: 'GIT_MIRROR',
        targetFile: `user-data/${currentUser?.username || 'user'}`,
        username: currentUser?.username || 'guest',
        status: 'SYNCED',
        details: res.message || 'Storage synchronized to dedicated GitHub directory',
        repoPath: currentUser?.dedicatedRepoPath || 'user-data',
        syncLatencyMs: Date.now() - start
      });
      setSyncLogs(syncLogger.getSyncLogs(currentUser?.username));
    } catch (e: any) {
      setSyncStatus(`❌ Sync error: ${e?.message}`);
      syncLogger.recordSyncOperation({
        operation: 'GIT_MIRROR',
        targetFile: `user-data/${currentUser?.username || 'user'}`,
        username: currentUser?.username || 'guest',
        status: 'ERROR',
        details: e?.message || 'Sync operation failed',
        repoPath: currentUser?.dedicatedRepoPath || 'user-data',
        syncLatencyMs: Date.now() - start
      });
      setSyncLogs(syncLogger.getSyncLogs(currentUser?.username));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestWebhook = async () => {
    try {
      const res = await userAuthManager.testWebhook();
      setSyncStatus(`⚡ Webhook Test: ${res.message} (Status: ${res.status})`);
      const logs = await userAuthManager.fetchAuditLogs();
      setAuditLogs(logs);
    } catch (e: any) {
      setSyncStatus(`❌ Webhook test failed: ${e?.message}`);
    }
  };

  const handleInspectUser = async (targetUsername: string) => {
    setInspectingUsername(targetUsername);
    const data = await userAuthManager.fetchAdminUserData(targetUsername);
    setInspectUserData(data);
  };

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setEditDisplayName(u.displayName || '');
    setEditEmail(u.email || '');
    setEditRole(u.role || 'standard');
    setEditNewPassword('');
    setEditIsActive(u.isActive !== false);
  };

  const openPermissionsModal = (u: any) => {
    setAdjustingUserPermissions(u);
    setPermissionToggles(u.permissions || {
      canUseAutopilot: true,
      canEditChannels: true,
      canUseThumbnailStudio: true,
      canPublishScheduledPosts: true,
      canExportData: false,
      canUseVoiceScriptGenerator: true,
      maxChannelsAllowed: 5,
      dailyGenerationLimit: 25
    });
  };

  const handleAdminCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUsername.trim() || !newAdminPassword.trim()) {
      setAuthError('Username aur password dono darkaar hain.');
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    try {
      await userAuthManager.createAdminUser({
        username: newAdminUsername.trim(),
        password: newAdminPassword.trim(),
        displayName: newAdminDisplayName.trim() || newAdminUsername.trim(),
        email: newAdminEmail.trim() || `${newAdminUsername.trim()}@itcafeteria.internal`,
        role: newAdminRole,
        permissions: newAdminRole === 'admin'
          ? {
              canUseAutopilot: true,
              canEditChannels: true,
              canUseThumbnailStudio: true,
              canPublishScheduledPosts: true,
              canExportData: true,
              canUseVoiceScriptGenerator: true,
              maxChannelsAllowed: 100,
              dailyGenerationLimit: 9999
            }
          : {
              canUseAutopilot: true,
              canEditChannels: true,
              canUseThumbnailStudio: true,
              canPublishScheduledPosts: true,
              canExportData: false,
              canUseVoiceScriptGenerator: true,
              maxChannelsAllowed: 5,
              dailyGenerationLimit: 25
            }
      });
      setAuthSuccess(`User @${newAdminUsername} kamyabi se create ho gaya!`);
      setNewAdminUsername('');
      setNewAdminPassword('');
      setNewAdminDisplayName('');
      setNewAdminEmail('');
      setShowCreateUserModal(false);
      const res = await userAuthManager.fetchAdminUsers();
      if (res?.users) setAdminUsers(res.users);
    } catch (err: any) {
      setAuthError(err?.message || 'User create karne mein error aaya');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsLoading(true);
    setAuthError(null);
    try {
      await userAuthManager.updateAdminUser(editingUser.username, {
        displayName: editDisplayName.trim() || editingUser.displayName,
        email: editEmail.trim() || editingUser.email,
        role: editRole,
        password: editNewPassword.trim() ? editNewPassword.trim() : undefined,
        isActive: editIsActive
      });
      setAuthSuccess(`User @${editingUser.username} ki profile kamyabi se update ho gayi!`);
      setEditingUser(null);
      const res = await userAuthManager.fetchAdminUsers();
      if (res?.users) setAdminUsers(res.users);
    } catch (err: any) {
      setAuthError(err?.message || 'User update karne mein error aaya');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminDeleteUser = async (targetUsername: string) => {
    if (targetUsername === 'waqarmajeed') {
      setAuthError('Waqar Majeed (Super Admin) account delete nahi kiya ja sakta!');
      return;
    }
    if (!confirm(`Are you sure you want to delete user @${targetUsername}? Yeh action irreversible hai.`)) {
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    try {
      await userAuthManager.deleteAdminUser(targetUsername);
      setAuthSuccess(`User @${targetUsername} system se delete kar diya gaya.`);
      const res = await userAuthManager.fetchAdminUsers();
      if (res?.users) setAdminUsers(res.users);
      if (inspectingUsername === targetUsername) {
        setInspectingUsername(null);
        setInspectUserData(null);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'User delete karne mein error aaya');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUserPermissions) return;
    setIsLoading(true);
    setAuthError(null);
    try {
      await userAuthManager.updateUserPermissions(adjustingUserPermissions.username, permissionToggles);
      setAuthSuccess(`@${adjustingUserPermissions.username} ki permissions aur limits update ho gayi hain!`);
      setAdjustingUserPermissions(null);
      const res = await userAuthManager.fetchAdminUsers();
      if (res?.users) setAdminUsers(res.users);
    } catch (err: any) {
      setAuthError(err?.message || 'Permissions update karne mein error aaya');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[115] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overscroll-contain overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden overscroll-contain text-slate-100 my-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              currentUser?.role === 'admin'
                ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
            }`}>
              {currentUser?.role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-base">Backend Multi-User Architecture &amp; RBAC</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                  currentUser?.role === 'admin'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                }`}>
                  {currentUser?.role === 'admin' ? 'Super Admin' : 'Standard User'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  User: <strong className="text-white">{currentUser?.username || 'Guest'}</strong>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Har user ka data alag dedicated GitHub directory mein save aur sync hota hai. Real-time webhooks audit logs active hain.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer self-start sm:self-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('PROFILE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'PROFILE' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>User Profile &amp; Switcher</span>
            </button>

            <button
              onClick={() => setActiveTab('ISOLATED_STORAGE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ISOLATED_STORAGE' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Isolated Storage &amp; GitHub Sync</span>
            </button>

            <button
              onClick={() => setActiveTab('WEBHOOK_LOGS')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'WEBHOOK_LOGS' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Real-Time Webhook Logs</span>
            </button>

            {currentUser?.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('ADMIN_SUPERUSER')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'ADMIN_SUPERUSER' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-300 hover:text-white bg-purple-950/40 border border-purple-800/60'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                  <span>Superuser Privileges</span>
                </button>

                <button
                  onClick={() => setActiveTab('PERMISSION_OVERVIEW')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'PERMISSION_OVERVIEW' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-300 hover:text-white bg-emerald-950/40 border border-emerald-800/60'
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Permission Overview</span>
                </button>

                <button
                  onClick={() => setActiveTab('AUDIT_LOG_DETAILS')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'AUDIT_LOG_DETAILS' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-300 hover:text-white bg-indigo-950/40 border border-indigo-800/60'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Audit Log</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentUser && (
              <button
                onClick={() => userAuthManager.logout()}
                className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                title="Logout current user"
              >
                <LogOut className="w-3 h-3" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {authSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          {authError && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* TAB 1: User Profile & Switcher */}
          {activeTab === 'PROFILE' && (
            <div className="space-y-4">
              {/* Current Active Account Card */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{currentUser?.displayName || 'Guest User'}</span>
                      <span className="text-cyan-400 font-mono text-[11px]">(@{currentUser?.username || 'none'})</span>
                    </div>
                    <p className="text-slate-400 text-xs">
                      Email: <strong className="text-slate-200">{currentUser?.email || 'N/A'}</strong> • Role:{' '}
                      <strong className={currentUser?.role === 'admin' ? 'text-purple-400' : 'text-cyan-400'}>
                        {currentUser?.role === 'admin' ? 'Super Admin (All Privileges)' : 'Standard User (Self-Isolated)'}
                      </strong>
                    </p>
                  </div>

                  {/* 1-Click Role Switcher Demo */}
                  <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold px-1.5">Quick Switch:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickSwitch('admin')}
                      disabled={isLoading || currentUser?.username === 'waqarmajeed'}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentUser?.username === 'waqarmajeed'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-800 text-purple-300 hover:bg-slate-700'
                      }`}
                    >
                      👑 Super Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSwitch('standard')}
                      disabled={isLoading || currentUser?.username === 'noorwahid'}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentUser?.username === 'noorwahid'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'bg-slate-800 text-cyan-300 hover:bg-slate-700'
                      }`}
                    >
                      👤 Standard (Noor)
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-400">
                    <FolderGit2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Dedicated Repo Directory: <strong className="text-emerald-300 font-mono">{currentUser?.dedicatedRepoPath || 'user-data/guest'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Radio className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Data Isolation: <strong className="text-cyan-300">Strictly Enforced via Backend RBAC</strong></span>
                  </div>
                </div>
              </div>

              {/* Last 5 Actions performed by current user */}
              <UserRecentActionsWidget username={currentUser?.username} />

              {/* Login / Register Form for Custom Users */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                      {authMode === 'LOGIN' ? 'Login with Another Profile' : 'Register New Standard User'}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setAuthMode('LOGIN')}
                      className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                        authMode === 'LOGIN' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('REGISTER')}
                      className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                        authMode === 'REGISTER' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Register
                    </button>
                  </div>
                </div>

                <form onSubmit={authMode === 'LOGIN' ? handleLogin : handleRegister} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1">Username</label>
                      <input
                        type="text"
                        placeholder="e.g. waqarmajeed ya naya_user"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1">Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                        required
                      />
                    </div>
                  </div>

                  {authMode === 'REGISTER' && (
                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1">Display Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Waqar Majeed / Studio Operator"
                        value={displayNameInput}
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-cyan-950 cursor-pointer disabled:opacity-50"
                    >
                      {authMode === 'LOGIN' ? <LogIn className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                      <span>{isLoading ? 'Processing...' : authMode === 'LOGIN' ? 'Login Profile' : 'Create & Register Account'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: Isolated Storage & GitHub Sync */}
          {activeTab === 'ISOLATED_STORAGE' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4 text-emerald-400" />
                      Dedicated Repository Directory: <span className="font-mono text-emerald-300">{currentUser?.dedicatedRepoPath}</span>
                    </h4>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Standard user ka تمام created data (channels, stories, prompts) is directory mein automatically save hota hai aur kisi doosre standard user ko visible nahi hota.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGitHubSync}
                      disabled={isSyncing}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Syncing...' : 'Sync with GitHub Repo'}</span>
                    </button>
                  </div>
                </div>

                {syncStatus && (
                  <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200">
                    {syncStatus}
                  </div>
                )}

                {/* Real-Time Sync Summary Badges */}
                {(() => {
                  const summary = syncLogger.getSyncSummary(currentUser?.username || 'guest');
                  return (
                    <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px]">
                        <span className="text-slate-400 block text-[10px]">Sync Pipeline:</span>
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{summary.isSynced ? '100% Synced' : 'Sync Required'}</span>
                        </span>
                      </div>
                      <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px]">
                        <span className="text-slate-400 block text-[10px]">Storage Mode:</span>
                        <span className="font-bold text-cyan-300 font-mono">Isolated FS</span>
                      </div>
                      <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px]">
                        <span className="text-slate-400 block text-[10px]">Target Folder:</span>
                        <span className="font-bold text-purple-300 font-mono truncate block">
                          {summary.dedicatedRepoPath}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px]">
                        <span className="text-slate-400 block text-[10px]">Sync Operations:</span>
                        <span className="font-bold text-white font-mono">{syncLogs.length} Logged</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Real-Time File System Sync Logger Feed */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    <h5 className="font-bold text-white text-xs uppercase tracking-wider">
                      Real-Time File System &amp; Multi-User Sync Logger:
                    </h5>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        syncLogger.clearLogs();
                        setSyncLogs([]);
                      }}
                      className="text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      Clear Sync Logs
                    </button>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-bold">
                      Live FS Hook
                    </span>
                  </div>
                </div>

                {syncLogs.length === 0 ? (
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
                    File system sync operations will appear here in real-time as users save files or mirror repositories.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto custom-modal-scroll">
                    {syncLogs.slice(0, 10).map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 bg-slate-900/90 border border-slate-800/80 rounded-lg flex items-start justify-between gap-2.5 text-xs hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            log.status === 'SYNCED' ? 'bg-emerald-400' : log.status === 'ERROR' ? 'bg-rose-400' : 'bg-cyan-400'
                          }`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-[11px] font-mono">{log.targetFile}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-800 text-cyan-300">
                                {log.operation}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                @{log.username}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{log.details}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono text-slate-500 block">{log.timestamp}</span>
                          <span className={`text-[9px] font-mono font-bold uppercase ${
                            log.status === 'SYNCED' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User Storage Files Browser */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <h5 className="font-bold text-cyan-300 text-xs uppercase tracking-wider">
                  User Isolated Files Browser:
                </h5>

                {userFiles?.files ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(userFiles.files).map(([fileName, content]: [string, any]) => (
                      <div key={fileName} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-white font-bold text-xs flex items-center gap-1.5">
                            <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                            {fileName}
                          </span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                            JSON
                          </span>
                        </div>
                        <pre className="p-2 bg-slate-950 rounded text-[10px] text-slate-300 font-mono max-h-32 overflow-y-auto leading-relaxed border border-slate-800">
                          {JSON.stringify(content, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-500 text-xs">
                    Files load ho rahi hain...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Real-Time Webhook Logs */}
          {activeTab === 'WEBHOOK_LOGS' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-indigo-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    Real-Time API Webhook Audit Logs
                  </h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Har new user addition, profile update, aur story creation webhook logs mein real-time mehfooz hoti hai data integrity maintain karne ke liye.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={handleTestWebhook}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Test Webhook Ping</span>
                    </button>
                  )}
                  <button
                    onClick={loadTabContent}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="Refresh logs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Logs Stream */}
              <div className="space-y-2">
                {auditLogs.length === 0 ? (
                  <div className="p-4 bg-slate-950 text-center text-slate-500 rounded-xl border border-slate-800">
                    Abhi koi webhook log entry nahi hai.
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-start justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] text-slate-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            log.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          }`}>
                            {log.username} ({log.role})
                          </span>
                          <span className="font-semibold text-white">{log.action}</span>
                        </div>
                        <p className="text-slate-300 text-xs">{log.details}</p>
                        {log.targetFile && (
                          <div className="text-[10px] font-mono text-emerald-400">
                            Target: {log.targetFile}
                          </div>
                        )}
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono shrink-0 ${
                        log.status === 'DISPATCHED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : log.status === 'LOCAL_LOGGED'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Superuser Privileges (Admin Only) */}
          {activeTab === 'ADMIN_SUPERUSER' && currentUser?.role === 'admin' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-950/40 border border-purple-500/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  <h4 className="font-bold text-white text-sm">Super Admin User &amp; Privilege Dashboard</h4>
                </div>
                <p className="text-purple-200 text-xs leading-relaxed">
                  Aap Super Admin (Waqar Majeed) hain. Yahan se aap tamam registered users ko add kar sakte hain, edit kar sakte hain, delete kar sakte hain, aur unke features aur limits ko control kar sakte hain.
                </p>
              </div>

              {/* All Users Registry */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h5 className="font-bold text-white text-xs uppercase tracking-wider">
                      Registered Users Registry ({adminUsers.length})
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Standard users ki limits aur allowed features yahan se configure karein
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateUserModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-900/30 transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Create New User</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {adminUsers.map((u) => {
                    const isSuperAdminAccount = u.username === 'waqarmajeed';
                    const perms: UserPermissions = u.permissions || {
                      canUseAutopilot: true,
                      canEditChannels: true,
                      canUseThumbnailStudio: true,
                      canPublishScheduledPosts: true,
                      canExportData: false,
                      canUseVoiceScriptGenerator: true,
                      maxChannelsAllowed: 5,
                      dailyGenerationLimit: 25
                    };

                    return (
                      <div
                        key={u.id || u.username}
                        className={`p-3.5 rounded-xl border transition-all ${
                          inspectingUsername === u.username
                            ? 'bg-purple-950/40 border-purple-400 ring-1 ring-purple-400/40'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          {/* User info */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-sm">{u.displayName}</span>
                              <span className="text-slate-400 text-xs font-mono">@{u.username}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                                u.role === 'admin'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              }`}>
                                {u.role === 'admin' ? '👑 Super Admin' : '👤 Standard User'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                u.isActive !== false
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}>
                                {u.isActive !== false ? 'Active' : 'Suspended'}
                              </span>
                            </div>
                            <p className="text-slate-400 text-[11px] font-mono">{u.email}</p>
                            <p className="text-emerald-400 text-[10px] font-mono truncate">
                              Mirror: {u.dedicatedRepoPath}
                            </p>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => openPermissionsModal(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 hover:bg-indigo-900/50 text-indigo-300 text-xs font-medium cursor-pointer transition-colors"
                              title="Feature Privileges aur Limits configure karein"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                              <span>Privileges &amp; Limits</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
                              title="Profile aur Password update karein"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleInspectUser(u.username)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-950/60 border border-purple-500/40 hover:bg-purple-900/50 text-purple-300 text-xs font-medium cursor-pointer transition-colors"
                              title="GitHub Storage Inspect karein"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>

                            <button
                              type="button"
                              disabled={isSuperAdminAccount}
                              onClick={() => handleAdminDeleteUser(u.username)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                                isSuperAdminAccount
                                  ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                                  : 'bg-rose-950/60 border-rose-500/40 hover:bg-rose-900/50 text-rose-300 cursor-pointer'
                              }`}
                              title={isSuperAdminAccount ? 'Super Admin account delete nahi ho sakta' : 'User delete karein'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Privileges & Limits Badges */}
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                            <span className="text-slate-500 uppercase font-mono">Privileges:</span>
                            <span className={`px-1.5 py-0.5 rounded font-mono ${perms.canUseAutopilot ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 line-through'}`}>
                              Autopilot
                            </span>
                            <span className={`px-1.5 py-0.5 rounded font-mono ${perms.canEditChannels ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 line-through'}`}>
                              Channels
                            </span>
                            <span className={`px-1.5 py-0.5 rounded font-mono ${perms.canUseThumbnailStudio ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 line-through'}`}>
                              Thumbnails
                            </span>
                            <span className={`px-1.5 py-0.5 rounded font-mono ${perms.canPublishScheduledPosts ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 line-through'}`}>
                              Publish
                            </span>
                            <span className={`px-1.5 py-0.5 rounded font-mono ${perms.canExportData ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 line-through'}`}>
                              Export
                            </span>
                            <span className={`px-1.5 py-0.5 rounded font-mono ${perms.canUseVoiceScriptGenerator ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 line-through'}`}>
                              Voice Script
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span>Max Channels: <strong className="text-white">{perms.maxChannelsAllowed ?? 5}</strong></span>
                            <span>•</span>
                            <span>Daily Limit: <strong className="text-white">{perms.dailyGenerationLimit ?? 25}</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inspected User Storage Preview */}
              {inspectUserData && (
                <div className="p-4 bg-slate-950 border border-purple-500/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-purple-300 text-xs flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      <span>Inspecting User Directory: @{inspectUserData.targetUser} ({inspectUserData.dedicatedRepoPath})</span>
                    </h5>
                    <button
                      onClick={() => setInspectUserData(null)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(inspectUserData.storageData || {}).map(([file, content]: [string, any]) => (
                      <div key={file} className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="font-bold text-white font-mono text-xs">{file}</span>
                        <pre className="p-2 mt-1 bg-slate-950 rounded text-[10px] text-slate-300 font-mono max-h-28 overflow-y-auto">
                          {JSON.stringify(content, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CREATE USER MODAL OVERLAY */}
              {showCreateUserModal && (
                <div className="fixed inset-0 z-[125] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-purple-400" />
                        <h4 className="font-bold text-white text-sm">Create New User Account</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCreateUserModal(false)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleAdminCreateUser} className="space-y-3">
                      <div>
                        <label className="block text-slate-300 text-xs mb-1 font-medium">Username *</label>
                        <input
                          type="text"
                          required
                          value={newAdminUsername}
                          onChange={(e) => setNewAdminUsername(e.target.value.toLowerCase())}
                          placeholder="e.g. ali_raza"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 text-xs mb-1 font-medium">Password *</label>
                        <input
                          type="password"
                          required
                          value={newAdminPassword}
                          onChange={(e) => setNewAdminPassword(e.target.value)}
                          placeholder="Set user password"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-300 text-xs mb-1 font-medium">Display Name</label>
                          <input
                            type="text"
                            value={newAdminDisplayName}
                            onChange={(e) => setNewAdminDisplayName(e.target.value)}
                            placeholder="e.g. Ali Raza"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 text-xs mb-1 font-medium">Account Role</label>
                          <select
                            value={newAdminRole}
                            onChange={(e) => setNewAdminRole(e.target.value as 'admin' | 'standard')}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                          >
                            <option value="standard">Standard User</option>
                            <option value="admin">Super Admin</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 text-xs mb-1 font-medium">Email Address</label>
                        <input
                          type="email"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="e.g. ali@itcafeteria.internal"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setShowCreateUserModal(false)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs cursor-pointer disabled:opacity-50"
                        >
                          {isLoading ? 'Creating...' : 'Create Account'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* EDIT USER MODAL OVERLAY */}
              {editingUser && (
                <div className="fixed inset-0 z-[125] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Pencil className="w-5 h-5 text-indigo-400" />
                        <h4 className="font-bold text-white text-sm">Edit User: @{editingUser.username}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingUser(null)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleAdminUpdateUser} className="space-y-3">
                      <div>
                        <label className="block text-slate-300 text-xs mb-1 font-medium">Display Name</label>
                        <input
                          type="text"
                          value={editDisplayName}
                          onChange={(e) => setEditDisplayName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 text-xs mb-1 font-medium">Email Address</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-300 text-xs mb-1 font-medium">Role</label>
                          <select
                            value={editRole}
                            disabled={editingUser.username === 'waqarmajeed'}
                            onChange={(e) => setEditRole(e.target.value as 'admin' | 'standard')}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                          >
                            <option value="standard">Standard User</option>
                            <option value="admin">Super Admin</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-300 text-xs mb-1 font-medium">Status</label>
                          <select
                            value={editIsActive ? 'active' : 'inactive'}
                            disabled={editingUser.username === 'waqarmajeed'}
                            onChange={(e) => setEditIsActive(e.target.value === 'active')}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Suspended</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 text-xs mb-1 font-medium">
                          Reset Password (leave blank to keep current)
                        </label>
                        <input
                          type="password"
                          value={editNewPassword}
                          onChange={(e) => setEditNewPassword(e.target.value)}
                          placeholder="New password..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer disabled:opacity-50"
                        >
                          {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* PRIVILEGES & LIMITS MODAL OVERLAY */}
              {adjustingUserPermissions && (
                <div className="fixed inset-0 z-[125] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
                        <div>
                          <h4 className="font-bold text-white text-sm">Privileges &amp; Limits: @{adjustingUserPermissions.username}</h4>
                          <span className="text-[11px] text-slate-400">Configure which features standard users can access</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAdjustingUserPermissions(null)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleAdminSavePermissions} className="space-y-4">
                      {/* Feature Toggles */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">Feature Permissions:</span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                            <input
                              type="checkbox"
                              checked={permissionToggles.canUseAutopilot}
                              onChange={(e) => setPermissionToggles({ ...permissionToggles, canUseAutopilot: e.target.checked })}
                              className="accent-cyan-500 rounded"
                            />
                            <span className="text-slate-200">Autopilot Decision Engine</span>
                          </label>

                          <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                            <input
                              type="checkbox"
                              checked={permissionToggles.canEditChannels}
                              onChange={(e) => setPermissionToggles({ ...permissionToggles, canEditChannels: e.target.checked })}
                              className="accent-cyan-500 rounded"
                            />
                            <span className="text-slate-200">Channel Management</span>
                          </label>

                          <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                            <input
                              type="checkbox"
                              checked={permissionToggles.canUseThumbnailStudio}
                              onChange={(e) => setPermissionToggles({ ...permissionToggles, canUseThumbnailStudio: e.target.checked })}
                              className="accent-cyan-500 rounded"
                            />
                            <span className="text-slate-200">Thumbnail Studio AI</span>
                          </label>

                          <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                            <input
                              type="checkbox"
                              checked={permissionToggles.canPublishScheduledPosts}
                              onChange={(e) => setPermissionToggles({ ...permissionToggles, canPublishScheduledPosts: e.target.checked })}
                              className="accent-cyan-500 rounded"
                            />
                            <span className="text-slate-200">Publish Scheduled Posts</span>
                          </label>

                          <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                            <input
                              type="checkbox"
                              checked={permissionToggles.canExportData}
                              onChange={(e) => setPermissionToggles({ ...permissionToggles, canExportData: e.target.checked })}
                              className="accent-cyan-500 rounded"
                            />
                            <span className="text-slate-200">Export System Data</span>
                          </label>

                          <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                            <input
                              type="checkbox"
                              checked={permissionToggles.canUseVoiceScriptGenerator}
                              onChange={(e) => setPermissionToggles({ ...permissionToggles, canUseVoiceScriptGenerator: e.target.checked })}
                              className="accent-cyan-500 rounded"
                            />
                            <span className="text-slate-200">Voice Script Generator</span>
                          </label>
                        </div>
                      </div>

                      {/* Numeric Limits */}
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">Standard User Limits:</span>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-400 mb-1">Max Channels Allowed</label>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={permissionToggles.maxChannelsAllowed}
                              onChange={(e) => setPermissionToggles({
                                ...permissionToggles,
                                maxChannelsAllowed: parseInt(e.target.value) || 1
                              })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">Daily Generation Limit</label>
                            <input
                              type="number"
                              min={1}
                              max={1000}
                              value={permissionToggles.dailyGenerationLimit}
                              onChange={(e) => setPermissionToggles({
                                ...permissionToggles,
                                dailyGenerationLimit: parseInt(e.target.value) || 1
                              })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setAdjustingUserPermissions(null)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs cursor-pointer disabled:opacity-50"
                        >
                          {isLoading ? 'Saving...' : 'Save Privileges'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Permission Overview (Summary Audit Table) */}
          {activeTab === 'PERMISSION_OVERVIEW' && currentUser?.role === 'admin' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-white text-sm">Permission Overview &amp; Access Audit Table</h4>
                </div>
                <p className="text-emerald-200 text-xs leading-relaxed">
                  Yahan aap tamam registered users aur unki assigned menu &amp; feature permissions ko ek hi summary table mein audit kar sakte hain bina har user ko alag se open kiye.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                        <th className="p-3">User</th>
                        <th className="p-3">Role</th>
                        <th className="p-3 text-center">Autopilot</th>
                        <th className="p-3 text-center">Channels</th>
                        <th className="p-3 text-center">Thumbnails</th>
                        <th className="p-3 text-center">Publish</th>
                        <th className="p-3 text-center">Export</th>
                        <th className="p-3 text-center">Voice Script</th>
                        <th className="p-3 text-center">Max Ch.</th>
                        <th className="p-3 text-center">Daily Limit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {adminUsers.map((u) => {
                        const p = u.permissions || {
                          canUseAutopilot: true,
                          canEditChannels: true,
                          canUseThumbnailStudio: true,
                          canPublishScheduledPosts: true,
                          canExportData: false,
                          canUseVoiceScriptGenerator: true,
                          maxChannelsAllowed: 5,
                          dailyGenerationLimit: 25
                        };
                        return (
                          <tr key={u.username} className="hover:bg-slate-900/60 transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-white">{u.displayName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">@{u.username}</div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${p.canUseAutopilot ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                {p.canUseAutopilot ? 'YES' : 'NO'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${p.canEditChannels ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                {p.canEditChannels ? 'YES' : 'NO'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${p.canUseThumbnailStudio ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                {p.canUseThumbnailStudio ? 'YES' : 'NO'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${p.canPublishScheduledPosts ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                {p.canPublishScheduledPosts ? 'YES' : 'NO'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${p.canExportData ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                {p.canExportData ? 'YES' : 'NO'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${p.canUseVoiceScriptGenerator ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                {p.canUseVoiceScriptGenerator ? 'YES' : 'NO'}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono text-white font-bold">
                              {p.maxChannelsAllowed ?? 5}
                            </td>
                            <td className="p-3 text-center font-mono text-white font-bold">
                              {p.dailyGenerationLimit ?? 25}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Dedicated Audit Log Component */}
          {activeTab === 'AUDIT_LOG_DETAILS' && currentUser?.role === 'admin' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-indigo-950/40 border border-indigo-500/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  <h4 className="font-bold text-white text-sm">Critical Admin &amp; System Audit Log Component</h4>
                </div>
                <p className="text-indigo-200 text-xs leading-relaxed">
                  Yeh dedicated audit log component administrative actions (user privilege adjustments, role changes, creations, deletions, and system configuration updates) ko track karta hai.
                </p>
              </div>

              <div className="space-y-2">
                {auditLogs.length === 0 ? (
                  <div className="p-6 bg-slate-950 text-center text-slate-500 rounded-xl border border-slate-800">
                    No critical admin audit log entries recorded yet.
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-start justify-between gap-2.5"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            log.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          }`}>
                            @{log.username} ({log.role})
                          </span>
                          <span className="font-bold text-white text-xs">{log.action}</span>
                        </div>
                        <p className="text-slate-300 text-xs">{log.details}</p>
                        {log.targetFile && (
                          <div className="text-[10px] font-mono text-emerald-400">
                            Target Resource: {log.targetFile}
                          </div>
                        )}
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono shrink-0 ${
                        log.status === 'DISPATCHED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : log.status === 'LOCAL_LOGGED'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            IT Cafeteria Multi-User RBAC &amp; GitHub Mirror Sync Active
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold cursor-pointer transition-colors"
          >
            Close Manager
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
