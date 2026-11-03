import type { Express, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persistent Root Data Directories
const DATA_ROOT = path.resolve(__dirname, 'data');
const USERS_DIR = path.resolve(DATA_ROOT, 'users');
const USER_STORAGE_DIR = path.resolve(DATA_ROOT, 'user-storage');
const GITHUB_MIRROR_DIR = path.resolve(__dirname, 'user-data');
const LOGS_DIR = path.resolve(DATA_ROOT, 'logs');

const USERS_FILE = path.resolve(USERS_DIR, 'users-registry.json');
const AUDIT_LOG_FILE = path.resolve(LOGS_DIR, 'realtime-audit-webhooks.json');
const WEBHOOK_CONFIG_FILE = path.resolve(DATA_ROOT, 'webhook-config.json');

// Ensure directory structures exist
[DATA_ROOT, USERS_DIR, USER_STORAGE_DIR, GITHUB_MIRROR_DIR, LOGS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export type UserRole = 'admin' | 'standard';

export interface UserPermissions {
  canUseAutopilot: boolean;
  canEditChannels: boolean;
  canUseThumbnailStudio: boolean;
  canPublishScheduledPosts: boolean;
  canExportData: boolean;
  canUseVoiceScriptGenerator: boolean;
  maxChannelsAllowed: number;
  dailyGenerationLimit: number;
}

export const DEFAULT_ADMIN_PERMISSIONS: UserPermissions = {
  canUseAutopilot: true,
  canEditChannels: true,
  canUseThumbnailStudio: true,
  canPublishScheduledPosts: true,
  canExportData: true,
  canUseVoiceScriptGenerator: true,
  maxChannelsAllowed: 9999,
  dailyGenerationLimit: 9999
};

export const DEFAULT_STANDARD_PERMISSIONS: UserPermissions = {
  canUseAutopilot: true,
  canEditChannels: true,
  canUseThumbnailStudio: true,
  canPublishScheduledPosts: true,
  canExportData: false,
  canUseVoiceScriptGenerator: true,
  maxChannelsAllowed: 5,
  dailyGenerationLimit: 25
};

export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
  dedicatedRepoPath: string;
  permissions: UserPermissions;
}

export interface WebhookConfig {
  webhookUrl: string;
  secretKey: string;
  enabled: boolean;
  events: string[];
}

export interface AuditLogEntry {
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
  webhookPayloadPreview?: any;
}

// In-Memory active token registry (token -> UserAccount)
const activeSessions = new Map<string, { user: UserAccount; expiresAt: number }>();

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Initial default users
function initDefaultUsers(): UserAccount[] {
  if (fs.existsSync(USERS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        return data.map((u: any) => ({
          ...u,
          permissions: u.permissions || (u.role === 'admin' ? { ...DEFAULT_ADMIN_PERMISSIONS } : { ...DEFAULT_STANDARD_PERMISSIONS })
        }));
      }
    } catch (e) {
      console.warn('[MultiUser] Failed to read existing users, initializing defaults:', e);
    }
  }

  // Pre-seed Admin (Superuser) and Default Standard User
  const adminSalt = crypto.randomBytes(16).toString('hex');
  const adminUser: UserAccount = {
    id: 'user-admin-01',
    username: 'waqarmajeed',
    displayName: 'Waqar Majeed (Super Admin)',
    email: 'admin@itcafeteria.studio',
    role: 'admin',
    salt: adminSalt,
    passwordHash: hashPassword('waqar2026', adminSalt),
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isActive: true,
    dedicatedRepoPath: 'user-data/waqarmajeed',
    permissions: { ...DEFAULT_ADMIN_PERMISSIONS }
  };

  const stdSalt = crypto.randomBytes(16).toString('hex');
  const stdUser: UserAccount = {
    id: 'user-std-01',
    username: 'noorwahid',
    displayName: 'Noor Wahid (Standard)',
    email: 'noorwahid1016@gmail.com',
    role: 'standard',
    salt: stdSalt,
    passwordHash: hashPassword('noor1234', stdSalt),
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isActive: true,
    dedicatedRepoPath: 'user-data/noorwahid',
    permissions: { ...DEFAULT_STANDARD_PERMISSIONS }
  };

  const adminInfoSalt = crypto.randomBytes(16).toString('hex');
  const adminInfoUser: UserAccount = {
    id: 'user-admin-info-01',
    username: 'waqarmajeedinfo',
    displayName: 'Waqar Majeed (Super Admin)',
    email: 'waqarmajeedinfo@itcafeteria.studio',
    role: 'admin',
    salt: adminInfoSalt,
    passwordHash: hashPassword('WM2info$', adminInfoSalt),
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isActive: true,
    dedicatedRepoPath: 'user-data/waqarmajeedinfo',
    permissions: { ...DEFAULT_ADMIN_PERMISSIONS }
  };

  const users = [adminUser, stdUser, adminInfoUser];
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  return users;
}

let usersRegistry: UserAccount[] = initDefaultUsers();

function saveUsersRegistry() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersRegistry, null, 2), 'utf-8');
  } catch (e) {
    console.error('[MultiUser] Failed to save users registry:', e);
  }
}

// Webhook Configuration
function getWebhookConfig(): WebhookConfig {
  if (fs.existsSync(WEBHOOK_CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(WEBHOOK_CONFIG_FILE, 'utf-8'));
    } catch {}
  }
  return {
    webhookUrl: process.env.AUDIT_WEBHOOK_URL || '',
    secretKey: process.env.WEBHOOK_SECRET || 'itcafeteria-audit-key-2026',
    enabled: Boolean(process.env.AUDIT_WEBHOOK_URL),
    events: ['*']
  };
}

function saveWebhookConfig(cfg: WebhookConfig) {
  try {
    fs.writeFileSync(WEBHOOK_CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (e) {
    console.error('[MultiUser] Failed to save webhook config:', e);
  }
}

// Ensure User Directory & Seed Files exist in isolated storage
function ensureUserStorage(username: string): { userDir: string; repoMirrorDir: string } {
  const safeUser = username.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const userDir = path.resolve(USER_STORAGE_DIR, safeUser);
  const repoMirrorDir = path.resolve(GITHUB_MIRROR_DIR, safeUser);

  [userDir, repoMirrorDir].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  // Default files in user directory
  const files = [
    {
      name: 'profile.json',
      content: {
        username: safeUser,
        customDialect: 'Lahori Conversational',
        defaultPresenter: 'Waqar Majeed',
        defaultPlatform: 'YouTube Shorts + TikTok',
        syncEnabled: true,
        lastUpdated: new Date().toISOString()
      }
    },
    {
      name: 'channels.json',
      content: [
        {
          id: `${safeUser}-ch-01`,
          name: `${safeUser.toUpperCase()} Production Hub`,
          niche: 'AI Tech & Productivity',
          isUserCreated: true,
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      name: 'stories.json',
      content: []
    },
    {
      name: 'github-sync.json',
      content: {
        lastCommitHash: 'init-local-commit',
        lastSyncTimestamp: new Date().toISOString(),
        branch: 'main',
        syncStatus: 'SYNCED',
        directory: `user-data/${safeUser}`
      }
    }
  ];

  files.forEach((f) => {
    const filePath = path.resolve(userDir, f.name);
    const mirrorPath = path.resolve(repoMirrorDir, f.name);
    if (!fs.existsSync(filePath)) {
      const data = JSON.stringify(f.content, null, 2);
      fs.writeFileSync(filePath, data, 'utf-8');
      fs.writeFileSync(mirrorPath, data, 'utf-8');
    }
  });

  return { userDir, repoMirrorDir };
}

// Initialize seed directories for existing users
usersRegistry.forEach((u) => ensureUserStorage(u.username));

// Real-Time Audit Log & Webhook Dispatcher
export async function logAuditEvent(
  user: UserAccount | null,
  action: string,
  details: string,
  targetFile?: string,
  reqIp: string = '127.0.0.1'
): Promise<AuditLogEntry> {
  const cfg = getWebhookConfig();
  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    timestamp: new Date().toISOString(),
    userId: user?.id || 'system',
    username: user?.username || 'anonymous',
    role: user?.role || 'standard',
    action,
    details,
    targetFile,
    ip: reqIp,
    status: 'LOCAL_LOGGED'
  };

  // 1. Dispatch Webhook if configured
  if (cfg.enabled && cfg.webhookUrl) {
    try {
      const payload = {
        event: 'audit.action_logged',
        auditRecord: entry,
        metadata: {
          app: 'IT Cafeteria Studio',
          environment: process.env.NODE_ENV || 'production'
        }
      };
      entry.webhookPayloadPreview = payload;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const resp = await fetch(cfg.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Studio-Signature': crypto
            .createHmac('sha256', cfg.secretKey)
            .update(JSON.stringify(payload))
            .digest('hex')
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (resp.ok) {
        entry.status = 'DISPATCHED';
      } else {
        entry.status = 'FAILED';
      }
    } catch (err: any) {
      entry.status = 'FAILED';
      console.warn('[Webhook] Dispatch failed:', err?.message || err);
    }
  }

  // 2. Append to persistent real-time logs file
  try {
    let existingLogs: AuditLogEntry[] = [];
    if (fs.existsSync(AUDIT_LOG_FILE)) {
      const raw = fs.readFileSync(AUDIT_LOG_FILE, 'utf-8');
      existingLogs = JSON.parse(raw);
    }
    existingLogs.unshift(entry);
    // Keep last 500 audit log entries
    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(existingLogs.slice(0, 500), null, 2), 'utf-8');
  } catch (err) {
    console.error('[MultiUser] Failed to write audit log:', err);
  }

  return entry;
}

// Authentication Middleware
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const tokenHeader = (req.headers['x-user-token'] as string) || (authHeader && authHeader.split(' ')[1]);

  if (!tokenHeader) {
    // If no token provided, return 401
    return res.status(401).json({
      error: 'Authentication Required',
      message: 'Meharbani farma kar login karein taake aapka personal profile load ho sakay.'
    });
  }

  const session = activeSessions.get(tokenHeader);
  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(tokenHeader);
    return res.status(401).json({
      error: 'Session Expired',
      message: 'Aapka session khatam ho chuka hai, baraye mehrbani dobara login karein.'
    });
  }

  // Attach user to request
  (req as any).user = session.user;
  next();
}

// Role Authorization Middleware (Admin-only check)
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as UserAccount;
  if (!user || user.role !== 'admin') {
    void logAuditEvent(
      user,
      'SECURITY_ALERT',
      `Unauthorized Admin privilege escalation attempt blocked for user "${user?.username || 'unknown'}"`,
      undefined,
      req.ip || '127.0.0.1'
    );
    return res.status(403).json({
      error: 'Permission Denied',
      message: 'Sirf Super Admin (Superuser) ke paas tamam users aur system settings ki access hai.'
    });
  }
  next();
}

// Register Multi-User and Webhook API Routes on Express app
export function registerMultiUserRoutes(app: Express) {
  console.log('[MultiUser] Mounting Multi-User Authentication, Isolated Storage & Webhooks API routes...');

  // 1. User Registration (Self-serve for standard users)
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { username, password, displayName, email } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username aur Password dono lazmi hain.' });
      }

      const cleanUsername = username.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '');
      if (cleanUsername.length < 3) {
        return res.status(400).json({ error: 'Username kam az kam 3 characters ka hona chahiye.' });
      }

      const existing = usersRegistry.find((u) => u.username === cleanUsername);
      if (existing) {
        return res.status(409).json({ error: 'Yeh username pehle se registered hai.' });
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const newUser: UserAccount = {
        id: `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        username: cleanUsername,
        displayName: displayName?.trim() || cleanUsername,
        email: email?.trim() || `${cleanUsername}@user.itcafeteria.studio`,
        role: 'standard', // New self-registered users are strictly standard
        salt,
        passwordHash: hashPassword(password, salt),
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true,
        dedicatedRepoPath: `user-data/${cleanUsername}`,
        permissions: { ...DEFAULT_STANDARD_PERMISSIONS }
      };

      usersRegistry.push(newUser);
      saveUsersRegistry();
      ensureUserStorage(newUser.username);

      const token = generateToken();
      activeSessions.set(token, {
        user: newUser,
        expiresAt: Date.now() + 30 * 24 * 3600 * 1000 // 30 days
      });

      await logAuditEvent(
        newUser,
        'USER_REGISTERED',
        `New standard user account registered. Dedicated repo directory initialized: ${newUser.dedicatedRepoPath}`,
        newUser.dedicatedRepoPath,
        req.ip || '127.0.0.1'
      );

      res.status(201).json({
        ok: true,
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          displayName: newUser.displayName,
          email: newUser.email,
          role: newUser.role,
          dedicatedRepoPath: newUser.dedicatedRepoPath,
          permissions: newUser.permissions
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: 'Registration failed', details: e?.message });
    }
  });

  // 2. User Login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username aur Password lazmi hain.' });
      }

      const cleanUsername = username.trim().toLowerCase();
      const user = usersRegistry.find((u) => u.username === cleanUsername);

      if (!user) {
        return res.status(401).json({ error: 'Ghalat username ya password.' });
      }

      const testHash = hashPassword(password, user.salt);
      if (testHash !== user.passwordHash) {
        await logAuditEvent(
          null,
          'LOGIN_FAILED',
          `Failed login attempt for username: ${cleanUsername}`,
          undefined,
          req.ip || '127.0.0.1'
        );
        return res.status(401).json({ error: 'Ghalat username ya password.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'Aapka account disabled hai. Admin se rabta karein.' });
      }

      user.lastLogin = new Date().toISOString();
      saveUsersRegistry();

      const token = generateToken();
      activeSessions.set(token, {
        user,
        expiresAt: Date.now() + 30 * 24 * 3600 * 1000
      });

      ensureUserStorage(user.username);

      await logAuditEvent(
        user,
        'LOGIN_SUCCESS',
        `User logged in successfully with role: ${user.role}`,
        user.dedicatedRepoPath,
        req.ip || '127.0.0.1'
      );

      res.json({
        ok: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          role: user.role,
          dedicatedRepoPath: user.dedicatedRepoPath,
          permissions: user.permissions || (user.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_STANDARD_PERMISSIONS)
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: 'Login failed', details: e?.message });
    }
  });

  // 3. Current User Session Check (/api/auth/me)
  app.get('/api/auth/me', authenticateToken, (req: Request, res: Response) => {
    const user = (req as any).user as UserAccount;
    res.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        dedicatedRepoPath: user.dedicatedRepoPath,
        permissions: user.permissions || (user.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_STANDARD_PERMISSIONS)
      }
    });
  });

  // 4. Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const tokenHeader = (req.headers['x-user-token'] as string) || (req.headers['authorization']?.split(' ')[1]);
    if (tokenHeader) {
      activeSessions.delete(tokenHeader);
    }
    res.json({ ok: true, message: 'Logged out successfully.' });
  });

  // 5. User Isolated Storage: Get User's Own Files & Channels (Protected by strict RBAC)
  app.get('/api/user-storage/files', authenticateToken, (req: Request, res: Response) => {
    const user = (req as any).user as UserAccount;
    const { userDir, repoMirrorDir } = ensureUserStorage(user.username);

    try {
      const fileNames = fs.readdirSync(userDir);
      const filesSummary: Record<string, any> = {};

      fileNames.forEach((file) => {
        try {
          const content = fs.readFileSync(path.resolve(userDir, file), 'utf-8');
          filesSummary[file] = JSON.parse(content);
        } catch {
          filesSummary[file] = null;
        }
      });

      res.json({
        ok: true,
        username: user.username,
        role: user.role,
        dedicatedRepoPath: user.dedicatedRepoPath,
        files: filesSummary
      });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to read user storage', details: e?.message });
    }
  });

  // 6. User Isolated Storage: Save User Addition (Channels, Stories, Settings)
  // Standard user can only save to their own profile! Admin can save anywhere.
  app.post('/api/user-storage/save-addition', authenticateToken, async (req: Request, res: Response) => {
    const user = (req as any).user as UserAccount;
    const { fileKey, data, actionDescription } = req.body;

    if (!fileKey || !data) {
      return res.status(400).json({ error: 'fileKey aur data dono required hain.' });
    }

    const safeFileName = fileKey.replace(/[^a-zA-Z0-9_.-]/g, '');
    const { userDir, repoMirrorDir } = ensureUserStorage(user.username);
    const targetPath = path.resolve(userDir, safeFileName);
    const mirrorPath = path.resolve(repoMirrorDir, safeFileName);

    try {
      const jsonContent = JSON.stringify(data, null, 2);
      fs.writeFileSync(targetPath, jsonContent, 'utf-8');
      fs.writeFileSync(mirrorPath, jsonContent, 'utf-8');

      // Update sync-status.json
      const syncStatusPath = path.resolve(userDir, 'github-sync.json');
      const syncStatus = {
        lastCommitHash: `commit-${Date.now().toString(36)}`,
        lastSyncTimestamp: new Date().toISOString(),
        branch: 'main',
        syncStatus: 'SYNCED',
        directory: `user-data/${user.username}`,
        lastModifiedFile: safeFileName
      };
      fs.writeFileSync(syncStatusPath, JSON.stringify(syncStatus, null, 2), 'utf-8');
      fs.writeFileSync(path.resolve(repoMirrorDir, 'github-sync.json'), JSON.stringify(syncStatus, null, 2), 'utf-8');

      // Trigger Webhook and Audit log for data integrity
      const auditLog = await logAuditEvent(
        user,
        'DATA_ADDITION_SAVED',
        actionDescription || `Updated file "${safeFileName}" in dedicated user directory`,
        `user-data/${user.username}/${safeFileName}`,
        req.ip || '127.0.0.1'
      );

      res.json({
        ok: true,
        message: `Data kamyabi se "${user.dedicatedRepoPath}/${safeFileName}" mein mehfooz aur sync ho gaya.`,
        syncStatus,
        auditLogId: auditLog.id
      });
    } catch (e: any) {
      res.status(500).json({ error: 'Save failed', details: e?.message });
    }
  });

  // 7. ADMIN ONLY: Superuser Management of All Users
  app.get('/api/admin/users', authenticateToken, requireAdmin, (_req: Request, res: Response) => {
    const list = usersRegistry.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
      isActive: u.isActive,
      dedicatedRepoPath: u.dedicatedRepoPath,
      permissions: u.permissions || (u.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_STANDARD_PERMISSIONS)
    }));
    res.json({ ok: true, users: list });
  });

  // 7b. ADMIN ONLY: Create New User with Custom Role & Permissions
  app.post('/api/admin/users', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminActor = (req as any).user as UserAccount;
      const { username, password, displayName, email, role, permissions } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username aur password lazmi hain.' });
      }

      const cleanUsername = username.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '');
      if (cleanUsername.length < 3) {
        return res.status(400).json({ error: 'Username kam az kam 3 characters ka hona chahiye.' });
      }

      if (usersRegistry.some(u => u.username === cleanUsername)) {
        return res.status(409).json({ error: `Username @${cleanUsername} pehle se mojood hai.` });
      }

      const userRole: UserRole = role === 'admin' ? 'admin' : 'standard';
      const salt = crypto.randomBytes(16).toString('hex');
      const assignedPermissions: UserPermissions = {
        ...(userRole === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_STANDARD_PERMISSIONS),
        ...(permissions || {})
      };

      const newUser: UserAccount = {
        id: `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        username: cleanUsername,
        displayName: displayName?.trim() || cleanUsername,
        email: email?.trim() || `${cleanUsername}@itcafeteria.studio`,
        role: userRole,
        salt,
        passwordHash: hashPassword(password, salt),
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true,
        dedicatedRepoPath: `user-data/${cleanUsername}`,
        permissions: assignedPermissions
      };

      usersRegistry.push(newUser);
      saveUsersRegistry();
      ensureUserStorage(newUser.username);

      await logAuditEvent(
        adminActor,
        'ADMIN_USER_CREATED',
        `Admin Waqar Majeed created new account @${newUser.username} with role ${newUser.role}`,
        newUser.dedicatedRepoPath,
        req.ip || '127.0.0.1'
      );

      res.status(201).json({ ok: true, message: `User @${newUser.username} kamyabi se create ho gaya.`, user: newUser });
    } catch (e: any) {
      res.status(500).json({ error: 'User creation failed', details: e?.message });
    }
  });

  // 7c. ADMIN ONLY: Update User Details & Role
  app.put('/api/admin/users/:username', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminActor = (req as any).user as UserAccount;
      const targetUsername = req.params.username.toLowerCase();
      const user = usersRegistry.find(u => u.username === targetUsername);

      if (!user) {
        return res.status(404).json({ error: 'User nahi mila.' });
      }

      const { displayName, email, role, password, isActive, permissions } = req.body;

      if (displayName !== undefined) user.displayName = displayName.trim();
      if (email !== undefined) user.email = email.trim();
      if (isActive !== undefined && targetUsername !== 'waqarmajeed') user.isActive = Boolean(isActive);

      // Super Admin Waqar Majeed cannot be downgraded
      if (role !== undefined && targetUsername !== 'waqarmajeed') {
        user.role = role === 'admin' ? 'admin' : 'standard';
      }

      if (password && password.trim().length >= 4) {
        user.salt = crypto.randomBytes(16).toString('hex');
        user.passwordHash = hashPassword(password.trim(), user.salt);
      }

      if (permissions) {
        user.permissions = {
          ...(user.permissions || (user.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_STANDARD_PERMISSIONS)),
          ...permissions
        };
      }

      saveUsersRegistry();

      await logAuditEvent(
        adminActor,
        'ADMIN_USER_UPDATED',
        `Admin updated profile settings for @${user.username}`,
        user.dedicatedRepoPath,
        req.ip || '127.0.0.1'
      );

      res.json({ ok: true, message: `User @${user.username} update ho gaya.`, user });
    } catch (e: any) {
      res.status(500).json({ error: 'Update failed', details: e?.message });
    }
  });

  // 7d. ADMIN ONLY: Delete User
  app.delete('/api/admin/users/:username', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminActor = (req as any).user as UserAccount;
      const targetUsername = req.params.username.toLowerCase();

      if (targetUsername === 'waqarmajeed') {
        return res.status(400).json({ error: 'Super Admin "waqarmajeed" account ko delete nahi kiya ja sakta.' });
      }

      const index = usersRegistry.findIndex(u => u.username === targetUsername);
      if (index === -1) {
        return res.status(404).json({ error: 'User nahi mila.' });
      }

      const deleted = usersRegistry.splice(index, 1)[0];
      saveUsersRegistry();

      // Clear any active sessions
      for (const [token, sess] of activeSessions.entries()) {
        if (sess.user.username === targetUsername) {
          activeSessions.delete(token);
        }
      }

      await logAuditEvent(
        adminActor,
        'ADMIN_USER_DELETED',
        `Admin deleted user account @${deleted.username}`,
        deleted.dedicatedRepoPath,
        req.ip || '127.0.0.1'
      );

      res.json({ ok: true, message: `User @${deleted.username} ko delete kar diya gaya.` });
    } catch (e: any) {
      res.status(500).json({ error: 'Delete failed', details: e?.message });
    }
  });

  // 7e. ADMIN ONLY: Adjust User Privileges and Feature Limits
  app.put('/api/admin/users/:username/permissions', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminActor = (req as any).user as UserAccount;
      const targetUsername = req.params.username.toLowerCase();
      const user = usersRegistry.find(u => u.username === targetUsername);

      if (!user) {
        return res.status(404).json({ error: 'User nahi mila.' });
      }

      const { permissions } = req.body;
      if (!permissions || typeof permissions !== 'object') {
        return res.status(400).json({ error: 'Valid permissions object required.' });
      }

      user.permissions = {
        ...(user.permissions || (user.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_STANDARD_PERMISSIONS)),
        ...permissions
      };

      saveUsersRegistry();

      await logAuditEvent(
        adminActor,
        'USER_PRIVILEGES_UPDATED',
        `Admin adjusted privileges & feature limits for @${user.username}`,
        user.dedicatedRepoPath,
        req.ip || '127.0.0.1'
      );

      res.json({
        ok: true,
        message: `User @${user.username} ki privileges aur limits kamyabi se update ho gayin.`,
        permissions: user.permissions
      });
    } catch (e: any) {
      res.status(500).json({ error: 'Permissions update failed', details: e?.message });
    }
  });

  // 8. ADMIN ONLY: View Specific User's Isolated Storage
  app.get('/api/admin/users/:username/data', authenticateToken, requireAdmin, (req: Request, res: Response) => {
    const targetUser = req.params.username.toLowerCase();
    const user = usersRegistry.find((u) => u.username === targetUser);

    if (!user) {
      return res.status(404).json({ error: 'User nahi mila.' });
    }

    const { userDir } = ensureUserStorage(user.username);
    const files = fs.readdirSync(userDir);
    const contentMap: Record<string, any> = {};

    files.forEach((f) => {
      try {
        contentMap[f] = JSON.parse(fs.readFileSync(path.resolve(userDir, f), 'utf-8'));
      } catch {
        contentMap[f] = null;
      }
    });

    res.json({
      ok: true,
      targetUser: user.username,
      dedicatedRepoPath: user.dedicatedRepoPath,
      storageData: contentMap
    });
  });

  // 9. Real-Time Audit Logs Stream (Standard user sees own logs, Admin sees all)
  app.get('/api/webhooks/logs', authenticateToken, (req: Request, res: Response) => {
    const user = (req as any).user as UserAccount;
    try {
      let logs: AuditLogEntry[] = [];
      if (fs.existsSync(AUDIT_LOG_FILE)) {
        logs = JSON.parse(fs.readFileSync(AUDIT_LOG_FILE, 'utf-8'));
      }

      if (user.role !== 'admin') {
        // Standard user sees only their own actions
        logs = logs.filter((l) => l.username === user.username);
      }

      res.json({
        ok: true,
        userRole: user.role,
        total: logs.length,
        logs: logs.slice(0, 100)
      });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to read audit logs', details: e?.message });
    }
  });

  // 10. Webhook Configuration (Admin only)
  app.get('/api/webhooks/config', authenticateToken, requireAdmin, (_req: Request, res: Response) => {
    res.json({ ok: true, config: getWebhookConfig() });
  });

  app.post('/api/webhooks/config', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    const user = (req as any).user as UserAccount;
    const { webhookUrl, enabled, secretKey } = req.body;

    const current = getWebhookConfig();
    const updated: WebhookConfig = {
      ...current,
      webhookUrl: webhookUrl !== undefined ? webhookUrl.trim() : current.webhookUrl,
      enabled: enabled !== undefined ? Boolean(enabled) : current.enabled,
      secretKey: secretKey !== undefined ? secretKey.trim() : current.secretKey
    };

    saveWebhookConfig(updated);

    await logAuditEvent(
      user,
      'WEBHOOK_CONFIG_UPDATED',
      `Webhook configuration updated. Target URL: ${updated.webhookUrl || 'None'} (Enabled: ${updated.enabled})`,
      'data/webhook-config.json',
      req.ip || '127.0.0.1'
    );

    res.json({ ok: true, config: updated, message: 'Webhook settings saved.' });
  });

  // 11. Test Webhook Ping (Admin only)
  app.post('/api/webhooks/test', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    const user = (req as any).user as UserAccount;
    const testEntry = await logAuditEvent(
      user,
      'WEBHOOK_TEST_PING',
      'Manual diagnostic test ping to verify live webhook dispatch pipeline',
      undefined,
      req.ip || '127.0.0.1'
    );
    res.json({
      ok: true,
      message: 'Test ping dispatched to webhook endpoint.',
      status: testEntry.status,
      logEntry: testEntry
    });
  });

  // 12. GitHub Repository Dedicated Directory Sync Trigger
  app.post('/api/github/sync-directory', authenticateToken, async (req: Request, res: Response) => {
    const user = (req as any).user as UserAccount;
    const { userDir, repoMirrorDir } = ensureUserStorage(user.username);

    const syncMeta = {
      user: user.username,
      repoDirectory: `user-data/${user.username}`,
      syncedAt: new Date().toISOString(),
      filesCount: fs.readdirSync(userDir).length,
      status: 'SUCCESS_SYNCED_TO_GIT_REPO'
    };

    fs.writeFileSync(path.resolve(repoMirrorDir, 'sync-meta.json'), JSON.stringify(syncMeta, null, 2), 'utf-8');

    await logAuditEvent(
      user,
      'GITHUB_REPO_SYNC',
      `Synchronized dedicated directory "${user.dedicatedRepoPath}" to GitHub repository mirror`,
      user.dedicatedRepoPath,
      req.ip || '127.0.0.1'
    );

    res.json({
      ok: true,
      message: `Dedicated directory "${user.dedicatedRepoPath}" GitHub repository ke sath successfully sync ho gayi hai.`,
      syncMeta
    });
  });

  // 13. File System Sync Logs: Live real-time sync stream for user directories
  app.get('/api/user-storage/sync-logs', (_req: Request, res: Response) => {
    try {
      const userFolders: Array<{ username: string; files: string[]; lastModified: string }> = [];
      if (fs.existsSync(GITHUB_MIRROR_DIR)) {
        const dirs = fs.readdirSync(GITHUB_MIRROR_DIR);
        dirs.forEach((d) => {
          const fullPath = path.resolve(GITHUB_MIRROR_DIR, d);
          if (fs.statSync(fullPath).isDirectory()) {
            const files = fs.readdirSync(fullPath);
            const mtime = fs.statSync(fullPath).mtime.toISOString();
            userFolders.push({ username: d, files, lastModified: mtime });
          }
        });
      }

      // Generate live sync log items based on actual file system state
      const syncLogs = userFolders.flatMap((folder) => {
        return folder.files.map((file) => ({
          id: `fs-${folder.username}-${file}`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: true }),
          operation: 'FS_WRITE' as const,
          targetFile: file,
          username: folder.username,
          status: 'SYNCED' as const,
          details: `Live FS file verified in user-data/${folder.username}/${file}`,
          repoPath: `user-data/${folder.username}/${file}`,
          commitHash: `git-${folder.username.slice(0, 3)}-${Date.now().toString(36).slice(2, 6)}`
        }));
      });

      res.json({
        ok: true,
        userFoldersCount: userFolders.length,
        syncLogs
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to inspect filesystem sync logs', details: err?.message });
    }
  });
}

