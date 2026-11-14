import fs from 'fs';
import path from 'path';
import type { Express, Request, Response } from 'express';

export interface StudioSharedState {
  version: number;
  updatedAt: string;
  lastSyncedAt: string | null;
  lastCommitSha: string | null;
  lastSyncReason: string | null;
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

export interface GitHubSyncFileTarget {
  localPath: string;
  repoPath: string;
}

interface GitHubCommitLog {
  sha: string;
  message: string;
  timestamp: string;
  filesCount: number;
  url?: string;
}

interface GitHubSyncMeta {
  repo: string;
  branch: string;
  lastSyncedAt: string | null;
  lastCommitSha: string | null;
  lastSyncError: string | null;
  recentCommits: GitHubCommitLog[];
}

const STUDIO_STATE_FILE = path.resolve(process.cwd(), 'data', 'studio', 'studio-state.json');
const GITHUB_SYNC_META_FILE = path.resolve(process.cwd(), 'data', 'studio', 'github-sync-meta.json');
const GITHUB_REPO_MIRROR_ROOT = path.resolve(process.cwd(), 'data', 'github-repo-mirror');

function getGitHubConfig() {
  const token = (process.env.GITHUB_TOKEN || '').trim();
  const repo = (process.env.GITHUB_REPO || 'waqarmajeedinfo/ITCafeteria-studio').trim();
  const branch = (process.env.GITHUB_BRANCH || 'main').trim() || 'main';
  return {
    token,
    repo,
    branch,
    remoteConfigured: Boolean(token && repo.includes('/')),
  };
}

function ensureDirForFile(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadStudioState(): StudioSharedState {
  try {
    if (fs.existsSync(STUDIO_STATE_FILE)) {
      const raw = fs.readFileSync(STUDIO_STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          version: Number(parsed.version) || 1,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
          lastSyncedAt: parsed.lastSyncedAt || null,
          lastCommitSha: parsed.lastCommitSha || null,
          lastSyncReason: parsed.lastSyncReason || null,
          ...parsed,
        };
      }
    }
  } catch (err) {
    console.error('[GitHubSync] Error reading studio state:', err);
  }

  const initial: StudioSharedState = {
    version: 1,
    updatedAt: new Date().toISOString(),
    lastSyncedAt: null,
    lastCommitSha: null,
    lastSyncReason: 'initial_bootstrap',
  };
  saveStudioState(initial);
  return initial;
}

export function saveStudioState(state: StudioSharedState) {
  try {
    ensureDirForFile(STUDIO_STATE_FILE);
    fs.writeFileSync(STUDIO_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');

    const mirrorFile = path.resolve(GITHUB_REPO_MIRROR_ROOT, 'data/studio/studio-state.json');
    ensureDirForFile(mirrorFile);
    fs.writeFileSync(mirrorFile, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('[GitHubSync] Error writing studio state:', err);
  }
}

export function mergeStudioStatePatch(
  patch: Partial<StudioSharedState>,
  reason: string = 'studio_update'
): StudioSharedState {
  const current = loadStudioState();
  const next: StudioSharedState = {
    ...current,
    ...patch,
    banner: patch.banner
      ? { ...(current.banner || {}), ...patch.banner }
      : current.banner,
    profileLibraries: patch.profileLibraries
      ? { ...(current.profileLibraries || {}), ...patch.profileLibraries }
      : current.profileLibraries,
    agentGeneratedData: patch.agentGeneratedData
      ? { ...(current.agentGeneratedData || {}), ...patch.agentGeneratedData }
      : current.agentGeneratedData,
    version: (Number(current.version) || 1) + 1,
    updatedAt: new Date().toISOString(),
    lastSyncReason: reason,
  };
  saveStudioState(next);
  return next;
}

function loadSyncMeta(): GitHubSyncMeta {
  const cfg = getGitHubConfig();
  try {
    if (fs.existsSync(GITHUB_SYNC_META_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(GITHUB_SYNC_META_FILE, 'utf-8'));
      if (parsed && typeof parsed === 'object') {
        return {
          repo: cfg.repo,
          branch: cfg.branch,
          lastSyncedAt: parsed.lastSyncedAt || null,
          lastCommitSha: parsed.lastCommitSha || null,
          lastSyncError: parsed.lastSyncError || null,
          recentCommits: Array.isArray(parsed.recentCommits) ? parsed.recentCommits : [],
        };
      }
    }
  } catch {}
  return {
    repo: cfg.repo,
    branch: cfg.branch,
    lastSyncedAt: null,
    lastCommitSha: null,
    lastSyncError: null,
    recentCommits: [],
  };
}

function saveSyncMeta(meta: GitHubSyncMeta) {
  try {
    ensureDirForFile(GITHUB_SYNC_META_FILE);
    fs.writeFileSync(GITHUB_SYNC_META_FILE, JSON.stringify(meta, null, 2), 'utf-8');
  } catch (err) {
    console.error('[GitHubSync] Meta save error:', err);
  }
}

function normalizeTarget(input: string | GitHubSyncFileTarget): GitHubSyncFileTarget {
  if (typeof input === 'string') {
    const cleanRel = input.replace(/^\/+/, '');
    return {
      localPath: path.resolve(process.cwd(), cleanRel),
      repoPath: cleanRel,
    };
  }
  return {
    localPath: path.isAbsolute(input.localPath)
      ? input.localPath
      : path.resolve(process.cwd(), input.localPath),
    repoPath: input.repoPath.replace(/^\/+/, ''),
  };
}

function mirrorTargetsToLocalRepoMirror(targets: GitHubSyncFileTarget[]) {
  for (const t of targets) {
    try {
      if (fs.existsSync(t.localPath)) {
        const dest = path.resolve(GITHUB_REPO_MIRROR_ROOT, t.repoPath);
        ensureDirForFile(dest);
        fs.copyFileSync(t.localPath, dest);
      }
    } catch (err) {
      console.warn(`[GitHubSync] Mirror copy skipped for ${t.repoPath}:`, err);
    }
  }
}

async function githubApiFetch(url: string, token: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ITCafeteria-Studio-Sync/1.0',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {}),
    },
  });
  return res;
}

async function commitTargetsToGitHub(
  targets: GitHubSyncFileTarget[],
  commitMessage: string
): Promise<{ committed: boolean; sha?: string; url?: string; error?: string; filesCount: number }> {
  const cfg = getGitHubConfig();
  mirrorTargetsToLocalRepoMirror(targets);

  const validFiles: Array<{ repoPath: string; content: string }> = [];
  const seen = new Set<string>();
  for (const t of targets) {
    if (seen.has(t.repoPath)) continue;
    seen.add(t.repoPath);
    if (fs.existsSync(t.localPath) && fs.statSync(t.localPath).isFile()) {
      try {
        const content = fs.readFileSync(t.localPath, 'utf-8');
        validFiles.push({ repoPath: t.repoPath, content });
      } catch {}
    }
  }

  if (validFiles.length === 0) {
    return { committed: false, error: 'No valid local files found to sync.', filesCount: 0 };
  }

  if (!cfg.remoteConfigured) {
    return {
      committed: false,
      error: 'GITHUB_TOKEN environment variable not configured (local mirror & live server state updated).',
      filesCount: validFiles.length,
    };
  }

  const [owner, repoName] = cfg.repo.split('/');
  const apiBase = `https://api.github.com/repos/${owner}/${repoName}`;

  const attemptCommit = async (): Promise<{ sha: string; url?: string }> => {
    const refRes = await githubApiFetch(`${apiBase}/git/ref/heads/${encodeURIComponent(cfg.branch)}`, cfg.token);
    if (!refRes.ok) {
      const txt = await refRes.text();
      throw new Error(`GitHub ref lookup failed (${refRes.status}): ${txt.slice(0, 180)}`);
    }
    const refJson: any = await refRes.json();
    const headSha = refJson?.object?.sha;
    if (!headSha) throw new Error('Missing GitHub branch head SHA');

    const commitRes = await githubApiFetch(`${apiBase}/git/commits/${headSha}`, cfg.token);
    if (!commitRes.ok) {
      const txt = await commitRes.text();
      throw new Error(`GitHub commit lookup failed (${commitRes.status}): ${txt.slice(0, 180)}`);
    }
    const commitJson: any = await commitRes.json();
    const baseTreeSha = commitJson?.tree?.sha;
    if (!baseTreeSha) throw new Error('Missing GitHub base tree SHA');

    const treeRes = await githubApiFetch(`${apiBase}/git/trees`, cfg.token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: validFiles.map((f) => ({
          path: f.repoPath,
          mode: '100644',
          type: 'blob',
          content: f.content,
        })),
      }),
    });
    if (!treeRes.ok) {
      const txt = await treeRes.text();
      throw new Error(`GitHub tree create failed (${treeRes.status}): ${txt.slice(0, 180)}`);
    }
    const treeJson: any = await treeRes.json();

    const newCommitRes = await githubApiFetch(`${apiBase}/git/commits`, cfg.token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: commitMessage,
        tree: treeJson.sha,
        parents: [headSha],
      }),
    });
    if (!newCommitRes.ok) {
      const txt = await newCommitRes.text();
      throw new Error(`GitHub commit create failed (${newCommitRes.status}): ${txt.slice(0, 180)}`);
    }
    const newCommitJson: any = await newCommitRes.json();

    const patchRes = await githubApiFetch(`${apiBase}/git/refs/heads/${encodeURIComponent(cfg.branch)}`, cfg.token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sha: newCommitJson.sha,
        force: false,
      }),
    });
    if (!patchRes.ok) {
      const txt = await patchRes.text();
      throw new Error(`GitHub ref update failed (${patchRes.status}): ${txt.slice(0, 180)}`);
    }

    return {
      sha: newCommitJson.sha,
      url: newCommitJson.html_url || `https://github.com/${cfg.repo}/commit/${newCommitJson.sha}`,
    };
  };

  try {
    let result: { sha: string; url?: string };
    try {
      result = await attemptCommit();
    } catch (firstErr: any) {
      if (/409|422/.test(String(firstErr?.message || ''))) {
        result = await attemptCommit();
      } else {
        throw firstErr;
      }
    }

    const now = new Date().toISOString();
    const meta = loadSyncMeta();
    meta.lastSyncedAt = now;
    meta.lastCommitSha = result.sha;
    meta.lastSyncError = null;
    meta.recentCommits = [
      {
        sha: result.sha,
        message: commitMessage,
        timestamp: now,
        filesCount: validFiles.length,
        url: result.url,
      },
      ...meta.recentCommits,
    ].slice(0, 20);
    saveSyncMeta(meta);

    const state = loadStudioState();
    state.lastSyncedAt = now;
    state.lastCommitSha = result.sha;
    saveStudioState(state);

    return { committed: true, sha: result.sha, url: result.url, filesCount: validFiles.length };
  } catch (err: any) {
    const errMsg = err?.message || 'GitHub push error';
    const meta = loadSyncMeta();
    meta.lastSyncError = errMsg;
    saveSyncMeta(meta);
    return { committed: false, error: errMsg, filesCount: validFiles.length };
  }
}

// Serialized batch queue for background GitHub commits
const pendingTargetMap = new Map<string, GitHubSyncFileTarget>();
const pendingMessages: string[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let syncChain: Promise<void> = Promise.resolve();

export function scheduleGitHubSync(
  targets: Array<string | GitHubSyncFileTarget>,
  commitMessage: string = 'chore(studio): sync studio state and agent data'
) {
  const normalized = targets.map(normalizeTarget);
  mirrorTargetsToLocalRepoMirror(normalized);

  for (const t of normalized) {
    pendingTargetMap.set(t.repoPath, t);
  }
  if (commitMessage && !pendingMessages.includes(commitMessage)) {
    pendingMessages.push(commitMessage);
  }

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const batchTargets = Array.from(pendingTargetMap.values());
    const msg = pendingMessages.length === 1
      ? pendingMessages[0]
      : `chore(studio): batch sync (${batchTargets.length} files)`;
    pendingTargetMap.clear();
    pendingMessages.length = 0;
    debounceTimer = null;

    syncChain = syncChain
      .then(async () => {
        await commitTargetsToGitHub(batchTargets, msg);
      })
      .catch((err) => {
        console.error('[GitHubSync] Background batch error:', err);
      });
  }, 450);
}

export function collectAllSyncableFiles(): GitHubSyncFileTarget[] {
  const candidates: Array<string | GitHubSyncFileTarget> = [
    'data/studio/studio-state.json',
    'data/agent/agent-registry.json',
    'data/agent/companion-memory.json',
    'data/agent/competitor-intelligence.json',
    'data/agent/phonetic-dictionary.json',
    'data/users/users-registry.json',
  ];

  const userStorageRoot = path.resolve(process.cwd(), 'data', 'user-storage');
  if (fs.existsSync(userStorageRoot)) {
    try {
      for (const username of fs.readdirSync(userStorageRoot)) {
        const userDir = path.resolve(userStorageRoot, username);
        if (fs.statSync(userDir).isDirectory()) {
          for (const file of fs.readdirSync(userDir)) {
            const full = path.resolve(userDir, file);
            if (fs.statSync(full).isFile() && file.endsWith('.json')) {
              candidates.push({
                localPath: full,
                repoPath: `user-data/${username}/${file}`,
              });
            }
          }
        }
      }
    } catch {}
  }

  return candidates
    .map(normalizeTarget)
    .filter((t) => fs.existsSync(t.localPath) && fs.statSync(t.localPath).isFile());
}

export async function pullStudioStateFromGitHub(): Promise<{
  pulled: boolean;
  updatedLocal: boolean;
  state: StudioSharedState;
  error?: string;
}> {
  const localState = loadStudioState();
  const cfg = getGitHubConfig();
  if (!cfg.remoteConfigured) {
    return {
      pulled: false,
      updatedLocal: false,
      state: localState,
      error: 'GITHUB_TOKEN not configured; serving live server studio-state.',
    };
  }

  try {
    const [owner, repoName] = cfg.repo.split('/');
    const url = `https://api.github.com/repos/${owner}/${repoName}/contents/data/studio/studio-state.json?ref=${encodeURIComponent(cfg.branch)}`;
    const res = await githubApiFetch(url, cfg.token, {
      headers: { Accept: 'application/vnd.github.raw+json' },
    });
    if (!res.ok) {
      return {
        pulled: false,
        updatedLocal: false,
        state: localState,
        error: `GitHub pull returned HTTP ${res.status}`,
      };
    }
    const remoteState = (await res.json()) as StudioSharedState;
    if (
      remoteState &&
      remoteState.updatedAt &&
      new Date(remoteState.updatedAt).getTime() > new Date(localState.updatedAt || 0).getTime()
    ) {
      saveStudioState(remoteState);
      return { pulled: true, updatedLocal: true, state: remoteState };
    }
    return { pulled: true, updatedLocal: false, state: localState };
  } catch (err: any) {
    return {
      pulled: false,
      updatedLocal: false,
      state: localState,
      error: err?.message || 'Pull failed',
    };
  }
}

export function getPublicSyncStatus() {
  const cfg = getGitHubConfig();
  const meta = loadSyncMeta();
  const state = loadStudioState();
  return {
    repo: cfg.repo,
    branch: cfg.branch,
    remoteConfigured: cfg.remoteConfigured,
    liveCrossDeviceActive: true,
    stateVersion: state.version,
    stateUpdatedAt: state.updatedAt,
    lastSyncedAt: meta.lastSyncedAt || state.lastSyncedAt,
    lastCommitSha: meta.lastCommitSha || state.lastCommitSha,
    lastSyncError: meta.lastSyncError,
    pendingFiles: pendingTargetMap.size,
    recentCommits: meta.recentCommits.slice(0, 8),
  };
}

export function registerGitHubSyncRoutes(app: Express) {
  // 1. Live Cross-Device Shared Studio State GET
  app.get('/api/studio-state', async (req: Request, res: Response) => {
    try {
      if (req.query.pull === '1') {
        await pullStudioStateFromGitHub();
      }
      const state = loadStudioState();
      res.json({
        ok: true,
        state,
        syncStatus: getPublicSyncStatus(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to read studio state' });
    }
  });

  // 2. Live Cross-Device Shared Studio State PUT/POST + Auto GitHub Sync
  const handleStateUpdate = (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const patch = body.patch && typeof body.patch === 'object' ? body.patch : body;
      const reason = typeof body.reason === 'string' ? body.reason : 'ui_state_updated';

      const cleanPatch: Partial<StudioSharedState> = {};
      const allowedKeys: Array<keyof StudioSharedState> = [
        'menuConfig',
        'themeConfig',
        'banner',
        'pendingQueue',
        'publishedLibrary',
        'profileLibraries',
        'channels',
        'latestStory',
        'agentGeneratedData',
      ];
      for (const k of allowedKeys) {
        if (patch[k] !== undefined) {
          (cleanPatch as any)[k] = patch[k];
        }
      }

      const updated = mergeStudioStatePatch(cleanPatch, reason);
      scheduleGitHubSync(
        ['data/studio/studio-state.json'],
        `chore(studio): sync ${reason}`
      );

      res.json({
        ok: true,
        state: updated,
        syncStatus: getPublicSyncStatus(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to update studio state' });
    }
  };

  app.put('/api/studio-state', handleStateUpdate);
  app.post('/api/studio-state', handleStateUpdate);

  // 3. GitHub Repository Sync Status
  app.get('/api/github/status', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      ...getPublicSyncStatus(),
    });
  });

  // 4. Immediate Full Sync to GitHub Repository
  app.post('/api/github/sync-now', async (req: Request, res: Response) => {
    try {
      const reason = String(req.body?.reason || 'Manual Studio & Agent Full Sync');
      const targets = collectAllSyncableFiles();
      const result = await commitTargetsToGitHub(
        targets,
        `chore(studio): ${reason} (${targets.length} files)`
      );
      res.json({
        ok: true,
        ...result,
        syncStatus: getPublicSyncStatus(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'GitHub sync-now failed' });
    }
  });

  // 5. Pull Latest Studio State from GitHub Repository
  app.post('/api/github/pull-state', async (_req: Request, res: Response) => {
    try {
      const result = await pullStudioStateFromGitHub();
      res.json({
        ok: true,
        ...result,
        syncStatus: getPublicSyncStatus(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'GitHub pull failed' });
    }
  });
}
