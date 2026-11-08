import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'crypto';
import type { Express, Request, Response } from 'express';

export const INTEGRATION_PUBLIC_PATHS = [
  '/api/integrations/oauth/youtube/callback',
  '/api/integrations/oauth/tiktok/callback',
];

type Provider = 'youtube' | 'tiktok';

interface AccountInfo {
  id: string;
  name: string;
  avatar?: string;
  subscribers?: number;
  followers?: number;
  customUrl?: string;
  uploadsPlaylistId?: string;
  statsAvailable?: boolean;
}

interface StoredToken {
  version: 1;
  provider: Provider;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope?: string;
  account: AccountInfo;
  connectedAt: string;
}

interface IntegrationConfig {
  appUrl: string;
  secret: string;
  youtube: { clientId: string; clientSecret: string; redirectUri: string };
  tiktok: { clientKey: string; clientSecret: string; redirectUri: string };
}

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
];
const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_SCOPES = ['user.info.basic', 'user.info.stats', 'video.list'];

const YT_METRICS = [
  'views',
  'estimatedMinutesWatched',
  'averageViewDuration',
  'averageViewPercentage',
  'subscribersGained',
  'subscribersLost',
  'likes',
  'comments',
  'shares',
].join(',');

const TOKEN_COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 60;
const STATE_COOKIE_MAX_AGE = 1000 * 60 * 10;
const CACHE_TTL = 1000 * 60 * 5;

const TOKEN_COOKIE: Record<Provider, string> = {
  youtube: 'itc_live_yt',
  tiktok: 'itc_live_tt',
};

const stateCookieName = (provider: Provider) => `itc_oauth_state_${provider}`;

class IntegrationError extends Error {
  constructor(
    message: string,
    public statusCode = 502,
    public code = 'integration_error'
  ) {
    super(message);
  }
}

class ReconnectError extends IntegrationError {
  constructor(message: string) {
    super(message, 401, 'reconnect');
  }
}

class ProviderHttpError extends Error {
  constructor(
    public statusCode: number,
    public providerMessage: string
  ) {
    super(providerMessage || `HTTP ${statusCode}`);
  }
}

function getConfig(req: Request): IntegrationConfig {
  const fallbackHost = `${req.protocol}://${req.get('host')}`;
  const appUrl = (process.env.APP_URL || fallbackHost).replace(/\/+$/, '');
  return {
    appUrl,
    secret: process.env.INTEGRATION_SECRET || '',
    youtube: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: `${appUrl}/api/integrations/oauth/youtube/callback`,
    },
    tiktok: {
      clientKey: '',
      clientSecret: '',
      redirectUri: `${appUrl}/api/integrations/oauth/tiktok/callback`,
    },
  };
}

function providerConfigured(provider: Provider, cfg: IntegrationConfig): boolean {
  if (!cfg.secret) return false;
  return provider === 'youtube'
    ? Boolean(cfg.youtube.clientId && cfg.youtube.clientSecret)
    : false;
}

function parseStoredToken(value: string, secret: string): StoredToken | null {
  if (!value || !secret) return null;
  try {
    const [version, ivPart, tagPart, dataPart] = value.split('.');
    if (version !== 'v1' || !ivPart || !tagPart || !dataPart) return null;
    const key = createHash('sha256').update(secret).digest();
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivPart, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(dataPart, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
    const parsed = JSON.parse(plain);
    if (!parsed || parsed.version !== 1 || !parsed.accessToken) return null;
    return parsed as StoredToken;
  } catch {
    return null;
  }
}

function encryptToken(token: StoredToken, secret: string): string {
  const key = createHash('sha256').update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(token), 'utf8'),
    cipher.final(),
  ]);
  return `v1.${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

function readCookie(req: Request, name: string): string {
  const header = req.headers.cookie;
  if (!header) return '';
  for (const entry of header.split(';')) {
    const separator = entry.indexOf('=');
    if (separator === -1) continue;
    if (entry.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(entry.slice(separator + 1).trim());
    } catch {
      return entry.slice(separator + 1).trim();
    }
  }
  return '';
}

function cookieOptions(cfg: IntegrationConfig, maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: cfg.appUrl.startsWith('https://'),
    path: '/',
    maxAge,
  };
}

function readStoredToken(req: Request, provider: Provider): StoredToken | null {
  const cfg = getConfig(req);
  const token = parseStoredToken(readCookie(req, TOKEN_COOKIE[provider]), cfg.secret);
  if (!token || token.provider !== provider) return null;
  return token;
}

function writeStoredToken(res: Response, cfg: IntegrationConfig, token: StoredToken) {
  res.cookie(TOKEN_COOKIE[token.provider], encryptToken(token, cfg.secret), cookieOptions(cfg, TOKEN_COOKIE_MAX_AGE));
}

function clearStoredToken(res: Response, cfg: IntegrationConfig, provider: Provider) {
  res.clearCookie(TOKEN_COOKIE[provider], cookieOptions(cfg, 0));
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

async function readPayload(response: globalThis.Response): Promise<any> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 400) };
  }
}

function extractProviderMessage(payload: any): string {
  if (!payload) return '';
  if (typeof payload.error_description === 'string') return payload.error_description;
  if (typeof payload.error === 'string') return payload.error;
  if (payload.error && typeof payload.error.message === 'string') return payload.error.message;
  if (typeof payload.message === 'string') return payload.message;
  return '';
}

async function providerFetch(url: string, init: RequestInit, label: string): Promise<any> {
  let response: globalThis.Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(25000) });
  } catch (err: any) {
    throw new IntegrationError(
      `${label} se connection nahi ho saka. Internet ya provider availability check karein.`,
      502,
      'network_error'
    );
  }
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new ProviderHttpError(response.status, extractProviderMessage(payload));
  }
  return payload;
}

function tikTokStatusForCode(code: string): number {
  if (code === 'access_token_invalid' || code === 'access_token_expired') return 401;
  if (code === 'scope_not_authorized' || code === 'scope_permission_missed') return 403;
  if (code === 'rate_limit_exceeded') return 429;
  return 502;
}

function ensureTikTokOk(payload: any) {
  const error = payload?.error;
  if (error && typeof error === 'object' && error.code && error.code !== 'ok') {
    throw new ProviderHttpError(tikTokStatusForCode(String(error.code)), String(error.message || error.code));
  }
}

function providerLabel(provider: Provider): string {
  return provider === 'youtube' ? 'YouTube' : 'TikTok';
}

function reconnectMessage(provider: Provider): string {
  return provider === 'youtube'
    ? 'YouTube permission expire ya revoke ho gayi hai. Disconnect karke dobara Connect karein.'
    : 'TikTok permission expire ya revoke ho gayi hai. Disconnect karke dobara Connect karein.';
}

function mapProviderFailure(err: any, provider: Provider): never {
  if (err instanceof IntegrationError) throw err;
  if (err instanceof ProviderHttpError) {
    if (err.statusCode === 401 || err.statusCode === 403) throw new ReconnectError(reconnectMessage(provider));
    if (err.statusCode === 429) {
      throw new IntegrationError(
        `${providerLabel(provider)} API quota/rate limit aa gaya hai. Thori der baad refresh karein.`,
        429,
        'quota'
      );
    }
    throw new IntegrationError(
      `${providerLabel(provider)} API se data nahi mila. Dobara try karein.`,
      502,
      'provider_error'
    );
  }
  throw err;
}

function redirectToApp(req: Request, res: Response, params: Record<string, string>) {
  const cfg = getConfig(req);
  const query = new URLSearchParams({ tab: 'live', ...params });
  res.redirect(`${cfg.appUrl}/?${query.toString()}`);
}

async function exchangeGoogleCode(code: string, cfg: IntegrationConfig): Promise<StoredToken> {
  const body = new URLSearchParams({
    code,
    client_id: cfg.youtube.clientId,
    client_secret: cfg.youtube.clientSecret,
    redirect_uri: cfg.youtube.redirectUri,
    grant_type: 'authorization_code',
  });
  const payload = await providerFetch(
    GOOGLE_TOKEN_URL,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    },
    'Google'
  );
  if (!payload?.access_token) {
    throw new IntegrationError('Google ne access token return nahi kiya. Dobara Connect karein.', 400, 'oauth_error');
  }
  if (!payload.refresh_token) {
    throw new IntegrationError(
      'Google ne refresh token nahi diya. Purani permission hata kar dobara Connect karein.',
      400,
      'oauth_error'
    );
  }
  const account = await fetchYouTubeChannel(payload.access_token);
  return {
    version: 1,
    provider: 'youtube',
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
    scope: payload.scope,
    account,
    connectedAt: new Date().toISOString(),
  };
}

async function exchangeTikTokCode(code: string, cfg: IntegrationConfig): Promise<StoredToken> {
  const body = new URLSearchParams({
    client_key: cfg.tiktok.clientKey,
    client_secret: cfg.tiktok.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: cfg.tiktok.redirectUri,
  });
  const payload = await providerFetch(
    TIKTOK_TOKEN_URL,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    },
    'TikTok'
  );
  if (!payload?.access_token) {
    throw new IntegrationError('TikTok ne access token return nahi kiya. Dobara Connect karein.', 400, 'oauth_error');
  }
  const user = await fetchTikTokUser(payload.access_token);
  return {
    version: 1,
    provider: 'tiktok',
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + Number(payload.expires_in || 86400) * 1000,
    scope: payload.scope,
    account: {
      id: String(payload.open_id || user.open_id || 'tiktok-user'),
      name: String(user.display_name || 'TikTok Creator'),
      avatar: user.avatar_url,
      followers: user.follower_count === undefined ? undefined : Number(user.follower_count),
      statsAvailable: user.follower_count !== undefined,
    },
    connectedAt: new Date().toISOString(),
  };
}

async function refreshGoogleToken(token: StoredToken, cfg: IntegrationConfig): Promise<StoredToken> {
  if (!token.refreshToken) {
    throw new ReconnectError('Google refresh token missing hai. Dobara Connect karein.');
  }
  const body = new URLSearchParams({
    client_id: cfg.youtube.clientId,
    client_secret: cfg.youtube.clientSecret,
    refresh_token: token.refreshToken,
    grant_type: 'refresh_token',
  });
  let payload: any;
  try {
    payload = await providerFetch(
      GOOGLE_TOKEN_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
      'Google token refresh'
    );
  } catch (err) {
    if (err instanceof ProviderHttpError && err.statusCode >= 400 && err.statusCode < 500) {
      throw new ReconnectError(reconnectMessage('youtube'));
    }
    throw err;
  }
  if (!payload?.access_token) throw new ReconnectError(reconnectMessage('youtube'));
  return {
    ...token,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || token.refreshToken,
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
    scope: payload.scope || token.scope,
  };
}

async function refreshTikTokToken(token: StoredToken, cfg: IntegrationConfig): Promise<StoredToken> {
  if (!token.refreshToken) {
    throw new ReconnectError('TikTok refresh token missing hai. Dobara Connect karein.');
  }
  const body = new URLSearchParams({
    client_key: cfg.tiktok.clientKey,
    client_secret: cfg.tiktok.clientSecret,
    refresh_token: token.refreshToken,
    grant_type: 'refresh_token',
  });
  let payload: any;
  try {
    payload = await providerFetch(
      TIKTOK_TOKEN_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
      'TikTok token refresh'
    );
  } catch (err) {
    if (err instanceof ProviderHttpError && err.statusCode >= 400 && err.statusCode < 500) {
      throw new ReconnectError(reconnectMessage('tiktok'));
    }
    throw err;
  }
  if (!payload?.access_token) throw new ReconnectError(reconnectMessage('tiktok'));
  return {
    ...token,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || token.refreshToken,
    expiresAt: Date.now() + Number(payload.expires_in || 86400) * 1000,
    scope: payload.scope || token.scope,
  };
}

async function ensureFreshToken(req: Request, res: Response, provider: Provider): Promise<StoredToken> {
  const cfg = getConfig(req);
  const token = readStoredToken(req, provider);
  if (!token) {
    throw new IntegrationError(
      `${providerLabel(provider)} connected nahi hai. Pehle Connect button dabayein.`,
      401,
      'not_connected'
    );
  }
  if (token.expiresAt > Date.now() + 60_000) return token;
  if (!providerConfigured(provider, cfg)) {
    throw new IntegrationError(
      `${providerLabel(provider)} ka OAuth configure nahi hai. Render environment variables check karein.`,
      400,
      'not_configured'
    );
  }
  try {
    const refreshed =
      provider === 'youtube'
        ? await refreshGoogleToken(token, cfg)
        : await refreshTikTokToken(token, cfg);
    writeStoredToken(res, cfg, refreshed);
    return refreshed;
  } catch (err) {
    if (err instanceof ReconnectError) clearStoredToken(res, cfg, provider);
    throw err;
  }
}

async function fetchYouTubeChannel(accessToken: string): Promise<AccountInfo> {
  const url = new URL('https://www.googleapis.com/youtube/v3/channels');
  url.searchParams.set('part', 'snippet,statistics,contentDetails');
  url.searchParams.set('mine', 'true');
  const payload = await providerFetch(
    url.toString(),
    { headers: { Authorization: `Bearer ${accessToken}` } },
    'YouTube Data API'
  );
  const item = payload?.items?.[0];
  if (!item) {
    throw new IntegrationError(
      'Is Google account par koi YouTube channel nahi mila. Us account se connect karein jiske channel ka data chahiye.',
      404,
      'no_channel'
    );
  }
  return {
    id: String(item.id || ''),
    name: String(item.snippet?.title || 'YouTube Channel'),
    avatar: item.snippet?.thumbnails?.default?.url || item.snippet?.thumbnails?.medium?.url,
    subscribers: item.statistics?.hiddenSubscriberCount ? undefined : Number(item.statistics?.subscriberCount || 0),
    customUrl: item.snippet?.customUrl,
    uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads,
  };
}

async function fetchTikTokUser(accessToken: string): Promise<any> {
  const statsFields =
    'open_id,union_id,avatar_url,display_name,is_verified,follower_count,following_count,likes_count,video_count';
  const request = async (fields: string) => {
    const url = new URL('https://open.tiktokapis.com/v2/user/info/');
    url.searchParams.set('fields', fields);
    const payload = await providerFetch(
      url.toString(),
      { headers: { Authorization: `Bearer ${accessToken}` } },
      'TikTok user info'
    );
    ensureTikTokOk(payload);
    return payload?.data?.user || {};
  };
  try {
    return await request(statsFields);
  } catch (err) {
    if (err instanceof ProviderHttpError && err.statusCode === 403) {
      return request('open_id,union_id,avatar_url,display_name,is_verified');
    }
    throw err;
  }
}

async function fetchTikTokVideos(accessToken: string): Promise<any[]> {
  const url = new URL('https://open.tiktokapis.com/v2/video/list/');
  url.searchParams.set(
    'fields',
    'id,title,video_description,duration,cover_image_url,share_url,create_time,view_count,like_count,comment_count,share_count'
  );
  const payload = await providerFetch(
    url.toString(),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ max_count: 20 }),
    },
    'TikTok video list'
  );
  ensureTikTokOk(payload);
  return Array.isArray(payload?.data?.videos) ? payload.data.videos : [];
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, offset: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + offset);
  return copy;
}

function numeric(value: any): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function reportRows(report: any): any[] {
  if (!report || !Array.isArray(report.columnHeaders) || !Array.isArray(report.rows)) return [];
  const headers = report.columnHeaders.map((header: any) => String(header.name));
  return report.rows.map((row: any[]) => {
    const entry: Record<string, any> = {};
    headers.forEach((header: string, index: number) => {
      entry[header] = row[index];
    });
    return entry;
  });
}

async function youtubeReport(accessToken: string, params: Record<string, string>): Promise<any> {
  const url = new URL('https://youtubeanalytics.googleapis.com/v2/reports');
  url.searchParams.set('ids', 'channel==MINE');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return providerFetch(
    url.toString(),
    { headers: { Authorization: `Bearer ${accessToken}` } },
    'YouTube Analytics API'
  );
}

async function optionalReport(
  accessToken: string,
  params: Record<string, string>,
  label: string
): Promise<any | null> {
  try {
    return await youtubeReport(accessToken, params);
  } catch (err: any) {
    console.warn(`[youtube] ${label} report unavailable:`, err?.message || err);
    return null;
  }
}

function summarizeDaily(rows: any[], uploads = 0) {
  let views = 0;
  let minutesWatched = 0;
  let weightedDuration = 0;
  let weightedPercentage = 0;
  let subscribersGained = 0;
  let subscribersLost = 0;
  let likes = 0;
  let comments = 0;
  let shares = 0;
  for (const row of rows) {
    const rowViews = numeric(row.views);
    views += rowViews;
    minutesWatched += numeric(row.estimatedMinutesWatched);
    weightedDuration += rowViews * numeric(row.averageViewDuration);
    weightedPercentage += rowViews * numeric(row.averageViewPercentage);
    subscribersGained += numeric(row.subscribersGained);
    subscribersLost += numeric(row.subscribersLost);
    likes += numeric(row.likes);
    comments += numeric(row.comments);
    shares += numeric(row.shares);
  }
  const interactions = likes + comments + shares;
  const netSubscribers = subscribersGained - subscribersLost;
  const averagePercentage =
    views > 0
      ? weightedPercentage / views
      : rows.length
        ? rows.reduce((sum, row) => sum + numeric(row.averageViewPercentage), 0) / rows.length
        : 0;
  const averageDuration =
    views > 0
      ? weightedDuration / views
      : rows.length
        ? rows.reduce((sum, row) => sum + numeric(row.averageViewDuration), 0) / rows.length
        : 0;
  return {
    views,
    minutesWatched,
    avgViewDuration: Number(averageDuration.toFixed(1)),
    avgViewPercentage: Number(averagePercentage.toFixed(1)),
    subscribersGained,
    subscribersLost,
    netSubscribers,
    likes,
    comments,
    shares,
    interactions,
    engagementRate: views > 0 ? Number(((interactions / views) * 100).toFixed(2)) : 0,
    subscribersPer1kViews: views > 0 ? Number(((netSubscribers / views) * 1000).toFixed(2)) : 0,
    uploads,
  };
}

function parseIsoDuration(value: string): number {
  if (!value) return 0;
  const match = value.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  return (
    numeric(match[1]) * 86400 +
    numeric(match[2]) * 3600 +
    numeric(match[3]) * 60 +
    numeric(match[4])
  );
}

async function countUploads(
  accessToken: string,
  playlistId: string | undefined,
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string
): Promise<{ current: number; previous: number; scanned: number; capped: boolean } | null> {
  if (!playlistId) return null;
  let pageToken = '';
  let current = 0;
  let previous = 0;
  let scanned = 0;
  let capped = false;
  for (let page = 0; page < 2; page += 1) {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'contentDetails');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', '50');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const payload = await providerFetch(
      url.toString(),
      { headers: { Authorization: `Bearer ${accessToken}` } },
      'YouTube uploads playlist'
    );
    const items = Array.isArray(payload?.items) ? payload.items : [];
    scanned += items.length;
    for (const item of items) {
      const published = String(item?.contentDetails?.videoPublishedAt || '').slice(0, 10);
      if (!published) continue;
      if (published >= currentStart && published <= currentEnd) current += 1;
      if (published >= previousStart && published <= previousEnd) previous += 1;
    }
    pageToken = payload?.nextPageToken || '';
    if (!pageToken) break;
    if (page === 1) capped = true;
  }
  return { current, previous, scanned, capped };
}

async function fetchTopVideoDetails(accessToken: string, ids: string[]): Promise<Map<string, any>> {
  const details = new Map<string, any>();
  if (!ids.length) return details;
  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('id', ids.slice(0, 50).join(','));
    const payload = await providerFetch(
      url.toString(),
      { headers: { Authorization: `Bearer ${accessToken}` } },
      'YouTube video details'
    );
    for (const item of payload?.items || []) {
      details.set(String(item.id), item);
    }
  } catch (err: any) {
    console.warn('[youtube] video details unavailable:', err?.message || err);
  }
  return details;
}

async function fetchYouTubeInsights(token: StoredToken, days: number) {
  const accessToken = token.accessToken;
  const channel = await fetchYouTubeChannel(accessToken);

  const endDate = addDays(new Date(), -1);
  const startDate = addDays(endDate, -(days - 1));
  const previousEnd = addDays(startDate, -1);
  const previousStart = addDays(previousEnd, -(days - 1));
  const start = toDateString(startDate);
  const end = toDateString(endDate);
  const previousStartDate = toDateString(previousStart);
  const previousEndDate = toDateString(previousEnd);

  const dailyParams = {
    startDate: start,
    endDate: end,
    dimensions: 'day',
    metrics: YT_METRICS,
    sort: 'day',
  };
  const previousDailyParams = { ...dailyParams, startDate: previousStartDate, endDate: previousEndDate };

  const [
    dailyReport,
    previousDailyReport,
    trafficReport,
    viewerTypeReport,
    deviceReport,
    countryReport,
    contentReport,
    topVideoReport,
    uploads,
  ] = await Promise.all([
    youtubeReport(accessToken, dailyParams).catch((err) => mapProviderFailure(err, 'youtube')),
    optionalReport(accessToken, previousDailyParams, 'previous period'),
    optionalReport(
      accessToken,
      { startDate: start, endDate: end, dimensions: 'insightTrafficSourceType', metrics: 'views,estimatedMinutesWatched', sort: '-views' },
      'traffic sources'
    ),
    optionalReport(
      accessToken,
      { startDate: start, endDate: end, dimensions: 'viewerType', metrics: 'views', sort: '-views' },
      'viewer types'
    ),
    optionalReport(
      accessToken,
      { startDate: start, endDate: end, dimensions: 'deviceType', metrics: 'views,estimatedMinutesWatched', sort: '-views' },
      'devices'
    ),
    optionalReport(
      accessToken,
      {
        startDate: start,
        endDate: end,
        dimensions: 'country',
        metrics: 'views,estimatedMinutesWatched,averageViewDuration',
        sort: '-views',
        maxResults: '8',
      },
      'geography'
    ),
    optionalReport(
      accessToken,
      { startDate: start, endDate: end, dimensions: 'creatorContentType', metrics: 'views,estimatedMinutesWatched', sort: '-views' },
      'content types'
    ),
    optionalReport(
      accessToken,
      {
        startDate: start,
        endDate: end,
        dimensions: 'video',
        metrics:
          'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,shares,subscribersGained',
        sort: '-views',
        maxResults: '10',
      },
      'top videos'
    ),
    countUploads(accessToken, channel.uploadsPlaylistId, start, end, previousStartDate, previousEndDate).catch(
      (err) => {
        console.warn('[youtube] upload count unavailable:', err?.message || err);
        return null;
      }
    ),
  ]);

  const daily = reportRows(dailyReport);
  const previousDaily = reportRows(previousDailyReport);
  const uploadCounts = uploads;
  const notes: string[] = [];

  const trafficSources = reportRows(trafficReport).map((row) => ({
    source: String(row.insightTrafficSourceType || 'UNKNOWN'),
    views: numeric(row.views),
    minutesWatched: numeric(row.estimatedMinutesWatched),
  }));
  if (!trafficReport) notes.push('Traffic source breakdown is refresh par available nahi tha.');

  const viewerTypes = reportRows(viewerTypeReport).map((row) => ({
    type: String(row.viewerType || 'UNKNOWN'),
    views: numeric(row.views),
  }));
  if (!viewerTypeReport) notes.push('New vs returning viewer split is refresh par available nahi tha.');

  const devices = reportRows(deviceReport).map((row) => ({
    device: String(row.deviceType || 'UNKNOWN'),
    views: numeric(row.views),
    minutesWatched: numeric(row.estimatedMinutesWatched),
  }));
  if (!deviceReport) notes.push('Device breakdown is refresh par available nahi tha.');

  const countries = reportRows(countryReport).map((row) => ({
    country: String(row.country || 'UNKNOWN'),
    views: numeric(row.views),
    minutesWatched: numeric(row.estimatedMinutesWatched),
    avgViewDuration: numeric(row.averageViewDuration),
  }));
  if (!countryReport) notes.push('Country breakdown is refresh par available nahi tha.');

  const contentTypes = reportRows(contentReport).map((row) => ({
    type: String(row.creatorContentType || 'UNKNOWN'),
    views: numeric(row.views),
    minutesWatched: numeric(row.estimatedMinutesWatched),
  }));
  if (!contentReport) notes.push('Shorts vs long-form split is refresh par available nahi tha.');

  const topRows = reportRows(topVideoReport);
  const detailMap = await fetchTopVideoDetails(
    accessToken,
    topRows.map((row) => String(row.video || '')).filter(Boolean)
  );
  const topVideos = topRows.map((row) => {
    const id = String(row.video || '');
    const detail = detailMap.get(id);
    const views = numeric(row.views);
    const interactions = numeric(row.likes) + numeric(row.comments) + numeric(row.shares);
    return {
      id,
      title: String(detail?.snippet?.title || `Video ${id}`),
      thumbnail: detail?.snippet?.thumbnails?.medium?.url || detail?.snippet?.thumbnails?.default?.url || '',
      publishedAt: detail?.snippet?.publishedAt || '',
      durationSeconds: parseIsoDuration(String(detail?.contentDetails?.duration || '')),
      views,
      minutesWatched: numeric(row.estimatedMinutesWatched),
      avgViewDuration: numeric(row.averageViewDuration),
      avgViewPercentage: numeric(row.averageViewPercentage),
      likes: numeric(row.likes),
      comments: numeric(row.comments),
      shares: numeric(row.shares),
      subscribersGained: numeric(row.subscribersGained),
      engagementRate: views > 0 ? Number(((interactions / views) * 100).toFixed(2)) : 0,
    };
  });
  if (!topVideoReport) notes.push('Top videos ka breakdown is refresh par available nahi tha.');
  if (topVideoReport && topRows.length && detailMap.size === 0) {
    notes.push('Video titles/thumbnails load nahi ho sake, lekin analytics numbers available hain.');
  }

  const summary = summarizeDaily(daily, uploadCounts?.current || 0);
  const previousSummary = summarizeDaily(previousDaily, uploadCounts?.previous || 0);
  if (!uploadCounts) notes.push('Upload frequency count available nahi hua; consistency score formula se bahar rahega.');
  if (uploadCounts?.capped) notes.push('Upload count sirf recent 100 uploads scan karta hai.');

  return {
    provider: 'youtube',
    days,
    channel: {
      id: channel.id,
      title: channel.name,
      avatar: channel.avatar || '',
      subscribers: channel.subscribers ?? null,
      customUrl: channel.customUrl || '',
    },
    range: {
      startDate: start,
      endDate: end,
      previousStartDate,
      previousEndDate,
    },
    summary,
    previousSummary,
    daily,
    previousDaily,
    trafficSources,
    viewerTypes,
    devices,
    countries,
    contentTypes,
    topVideos,
    notes,
    fetchedAt: new Date().toISOString(),
  };
}

function summarizeTikTok(videos: any[], user: any) {
  const count = videos.length;
  const totalViews = videos.reduce((sum, video) => sum + video.views, 0);
  const totalLikes = videos.reduce((sum, video) => sum + video.likes, 0);
  const totalComments = videos.reduce((sum, video) => sum + video.comments, 0);
  const totalShares = videos.reduce((sum, video) => sum + video.shares, 0);
  const interactions = totalLikes + totalComments + totalShares;
  const sortedViews = [...videos.map((video) => video.views)].sort((a, b) => a - b);
  const medianViews =
    sortedViews.length === 0
      ? 0
      : sortedViews.length % 2
        ? sortedViews[Math.floor(sortedViews.length / 2)]
        : Math.round(
            (sortedViews[sortedViews.length / 2 - 1] + sortedViews[sortedViews.length / 2]) / 2
          );
  const timestamps = videos
    .map((video) => new Date(video.createdAt).getTime())
    .filter((value) => Number.isFinite(value));
  const spanDays =
    timestamps.length > 1
      ? Math.max(1, (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60 * 24))
      : 0;
  const followers = user.follower_count === undefined ? null : numeric(user.follower_count);
  const averageLikes = count ? totalLikes / count : 0;
  return {
    videosAnalyzed: count,
    totalViews,
    averageViews: count ? Math.round(totalViews / count) : 0,
    medianViews,
    totalLikes,
    totalComments,
    totalShares,
    interactions,
    engagementRate: totalViews > 0 ? Number(((interactions / totalViews) * 100).toFixed(2)) : 0,
    averageLikes: Math.round(averageLikes),
    likeFollowerRatio: followers && followers > 0 ? Number(((averageLikes / followers) * 100).toFixed(2)) : null,
    shareRate: totalViews > 0 ? Number(((totalShares / totalViews) * 100).toFixed(2)) : 0,
    commentRate: totalViews > 0 ? Number(((totalComments / totalViews) * 100).toFixed(2)) : 0,
    postsPerWeek: spanDays > 0 ? Number(((count / spanDays) * 7).toFixed(1)) : 0,
    spanDays: Math.round(spanDays),
  };
}

async function fetchTikTokInsights(token: StoredToken) {
  const user = await fetchTikTokUser(token.accessToken);
  const rawVideos = await fetchTikTokVideos(token.accessToken);
  const videos = rawVideos
    .map((video) => {
      const views = numeric(video.view_count);
      const likes = numeric(video.like_count);
      const comments = numeric(video.comment_count);
      const shares = numeric(video.share_count);
      const interactions = likes + comments + shares;
      const createdAt = video.create_time
        ? new Date(Number(video.create_time) * 1000).toISOString()
        : '';
      return {
        id: String(video.id || ''),
        title: String(video.title || video.video_description || `TikTok video ${video.id || ''}`).slice(0, 180),
        description: String(video.video_description || ''),
        createdAt,
        duration: numeric(video.duration),
        cover: String(video.cover_image_url || ''),
        url: String(video.share_url || ''),
        views,
        likes,
        comments,
        shares,
        engagementRate: views > 0 ? Number(((interactions / views) * 100).toFixed(2)) : 0,
      };
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 20);

  const statsAvailable = user.follower_count !== undefined;
  return {
    provider: 'tiktok',
    profile: {
      id: String(user.open_id || token.account.id || ''),
      name: String(user.display_name || token.account.name || 'TikTok Creator'),
      avatar: String(user.avatar_url || token.account.avatar || ''),
      followers: statsAvailable ? numeric(user.follower_count) : null,
      following: statsAvailable ? numeric(user.following_count) : null,
      likes: statsAvailable ? numeric(user.likes_count) : null,
      videoCount: statsAvailable ? numeric(user.video_count) : null,
      verified: Boolean(user.is_verified),
      statsAvailable,
    },
    summary: summarizeTikTok(videos, user),
    videos,
    notes: [
      'TikTok official Display API watch-time, retention, traffic source aur demographics nahi deta.',
      'Video counts lifetime hain (date-range filter official API mein available nahi).',
      'Analysis recent 20 public videos par based hai.',
    ],
    fetchedAt: new Date().toISOString(),
  };
}

function clearProviderCache(provider: Provider, accountId?: string) {
  for (const key of Array.from(insightsCache.keys())) {
    if (!key.startsWith(`${provider}:`)) continue;
    if (accountId && !key.includes(accountId)) continue;
    insightsCache.delete(key);
  }
}

const insightsCache = new Map<string, { expiresAt: number; payload: any }>();

function sendRouteError(res: Response, err: any, provider: Provider) {
  if (err instanceof IntegrationError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }
  console.error(`[${provider}] live insights error:`, err?.message || err);
  res.status(500).json({
    error: `${providerLabel(provider)} live data fetch nahi ho saka. Dobara try karein.`,
    code: 'server_error',
  });
}

export function registerIntegrationRoutes(app: Express) {
  app.get('/api/integrations/status', (req: Request, res: Response) => {
    const cfg = getConfig(req);
    const youtubeToken = readStoredToken(req, 'youtube');
    const tiktokToken = readStoredToken(req, 'tiktok');
    res.set('Cache-Control', 'no-store');
    res.json({
      appUrl: cfg.appUrl,
      appUrlConfigured: Boolean(process.env.APP_URL),
      redirectUris: {
        youtube: cfg.youtube.redirectUri,
        tiktok: cfg.tiktok.redirectUri,
      },
      configured: {
        youtube: providerConfigured('youtube', cfg),
        tiktok: providerConfigured('tiktok', cfg),
        tokenStorage: Boolean(cfg.secret),
      },
      connected: {
        youtube: youtubeToken
          ? {
              id: youtubeToken.account.id,
              name: youtubeToken.account.name,
              avatar: youtubeToken.account.avatar || '',
              subscribers: youtubeToken.account.subscribers ?? null,
              connectedAt: youtubeToken.connectedAt,
            }
          : null,
        tiktok: tiktokToken
          ? {
              id: tiktokToken.account.id,
              name: tiktokToken.account.name,
              avatar: tiktokToken.account.avatar || '',
              followers: tiktokToken.account.followers ?? null,
              connectedAt: tiktokToken.connectedAt,
            }
          : null,
      },
    });
  });

  app.get('/api/integrations/oauth/:provider/start', (req: Request, res: Response) => {
    const provider = req.params.provider === 'youtube' || req.params.provider === 'tiktok'
      ? (req.params.provider as Provider)
      : null;
    if (!provider) {
      res.status(404).send('Unknown provider');
      return;
    }
    const cfg = getConfig(req);
    if (!providerConfigured(provider, cfg)) {
      res
        .status(400)
        .send(
          `${providerLabel(provider)} OAuth configured nahi hai. Render environment mein required keys add karein, phir dobara try karein.`
        );
      return;
    }
    const state = randomBytes(24).toString('base64url');
    res.cookie(stateCookieName(provider), state, cookieOptions(cfg, STATE_COOKIE_MAX_AGE));
    const query = new URLSearchParams({
      response_type: 'code',
      state,
      redirect_uri: provider === 'youtube' ? cfg.youtube.redirectUri : cfg.tiktok.redirectUri,
    });
    if (provider === 'youtube') {
      query.set('client_id', cfg.youtube.clientId);
      query.set('scope', GOOGLE_SCOPES.join(' '));
      query.set('access_type', 'offline');
      query.set('prompt', 'consent select_account');
      query.set('include_granted_scopes', 'true');
      res.redirect(`${GOOGLE_AUTH_URL}?${query.toString()}`);
      return;
    }
    query.set('client_key', cfg.tiktok.clientKey);
    query.set('scope', TIKTOK_SCOPES.join(','));
    res.redirect(`${TIKTOK_AUTH_URL}?${query.toString()}`);
  });

  app.get('/api/integrations/oauth/:provider/callback', async (req: Request, res: Response) => {
    const provider = req.params.provider === 'youtube' || req.params.provider === 'tiktok'
      ? (req.params.provider as Provider)
      : null;
    if (!provider) {
      res.status(404).send('Unknown provider');
      return;
    }
    const cfg = getConfig(req);
    const expectedState = readCookie(req, stateCookieName(provider));
    res.clearCookie(stateCookieName(provider), cookieOptions(cfg, 0));
    const receivedState = String(req.query.state || '');
    if (!safeEqual(expectedState, receivedState)) {
      redirectToApp(req, res, {
        integration: provider,
        status: 'error',
        message: 'OAuth state verify nahi hua. Dobara Connect karein.',
      });
      return;
    }
    if (req.query.error) {
      redirectToApp(req, res, {
        integration: provider,
        status: 'error',
        message: String(req.query.error_description || req.query.error || 'Permission cancel ho gayi.'),
      });
      return;
    }
    const code = String(req.query.code || '');
    if (!code) {
      redirectToApp(req, res, {
        integration: provider,
        status: 'error',
        message: 'OAuth code nahi mila. Dobara Connect karein.',
      });
      return;
    }
    if (!providerConfigured(provider, cfg)) {
      redirectToApp(req, res, {
        integration: provider,
        status: 'error',
        message: 'OAuth keys missing hain. Render environment variables check karein.',
      });
      return;
    }
    try {
      const token =
        provider === 'youtube'
          ? await exchangeGoogleCode(code, cfg)
          : await exchangeTikTokCode(code, cfg);
      writeStoredToken(res, cfg, token);
      clearProviderCache(provider);
      redirectToApp(req, res, { integration: provider, status: 'connected' });
    } catch (err: any) {
      console.error(`[${provider}] OAuth exchange failed:`, err?.message || err);
      let message = `${providerLabel(provider)} connect nahi ho saka. Dobara try karein.`;
      if (err instanceof ProviderHttpError && /invalid_grant|invalid code|expired/i.test(err.providerMessage)) {
        message = 'OAuth code expire ya already use ho chuka hai. Dobara Connect karein.';
      } else if (err instanceof IntegrationError) {
        message = err.message;
      }
      redirectToApp(req, res, { integration: provider, status: 'error', message });
    }
  });

  app.get('/api/integrations/youtube/insights', async (req: Request, res: Response) => {
    const requestedDays = Number(req.query.days);
    const days = [7, 28, 90].includes(requestedDays) ? requestedDays : 28;
    try {
      const token = await ensureFreshToken(req, res, 'youtube');
      const cacheKey = `youtube:${token.account.id || 'me'}:${days}`;
      const fresh = String(req.query.fresh || '') === '1';
      const cached = insightsCache.get(cacheKey);
      if (!fresh && cached && cached.expiresAt > Date.now()) {
        res.set('Cache-Control', 'no-store');
        res.json({ ...cached.payload, cached: true });
        return;
      }
      const payload = await fetchYouTubeInsights(token, days);
      insightsCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL, payload });
      res.set('Cache-Control', 'no-store');
      res.json({ ...payload, cached: false });
    } catch (err) {
      sendRouteError(res, err, 'youtube');
    }
  });

  app.get('/api/integrations/tiktok/insights', async (req: Request, res: Response) => {
    try {
      const token = await ensureFreshToken(req, res, 'tiktok');
      const cacheKey = `tiktok:${token.account.id || 'me'}`;
      const fresh = String(req.query.fresh || '') === '1';
      const cached = insightsCache.get(cacheKey);
      if (!fresh && cached && cached.expiresAt > Date.now()) {
        res.set('Cache-Control', 'no-store');
        res.json({ ...cached.payload, cached: true });
        return;
      }
      const payload = await fetchTikTokInsights(token);
      insightsCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL, payload });
      res.set('Cache-Control', 'no-store');
      res.json({ ...payload, cached: false });
    } catch (err) {
      sendRouteError(res, err, 'tiktok');
    }
  });

  app.post('/api/integrations/disconnect/:provider', (req: Request, res: Response) => {
    const provider = req.params.provider === 'youtube' || req.params.provider === 'tiktok'
      ? (req.params.provider as Provider)
      : null;
    if (!provider) {
      res.status(404).json({ error: 'Unknown provider' });
      return;
    }
    const cfg = getConfig(req);
    const token = readStoredToken(req, provider);
    clearStoredToken(res, cfg, provider);
    clearProviderCache(provider, token?.account.id);
    res.json({ ok: true });
  });
}
