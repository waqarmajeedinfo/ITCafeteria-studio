/**
 * Client-Side Multi-User Authentication & Storage Isolation Store
 */

export type UserRole = 'admin' | 'standard';

export interface UserPermissions {
  // Core Channel Modules (4)
  canAccessDiagnostics: boolean;
  canAccessLive: boolean;
  canAccessSignals: boolean;
  canAccessBenchmarking: boolean;

  // Autopilot & Automation Modules (3)
  canUseAutopilot: boolean;
  canAccessSimulator: boolean;
  canAccessCommunity: boolean;

  // Management & Queue Modules (5)
  canAccessPending: boolean;
  canAccessCalendar: boolean;
  canAccessDuplicates: boolean;
  canAccessMasterlist: boolean;
  canAccessRoadmap: boolean;

  // AI Studio Modules (7)
  canAccessChat: boolean;
  canAccessSearch: boolean;
  canAccessVideo: boolean;
  canUseThumbnailStudio: boolean;
  canAccessTranscribe: boolean;
  canAccessMusic: boolean;
  canAccess3D: boolean;

  // Administrative Actions
  canEditChannels: boolean;
  canPublishScheduledPosts: boolean;
  canExportData: boolean;
  canUseVoiceScriptGenerator: boolean;

  // Quotas & Limits
  maxChannelsAllowed: number;
  dailyGenerationLimit: number;
}

export const ALL_ADMIN_PERMISSIONS: UserPermissions = {
  canAccessDiagnostics: true,
  canAccessLive: true,
  canAccessSignals: true,
  canAccessBenchmarking: true,
  canUseAutopilot: true,
  canAccessSimulator: true,
  canAccessCommunity: true,
  canAccessPending: true,
  canAccessCalendar: true,
  canAccessDuplicates: true,
  canAccessMasterlist: true,
  canAccessRoadmap: true,
  canAccessChat: true,
  canAccessSearch: true,
  canAccessVideo: true,
  canUseThumbnailStudio: true,
  canAccessTranscribe: true,
  canAccessMusic: true,
  canAccess3D: true,
  canEditChannels: true,
  canPublishScheduledPosts: true,
  canExportData: true,
  canUseVoiceScriptGenerator: true,
  maxChannelsAllowed: 9999,
  dailyGenerationLimit: 9999
};

export const ALL_STANDARD_PERMISSIONS: UserPermissions = {
  canAccessDiagnostics: true,
  canAccessLive: true,
  canAccessSignals: true,
  canAccessBenchmarking: true,
  canUseAutopilot: true,
  canAccessSimulator: true,
  canAccessCommunity: true,
  canAccessPending: true,
  canAccessCalendar: true,
  canAccessDuplicates: true,
  canAccessMasterlist: true,
  canAccessRoadmap: true,
  canAccessChat: true,
  canAccessSearch: true,
  canAccessVideo: true,
  canUseThumbnailStudio: true,
  canAccessTranscribe: true,
  canAccessMusic: true,
  canAccess3D: true,
  canEditChannels: true,
  canPublishScheduledPosts: true,
  canExportData: false,
  canUseVoiceScriptGenerator: true,
  maxChannelsAllowed: 5,
  dailyGenerationLimit: 25
};

export interface UserSessionProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  dedicatedRepoPath: string;
  permissions?: UserPermissions;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  role: UserRole;
  action: string;
  details: string;
  targetFile?: string;
  ip: string;
  status: 'DISPATCHED' | 'LOCAL_LOGGED' | 'FAILED';
}

export interface UserSessionActivity {
  id: string;
  timestamp: string;
  action: string;
  details?: string;
  category: 'AUTH' | 'STORAGE' | 'SYNC' | 'AUTOPILOT' | 'SETTINGS' | 'CHANNEL';
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  userId?: string;
  username?: string;
}

const TOKEN_KEY = 'itcafeteria_user_auth_token';
const USER_CACHE_KEY = 'itcafeteria_user_cached_profile';
const ACTIVITY_STORAGE_KEY = 'itcafeteria_user_session_activity';

export const USER_AUTH_UPDATED_EVENT = 'itcafeteria_user_auth_updated';
export const USER_ACTIVITY_UPDATED_EVENT = 'itcafeteria_user_activity_updated';

class UserAuthManager {
  private currentToken: string | null = null;
  private currentUser: UserSessionProfile | null = null;
  private sessionActivityHistory: UserSessionActivity[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.currentToken = localStorage.getItem(TOKEN_KEY);
      try {
        const cached = localStorage.getItem(USER_CACHE_KEY);
        if (cached) this.currentUser = JSON.parse(cached);
      } catch {}
      this.sessionActivityHistory = this.loadActivityHistory();
      // Automatically verify or auto-login with default admin if clean session
      this.init();
    }
  }

  private loadActivityHistory(): UserSessionActivity[] {
    try {
      const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  private saveActivityHistory() {
    try {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(this.sessionActivityHistory.slice(0, 50)));
      window.dispatchEvent(new CustomEvent(USER_ACTIVITY_UPDATED_EVENT, { detail: this.sessionActivityHistory }));
    } catch (e) {
      console.warn('[UserAuthStore] Failed to save session activity:', e);
    }
  }

  public logSessionActivity(
    action: string,
    details?: string,
    category: UserSessionActivity['category'] = 'STORAGE',
    status: UserSessionActivity['status'] = 'SUCCESS'
  ): UserSessionActivity {
    const entry: UserSessionActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: true }),
      action,
      details,
      category,
      status,
      userId: this.currentUser?.id,
      username: this.currentUser?.username || 'guest'
    };

    this.sessionActivityHistory.unshift(entry);
    if (this.sessionActivityHistory.length > 50) {
      this.sessionActivityHistory = this.sessionActivityHistory.slice(0, 50);
    }
    this.saveActivityHistory();
    return entry;
  }

  public getSessionActivityHistory(): UserSessionActivity[] {
    return [...this.sessionActivityHistory];
  }

  public getLastUserActions(count: number = 5): UserSessionActivity[] {
    const currentUsername = this.currentUser?.username;
    if (!currentUsername) {
      return this.sessionActivityHistory.slice(0, count);
    }
    const userSpecific = this.sessionActivityHistory.filter(
      a => !a.username || a.username === currentUsername
    );
    return userSpecific.slice(0, count);
  }

  public clearSessionActivityHistory() {
    this.sessionActivityHistory = [];
    this.saveActivityHistory();
  }

  private async init() {
    if (this.currentToken) {
      await this.refreshUser();
    }
  }

  public getToken(): string | null {
    return this.currentToken;
  }

  public getUser(): UserSessionProfile | null {
    return this.currentUser;
  }

  public isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  public hasPermission(key: keyof UserPermissions): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'admin') return true;
    if (!this.currentUser.permissions) return true;
    return Boolean(this.currentUser.permissions[key]);
  }

  public getPermissions(): UserPermissions | null {
    if (!this.currentUser) return null;
    return this.currentUser.permissions || null;
  }

  private setSession(token: string, user: UserSessionProfile) {
    this.currentToken = token;
    this.currentUser = user;
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      window.dispatchEvent(new CustomEvent(USER_AUTH_UPDATED_EVENT, { detail: user }));
    } catch {}
  }

  public async refreshUser(): Promise<UserSessionProfile | null> {
    if (!this.currentToken) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'x-user-token': this.currentToken }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          this.currentUser = data.user;
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
          window.dispatchEvent(new CustomEvent(USER_AUTH_UPDATED_EVENT, { detail: data.user }));
          return data.user;
        }
      } else if (res.status === 401) {
        this.logout();
      }
    } catch {}
    return null;
  }

  public async login(username: string, password: string): Promise<UserSessionProfile> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        this.logSessionActivity('Login Failed', `Failed attempt for @${username}: ${data.error || 'Invalid credentials'}`, 'AUTH', 'FAILED');
        throw new Error(data.error || 'Login failed');
      }
      this.setSession(data.token, data.user);
      this.logSessionActivity('User Logged In', `Session initialized as @${data.user.username} (${data.user.role})`, 'AUTH', 'SUCCESS');
      return data.user;
    } catch (err: any) {
      if (!err.message?.includes('Login Failed')) {
        this.logSessionActivity('Login Error', err.message || 'Connection failure', 'AUTH', 'FAILED');
      }
      throw err;
    }
  }

  public async register(
    username: string,
    password: string,
    displayName?: string,
    email?: string
  ): Promise<UserSessionProfile> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName, email })
      });
      const data = await res.json();
      if (!res.ok) {
        this.logSessionActivity('Registration Failed', `Failed registering @${username}: ${data.error}`, 'AUTH', 'FAILED');
        throw new Error(data.error || 'Registration failed');
      }
      this.setSession(data.token, data.user);
      this.logSessionActivity('New Account Created', `Profile @${data.user.username} created with dedicated GitHub repository directory`, 'AUTH', 'SUCCESS');
      return data.user;
    } catch (err: any) {
      throw err;
    }
  }

  public async logout() {
    const priorUser = this.currentUser?.username;
    if (this.currentToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'x-user-token': this.currentToken }
      }).catch(() => {});
    }
    this.logSessionActivity('User Logged Out', `Session ended for @${priorUser || 'current user'}`, 'AUTH', 'SUCCESS');
    this.currentToken = null;
    this.currentUser = null;
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
      window.dispatchEvent(new CustomEvent(USER_AUTH_UPDATED_EVENT, { detail: null }));
    } catch {}
  }

  // Save an addition to the user's isolated storage directory
  public async saveAddition(fileKey: string, data: any, actionDescription?: string) {
    if (!this.currentToken) throw new Error('Not authenticated');
    try {
      const res = await fetch('/api/user-storage/save-addition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-token': this.currentToken
        },
        body: JSON.stringify({ fileKey, data, actionDescription })
      });
      const result = await res.json();
      if (!res.ok) {
        this.logSessionActivity(`Save Failed (${fileKey})`, result.error || 'Failed to save addition', 'STORAGE', 'FAILED');
        throw new Error(result.error || 'Save failed');
      }
      this.logSessionActivity(
        `File Saved: ${fileKey}`,
        actionDescription || `Isolated profile file ${fileKey}.json updated in user-data/${this.currentUser?.username}`,
        'STORAGE',
        'SUCCESS'
      );
      return result;
    } catch (err: any) {
      throw err;
    }
  }

  // Load user files from isolated storage
  public async loadUserFiles() {
    if (!this.currentToken) return null;
    const res = await fetch('/api/user-storage/files', {
      headers: { 'x-user-token': this.currentToken }
    });
    if (!res.ok) return null;
    return res.json();
  }

  // Fetch Real-Time Webhook Logs
  public async fetchAuditLogs(): Promise<AuditLogItem[]> {
    if (!this.currentToken) return [];
    try {
      const res = await fetch('/api/webhooks/logs', {
        headers: { 'x-user-token': this.currentToken }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.logs || [];
    } catch {
      return [];
    }
  }

  // GitHub Repository Sync Trigger
  public async syncWithGitHub() {
    if (!this.currentToken) throw new Error('Not authenticated');
    try {
      const res = await fetch('/api/github/sync-directory', {
        method: 'POST',
        headers: { 'x-user-token': this.currentToken }
      });
      const data = await res.json();
      if (!res.ok) {
        this.logSessionActivity('GitHub Sync Failed', data.error || 'Sync request failed', 'SYNC', 'FAILED');
        throw new Error(data.error || 'GitHub sync failed');
      }
      this.logSessionActivity(
        'GitHub Storage Synced',
        `Synchronized ${data.filesSynced || 0} user files to dedicated GitHub directory at ${data.repoPath || 'repo'}`,
        'SYNC',
        'SUCCESS'
      );
      return data;
    } catch (err: any) {
      throw err;
    }
  }

  // Admin APIs
  public async fetchAdminUsers() {
    if (!this.currentToken || !this.isAdmin()) throw new Error('Admin privileges required');
    const res = await fetch('/api/admin/users', {
      headers: { 'x-user-token': this.currentToken }
    });
    return res.json();
  }

  public async fetchAdminUserData(targetUsername: string) {
    if (!this.currentToken || !this.isAdmin()) throw new Error('Admin privileges required');
    const res = await fetch(`/api/admin/users/${encodeURIComponent(targetUsername)}/data`, {
      headers: { 'x-user-token': this.currentToken }
    });
    return res.json();
  }

  public async testWebhook() {
    if (!this.currentToken || !this.isAdmin()) throw new Error('Admin privileges required');
    const res = await fetch('/api/webhooks/test', {
      method: 'POST',
      headers: { 'x-user-token': this.currentToken }
    });
    return res.json();
  }

  // Admin User CRUD APIs
  public async createAdminUser(data: {
    username: string;
    password: string;
    displayName?: string;
    email?: string;
    role?: UserRole;
    permissions?: Partial<UserPermissions>;
  }) {
    if (!this.currentToken || !this.isAdmin()) throw new Error('Admin privileges required');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-token': this.currentToken
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create user');
    this.logSessionActivity('Admin Created User', `Created account @${data.username} (${data.role || 'standard'})`, 'AUTH', 'SUCCESS');
    return result;
  }

  public async updateAdminUser(targetUsername: string, data: {
    displayName?: string;
    email?: string;
    role?: UserRole;
    password?: string;
    isActive?: boolean;
    permissions?: Partial<UserPermissions>;
  }) {
    if (!this.currentToken || !this.isAdmin()) throw new Error('Admin privileges required');
    const res = await fetch(`/api/admin/users/${encodeURIComponent(targetUsername)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-token': this.currentToken
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update user');
    this.logSessionActivity('Admin Updated User', `Updated settings for @${targetUsername}`, 'AUTH', 'SUCCESS');
    return result;
  }

  public async deleteAdminUser(targetUsername: string) {
    if (!this.currentToken || !this.isAdmin()) throw new Error('Admin privileges required');
    const res = await fetch(`/api/admin/users/${encodeURIComponent(targetUsername)}`, {
      method: 'DELETE',
      headers: { 'x-user-token': this.currentToken }
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to delete user');
    this.logSessionActivity('Admin Deleted User', `Deleted user account @${targetUsername}`, 'AUTH', 'SUCCESS');
    return result;
  }

  public async updateUserPermissions(targetUsername: string, permissions: Partial<UserPermissions>) {
    if (!this.currentToken || !this.isAdmin()) throw new Error('Admin privileges required');
    const res = await fetch(`/api/admin/users/${encodeURIComponent(targetUsername)}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-token': this.currentToken
      },
      body: JSON.stringify({ permissions })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update privileges');
    this.logSessionActivity('Privileges Adjusted', `Updated feature privileges & limits for @${targetUsername}`, 'AUTH', 'SUCCESS');
    return result;
  }

  // Request password reset token via email or username
  public async requestPasswordReset(identifier: string): Promise<{ ok: boolean; resetToken: string; email: string; message: string }> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset request failed');
    this.logSessionActivity('Password Reset Requested', `Reset code generated for ${identifier}`, 'AUTH', 'SUCCESS');
    return data;
  }

  // Confirm and set new password using resetToken
  public async resetPassword(identifier: string, resetToken: string, newPassword: string): Promise<UserSessionProfile> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, resetToken, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset failed');
    if (data.token && data.user) {
      this.setSession(data.token, data.user);
    }
    this.logSessionActivity('Password Reset Confirmed', `Password successfully updated for ${identifier}`, 'AUTH', 'SUCCESS');
    return data.user;
  }
}

export const userAuthManager = new UserAuthManager();

/**
 * Global cleanup utility that purges stale persistent development logs
 * and sync cache upon application initialization for cleaner debugging.
 */
export function initGlobalLogCleanup() {
  if (typeof window === 'undefined') return;
  try {
    // 1. Cap session activity logs to last 15 entries
    const rawActivity = localStorage.getItem('itcafeteria_user_session_activity');
    if (rawActivity) {
      try {
        const parsed = JSON.parse(rawActivity);
        if (Array.isArray(parsed) && parsed.length > 15) {
          localStorage.setItem('itcafeteria_user_session_activity', JSON.stringify(parsed.slice(0, 15)));
        }
      } catch {}
    }

    // 2. Remove obsolete temporary log caches while preserving active auth token
    const staleDebugKeys = [
      'itcafeteria_debug_temp_logs',
      'itcafeteria_temp_sync_buffer',
      'itcafeteria_old_audit_cache'
    ];
    staleDebugKeys.forEach((key) => localStorage.removeItem(key));

    // 3. Trigger session activity update event
    console.info('[IT Cafeteria Studio] Global log cleanup initialized: persistent debug buffers purged.');
  } catch (err) {
    console.warn('[IT Cafeteria Studio] Global log cleanup warning:', err);
  }
}
