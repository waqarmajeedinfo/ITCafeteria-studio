/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria — Cross-Device Live Sync & GitHub Repo Sync Client
 */

export interface GitHubSyncStatusInfo {
  repo: string;
  branch: string;
  remoteConfigured: boolean;
  liveCrossDeviceActive: boolean;
  stateVersion?: number;
  stateUpdatedAt?: string | null;
  lastSyncedAt: string | null;
  lastCommitSha: string | null;
  lastSyncError: string | null;
  pendingFiles?: number;
  recentCommits?: Array<{
    sha: string;
    message: string;
    timestamp: string;
    filesCount: number;
    url?: string;
  }>;
}

export interface StudioRemoteState {
  version: number;
  updatedAt: string;
  lastSyncedAt?: string | null;
  lastCommitSha?: string | null;
  lastSyncReason?: string | null;
  menuConfig?: any;
  themeConfig?: any;
  banner?: {
    url?: string;
    overlayStyle?: string;
    height?: string;
  };
  pendingQueue?: any[];
  publishedLibrary?: any[];
  profileLibraries?: Record<string, any[]>;
  channels?: Record<string, any>;
  latestStory?: any;
  scriptRotationState?: any;
  agentGeneratedData?: {
    stories?: any[];
    competitorScan?: any;
    lastGeneratedAt?: string;
  };
}

export const STUDIO_SYNC_UPDATED_EVENT = 'itcafeteria_studio_state_synced';
export const GITHUB_SYNC_STATUS_EVENT = 'itcafeteria_github_sync_status';
const SYNC_UPDATED_AT_KEY = 'itc_studio_sync_updated_at';
const SYNC_VERSION_KEY = 'itc_studio_sync_version';

let hydratingFromRemote = false;
let pendingPatchBuffer: Record<string, any> = {};
let pendingReason = 'studio_update';
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let lastSyncStatus: GitHubSyncStatusInfo | null = null;

export function isHydratingRemoteState(): boolean {
  return hydratingFromRemote;
}

export function getCachedSyncStatus(): GitHubSyncStatusInfo | null {
  return lastSyncStatus;
}

function updateCachedStatus(status: GitHubSyncStatusInfo | null) {
  if (!status) return;
  lastSyncStatus = status;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(GITHUB_SYNC_STATUS_EVENT, { detail: status }));
  }
}

export function applyRemoteStudioState(remote: StudioRemoteState): boolean {
  if (typeof window === 'undefined' || !remote || typeof remote !== 'object') return false;

  const localUpdatedAt = localStorage.getItem(SYNC_UPDATED_AT_KEY);
  const localVersion = Number(localStorage.getItem(SYNC_VERSION_KEY) || '0');
  const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
  const localTime = localUpdatedAt ? new Date(localUpdatedAt).getTime() : 0;

  if (localUpdatedAt && remoteTime <= localTime && Number(remote.version || 0) <= localVersion) {
    return false;
  }

  hydratingFromRemote = true;
  let appliedAny = false;

  try {
    if (remote.menuConfig && Array.isArray(remote.menuConfig.groups) && Array.isArray(remote.menuConfig.items)) {
      localStorage.setItem('itcafeteria_menu_customizer_config', JSON.stringify(remote.menuConfig));
      window.dispatchEvent(new CustomEvent('itcafeteria_menu_customizer_updated', { detail: remote.menuConfig }));
      appliedAny = true;
    }

    if (remote.themeConfig && typeof remote.themeConfig === 'object') {
      localStorage.setItem('itc_studio_theme_config', JSON.stringify(remote.themeConfig));
      if (remote.themeConfig.holoTheme) localStorage.setItem('itc_holo_theme', String(remote.themeConfig.holoTheme));
      if (remote.themeConfig.holoOpacity !== undefined) localStorage.setItem('itc_holo_opacity', String(remote.themeConfig.holoOpacity));
      if (remote.themeConfig.holoSpeed !== undefined) localStorage.setItem('itc_holo_speed', String(remote.themeConfig.holoSpeed));
      appliedAny = true;
    }

    if (remote.banner && typeof remote.banner === 'object') {
      if (remote.banner.url) localStorage.setItem('itc_custom_banner', remote.banner.url);
      if (remote.banner.overlayStyle) localStorage.setItem('itc_banner_overlay', remote.banner.overlayStyle);
      if (remote.banner.height) localStorage.setItem('itc_banner_height', remote.banner.height);
      appliedAny = true;
    }

    if (Array.isArray(remote.pendingQueue)) {
      localStorage.setItem('itcafeteria_pending_queue_v2', JSON.stringify(remote.pendingQueue));
      window.dispatchEvent(new CustomEvent('itcafeteria_pending_queue_updated', { detail: remote.pendingQueue }));
      appliedAny = true;
    }

    if (Array.isArray(remote.publishedLibrary)) {
      localStorage.setItem('itcafeteria_published_library_v1', JSON.stringify(remote.publishedLibrary));
      window.dispatchEvent(new CustomEvent('itcafeteria_published_library_updated', { detail: remote.publishedLibrary }));
      appliedAny = true;
    }

    if (remote.profileLibraries && typeof remote.profileLibraries === 'object') {
      for (const [channelId, stories] of Object.entries(remote.profileLibraries)) {
        if (Array.isArray(stories)) {
          localStorage.setItem(`itcafeteria_profile_library_${channelId}`, JSON.stringify(stories));
          window.dispatchEvent(new CustomEvent('itcafeteria_profile_library_updated', { detail: { channelId, stories } }));
        }
      }
      appliedAny = true;
    }

    if (remote.channels && typeof remote.channels === 'object' && Object.keys(remote.channels).length > 0) {
      localStorage.setItem('itcafeteria_channels_store_v2', JSON.stringify(remote.channels));
      window.dispatchEvent(new CustomEvent('itcafeteria_channels_updated', { detail: remote.channels }));
      appliedAny = true;
    }

    if (remote.latestStory && typeof remote.latestStory === 'object') {
      localStorage.setItem('itcafeteria_latest_story', JSON.stringify(remote.latestStory));
      appliedAny = true;
    }

    if (remote.scriptRotationState && typeof remote.scriptRotationState === 'object') {
      localStorage.setItem('itcafeteria_script_pattern_rotation_v1', JSON.stringify(remote.scriptRotationState));
      appliedAny = true;
    }

    if (remote.updatedAt) localStorage.setItem(SYNC_UPDATED_AT_KEY, remote.updatedAt);
    if (remote.version) localStorage.setItem(SYNC_VERSION_KEY, String(remote.version));

    window.dispatchEvent(new CustomEvent(STUDIO_SYNC_UPDATED_EVENT, { detail: remote }));
  } catch (err) {
    console.warn('[StudioSync] Apply remote state error:', err);
  } finally {
    hydratingFromRemote = false;
  }

  return appliedAny;
}

export async function fetchRemoteStudioState(pullFromGitHub: boolean = false): Promise<StudioRemoteState | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(`/api/studio-state${pullFromGitHub ? '?pull=1' : ''}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.syncStatus) updateCachedStatus(data.syncStatus);
    if (data?.state) {
      applyRemoteStudioState(data.state);
      return data.state;
    }
  } catch (err) {
    console.warn('[StudioSync] Fetch error:', err);
  }
  return null;
}

export function pushStudioStatePatch(
  patch: Partial<StudioRemoteState>,
  reason: string = 'studio_update'
): void {
  if (typeof window === 'undefined' || hydratingFromRemote) return;

  pendingPatchBuffer = {
    ...pendingPatchBuffer,
    ...patch,
    ...(patch.banner
      ? { banner: { ...(pendingPatchBuffer.banner || {}), ...patch.banner } }
      : {}),
    ...(patch.profileLibraries
      ? { profileLibraries: { ...(pendingPatchBuffer.profileLibraries || {}), ...patch.profileLibraries } }
      : {}),
  };
  pendingReason = reason;

  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    const payloadPatch = pendingPatchBuffer;
    const payloadReason = pendingReason;
    pendingPatchBuffer = {};
    pushTimer = null;

    try {
      const res = await fetch('/api/studio-state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patch: payloadPatch, reason: payloadReason }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.state?.updatedAt) localStorage.setItem(SYNC_UPDATED_AT_KEY, data.state.updatedAt);
      if (data?.state?.version) localStorage.setItem(SYNC_VERSION_KEY, String(data.state.version));
      if (data?.syncStatus) updateCachedStatus(data.syncStatus);
    } catch (err) {
      console.warn('[StudioSync] Push patch warning:', err);
    }
  }, 250);
}

export async function getGitHubSyncStatus(): Promise<GitHubSyncStatusInfo | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/github/status');
    if (!res.ok) return null;
    const data = await res.json();
    updateCachedStatus(data);
    return data;
  } catch {
    return null;
  }
}

export async function triggerGitHubSyncNow(reason: string = 'Manual Studio & Agent Sync') {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/github/sync-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (data?.syncStatus) updateCachedStatus(data.syncStatus);
    return data;
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Sync request failed' };
  }
}
