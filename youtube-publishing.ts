import { createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Express, Request, Response } from 'express';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_COOKIE = 'itc_live_yt';
const STATE_COOKIE = 'itc_oauth_state_youtube';
const UPLOAD_SCOPE = 'https://www.googleapis.com/auth/youtube.upload';
const COOKIE_MAX_AGE = 10 * 60 * 1000;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
const QUEUE_DIR = path.resolve(process.cwd(), 'data', 'youtube-publishing');
const QUEUE_FILE = path.join(QUEUE_DIR, 'queue.json');

type QueueStatus = 'pending_approval' | 'uploading' | 'scheduled' | 'failed' | 'cancelled';
interface QueueItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  scheduledAt: string;
  status: QueueStatus;
  createdAt: string;
  updatedAt: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  error?: string;
}
interface StoredToken {
  provider: string;
  accessToken: string;
  expiresAt: number;
  scope?: string;
}

async function readQueue(): Promise<QueueItem[]> {
  try {
    const parsed = JSON.parse(await fs.readFile(QUEUE_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeQueue(items: QueueItem[]): Promise<void> {
  await fs.mkdir(QUEUE_DIR, { recursive: true });
  const temporary = `${QUEUE_FILE}.${randomBytes(6).toString('hex')}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(items, null, 2), { mode: 0o600 });
  await fs.rename(temporary, QUEUE_FILE);
}

function cookieValue(req: Request, name: string): string {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index >= 0 && part.slice(0, index).trim() === name) {
      try { return decodeURIComponent(part.slice(index + 1).trim()); } catch { return ''; }
    }
  }
  return '';
}

function getToken(req: Request): StoredToken | null {
  const secret = process.env.INTEGRATION_SECRET || '';
  const value = cookieValue(req, TOKEN_COOKIE);
  if (!secret || !value) return null;
  try {
    const [version, iv, tag, data] = value.split('.');
    if (version !== 'v1' || !iv || !tag || !data) return null;
    const key = createHash('sha256').update(secret).digest();
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(data, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
    const token = JSON.parse(plaintext) as StoredToken;
    return token?.provider === 'youtube' && token.accessToken ? token : null;
  } catch {
    return null;
  }
}

function validateSchedule(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.getTime() < Date.now() + 15 * 60 * 1000) return null;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);
  if (![17, 18, 19, 20].includes(hour) || minute !== 0) return null;
  return date.toISOString();
}

function sendError(res: Response, status: number, error: string) {
  return res.status(status).json({ ok: false, error });
}

async function uploadApprovedVideo(req: Request, item: QueueItem): Promise<string> {
  const token = getToken(req);
  if (!token) throw new Error('YouTube account connect nahi hai. Publishing page se dobara connect karein.');
  if (!token.scope?.split(/\s+/).includes(UPLOAD_SCOPE)) {
    throw new Error('YouTube upload permission missing hai. Publishing connect flow se dobara permission dein.');
  }
  if (token.expiresAt <= Date.now() + 60_000) {
    throw new Error('YouTube access token expire ho gaya. Dobara connect karke approval retry karein.');
  }

  const mediaPath = path.join(QUEUE_DIR, `${item.id}.video`);
  const video = await fs.readFile(mediaPath);
  const mimeType = (await fs.readFile(`${mediaPath}.mime`, 'utf8')).trim() || 'video/mp4';
  const metadata = {
    snippet: { title: item.title, description: item.description, tags: item.tags },
    status: { privacyStatus: 'private', publishAt: item.scheduledAt, selfDeclaredMadeForKids: false },
  };
  const initUrl = new URL('https://www.googleapis.com/upload/youtube/v3/videos');
  initUrl.searchParams.set('uploadType', 'resumable');
  initUrl.searchParams.set('part', 'snippet,status');
  const init = await fetch(initUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(video.length),
    },
    body: JSON.stringify(metadata),
    signal: AbortSignal.timeout(30_000),
  });
  if (!init.ok) throw new Error(`YouTube upload initialize failed (${init.status}): ${(await init.text()).slice(0, 500)}`);
  const uploadUrl = init.headers.get('location');
  if (!uploadUrl) throw new Error('YouTube ne resumable upload URL return nahi kiya.');

  const uploaded = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType, 'Content-Length': String(video.length) },
    body: video,
    signal: AbortSignal.timeout(10 * 60_000),
  });
  const result = await uploaded.json().catch(() => ({})) as { id?: string; error?: { message?: string } };
  if (!uploaded.ok || !result.id) {
    throw new Error(`YouTube video upload failed (${uploaded.status}): ${result.error?.message || 'provider error'}`);
  }
  return result.id;
}

export function registerYouTubePublishingRoutes(app: Express): void {
  app.get('/youtube-publishing/connect', (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const secret = process.env.INTEGRATION_SECRET || '';
    const appUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
    if (!clientId || !process.env.GOOGLE_CLIENT_SECRET || !secret) {
      return sendError(res, 400, 'Google OAuth client ya INTEGRATION_SECRET configure nahi hai.');
    }
    const state = randomBytes(24).toString('base64url');
    res.cookie(STATE_COOKIE, state, {
      httpOnly: true, sameSite: 'lax', secure: appUrl.startsWith('https://'), path: '/', maxAge: COOKIE_MAX_AGE,
    });
    const query = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${appUrl}/api/integrations/oauth/youtube/callback`,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/yt-analytics.readonly',
        UPLOAD_SCOPE,
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent select_account',
      include_granted_scopes: 'true',
      state,
    });
    return res.redirect(`${AUTH_URL}?${query.toString()}`);
  });

  app.get('/youtube-publishing/status', (req: Request, res: Response) => {
    const token = getToken(req);
    res.set('Cache-Control', 'no-store').json({
      connected: Boolean(token),
      uploadScopeGranted: Boolean(token?.scope?.split(/\s+/).includes(UPLOAD_SCOPE)),
      scheduleSlots: ['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'],
      timeZone: 'Asia/Karachi',
      maxVideoBytes: MAX_VIDEO_BYTES,
    });
  });

  app.get('/youtube-publishing/queue', async (_req: Request, res: Response) => {
    try {
      const items = await readQueue();
      return res.set('Cache-Control', 'no-store').json({ ok: true, items });
    } catch (error: any) {
      return sendError(res, 500, error?.message || 'Queue read nahi ho saki.');
    }
  });

  app.post('/youtube-publishing/queue', async (req: Request, res: Response) => {
    const { title, description = '', tags = [], scheduledAt, videoBase64, mimeType = 'video/mp4' } = req.body || {};
    const schedule = validateSchedule(scheduledAt);
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 100) {
      return sendError(res, 400, 'Video title 1 se 100 characters ka hona chahiye.');
    }
    if (typeof description !== 'string' || description.length > 5000) return sendError(res, 400, 'Description 5000 characters se zyada hai.');
    if (!schedule) return sendError(res, 400, 'Schedule must be at least 15 minutes ahead and exactly 5, 6, 7, or 8 PM Pakistan time.');
    if (!Array.isArray(tags) || tags.length > 30 || tags.some((tag) => typeof tag !== 'string' || tag.length > 100)) {
      return sendError(res, 400, 'Tags must be an array of up to 30 strings (100 characters each).');
    }
    if (typeof videoBase64 !== 'string' || !videoBase64.trim()) return sendError(res, 400, 'Video file (base64) is required.');
    const cleanBase64 = videoBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
    const byteLength = Math.floor(cleanBase64.length * 3 / 4);
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64) || byteLength <= 0 || byteLength > MAX_VIDEO_BYTES) {
      return sendError(res, 413, `Video base64 must be valid and no larger than ${MAX_VIDEO_BYTES / (1024 * 1024)} MB.`);
    }
    if (typeof mimeType !== 'string' || !/^video\/[a-zA-Z0-9.+-]+$/.test(mimeType)) return sendError(res, 400, 'A valid video MIME type is required.');

    try {
      const items = await readQueue();
      const now = new Date().toISOString();
      const item: QueueItem = {
        id: randomBytes(16).toString('hex'),
        title: title.trim(), description: description.trim(), tags: tags.map((tag: string) => tag.trim()).filter(Boolean),
        scheduledAt: schedule, status: 'pending_approval', createdAt: now, updatedAt: now,
      };
      await fs.mkdir(QUEUE_DIR, { recursive: true });
      await fs.writeFile(path.join(QUEUE_DIR, `${item.id}.video`), Buffer.from(cleanBase64, 'base64'), { mode: 0o600 });
      await fs.writeFile(path.join(QUEUE_DIR, `${item.id}.video.mime`), mimeType, { mode: 0o600 });
      items.unshift(item);
      await writeQueue(items);
      return res.status(201).json({ ok: true, item, approvalRequired: true });
    } catch (error: any) {
      return sendError(res, 500, error?.message || 'Queue item save nahi ho saka.');
    }
  });

  app.post('/youtube-publishing/queue/:id/approve', async (req: Request, res: Response) => {
    try {
      const items = await readQueue();
      const index = items.findIndex((item) => item.id === req.params.id);
      if (index < 0) return sendError(res, 404, 'Queue item nahi mila.');
      const item = items[index];
      if (item.status !== 'pending_approval') return sendError(res, 409, `Item is ${item.status}; only pending items can be approved.`);
      if (!getToken(req)?.scope?.split(/\s+/).includes(UPLOAD_SCOPE)) {
        return sendError(res, 403, 'YouTube upload permission missing hai. Publishing connect flow se dobara connect karein.');
      }
      item.status = 'uploading';
      item.updatedAt = new Date().toISOString();
      await writeQueue(items);
      try {
        const videoId = await uploadApprovedVideo(req, item);
        item.youtubeVideoId = videoId;
        item.youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        item.status = 'scheduled';
        item.error = undefined;
        await fs.rm(path.join(QUEUE_DIR, `${item.id}.video`), { force: true });
        await fs.rm(path.join(QUEUE_DIR, `${item.id}.video.mime`), { force: true });
      } catch (error: any) {
        item.status = 'failed';
        item.error = String(error?.message || 'YouTube upload failed').slice(0, 500);
      }
      item.updatedAt = new Date().toISOString();
      await writeQueue(items);
      if (item.status === 'failed') return res.status(502).json({ ok: false, item });
      return res.json({ ok: true, item, message: 'Approved video uploaded privately and scheduled on YouTube.' });
    } catch (error: any) {
      return sendError(res, 500, error?.message || 'Approval process fail ho gaya.');
    }
  });

  app.post('/youtube-publishing/queue/:id/cancel', async (_req: Request, res: Response) => {
    try {
      const items = await readQueue();
      const item = items.find((entry) => entry.id === _req.params.id);
      if (!item) return sendError(res, 404, 'Queue item nahi mila.');
      if (item.status !== 'pending_approval') return sendError(res, 409, 'Only unapproved items can be cancelled here.');
      item.status = 'cancelled';
      item.updatedAt = new Date().toISOString();
      await writeQueue(items);
      await fs.rm(path.join(QUEUE_DIR, `${item.id}.video`), { force: true });
      await fs.rm(path.join(QUEUE_DIR, `${item.id}.video.mime`), { force: true });
      return res.json({ ok: true, item });
    } catch (error: any) {
      return sendError(res, 500, error?.message || 'Queue item cancel nahi ho saka.');
    }
  });
}
