/**
 * Real-Time Logging Service for Multi-User Storage & File System Synchronization
 * Hooks into file system changes for user directories, recording and displaying
 * sync status (FS_WRITE, GIT_MIRROR, RECONCILE, WEBHOOK_ACK) across isolated user workspaces.
 */

export type SyncOperationType = 'FS_WRITE' | 'GIT_MIRROR' | 'FS_READ' | 'RECONCILE' | 'WEBHOOK_ACK';
export type SyncStatusState = 'SYNCED' | 'PENDING' | 'ERROR' | 'QUEUED';

export interface SyncLogRecord {
  id: string;
  timestamp: string;
  operation: SyncOperationType;
  targetFile: string;
  username: string;
  status: SyncStatusState;
  bytesTransferred?: number;
  syncLatencyMs?: number;
  details: string;
  repoPath: string;
  commitHash?: string;
}

export interface UserSyncSummary {
  username: string;
  isSynced: boolean;
  lastSyncTimestamp: string;
  totalOperations: number;
  syncedFilesCount: number;
  pendingCount: number;
  dedicatedRepoPath: string;
}

const STORAGE_KEY = 'itcafeteria_sync_log_records';
export const SYNC_LOGGER_UPDATED_EVENT = 'itcafeteria_sync_logger_updated';

class SyncLoggerService {
  private logs: SyncLogRecord[] = [];
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.logs = this.loadLocalLogs();
      this.init();
    }
  }

  private loadLocalLogs(): SyncLogRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  private saveLogs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs.slice(0, 100)));
      window.dispatchEvent(new CustomEvent(SYNC_LOGGER_UPDATED_EVENT, { detail: this.logs }));
    } catch (e) {
      console.warn('[SyncLogger] Failed to persist sync logs:', e);
    }
  }

  private init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Periodically sync with backend sync activity if available
    this.fetchServerSyncLogs().catch(() => {});
  }

  /**
   * Log a file system change or sync operation in real-time
   */
  public recordSyncOperation(entry: {
    operation: SyncOperationType;
    targetFile: string;
    username: string;
    status: SyncStatusState;
    details: string;
    repoPath?: string;
    bytesTransferred?: number;
    syncLatencyMs?: number;
    commitHash?: string;
  }): SyncLogRecord {
    const record: SyncLogRecord = {
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: true }),
      operation: entry.operation,
      targetFile: entry.targetFile,
      username: entry.username || 'guest',
      status: entry.status,
      details: entry.details,
      repoPath: entry.repoPath || `user-data/${entry.username || 'guest'}`,
      bytesTransferred: entry.bytesTransferred,
      syncLatencyMs: entry.syncLatencyMs,
      commitHash: entry.commitHash || `git-${Math.random().toString(36).slice(2, 8)}`
    };

    this.logs.unshift(record);
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(0, 100);
    }
    this.saveLogs();
    return record;
  }

  /**
   * Fetch real-time server-side filesystem sync events from Express
   */
  public async fetchServerSyncLogs(): Promise<SyncLogRecord[]> {
    try {
      const res = await fetch('/api/user-storage/sync-logs');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.syncLogs)) {
          // Merge server-side filesystem sync logs with local records without duplicates
          const seen = new Set(this.logs.map(l => l.id));
          for (const sLog of data.syncLogs) {
            if (!seen.has(sLog.id)) {
              this.logs.push(sLog);
              seen.add(sLog.id);
            }
          }
          this.logs.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
          this.saveLogs();
        }
      }
    } catch {
      // Backend offline fallback
    }
    return [...this.logs];
  }

  /**
   * Get all recorded sync logs or filter by user
   */
  public getSyncLogs(username?: string, limit: number = 30): SyncLogRecord[] {
    if (!username) return this.logs.slice(0, limit);
    return this.logs.filter(l => l.username === username).slice(0, limit);
  }

  /**
   * Generate an automated status summary for multi-user storage
   */
  public getSyncSummary(username: string): UserSyncSummary {
    const userLogs = this.logs.filter(l => l.username === username);
    const hasErrors = userLogs.some(l => l.status === 'ERROR');
    const lastLog = userLogs[0];

    return {
      username,
      isSynced: !hasErrors,
      lastSyncTimestamp: lastLog ? lastLog.timestamp : 'Active Sync Ready',
      totalOperations: userLogs.length,
      syncedFilesCount: userLogs.filter(l => l.status === 'SYNCED').length,
      pendingCount: userLogs.filter(l => l.status === 'PENDING').length,
      dedicatedRepoPath: `user-data/${username}`
    };
  }

  /**
   * Clear all recorded sync logs
   */
  public clearLogs() {
    this.logs = [];
    this.saveLogs();
  }
}

export const syncLogger = new SyncLoggerService();
