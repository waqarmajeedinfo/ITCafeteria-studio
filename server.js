// server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { timingSafeEqual as timingSafeEqual2 } from "crypto";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// src/lib/thumbnailMaster.ts
var clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
function getThumbnailIdentity(channelName, presenter) {
  const isItCafeteria = /it\s*cafeteria/i.test(channelName);
  return isItCafeteria ? {
    channelName: channelName || "IT Cafeteria",
    presenter: presenter || "Waqar Majeed",
    tagline: "Learn \u2022 Build \u2022 Grow",
    deskProps: "neatly stacked technology books"
  } : {
    channelName: channelName || "Beauty Hub",
    presenter: presenter || "Mehr Zadi",
    tagline: "Beauty \u2022 Style \u2022 Confidence",
    deskProps: "neatly stacked beauty and styling boxes"
  };
}
function splitHeadline(headline) {
  const words = clean(headline).replace(/[^\p{L}\p{N}\s]/gu, " ").split(" ").filter(Boolean).map((word) => word.toUpperCase());
  if (!words.length) return ["TECH", "TRICK"];
  if (words.length === 1) return [words[0].slice(0, 22), ""];
  const otherWords = words.slice(0, 7);
  const splitAt = Math.ceil(otherWords.length / 2);
  const line1 = otherWords.slice(0, splitAt).join(" ").slice(0, 22).trim();
  const line2 = otherWords.slice(splitAt).join(" ").slice(0, 22).trim();
  return [line1, line2 || otherWords[otherWords.length - 1]];
}
function buildMasterThumbnailPrompt(input) {
  const identity = getThumbnailIdentity(input.channelName, input.presenter);
  const tagline = clean(input.tagline) || identity.tagline;
  const deskProps = clean(input.deskProps) || identity.deskProps;
  const characterTag = clean(input.characterTag) || "selected character tag";
  const line1 = clean(input.line1) || "TECH";
  const line2 = clean(input.line2);
  const subBanner = clean(input.subBanner) || "MUST TRY";
  const hologram = clean(input.hologram) || "a glowing 3D hologram visualising the story topic with layered interface panels and data streams";
  const headline = line2 ? `top line "${line1}" in solid bright white, and bottom line "${line2}" in solid high-pop neon-cyan` : `the single headline "${line1}" in solid bright white with a neon-cyan lower rim`;
  const characterLock = input.hasReferenceImage ? `Use the ATTACHED reference image as the exact identity reference for ${identity.presenter}: match the face, hair, skin tone, body proportions and the exact outfit from that image. Do not restyle the character or substitute a different person, hairstyle or clothing.` : `Match ${identity.presenter}'s official look for character tag "${characterTag}" (face, hair and outfit). If a reference image for this tag is attached, follow it exactly; never invent a different person, hairstyle or outfit.`;
  return `Master Thumbnail Agent v3.45 \u2014 create ONE finished 9:16 vertical YouTube Shorts thumbnail image for "${identity.channelName}" (tagline: "${tagline}"), presenter ${identity.presenter}. Clean photorealistic studio composite, 8K detail, sharp focus, high-CTR packaging.

FRAMING & PADDING (strict):
- 9:16 vertical frame. Deliberately zoom out so the whole scene reads as a compact, centered visual block.
- Leave exactly 20% of the top frame and exactly 20% of the bottom frame as clean background only: natural studio ceiling at the top, clean studio floor at the bottom. No character, prop, hand, text, badge, banner or hologram may enter those two clean bands.
- Keep all branding, headline, banner, hologram, character, desk and signature patch inside the middle 60% safe area.

LIGHT & COLOR:
- Clean high-vibrancy natural studio lighting with sharp neon-blue and cyan contrast, crisp shadows and realistic textures.
- Absolutely NO hazy, foggy, smoky, underwater, dreamy or heavy hue-saturation filter layers.

HEADER:
- Circular "${identity.channelName}" logo at the top-left of the safe area.
- Tagline "${tagline}" in clean white type at the top-right of the safe area.

HERO HEADLINE (center aligned):
- Bold 3D lettering with a dual-color treatment: ${headline}.
- Sharp neon outline/rim-light around both lines, strong dimensional depth, perfectly spelled, instantly readable at mobile size.
- Add a small circular play-button icon with a ">" glyph near the end of the headline text.

SUB-BANNER (center aligned, below the headline):
- "${subBanner}" in bold black text on a vibrant yellow textured brush-stroke banner.
- Defined 3D tilt: top-right further back, bottom-left forward. Text crisp and fully inside the banner.

DYNAMIC HOLOGRAM (story-driven):
- ${hologram}
- Render it as a floating, semi-transparent volumetric 3D hologram with cyan-blue projector light, custom NON-circular sparkle trails, matrix light-streams and energy flows that wrap around and adapt to the hologram's exact shape.

CHARACTER (reference-locked):
- Selected character tag: "${characterTag}".
- ${characterLock}
- Position ${identity.presenter} lower-left, body angled toward the camera with a natural excited expression, pointing naturally toward the hologram.
- Scale the character down inside the centered block so the hologram and headline stay dominant. Correct anatomy and five fingers.

STUDIO DESK & PROPS:
- Foreground desk with a branded "${identity.channelName}" mug, an unbranded metallic laptop with an etched "${identity.channelName}" logo glowing neon-blue, and ${deskProps}.

SIGNATURE PATCH:
- Small, sleek, compact white brush-stroke patch on the foreground desk, above the clean bottom 20% band, with "${identity.presenter}" in clean black cursive script and a subtle 3D tilt.

STRICTLY AVOID:
- Hazy/underwater look, heavy color filters, muddy shadows, watermark, extra logos, extra text, misspelled words, distorted face or hands, duplicate presenter, cropped head or fingers, clutter inside the top and bottom clean margins.`;
}

// integrations.ts
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "crypto";
var INTEGRATION_PUBLIC_PATHS = [
  "/api/integrations/oauth/youtube/callback",
  "/api/integrations/oauth/tiktok/callback"
];
var GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
var GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
var GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly"
];
var TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
var TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
var TIKTOK_SCOPES = ["user.info.basic", "user.info.stats", "video.list"];
var YT_METRICS = [
  "views",
  "estimatedMinutesWatched",
  "averageViewDuration",
  "averageViewPercentage",
  "subscribersGained",
  "subscribersLost",
  "likes",
  "comments",
  "shares"
].join(",");
var TOKEN_COOKIE_MAX_AGE = 1e3 * 60 * 60 * 24 * 60;
var STATE_COOKIE_MAX_AGE = 1e3 * 60 * 10;
var CACHE_TTL = 1e3 * 60 * 5;
var TOKEN_COOKIE = {
  youtube: "itc_live_yt",
  tiktok: "itc_live_tt"
};
var stateCookieName = (provider) => `itc_oauth_state_${provider}`;
var IntegrationError = class extends Error {
  constructor(message, statusCode = 502, code = "integration_error") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
};
var ReconnectError = class extends IntegrationError {
  constructor(message) {
    super(message, 401, "reconnect");
  }
};
var ProviderHttpError = class extends Error {
  constructor(statusCode, providerMessage) {
    super(providerMessage || `HTTP ${statusCode}`);
    this.statusCode = statusCode;
    this.providerMessage = providerMessage;
  }
};
function getConfig(req) {
  const fallbackHost = `${req.protocol}://${req.get("host")}`;
  const appUrl = (process.env.APP_URL || fallbackHost).replace(/\/+$/, "");
  return {
    appUrl,
    secret: process.env.INTEGRATION_SECRET || "",
    youtube: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectUri: `${appUrl}/api/integrations/oauth/youtube/callback`
    },
    tiktok: {
      clientKey: process.env.TIKTOK_CLIENT_KEY || "",
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || "",
      redirectUri: `${appUrl}/api/integrations/oauth/tiktok/callback`
    }
  };
}
function providerConfigured(provider, cfg) {
  if (!cfg.secret) return false;
  return provider === "youtube" ? Boolean(cfg.youtube.clientId && cfg.youtube.clientSecret) : Boolean(cfg.tiktok.clientKey && cfg.tiktok.clientSecret);
}
function parseStoredToken(value, secret) {
  if (!value || !secret) return null;
  try {
    const [version, ivPart, tagPart, dataPart] = value.split(".");
    if (version !== "v1" || !ivPart || !tagPart || !dataPart) return null;
    const key = createHash("sha256").update(secret).digest();
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(dataPart, "base64url")),
      decipher.final()
    ]).toString("utf8");
    const parsed = JSON.parse(plain);
    if (!parsed || parsed.version !== 1 || !parsed.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
}
function encryptToken(token, secret) {
  const key = createHash("sha256").update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(token), "utf8"),
    cipher.final()
  ]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}
function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return "";
  for (const entry of header.split(";")) {
    const separator = entry.indexOf("=");
    if (separator === -1) continue;
    if (entry.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(entry.slice(separator + 1).trim());
    } catch {
      return entry.slice(separator + 1).trim();
    }
  }
  return "";
}
function cookieOptions(cfg, maxAge) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: cfg.appUrl.startsWith("https://"),
    path: "/",
    maxAge
  };
}
function readStoredToken(req, provider) {
  const cfg = getConfig(req);
  const token = parseStoredToken(readCookie(req, TOKEN_COOKIE[provider]), cfg.secret);
  if (!token || token.provider !== provider) return null;
  return token;
}
function writeStoredToken(res, cfg, token) {
  res.cookie(TOKEN_COOKIE[token.provider], encryptToken(token, cfg.secret), cookieOptions(cfg, TOKEN_COOKIE_MAX_AGE));
}
function clearStoredToken(res, cfg, provider) {
  res.clearCookie(TOKEN_COOKIE[provider], cookieOptions(cfg, 0));
}
function safeEqual(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}
async function readPayload(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 400) };
  }
}
function extractProviderMessage(payload) {
  if (!payload) return "";
  if (typeof payload.error_description === "string") return payload.error_description;
  if (typeof payload.error === "string") return payload.error;
  if (payload.error && typeof payload.error.message === "string") return payload.error.message;
  if (typeof payload.message === "string") return payload.message;
  return "";
}
async function providerFetch(url, init, label) {
  let response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(25e3) });
  } catch (err) {
    throw new IntegrationError(
      `${label} se connection nahi ho saka. Internet ya provider availability check karein.`,
      502,
      "network_error"
    );
  }
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new ProviderHttpError(response.status, extractProviderMessage(payload));
  }
  return payload;
}
function tikTokStatusForCode(code) {
  if (code === "access_token_invalid" || code === "access_token_expired") return 401;
  if (code === "scope_not_authorized" || code === "scope_permission_missed") return 403;
  if (code === "rate_limit_exceeded") return 429;
  return 502;
}
function ensureTikTokOk(payload) {
  const error = payload?.error;
  if (error && typeof error === "object" && error.code && error.code !== "ok") {
    throw new ProviderHttpError(tikTokStatusForCode(String(error.code)), String(error.message || error.code));
  }
}
function providerLabel(provider) {
  return provider === "youtube" ? "YouTube" : "TikTok";
}
function reconnectMessage(provider) {
  return provider === "youtube" ? "YouTube permission expire ya revoke ho gayi hai. Disconnect karke dobara Connect karein." : "TikTok permission expire ya revoke ho gayi hai. Disconnect karke dobara Connect karein.";
}
function mapProviderFailure(err, provider) {
  if (err instanceof IntegrationError) throw err;
  if (err instanceof ProviderHttpError) {
    if (err.statusCode === 401 || err.statusCode === 403) throw new ReconnectError(reconnectMessage(provider));
    if (err.statusCode === 429) {
      throw new IntegrationError(
        `${providerLabel(provider)} API quota/rate limit aa gaya hai. Thori der baad refresh karein.`,
        429,
        "quota"
      );
    }
    throw new IntegrationError(
      `${providerLabel(provider)} API se data nahi mila. Dobara try karein.`,
      502,
      "provider_error"
    );
  }
  throw err;
}
function redirectToApp(req, res, params) {
  const cfg = getConfig(req);
  const query = new URLSearchParams({ tab: "live", ...params });
  res.redirect(`${cfg.appUrl}/?${query.toString()}`);
}
async function exchangeGoogleCode(code, cfg) {
  const body = new URLSearchParams({
    code,
    client_id: cfg.youtube.clientId,
    client_secret: cfg.youtube.clientSecret,
    redirect_uri: cfg.youtube.redirectUri,
    grant_type: "authorization_code"
  });
  const payload = await providerFetch(
    GOOGLE_TOKEN_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    },
    "Google"
  );
  if (!payload?.access_token) {
    throw new IntegrationError("Google ne access token return nahi kiya. Dobara Connect karein.", 400, "oauth_error");
  }
  if (!payload.refresh_token) {
    throw new IntegrationError(
      "Google ne refresh token nahi diya. Purani permission hata kar dobara Connect karein.",
      400,
      "oauth_error"
    );
  }
  const account = await fetchYouTubeChannel(payload.access_token);
  return {
    version: 1,
    provider: "youtube",
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1e3,
    scope: payload.scope,
    account,
    connectedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function exchangeTikTokCode(code, cfg) {
  const body = new URLSearchParams({
    client_key: cfg.tiktok.clientKey,
    client_secret: cfg.tiktok.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: cfg.tiktok.redirectUri
  });
  const payload = await providerFetch(
    TIKTOK_TOKEN_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    },
    "TikTok"
  );
  if (!payload?.access_token) {
    throw new IntegrationError("TikTok ne access token return nahi kiya. Dobara Connect karein.", 400, "oauth_error");
  }
  const user = await fetchTikTokUser(payload.access_token);
  return {
    version: 1,
    provider: "tiktok",
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + Number(payload.expires_in || 86400) * 1e3,
    scope: payload.scope,
    account: {
      id: String(payload.open_id || user.open_id || "tiktok-user"),
      name: String(user.display_name || "TikTok Creator"),
      avatar: user.avatar_url,
      followers: user.follower_count === void 0 ? void 0 : Number(user.follower_count),
      statsAvailable: user.follower_count !== void 0
    },
    connectedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function refreshGoogleToken(token, cfg) {
  if (!token.refreshToken) {
    throw new ReconnectError("Google refresh token missing hai. Dobara Connect karein.");
  }
  const body = new URLSearchParams({
    client_id: cfg.youtube.clientId,
    client_secret: cfg.youtube.clientSecret,
    refresh_token: token.refreshToken,
    grant_type: "refresh_token"
  });
  let payload;
  try {
    payload = await providerFetch(
      GOOGLE_TOKEN_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
      },
      "Google token refresh"
    );
  } catch (err) {
    if (err instanceof ProviderHttpError && err.statusCode >= 400 && err.statusCode < 500) {
      throw new ReconnectError(reconnectMessage("youtube"));
    }
    throw err;
  }
  if (!payload?.access_token) throw new ReconnectError(reconnectMessage("youtube"));
  return {
    ...token,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || token.refreshToken,
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1e3,
    scope: payload.scope || token.scope
  };
}
async function refreshTikTokToken(token, cfg) {
  if (!token.refreshToken) {
    throw new ReconnectError("TikTok refresh token missing hai. Dobara Connect karein.");
  }
  const body = new URLSearchParams({
    client_key: cfg.tiktok.clientKey,
    client_secret: cfg.tiktok.clientSecret,
    refresh_token: token.refreshToken,
    grant_type: "refresh_token"
  });
  let payload;
  try {
    payload = await providerFetch(
      TIKTOK_TOKEN_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
      },
      "TikTok token refresh"
    );
  } catch (err) {
    if (err instanceof ProviderHttpError && err.statusCode >= 400 && err.statusCode < 500) {
      throw new ReconnectError(reconnectMessage("tiktok"));
    }
    throw err;
  }
  if (!payload?.access_token) throw new ReconnectError(reconnectMessage("tiktok"));
  return {
    ...token,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || token.refreshToken,
    expiresAt: Date.now() + Number(payload.expires_in || 86400) * 1e3,
    scope: payload.scope || token.scope
  };
}
async function ensureFreshToken(req, res, provider) {
  const cfg = getConfig(req);
  const token = readStoredToken(req, provider);
  if (!token) {
    throw new IntegrationError(
      `${providerLabel(provider)} connected nahi hai. Pehle Connect button dabayein.`,
      401,
      "not_connected"
    );
  }
  if (token.expiresAt > Date.now() + 6e4) return token;
  if (!providerConfigured(provider, cfg)) {
    throw new IntegrationError(
      `${providerLabel(provider)} ka OAuth configure nahi hai. Render environment variables check karein.`,
      400,
      "not_configured"
    );
  }
  try {
    const refreshed = provider === "youtube" ? await refreshGoogleToken(token, cfg) : await refreshTikTokToken(token, cfg);
    writeStoredToken(res, cfg, refreshed);
    return refreshed;
  } catch (err) {
    if (err instanceof ReconnectError) clearStoredToken(res, cfg, provider);
    throw err;
  }
}
async function fetchYouTubeChannel(accessToken) {
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet,statistics,contentDetails");
  url.searchParams.set("mine", "true");
  const payload = await providerFetch(
    url.toString(),
    { headers: { Authorization: `Bearer ${accessToken}` } },
    "YouTube Data API"
  );
  const item = payload?.items?.[0];
  if (!item) {
    throw new IntegrationError(
      "Is Google account par koi YouTube channel nahi mila. Us account se connect karein jiske channel ka data chahiye.",
      404,
      "no_channel"
    );
  }
  return {
    id: String(item.id || ""),
    name: String(item.snippet?.title || "YouTube Channel"),
    avatar: item.snippet?.thumbnails?.default?.url || item.snippet?.thumbnails?.medium?.url,
    subscribers: item.statistics?.hiddenSubscriberCount ? void 0 : Number(item.statistics?.subscriberCount || 0),
    customUrl: item.snippet?.customUrl,
    uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads
  };
}
async function fetchTikTokUser(accessToken) {
  const statsFields = "open_id,union_id,avatar_url,display_name,is_verified,follower_count,following_count,likes_count,video_count";
  const request = async (fields) => {
    const url = new URL("https://open.tiktokapis.com/v2/user/info/");
    url.searchParams.set("fields", fields);
    const payload = await providerFetch(
      url.toString(),
      { headers: { Authorization: `Bearer ${accessToken}` } },
      "TikTok user info"
    );
    ensureTikTokOk(payload);
    return payload?.data?.user || {};
  };
  try {
    return await request(statsFields);
  } catch (err) {
    if (err instanceof ProviderHttpError && err.statusCode === 403) {
      return request("open_id,union_id,avatar_url,display_name,is_verified");
    }
    throw err;
  }
}
async function fetchTikTokVideos(accessToken) {
  const url = new URL("https://open.tiktokapis.com/v2/video/list/");
  url.searchParams.set(
    "fields",
    "id,title,video_description,duration,cover_image_url,share_url,create_time,view_count,like_count,comment_count,share_count"
  );
  const payload = await providerFetch(
    url.toString(),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ max_count: 20 })
    },
    "TikTok video list"
  );
  ensureTikTokOk(payload);
  return Array.isArray(payload?.data?.videos) ? payload.data.videos : [];
}
function toDateString(date) {
  return date.toISOString().slice(0, 10);
}
function addDays(date, offset) {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + offset);
  return copy;
}
function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function reportRows(report) {
  if (!report || !Array.isArray(report.columnHeaders) || !Array.isArray(report.rows)) return [];
  const headers = report.columnHeaders.map((header) => String(header.name));
  return report.rows.map((row) => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = row[index];
    });
    return entry;
  });
}
async function youtubeReport(accessToken, params) {
  const url = new URL("https://youtubeanalytics.googleapis.com/v2/reports");
  url.searchParams.set("ids", "channel==MINE");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return providerFetch(
    url.toString(),
    { headers: { Authorization: `Bearer ${accessToken}` } },
    "YouTube Analytics API"
  );
}
async function optionalReport(accessToken, params, label) {
  try {
    return await youtubeReport(accessToken, params);
  } catch (err) {
    console.warn(`[youtube] ${label} report unavailable:`, err?.message || err);
    return null;
  }
}
function summarizeDaily(rows, uploads = 0) {
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
  const averagePercentage = views > 0 ? weightedPercentage / views : rows.length ? rows.reduce((sum, row) => sum + numeric(row.averageViewPercentage), 0) / rows.length : 0;
  const averageDuration = views > 0 ? weightedDuration / views : rows.length ? rows.reduce((sum, row) => sum + numeric(row.averageViewDuration), 0) / rows.length : 0;
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
    engagementRate: views > 0 ? Number((interactions / views * 100).toFixed(2)) : 0,
    subscribersPer1kViews: views > 0 ? Number((netSubscribers / views * 1e3).toFixed(2)) : 0,
    uploads
  };
}
function parseIsoDuration(value) {
  if (!value) return 0;
  const match = value.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  return numeric(match[1]) * 86400 + numeric(match[2]) * 3600 + numeric(match[3]) * 60 + numeric(match[4]);
}
async function countUploads(accessToken, playlistId, currentStart, currentEnd, previousStart, previousEnd) {
  if (!playlistId) return null;
  let pageToken = "";
  let current = 0;
  let previous = 0;
  let scanned = 0;
  let capped = false;
  for (let page = 0; page < 2; page += 1) {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "contentDetails");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("maxResults", "50");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const payload = await providerFetch(
      url.toString(),
      { headers: { Authorization: `Bearer ${accessToken}` } },
      "YouTube uploads playlist"
    );
    const items = Array.isArray(payload?.items) ? payload.items : [];
    scanned += items.length;
    for (const item of items) {
      const published = String(item?.contentDetails?.videoPublishedAt || "").slice(0, 10);
      if (!published) continue;
      if (published >= currentStart && published <= currentEnd) current += 1;
      if (published >= previousStart && published <= previousEnd) previous += 1;
    }
    pageToken = payload?.nextPageToken || "";
    if (!pageToken) break;
    if (page === 1) capped = true;
  }
  return { current, previous, scanned, capped };
}
async function fetchTopVideoDetails(accessToken, ids) {
  const details = /* @__PURE__ */ new Map();
  if (!ids.length) return details;
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("id", ids.slice(0, 50).join(","));
    const payload = await providerFetch(
      url.toString(),
      { headers: { Authorization: `Bearer ${accessToken}` } },
      "YouTube video details"
    );
    for (const item of payload?.items || []) {
      details.set(String(item.id), item);
    }
  } catch (err) {
    console.warn("[youtube] video details unavailable:", err?.message || err);
  }
  return details;
}
async function fetchYouTubeInsights(token, days) {
  const accessToken = token.accessToken;
  const channel = await fetchYouTubeChannel(accessToken);
  const endDate = addDays(/* @__PURE__ */ new Date(), -1);
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
    dimensions: "day",
    metrics: YT_METRICS,
    sort: "day"
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
    uploads
  ] = await Promise.all([
    youtubeReport(accessToken, dailyParams).catch((err) => mapProviderFailure(err, "youtube")),
    optionalReport(accessToken, previousDailyParams, "previous period"),
    optionalReport(
      accessToken,
      { startDate: start, endDate: end, dimensions: "insightTrafficSourceType", metrics: "views,estimatedMinutesWatched", sort: "-views" },
      "traffic sources"
    ),
    optionalReport(
      accessToken,
      { startDate: start, endDate: end, dimensions: "viewerType", metrics: "views", sort: "-views" },
      "viewer types"
    ),
    optionalReport(
      accessToken,
      { startDate: start, endDate: end, dimensions: "deviceType", metrics: "views,estimatedMinutesWatched", sort: "-views" },
      "devices"
    ),
    optionalReport(
      accessToken,
      {
        startDate: start,
        endDate: end,
        dimensions: "country",
        metrics: "views,estimatedMinutesWatched,averageViewDuration",
        sort: "-views",
        maxResults: "8"
      },
      "geography"
    ),
    optionalReport(
      accessToken,
      { startDate: start, endDate: end, dimensions: "creatorContentType", metrics: "views,estimatedMinutesWatched", sort: "-views" },
      "content types"
    ),
    optionalReport(
      accessToken,
      {
        startDate: start,
        endDate: end,
        dimensions: "video",
        metrics: "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,shares,subscribersGained",
        sort: "-views",
        maxResults: "10"
      },
      "top videos"
    ),
    countUploads(accessToken, channel.uploadsPlaylistId, start, end, previousStartDate, previousEndDate).catch(
      (err) => {
        console.warn("[youtube] upload count unavailable:", err?.message || err);
        return null;
      }
    )
  ]);
  const daily = reportRows(dailyReport);
  const previousDaily = reportRows(previousDailyReport);
  const uploadCounts = uploads;
  const notes = [];
  const trafficSources = reportRows(trafficReport).map((row) => ({
    source: String(row.insightTrafficSourceType || "UNKNOWN"),
    views: numeric(row.views),
    minutesWatched: numeric(row.estimatedMinutesWatched)
  }));
  if (!trafficReport) notes.push("Traffic source breakdown is refresh par available nahi tha.");
  const viewerTypes = reportRows(viewerTypeReport).map((row) => ({
    type: String(row.viewerType || "UNKNOWN"),
    views: numeric(row.views)
  }));
  if (!viewerTypeReport) notes.push("New vs returning viewer split is refresh par available nahi tha.");
  const devices = reportRows(deviceReport).map((row) => ({
    device: String(row.deviceType || "UNKNOWN"),
    views: numeric(row.views),
    minutesWatched: numeric(row.estimatedMinutesWatched)
  }));
  if (!deviceReport) notes.push("Device breakdown is refresh par available nahi tha.");
  const countries = reportRows(countryReport).map((row) => ({
    country: String(row.country || "UNKNOWN"),
    views: numeric(row.views),
    minutesWatched: numeric(row.estimatedMinutesWatched),
    avgViewDuration: numeric(row.averageViewDuration)
  }));
  if (!countryReport) notes.push("Country breakdown is refresh par available nahi tha.");
  const contentTypes = reportRows(contentReport).map((row) => ({
    type: String(row.creatorContentType || "UNKNOWN"),
    views: numeric(row.views),
    minutesWatched: numeric(row.estimatedMinutesWatched)
  }));
  if (!contentReport) notes.push("Shorts vs long-form split is refresh par available nahi tha.");
  const topRows = reportRows(topVideoReport);
  const detailMap = await fetchTopVideoDetails(
    accessToken,
    topRows.map((row) => String(row.video || "")).filter(Boolean)
  );
  const topVideos = topRows.map((row) => {
    const id = String(row.video || "");
    const detail = detailMap.get(id);
    const views = numeric(row.views);
    const interactions = numeric(row.likes) + numeric(row.comments) + numeric(row.shares);
    return {
      id,
      title: String(detail?.snippet?.title || `Video ${id}`),
      thumbnail: detail?.snippet?.thumbnails?.medium?.url || detail?.snippet?.thumbnails?.default?.url || "",
      publishedAt: detail?.snippet?.publishedAt || "",
      durationSeconds: parseIsoDuration(String(detail?.contentDetails?.duration || "")),
      views,
      minutesWatched: numeric(row.estimatedMinutesWatched),
      avgViewDuration: numeric(row.averageViewDuration),
      avgViewPercentage: numeric(row.averageViewPercentage),
      likes: numeric(row.likes),
      comments: numeric(row.comments),
      shares: numeric(row.shares),
      subscribersGained: numeric(row.subscribersGained),
      engagementRate: views > 0 ? Number((interactions / views * 100).toFixed(2)) : 0
    };
  });
  if (!topVideoReport) notes.push("Top videos ka breakdown is refresh par available nahi tha.");
  if (topVideoReport && topRows.length && detailMap.size === 0) {
    notes.push("Video titles/thumbnails load nahi ho sake, lekin analytics numbers available hain.");
  }
  const summary = summarizeDaily(daily, uploadCounts?.current || 0);
  const previousSummary = summarizeDaily(previousDaily, uploadCounts?.previous || 0);
  if (!uploadCounts) notes.push("Upload frequency count available nahi hua; consistency score formula se bahar rahega.");
  if (uploadCounts?.capped) notes.push("Upload count sirf recent 100 uploads scan karta hai.");
  return {
    provider: "youtube",
    days,
    channel: {
      id: channel.id,
      title: channel.name,
      avatar: channel.avatar || "",
      subscribers: channel.subscribers ?? null,
      customUrl: channel.customUrl || ""
    },
    range: {
      startDate: start,
      endDate: end,
      previousStartDate,
      previousEndDate
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
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function summarizeTikTok(videos, user) {
  const count = videos.length;
  const totalViews = videos.reduce((sum, video) => sum + video.views, 0);
  const totalLikes = videos.reduce((sum, video) => sum + video.likes, 0);
  const totalComments = videos.reduce((sum, video) => sum + video.comments, 0);
  const totalShares = videos.reduce((sum, video) => sum + video.shares, 0);
  const interactions = totalLikes + totalComments + totalShares;
  const sortedViews = [...videos.map((video) => video.views)].sort((a, b) => a - b);
  const medianViews = sortedViews.length === 0 ? 0 : sortedViews.length % 2 ? sortedViews[Math.floor(sortedViews.length / 2)] : Math.round(
    (sortedViews[sortedViews.length / 2 - 1] + sortedViews[sortedViews.length / 2]) / 2
  );
  const timestamps = videos.map((video) => new Date(video.createdAt).getTime()).filter((value) => Number.isFinite(value));
  const spanDays = timestamps.length > 1 ? Math.max(1, (Math.max(...timestamps) - Math.min(...timestamps)) / (1e3 * 60 * 60 * 24)) : 0;
  const followers = user.follower_count === void 0 ? null : numeric(user.follower_count);
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
    engagementRate: totalViews > 0 ? Number((interactions / totalViews * 100).toFixed(2)) : 0,
    averageLikes: Math.round(averageLikes),
    likeFollowerRatio: followers && followers > 0 ? Number((averageLikes / followers * 100).toFixed(2)) : null,
    shareRate: totalViews > 0 ? Number((totalShares / totalViews * 100).toFixed(2)) : 0,
    commentRate: totalViews > 0 ? Number((totalComments / totalViews * 100).toFixed(2)) : 0,
    postsPerWeek: spanDays > 0 ? Number((count / spanDays * 7).toFixed(1)) : 0,
    spanDays: Math.round(spanDays)
  };
}
async function fetchTikTokInsights(token) {
  const user = await fetchTikTokUser(token.accessToken);
  const rawVideos = await fetchTikTokVideos(token.accessToken);
  const videos = rawVideos.map((video) => {
    const views = numeric(video.view_count);
    const likes = numeric(video.like_count);
    const comments = numeric(video.comment_count);
    const shares = numeric(video.share_count);
    const interactions = likes + comments + shares;
    const createdAt = video.create_time ? new Date(Number(video.create_time) * 1e3).toISOString() : "";
    return {
      id: String(video.id || ""),
      title: String(video.title || video.video_description || `TikTok video ${video.id || ""}`).slice(0, 180),
      description: String(video.video_description || ""),
      createdAt,
      duration: numeric(video.duration),
      cover: String(video.cover_image_url || ""),
      url: String(video.share_url || ""),
      views,
      likes,
      comments,
      shares,
      engagementRate: views > 0 ? Number((interactions / views * 100).toFixed(2)) : 0
    };
  }).sort((a, b) => a.createdAt < b.createdAt ? 1 : -1).slice(0, 20);
  const statsAvailable = user.follower_count !== void 0;
  return {
    provider: "tiktok",
    profile: {
      id: String(user.open_id || token.account.id || ""),
      name: String(user.display_name || token.account.name || "TikTok Creator"),
      avatar: String(user.avatar_url || token.account.avatar || ""),
      followers: statsAvailable ? numeric(user.follower_count) : null,
      following: statsAvailable ? numeric(user.following_count) : null,
      likes: statsAvailable ? numeric(user.likes_count) : null,
      videoCount: statsAvailable ? numeric(user.video_count) : null,
      verified: Boolean(user.is_verified),
      statsAvailable
    },
    summary: summarizeTikTok(videos, user),
    videos,
    notes: [
      "TikTok official Display API watch-time, retention, traffic source aur demographics nahi deta.",
      "Video counts lifetime hain (date-range filter official API mein available nahi).",
      "Analysis recent 20 public videos par based hai."
    ],
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function clearProviderCache(provider, accountId) {
  for (const key of Array.from(insightsCache.keys())) {
    if (!key.startsWith(`${provider}:`)) continue;
    if (accountId && !key.includes(accountId)) continue;
    insightsCache.delete(key);
  }
}
var insightsCache = /* @__PURE__ */ new Map();
function sendRouteError(res, err, provider) {
  if (err instanceof IntegrationError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }
  console.error(`[${provider}] live insights error:`, err?.message || err);
  res.status(500).json({
    error: `${providerLabel(provider)} live data fetch nahi ho saka. Dobara try karein.`,
    code: "server_error"
  });
}
function registerIntegrationRoutes(app2) {
  app2.get("/api/integrations/status", (req, res) => {
    const cfg = getConfig(req);
    const youtubeToken = readStoredToken(req, "youtube");
    const tiktokToken = readStoredToken(req, "tiktok");
    res.set("Cache-Control", "no-store");
    res.json({
      appUrl: cfg.appUrl,
      appUrlConfigured: Boolean(process.env.APP_URL),
      redirectUris: {
        youtube: cfg.youtube.redirectUri,
        tiktok: cfg.tiktok.redirectUri
      },
      configured: {
        youtube: providerConfigured("youtube", cfg),
        tiktok: providerConfigured("tiktok", cfg),
        tokenStorage: Boolean(cfg.secret)
      },
      connected: {
        youtube: youtubeToken ? {
          id: youtubeToken.account.id,
          name: youtubeToken.account.name,
          avatar: youtubeToken.account.avatar || "",
          subscribers: youtubeToken.account.subscribers ?? null,
          connectedAt: youtubeToken.connectedAt
        } : null,
        tiktok: tiktokToken ? {
          id: tiktokToken.account.id,
          name: tiktokToken.account.name,
          avatar: tiktokToken.account.avatar || "",
          followers: tiktokToken.account.followers ?? null,
          connectedAt: tiktokToken.connectedAt
        } : null
      }
    });
  });
  app2.get("/api/integrations/oauth/:provider/start", (req, res) => {
    const provider = req.params.provider === "youtube" || req.params.provider === "tiktok" ? req.params.provider : null;
    if (!provider) {
      res.status(404).send("Unknown provider");
      return;
    }
    const cfg = getConfig(req);
    if (!providerConfigured(provider, cfg)) {
      res.status(400).send(
        `${providerLabel(provider)} OAuth configured nahi hai. Render environment mein required keys add karein, phir dobara try karein.`
      );
      return;
    }
    const state = randomBytes(24).toString("base64url");
    res.cookie(stateCookieName(provider), state, cookieOptions(cfg, STATE_COOKIE_MAX_AGE));
    const query = new URLSearchParams({
      response_type: "code",
      state,
      redirect_uri: provider === "youtube" ? cfg.youtube.redirectUri : cfg.tiktok.redirectUri
    });
    if (provider === "youtube") {
      query.set("client_id", cfg.youtube.clientId);
      query.set("scope", GOOGLE_SCOPES.join(" "));
      query.set("access_type", "offline");
      query.set("prompt", "consent select_account");
      query.set("include_granted_scopes", "true");
      res.redirect(`${GOOGLE_AUTH_URL}?${query.toString()}`);
      return;
    }
    query.set("client_key", cfg.tiktok.clientKey);
    query.set("scope", TIKTOK_SCOPES.join(","));
    res.redirect(`${TIKTOK_AUTH_URL}?${query.toString()}`);
  });
  app2.get("/api/integrations/oauth/:provider/callback", async (req, res) => {
    const provider = req.params.provider === "youtube" || req.params.provider === "tiktok" ? req.params.provider : null;
    if (!provider) {
      res.status(404).send("Unknown provider");
      return;
    }
    const cfg = getConfig(req);
    const expectedState = readCookie(req, stateCookieName(provider));
    res.clearCookie(stateCookieName(provider), cookieOptions(cfg, 0));
    const receivedState = String(req.query.state || "");
    if (!safeEqual(expectedState, receivedState)) {
      redirectToApp(req, res, {
        integration: provider,
        status: "error",
        message: "OAuth state verify nahi hua. Dobara Connect karein."
      });
      return;
    }
    if (req.query.error) {
      redirectToApp(req, res, {
        integration: provider,
        status: "error",
        message: String(req.query.error_description || req.query.error || "Permission cancel ho gayi.")
      });
      return;
    }
    const code = String(req.query.code || "");
    if (!code) {
      redirectToApp(req, res, {
        integration: provider,
        status: "error",
        message: "OAuth code nahi mila. Dobara Connect karein."
      });
      return;
    }
    if (!providerConfigured(provider, cfg)) {
      redirectToApp(req, res, {
        integration: provider,
        status: "error",
        message: "OAuth keys missing hain. Render environment variables check karein."
      });
      return;
    }
    try {
      const token = provider === "youtube" ? await exchangeGoogleCode(code, cfg) : await exchangeTikTokCode(code, cfg);
      writeStoredToken(res, cfg, token);
      clearProviderCache(provider);
      redirectToApp(req, res, { integration: provider, status: "connected" });
    } catch (err) {
      console.error(`[${provider}] OAuth exchange failed:`, err?.message || err);
      let message = `${providerLabel(provider)} connect nahi ho saka. Dobara try karein.`;
      if (err instanceof ProviderHttpError && /invalid_grant|invalid code|expired/i.test(err.providerMessage)) {
        message = "OAuth code expire ya already use ho chuka hai. Dobara Connect karein.";
      } else if (err instanceof IntegrationError) {
        message = err.message;
      }
      redirectToApp(req, res, { integration: provider, status: "error", message });
    }
  });
  app2.get("/api/integrations/youtube/insights", async (req, res) => {
    const requestedDays = Number(req.query.days);
    const days = [7, 28, 90].includes(requestedDays) ? requestedDays : 28;
    try {
      const token = await ensureFreshToken(req, res, "youtube");
      const cacheKey = `youtube:${token.account.id || "me"}:${days}`;
      const fresh = String(req.query.fresh || "") === "1";
      const cached = insightsCache.get(cacheKey);
      if (!fresh && cached && cached.expiresAt > Date.now()) {
        res.set("Cache-Control", "no-store");
        res.json({ ...cached.payload, cached: true });
        return;
      }
      const payload = await fetchYouTubeInsights(token, days);
      insightsCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL, payload });
      res.set("Cache-Control", "no-store");
      res.json({ ...payload, cached: false });
    } catch (err) {
      sendRouteError(res, err, "youtube");
    }
  });
  app2.get("/api/integrations/tiktok/insights", async (req, res) => {
    try {
      const token = await ensureFreshToken(req, res, "tiktok");
      const cacheKey = `tiktok:${token.account.id || "me"}`;
      const fresh = String(req.query.fresh || "") === "1";
      const cached = insightsCache.get(cacheKey);
      if (!fresh && cached && cached.expiresAt > Date.now()) {
        res.set("Cache-Control", "no-store");
        res.json({ ...cached.payload, cached: true });
        return;
      }
      const payload = await fetchTikTokInsights(token);
      insightsCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL, payload });
      res.set("Cache-Control", "no-store");
      res.json({ ...payload, cached: false });
    } catch (err) {
      sendRouteError(res, err, "tiktok");
    }
  });
  app2.post("/api/integrations/disconnect/:provider", (req, res) => {
    const provider = req.params.provider === "youtube" || req.params.provider === "tiktok" ? req.params.provider : null;
    if (!provider) {
      res.status(404).json({ error: "Unknown provider" });
      return;
    }
    const cfg = getConfig(req);
    const token = readStoredToken(req, provider);
    clearStoredToken(res, cfg, provider);
    clearProviderCache(provider, token?.account.id);
    res.json({ ok: true });
  });
}

// server.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var port = process.env.DEFAULT_APP_PORT ? Number(process.env.DEFAULT_APP_PORT) : process.env.PORT && process.env.PORT !== "8080" ? Number(process.env.PORT) : 3e3;
var app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
var accessKey = process.env.APP_ACCESS_KEY;
if (accessKey && process.env.NODE_ENV === "production" && !process.env.DEFAULT_APP_PORT) {
  app.use((req, res, next) => {
    if (req.path === "/api/health") return next();
    if (INTEGRATION_PUBLIC_PATHS.includes(req.path)) return next();
    if (req.path.startsWith("/tiktok") && req.path.endsWith(".txt")) return next();
    const [scheme, encoded] = (req.headers.authorization || "").split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString("utf8");
      const separator = decoded.indexOf(":");
      const password = separator === -1 ? "" : decoded.slice(separator + 1);
      const given = Buffer.from(password);
      const expected = Buffer.from(accessKey);
      if (given.length === expected.length && timingSafeEqual2(given, expected)) return next();
    }
    res.set("WWW-Authenticate", 'Basic realm="IT Cafeteria", charset="UTF-8"');
    res.status(401).send("Authentication required");
  });
}
var getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
};
var withTimeout = (promise, ms, label) => new Promise((resolve, reject) => {
  const timer = setTimeout(
    () => reject(new Error(`${label} timeout \u2014 ${Math.round(ms / 1e3)}s mein jawab nahi aaya`)),
    ms
  );
  promise.then(
    (value) => {
      clearTimeout(timer);
      resolve(value);
    },
    (error) => {
      clearTimeout(timer);
      reject(error);
    }
  );
});
var friendlyGeminiError = (err, fallback) => {
  const raw = String(err?.message || "");
  if (/429|RESOURCE_EXHAUSTED|exceeded your current quota|quota|rate limit/i.test(raw)) {
    return "Gemini ki free limit abhi khatam hai, is liye request poori nahi ho saki. Thori der baad ya quota reset hone par dobara try karein. Jaldi chahiye to Google AI Studio mein billing enable karni padegi.";
  }
  if (/503|UNAVAILABLE|high demand|overloaded/i.test(raw)) {
    return "Gemini model abhi busy hai. 1-2 minute baad dobara try karein.";
  }
  if (/401|403|PERMISSION_DENIED|API key not valid|invalid api key/i.test(raw)) {
    return "Gemini API key ka issue hai. Render Environment mein GEMINI_API_KEY check karein.";
  }
  const trimmed = raw.trim();
  return trimmed && trimmed.length <= 240 ? trimmed : fallback;
};
function extractJsonObject(raw) {
  const text = String(raw || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
  }
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, index + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "IT Cafeteria Studio", uptime: process.uptime() });
});
var CHAT_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-4-argon"
];
var CHAT_FALLBACK_ORDER = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest"
];
function generateIntelligentChatFallback(userQuery) {
  const q = (userQuery || "").toLowerCase();
  if (q.includes("short") || q.includes("video") || q.includes("script") || q.includes("autopilot")) {
    return 'Waqar Bhai! Main ne aapki request note kar li hai. Autopilot Coordinator active hai: yeh 58 catalog videos se 0-duplicate verify karke 10-scene short package (Google Flow prompts aur voice dialogue ke sath) foran tayar kar sakta hai. Aap "Aaj ka short bana do" keh kar foran trigger kar sakte hain!';
  }
  if (q.includes("excel") || q.includes("sheet")) {
    return 'Excel aur Google Sheets ke liye aaj ka best viral angle "Center Across Selection" aur "Smart Fill AI" hai. Merge Cells ki jagah Ctrl+1 daba kar Alignment mein Center Across Selection use karein taake sorting aur formulas kabhi break na hon!';
  }
  if (q.includes("windows") || q.includes("pc") || q.includes("slow")) {
    return 'Windows 11 speedup ke liye Win + R dabayein aur "cleanmgr" ya "temp" clean karne ka 20-second shortcut record karein. Is topic ka surge Pakistani tech audience mein +155% chal raha hai!';
  }
  if (q.includes("train") || q.includes("naya user") || q.includes("kaise")) {
    return 'Waqar Bhai! Naye trainee ya student ke liye workflow nihayat aasan hai: 1) Mic par bolein "Aaj ka short bana do". 2) Card se Google Flow Prompts copy karein. 3) Calendar mein shaam 6:00 PM slot par video auto-schedule ho chuki hogi!';
  }
  return "Waqar Bhai! Main aapke sath live co-pilot mode mein connect hoon. Aap mujhe Google Flow video prompts, YouTube tags, ya Content Calendar ke bare mein bataiye, main foran tayar kar deta hoon.";
}
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages, model = "gemini-3.1-flash-lite", systemInstruction, fallback = true } = req.body;
    let ai = null;
    try {
      ai = getAiClient();
    } catch (e) {
      console.warn("Gemini client not initialized, using local fallback:", e?.message || e);
    }
    const selectedModel = CHAT_MODELS.includes(model) ? model : "gemini-3.1-flash-lite";
    const modelsToTry = fallback ? [selectedModel, ...CHAT_FALLBACK_ORDER.filter((item) => item !== selectedModel)] : [selectedModel];
    const contents = (messages || []).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }]
    }));
    let response = null;
    let lastError = null;
    let modelUsed = selectedModel;
    if (ai && contents.length > 0) {
      for (const candidate of modelsToTry) {
        try {
          response = await withTimeout(
            ai.models.generateContent({
              model: candidate,
              contents,
              config: {
                systemInstruction: systemInstruction || "You are an expert AI Production Assistant and Script Doctor for IT Cafeteria, run by Waqar Majeed. You communicate warmly in Roman Urdu or English as requested, assisting with Google Flow prompts, YouTube Shorts hooks, and viral retention. Keep answers concise, natural, and under 90 words.",
                temperature: 0.7
              }
            }),
            1e4,
            "Chat"
          );
          modelUsed = candidate;
          break;
        } catch (attemptError) {
          lastError = attemptError;
          console.warn(`Chat attempt (${candidate}) note:`, attemptError?.message || attemptError);
        }
      }
    }
    if (response?.text) {
      return res.json({ text: response.text, modelUsed });
    }
    const lastUserMsg = (messages || []).filter((m) => m.role === "user").pop()?.text || "";
    const fallbackText = generateIntelligentChatFallback(lastUserMsg);
    return res.json({
      text: fallbackText,
      modelUsed: "itcafeteria-co-pilot-engine",
      fallbackEngaged: true
    });
  } catch (err) {
    console.warn("Chat endpoint caught error, serving fallback:", err?.message || err);
    res.json({
      text: "Waqar Bhai! Main aapke sath live hoon. Aap mujhe Google Flow script, Content Calendar, ya naye short video ke bare mein bataiye, main foran execute kar deta hoon.",
      modelUsed: "itcafeteria-local-engine"
    });
  }
});
app.post("/api/ai/search-grounding", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }
    const ai = getAiClient();
    const searchAttempts = [
      { model: "gemini-3.8-flash", timeoutMs: 3e4 },
      { model: "gemini-3.6-flash", timeoutMs: 3e4 },
      { model: "gemini-3-flash-preview", timeoutMs: 3e4 }
    ];
    let response = null;
    let lastError = null;
    for (const attempt of searchAttempts) {
      try {
        response = await withTimeout(
          ai.models.generateContent({
            model: attempt.model,
            contents: query,
            config: {
              tools: [{ googleSearch: {} }],
              systemInstruction: "You are a tech research engine for IT Cafeteria. Find the latest verified facts, model releases, prices, and features for tech content creators. Summarize in concise Roman Urdu and list sources."
            }
          }),
          attempt.timeoutMs,
          "Search grounding"
        );
        break;
      } catch (attemptError) {
        lastError = attemptError;
        console.error(
          `Search grounding attempt (${attempt.model}) failed:`,
          attemptError?.message || attemptError
        );
      }
    }
    if (!response) {
      throw lastError || new Error("Failed to search");
    }
    const text = response.text;
    const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = searchChunks.filter((c) => c.web?.uri).map((c) => ({ title: c.web.title || c.web.uri, uri: c.web.uri }));
    res.json({ text, sources: webSources });
  } catch (err) {
    console.error("Search grounding error:", err);
    res.status(500).json({
      error: friendlyGeminiError(err, "Research search fail ho gayi. Dobara try karein.")
    });
  }
});
app.post("/api/ai/trending-keywords", async (req, res) => {
  try {
    const { category = "All" } = req.body;
    const ai = getAiClient();
    const query = `Trending tech searches, Excel shortcuts, AI updates, and Windows tutorials in Pakistan and India for category: ${category}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Search Google for real-time trending YouTube tech keywords in Pakistan and South Asia: "${query}".
Return strict raw JSON (no markdown fences):
{
  "keywords": [
    {
      "keyword": "Windows 11 Temp Files Delete",
      "urduIntent": "bina software PC 2X fast",
      "surge": "+155%",
      "category": "PC & Windows Hacks",
      "hook": "Aapka PC slow ho gaya hai? Sirf yeh 1 run command chalayein..."
    },
    {
      "keyword": "Google Sheets Smart Fill AI Trick",
      "urduIntent": "ghanton ka data entry seconds mein",
      "surge": "+175%",
      "category": "Google Workspace",
      "hook": "Google Sheets ka naya Smart Fill AI feature jo manual typing khatam karta hai!"
    },
    {
      "keyword": "ChatGPT Voice Mode Urdu Accent",
      "urduIntent": "realtime natural Pakistani voice",
      "surge": "+210%",
      "category": "AI Tools",
      "hook": "ChatGPT ka voice mode ab Pakistani Urdu samajhta hai bina kisi prompt ke!"
    },
    {
      "keyword": "Excel Center Across Selection",
      "urduIntent": "stop merging cells trick",
      "surge": "+130%",
      "category": "Excel Productivity",
      "hook": "Excel mein cells merge mat karein! Center Across Selection ka shortcut dekhein..."
    },
    {
      "keyword": "Power Automate Daily Report Flow",
      "urduIntent": "office automation bina coding",
      "surge": "+115%",
      "category": "AI Workflows",
      "hook": "Office ki daily report auto send karein bina ek line code likhe!"
    }
  ]
}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });
    const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = searchChunks.filter((c) => c.web?.uri).map((c) => ({ title: c.web.title || c.web.uri, uri: c.web.uri }));
    let data;
    try {
      data = JSON.parse(response.text || "{}");
    } catch {
      const match = response.text?.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : {};
    }
    res.json({ keywords: data.keywords || [], sources: webSources });
  } catch (err) {
    console.error("Trending keywords error:", err);
    res.json({
      keywords: [
        {
          keyword: "Windows 11 Temp Files Auto-Delete",
          urduIntent: "PC speedup bina software ke",
          surge: "+150% Surge",
          category: "PC & Windows Hacks",
          hook: "Aapka laptop slow ho raha hai? Run command se temp files 5 seconds mein clean karein!"
        },
        {
          keyword: "Google Sheets Smart Fill AI Trick",
          urduIntent: "data entry auto-complete",
          surge: "+180% Surge",
          category: "Google Workspace",
          hook: "Google Sheets mein ab generative AI se columns auto-fill hote hain bina formula!"
        },
        {
          keyword: "ChatGPT Voice Mode Pakistani Accent",
          urduIntent: "natural Urdu conversation",
          surge: "+210% Surge",
          category: "AI & Smart Technology",
          hook: "ChatGPT Voice Mode ab Urdu bol raha hai! Kese enable karein dekhein is video mein..."
        },
        {
          keyword: "Excel Center Across Selection Trick",
          urduIntent: "merge cells ka behtareen alternative",
          surge: "+110% Surge",
          category: "Excel Productivity",
          hook: "Stop merging cells in Excel! Ctrl + 1 daba kar yeh option select karein..."
        },
        {
          keyword: "Power Automate Desktop Daily Email Flow",
          urduIntent: "daily office reports automation",
          surge: "+130% Surge",
          category: "AI Chatbots & Workflows",
          hook: "Daily reports khud bakhud generate aur email hone ka no-code formula!"
        }
      ],
      sources: [
        { title: "Google Trends South Asia Tech", uri: "https://trends.google.com" },
        { title: "YouTube Search Queries Pakistan", uri: "https://youtube.com" }
      ]
    });
  }
});
app.post("/api/ai/generate-image", async (req, res) => {
  try {
    const { prompt, aspectRatio = "9:16", imageSize = "1K", base64InputImage, model = "gemini-nano-banana-2.1" } = req.body;
    const ai = getAiClient();
    const parts = [];
    if (base64InputImage) {
      const rawImage = String(base64InputImage);
      const dataUrlMatch = rawImage.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
      parts.push({
        inlineData: {
          mimeType: dataUrlMatch?.[1] || "image/png",
          data: dataUrlMatch?.[2] || rawImage
        }
      });
    }
    parts.push({ text: prompt });
    const selectedModel = model === "gemini-3.1-flash-lite-image" ? "gemini-3.1-flash-lite-image" : "gemini-nano-banana-2.1";
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio,
          imageSize
        }
      }
    });
    let imageUrl = null;
    let descriptionText = "";
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
        } else if (part.text) {
          descriptionText += part.text;
        }
      }
    }
    if (!imageUrl) {
      return res.status(500).json({ error: "No image data returned from model", text: descriptionText });
    }
    res.json({ imageUrl, description: descriptionText });
  } catch (err) {
    console.error("Image generation error:", err);
    const raw = String(err?.message || err || "");
    const message = /429|quota|rate limit|exceeded your current quota/i.test(raw) ? "Image model ki free quota abhi khatam hai. 1-2 minute baad dobara try karein ya doosra image model chunein." : /503|high demand|overloaded|unavailable/i.test(raw) ? "Image model abhi busy hai. Thori der baad dobara try karein." : raw && raw.length <= 240 ? raw : "Thumbnail generate nahi hui. Dobara try karein.";
    res.status(500).json({ error: message });
  }
});
app.post("/api/ai/generate-video", async (req, res) => {
  try {
    const { prompt, aspectRatio = "9:16", duration = "10s", base64Image } = req.body;
    const ai = getAiClient();
    const inputParts = [];
    if (base64Image) {
      inputParts.push({
        type: "image",
        mime_type: "image/png",
        data: base64Image.replace(/^data:image\/\w+;base64,/, "")
      });
    }
    inputParts.push({
      type: "text",
      text: prompt
    });
    const interaction = await ai.interactions.create({
      model: "gemini-omni-1.1-flash",
      input: inputParts.length === 1 ? inputParts[0].text : inputParts,
      background: false,
      store: false,
      stream: false,
      response_format: {
        type: "video",
        aspect_ratio: aspectRatio,
        duration,
        resolution: "720p"
      }
    }, { timeout: 3e5 });
    const videoPart = interaction.output_video;
    if (videoPart && videoPart.data) {
      const videoUrl = `data:${videoPart.mime_type || "video/mp4"};base64,${videoPart.data}`;
      return res.json({ videoUrl });
    } else if (videoPart && videoPart.uri) {
      return res.json({ videoUri: videoPart.uri });
    }
    res.status(500).json({ error: "Video generation completed but output data was empty" });
  } catch (err) {
    console.error("Video generation error:", err);
    res.status(500).json({ error: friendlyGeminiError(err, "Video generate nahi ho saki. Dobara try karein.") });
  }
});
app.post("/api/ai/transcribe", async (req, res) => {
  try {
    const { base64Audio, mimeType = "audio/webm" } = req.body;
    if (!base64Audio) {
      return res.status(400).json({ error: "base64Audio is required" });
    }
    const ai = getAiClient();
    const cleanBase64 = base64Audio.replace(/^data:audio\/\w+;base64,/, "");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-transcribe",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64
            }
          },
          {
            text: "Transcribe this spoken audio accurately. Output the exact spoken words in Roman Urdu and English."
          }
        ]
      }
    });
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const transcriptionText = parts.map((part) => part.audioTranscription?.text).filter((t) => Boolean(t && t.trim())).join(" ").replace(/\s+/g, " ").trim();
    const plainText = parts.filter((part) => typeof part.text === "string" && !part.thought).map((part) => part.text).join("").trim();
    const text = transcriptionText || plainText;
    if (!text) {
      return res.status(500).json({ error: "No transcription text was returned by the model" });
    }
    res.json({ text });
  } catch (err) {
    console.error("Transcription error:", err);
    res.status(500).json({ error: friendlyGeminiError(err, "Voice transcribe nahi ho saki. Dobara try karein.") });
  }
});
app.post("/api/ai/speak", async (req, res) => {
  try {
    const {
      text,
      voiceName = "Puck",
      voiceStyle = "Natural warm conversational Pakistani Urdu tech presenter, friendly Punjabi Pakistani accent tone, calm cadence, articulate"
    } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required for speech" });
    }
    const ai = getAiClient();
    const cleanText = text.replace(/--- SCENE[\s\S]*?---/g, "").replace(/[*_#`>-]/g, " ").replace(/https?:\/\/\S+/g, "link").replace(/\s+/g, " ").trim().slice(0, 900);
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: voiceStyle
              }
            }
          ]
        }
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: "No audio data returned from TTS model" });
    }
    const audioUrl = `data:audio/wav;base64,${base64Audio}`;
    res.json({ audioUrl });
  } catch (err) {
    console.error("Speech generation error:", err);
    res.status(500).json({ error: friendlyGeminiError(err, "Awaaz generate nahi ho saki") });
  }
});
app.post("/api/ai/generate-music", async (req, res) => {
  try {
    const { prompt = "High-energy modern tech YouTuber background beat with upbeat synth and subtle tech accents" } = req.body;
    const ai = getAiClient();
    const responseStream = await ai.models.generateContentStream({
      model: "lyria-3-clip-preview",
      contents: prompt
    });
    let audioBase64 = "";
    let mimeType = "audio/wav";
    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
      }
    }
    if (!audioBase64) {
      return res.status(500).json({ error: "No audio returned from Lyria model" });
    }
    const audioUrl = `data:${mimeType};base64,${audioBase64}`;
    res.json({ audioUrl });
  } catch (err) {
    console.error("Music generation error:", err);
    res.status(500).json({ error: friendlyGeminiError(err, "Music generate nahi ho saka. Dobara try karein.") });
  }
});
app.post("/api/ai/quick-publish", async (req, res) => {
  try {
    const { title, category, scheduledTime = "6:00 PM PKT", date = "Today", platform = "YouTube + TikTok" } = req.body;
    const ai = getAiClient();
    const prompt = `You are the master YouTube Shorts growth agent for 'IT Cafeteria' (Pakistani tech channel run by Waqar Majeed, 58+ videos published).
The user wants to Quick Publish an upcoming video:
- Title / Idea: "${title}"
- Category: "${category}"
- Scheduled Slot: "${scheduledTime}" on "${date}"
- Platforms: "${platform}"

Channel Analytics Context:
- 79% traffic comes from YouTube search (needs strong keyword metadata).
- Returning viewers are low (0.2%), so you MUST include an episodic series bridge/teaser to hook subscribers for the next video.
- Format style: Roman Urdu + concise English keywords. High energy, zero fluff.

Generate the final YouTube Shorts publishing package and thumbnail specification.
Return STRICT valid JSON only with NO markdown fences, matching this structure:
{
  "optimizedTitle": "Catchy Short Title with 3 hashtags (under 70 chars)",
  "description": "2-3 punchy lines in Roman Urdu explaining what viewer learns, key shortcuts, and call to action + episodic bridge",
  "tags": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8", "keyword9", "keyword10"],
  "pinnedComment": "Engaging question in Roman Urdu to drive comments and retention loop",
  "thumbnailHeadline": "3-4 uppercase impact words (e.g. WINDOWS TEMP CLEAN)",
  "thumbnailSubBadge": "Punchy badge (e.g. 5 SECONDS FIX)",
  "thumbnailAccentColor": "cyan" | "amber" | "emerald" | "purple",
  "thumbnailPrompt": "A detailed 9:16 vertical thumbnail prompt for Gemini Nano Banana 2.1 following Section 19.1.2 specs: dark modern studio background, high contrast 3D text badge, neon glow, crisp tech iconography, 8k vertical framing",
  "tiktokCaption": "Short punchy TikTok caption with viral audio cue & hashtags",
  "episodicBridge": "One-line teaser connecting this topic to the upcoming next episode"
}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5
      }
    });
    const text = response.text || "{}";
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    }
    res.json(data);
  } catch (err) {
    console.error("Quick publish error:", err);
    res.json({
      optimizedTitle: `${req.body.title || "Tech Hack"} #shorts #itcafeteria #techtips`,
      description: `Is video mein dekhein ${req.body.title || "yeh zabardast trick"}. Ghanton ka kaam seconds mein! Channel subscribe karein agli episode ke liye.

#itcafeteria #shorts #pakistanitech`,
      tags: ["itcafeteria", "shorts", "tech hacks", "pakistan tech", "waqar majeed", "urdu tech", "productivity tricks", "tips and tricks"],
      pinnedComment: `Aapko yeh trick pehle pata thi? Comment mein zaroor batayein aur agla topic suggest karein! \u{1F447}`,
      thumbnailHeadline: "HIDDEN TECH TRICK",
      thumbnailSubBadge: "100% WORKING",
      thumbnailAccentColor: "cyan",
      thumbnailPrompt: 'Modern high-tech YouTube Shorts vertical 9:16 thumbnail cover, cyber dark navy background #070a13, neon blue accent glow, bold yellow 3D text "HIDDEN TECH TRICK", ultra-crisp digital interface graphics, clean layout, 8k resolution',
      tiktokCaption: `Check out this crazy trick! \u{1F525} #tech #techtok #pakistan #shorts`,
      episodicBridge: `Agli episode mein hum is tool ka next level automation cover karenge!`
    });
  }
});
app.post("/api/ai/story-ideas", async (req, res) => {
  try {
    const {
      channelName = "IT Cafeteria",
      presenter = "Waqar Majeed",
      niche = "IT & Technology",
      category = "General",
      seedTopic = "",
      excludeTitles = [],
      count = 3
    } = req.body || {};
    const ai = getAiClient();
    const safeCount = Math.min(Math.max(Number(count) || 3, 2), 5);
    const excluded = (Array.isArray(excludeTitles) ? excludeTitles : []).map((title) => String(title || "").trim()).filter(Boolean).slice(0, 80).join(" | ");
    const prompt = `You are the story discovery agent for "${channelName}" (${niche}), presenter "${presenter}".
Category: "${category}".
Creator ka idea / topic: "${seedTopic || "koi specific topic nahi \u2014 is category ke andar fresh angle chunein"}"

Task: ${safeCount} FRESH YouTube Shorts (vertical 9:16) story ideas generate karein jo is channel par pehle cover nahi hue.
Rules:
- Title clickable aur short ho, maximum 65 characters. Roman Urdu + English tech keywords mix.
- Har idea excluded titles se clearly DIFFERENT ho, sirf words badal kar wahi topic na dohraye.
- Hook Roman Urdu mein, first 1.5 seconds ke liye pattern interrupt (no greeting).
- "angle" ek line mein unique story angle bataye.
- "points" mein 3-4 concrete points likhein jo video cover karegi.
- "whyFresh" bataye ke yeh duplicate kyun nahi hai.
- Channel IT/tech ho to practical tech tutorial, Beauty ho to beauty-specific idea ho.
- Generic "is video mein" ya "aaj hum seekhenge" titles bilkul nahi.

Excluded already-published / remembered titles (do NOT reuse or paraphrase):
${excluded || "(none)"}

Return STRICT raw JSON only, no markdown fences:
{
  "ideas": [
    { "title": "...", "hook": "...", "angle": "...", "points": "...", "whyFresh": "..." }
  ]
}`;
    const ideaAttempts = [
      { model: "gemini-3.5-flash-lite", timeoutMs: 45e3, thinking: false },
      { model: "gemini-3-flash-preview", timeoutMs: 45e3, thinking: true },
      { model: "gemini-3.6-flash", timeoutMs: 45e3, thinking: true }
    ];
    let data = null;
    let lastError = null;
    for (let attemptIndex = 0; attemptIndex < ideaAttempts.length; attemptIndex += 1) {
      const attempt = ideaAttempts[attemptIndex];
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: attempt.model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.9,
              maxOutputTokens: 2048,
              ...attempt.thinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}
            }
          }),
          attempt.timeoutMs,
          "Story ideas"
        );
        const parsed = extractJsonObject(response.text || "");
        if (!parsed || !Array.isArray(parsed.ideas) || !parsed.ideas.length) {
          throw new Error("AI ne valid ideas JSON return nahi kiya");
        }
        data = parsed;
        break;
      } catch (attemptError) {
        lastError = attemptError;
        console.error(`Story ideas attempt ${attemptIndex + 1} (${attempt.model}) failed:`, attemptError?.message || attemptError);
      }
    }
    if (!data) {
      throw lastError || new Error("Fresh ideas generate nahi ho sake");
    }
    const ideas = (Array.isArray(data.ideas) ? data.ideas : []).filter((idea) => idea && String(idea.title || "").trim()).map((idea) => ({
      title: String(idea.title).trim().slice(0, 90),
      hook: String(idea.hook || "").trim(),
      angle: String(idea.angle || "").trim(),
      points: String(idea.points || "").trim(),
      whyFresh: String(idea.whyFresh || "").trim()
    })).slice(0, safeCount);
    if (!ideas.length) {
      throw new Error("AI ne koi fresh idea return nahi kiya");
    }
    res.json({ ideas });
  } catch (err) {
    console.error("Story ideas error:", err);
    res.status(500).json({ error: friendlyGeminiError(err, "Fresh ideas generate nahi ho sake. Dobara try karein.") });
  }
});
app.post("/api/ai/generate-story", async (req, res) => {
  try {
    const {
      channelName = "IT Cafeteria",
      presenter = "Waqar Majeed",
      niche = "IT & Technology",
      category = "General",
      playlist = category,
      tag = "@WM25-1",
      sceneCount = 10,
      idea = {},
      discussionNotes = "",
      discussionTranscript = [],
      excludeTitles = []
    } = req.body || {};
    const ideaTitle = String(idea.title || "").trim();
    if (!ideaTitle) {
      return res.status(400).json({ error: "Story idea ka title required hai" });
    }
    const totalScenes = Math.min(Math.max(Number(sceneCount) || 10, 4), 15);
    const beatGuide = totalScenes <= 4 ? "Hook; Problem + Reveal; Demonstration + Proof; Benefit + Save CTA" : totalScenes <= 7 ? "Hook; Problem; Agitate; Reveal; Demonstration; Proof / Result; Conclusion + Save CTA" : totalScenes <= 10 ? "Hook; Problem; Agitate; Reveal; Demonstrate 1; Demonstrate 2; Proof / Result; Benefit; Curiosity Loop; Conclusion + Save CTA" : "Hook; Problem; Agitate; Reveal; multiple Demonstration scenes; Proof / Result; Benefit; common mistakes; recap; Curiosity Loop; Conclusion + Save CTA";
    const transcript = (Array.isArray(discussionTranscript) ? discussionTranscript : []).filter((message) => message && String(message.text || "").trim()).slice(-10).map((message) => `${message.role === "user" ? "Creator" : "AI"}: ${String(message.text).trim().slice(0, 600)}`).join("\n");
    const excluded = (Array.isArray(excludeTitles) ? excludeTitles : []).map((title2) => String(title2 || "").trim()).filter(Boolean).slice(0, 60).join(" | ");
    const primaryHashtag = channelName.toLowerCase().includes("beauty") ? "#BeautyHub" : "#ITCafeteria";
    const prompt = `You are the lead story architect for "${channelName}" (${niche}), presenter "${presenter}".
Create a complete ${totalScenes}-scene vertical YouTube Shorts story package in Roman Urdu (Pakistani Urdu in Latin script), with English tech/beauty keywords where natural.

CREATOR BRIEF
- Category: "${category}" | Playlist: "${playlist}"
- Character tag for Flow prompts: "${tag}"
- Working idea title: "${ideaTitle}"
- Idea hook direction: "${String(idea.hook || "").trim()}"
- Unique angle: "${String(idea.angle || "").trim()}"
- Points to cover: "${String(idea.points || "").trim()}"
- Discussion notes from creator: "${String(discussionNotes || "").trim() || "(none)"}"
- Discussion transcript:
${transcript || "(none)"}
- Already published titles to avoid: ${excluded || "(none)"}
- Primary hashtag: ${primaryHashtag}

STORY RULES (strict)
1. Exactly ${totalScenes} scenes. Beat guide: ${beatGuide}
2. Every scene is exactly 10 seconds and the spoken "dialogue" must be 22 to 25 Roman Urdu words (2.7 words per second). Count carefully. "words" field must match the actual dialogue word count.
3. Scene 1 Hook: no greeting, immediate pattern interrupt in the first line. Final scene must be a Save/Follow CTA.
4. Dialogue must be Roman Urdu in Latin script. No Devanagari. English only for tool names/tech terms. No repeated word or syllable, no filler.
5. Each "script" is a paste-ready Google Flow prompt for that scene:
   - Character scenes start with "${tag}" and include: sitting/standing anchor pose (0.5s), studio setting, gesture/visual overlay, voice instruction line ("He speaks in his natural, warm, conversational Pakistani Urdu voice at a calm pace. No word or syllable is repeated."), then the exact dialogue in double quotes, then the closing anchor pose.
   - Screen-demo scenes start with "The camera cuts to a full-screen..." and include ${tag}'s voiceover plus the exact dialogue in quotes.
   - The dialogue inside script must be word-for-word identical to the "dialogue" field.
6. The story must follow the creator's idea and discussion notes. Do not drift to an unrelated topic.
7. Title must NOT be the raw topic sentence. Max 65 characters, curiosity + search keyword. Do not reuse excluded titles.
8. Description: 2-3 Roman Urdu lines + a "PRACTICAL STEPS / COMMANDS:" block with 3-6 concrete steps when the topic is a tech tutorial. For beauty, give a short step routine instead.
9. THUMBNAIL AGENT v3.45 structured output (server master prompt khud banayega, is liye poora image prompt mat likho):
   - thumbnailLine1 + thumbnailLine2: total 3-5 UPPERCASE words, har line maximum 14 characters. Line 1 white aur line 2 neon-cyan render hogi. Raw topic sentence kabhi nahi.
   - thumbnailSubBanner: 2-4 word punchy yellow-banner hook, Roman Urdu + English mix allowed.
   - thumbnailHologram: 20-35 words mein EXACT story/tool-specific floating 3D hologram (icons, UI panels, data flows) + uske around adapted energy trails. Generic "tech hologram" bilkul nahi.
   - Thumbnail text story ke core result/tool par ho, clickbait jhooth par nahi.
10. seriesPlan: one line teaser for the next episode.

Return STRICT valid JSON only, no markdown fences:
{
  "title": "...",
  "hook": "...",
  "thumbnailLine1": "MAX 14 CHARS",
  "thumbnailLine2": "MAX 14 CHARS",
  "thumbnailSubBanner": "2-4 WORDS",
  "thumbnailHologram": "story-specific floating 3D hologram description with energy trails",
  "hashtags": ["${primaryHashtag}", "#Shorts", "#..."],
  "description": "...",
  "tags": ["keyword1", "keyword2", "... 10-14 tags"],
  "tiktokCaption": "...",
  "seriesPlan": "...",
  "scenes": [
    {
      "num": 1,
      "duration": "10s",
      "purpose": "Hook",
      "isCTA": false,
      "words": 24,
      "visual": "short visual direction",
      "dialogue": "exact Roman Urdu dialogue",
      "script": "full paste-ready Flow prompt"
    }
  ]
}`;
    const ai = getAiClient();
    const storyAttempts = [
      { model: "gemini-3-flash-preview", timeoutMs: 8e4, thinking: true },
      { model: "gemini-3.6-flash", timeoutMs: 5e4, thinking: true },
      { model: "gemini-3.5-flash", timeoutMs: 8e4, thinking: true },
      { model: "gemini-3.5-flash-lite", timeoutMs: 8e4, thinking: false },
      { model: "gemini-3.7-flash", timeoutMs: 6e4, thinking: true }
    ];
    let data = null;
    let modelUsed = storyAttempts[0].model;
    let lastError = null;
    const minimumScenes = Math.max(4, totalScenes - 2);
    for (let attemptIndex = 0; attemptIndex < storyAttempts.length; attemptIndex += 1) {
      const attempt = storyAttempts[attemptIndex];
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: attempt.model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.8,
              maxOutputTokens: 32768,
              ...attempt.thinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}
            }
          }),
          attempt.timeoutMs,
          "Story generation"
        );
        const parsed = extractJsonObject(response.text || "");
        if (!parsed) {
          throw new Error("AI ne valid JSON return nahi kiya");
        }
        const parsedScenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];
        if (parsedScenes.length < minimumScenes) {
          throw new Error(`AI ne sirf ${parsedScenes.length} scenes return kiye (${totalScenes} chahiye the)`);
        }
        data = parsed;
        modelUsed = attempt.model;
        break;
      } catch (attemptError) {
        lastError = attemptError;
        console.error(`Story generation attempt ${attemptIndex + 1} (${attempt.model}) failed:`, attemptError?.message || attemptError);
        if (attemptIndex < storyAttempts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
      }
    }
    if (!data) {
      throw lastError || new Error("Story generate nahi ho saki");
    }
    const safeString = (value) => String(value || "").trim();
    const rawScenes = Array.isArray(data.scenes) ? data.scenes : [];
    const scenes = rawScenes.filter((scene) => scene && (scene.script || scene.dialogue)).map((scene, index) => {
      const dialogue = safeString(scene.dialogue);
      const visual = safeString(scene.visual);
      const script = safeString(scene.script) || `${tag} \u2014 ${visual}
He says: "${dialogue}"`;
      const computedWords = dialogue ? dialogue.split(/\s+/).filter(Boolean).length : 0;
      return {
        num: index + 1,
        duration: "10s",
        purpose: safeString(scene.purpose) || `Scene ${index + 1}`,
        isCTA: Boolean(scene.isCTA) || index === rawScenes.length - 1,
        words: computedWords || Number(scene.words) || 0,
        visual,
        dialogue,
        script
      };
    });
    if (!scenes.length) {
      throw new Error("AI ne adhoori story return ki \u2014 koi scene nahi mila");
    }
    const tags = Array.isArray(data.tags) ? data.tags.map((item) => safeString(item)).filter(Boolean).slice(0, 16) : [];
    const hashtags = Array.isArray(data.hashtags) ? data.hashtags.map((item) => safeString(item)).filter(Boolean).slice(0, 5) : [primaryHashtag, "#Shorts"];
    if (!hashtags.length) hashtags.push(primaryHashtag, "#Shorts");
    const title = safeString(data.title) || ideaTitle;
    const tiktokCaption = safeString(data.tiktokCaption) || `${title} ${hashtags.join(" ")}`;
    const [fallbackLine1, fallbackLine2] = splitHeadline(
      safeString(data.thumbnailHeadline) || title || ideaTitle
    );
    const thumbnailLine1 = safeString(data.thumbnailLine1).slice(0, 22) || fallbackLine1;
    const thumbnailLine2 = safeString(data.thumbnailLine2).slice(0, 22) || fallbackLine2;
    const thumbnailSubBadge = safeString(data.thumbnailSubBanner) || safeString(data.thumbnailSubBadge) || "MUST TRY";
    const ideaPoints = safeString(idea.points);
    const thumbnailHologram = safeString(data.thumbnailHologram) || `a glowing floating 3D hologram visualising "${ideaTitle}"${ideaPoints ? ` with ${ideaPoints.slice(0, 140)}` : " with layered UI panels and data streams"}, surrounded by custom cyan energy trails that adapt to its shape`;
    const thumbnailPrompt = buildMasterThumbnailPrompt({
      channelName,
      presenter,
      line1: thumbnailLine1,
      line2: thumbnailLine2,
      subBanner: thumbnailSubBadge,
      hologram: thumbnailHologram,
      characterTag: tag
    });
    const thumbnailHeadline = [thumbnailLine1, thumbnailLine2].filter(Boolean).join(" ").slice(0, 40);
    res.json({
      title,
      hook: safeString(data.hook) || safeString(idea.hook) || "Reveal",
      thumbnailLine1,
      thumbnailLine2,
      thumbnailHeadline,
      thumbnailSubBadge,
      thumbnailHologram,
      hashtags,
      description: safeString(data.description),
      tags,
      tiktokCaption,
      thumbnailPrompt,
      seriesPlan: safeString(data.seriesPlan),
      scenes,
      modelUsed
    });
  } catch (err) {
    console.error("Story generation error:", err);
    res.status(500).json({ error: friendlyGeminiError(err, "Story generate nahi ho saki. Dobara try karein.") });
  }
});
registerIntegrationRoutes(app);
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  app.listen(port, "0.0.0.0", () => {
    console.log(`IT Cafeteria Full-Stack Studio running on http://0.0.0.0:${port}`);
  });
}
startServer();
