import { CHANNEL_PROFILES, CATEGORIES_IT_CAFETERIA, type ChannelProfile, type ChannelTagVariant } from '../data/channelData';
import { pushStudioStatePatch, isHydratingRemoteState } from './studioSyncStore';

const STORAGE_KEY = 'itcafeteria_channels_store_v2';
const HISTORY_KEY = 'itcafeteria_channels_history_v2';

export interface ChannelEngineConfig {
  channelId: string;
  baselineTag: string;
  defaultSceneCount: number;
  duplicateStrictness: 'deep' | 'balanced' | 'strict' | 'relaxed' | string;
  dialectTone: string;
  lockPersonaAcrossScenes: boolean;
  autoQueueSync: boolean;
  flowPromptFormat: string;
  customInstructions: string;
  presenterPersonaPrompt?: string;
  targetAudience?: string;
  nicheKeywords?: string[];
  autonomousPriority?: 'URGENT' | 'HIGH' | 'NORMAL';
  aspectRatio?: '9:16' | '16:9';
  searchGroundingRules?: string;
}

export interface ExtendedChannelProfile extends ChannelProfile {
  isCustom?: boolean;
  platform?: string;
  hasCharacterTag?: boolean;
  aspectRatio?: '9:16' | '16:9';
  engineConfig?: ChannelEngineConfig;
}

export const DEFAULT_ENGINE_CONFIGS: Record<string, ChannelEngineConfig> = {
  itcafeteria: {
    channelId: 'itcafeteria',
    baselineTag: '@WM25-1',
    defaultSceneCount: 10,
    duplicateStrictness: 'deep',
    dialectTone: 'workshop',
    lockPersonaAcrossScenes: true,
    autoQueueSync: true,
    flowPromptFormat: 'split_screen',
    customInstructions:
      'High-stakes urgent tone in Roman Urdu. Structure: Shocking security/productivity warning or myth reveal, Live proof of why users are at risk, Root cause explanation, 1-Click fix & prevention step, Post-fix verification test, Interactive viewer question, Subscribe CTA.',
    presenterPersonaPrompt: 'Waqar Majeed (IT Cafeteria) — authoritative Pakistani tech creator, practical tips, fluent Roman Urdu.',
    targetAudience: 'Tech enthusiasts, office workers, students, Windows & AI users',
    nicheKeywords: ['windows 11', 'pc hacks', 'chatgpt', 'gemini', 'power automate', 'google sheets', 'secrets'],
    autonomousPriority: 'HIGH',
    aspectRatio: '9:16',
    searchGroundingRules: 'Prioritize latest Microsoft Windows updates, Google Gemini/OpenAI breakthrough features, and verified productivity shortcuts.'
  },
  beautyhub: {
    channelId: 'beautyhub',
    baselineTag: '@MZ22-1',
    defaultSceneCount: 10,
    duplicateStrictness: 'balanced',
    dialectTone: 'beauty_friendly',
    lockPersonaAcrossScenes: true,
    autoQueueSync: true,
    flowPromptFormat: 'aesthetic_soft_glam',
    customInstructions:
      'Warm, friendly sisterly tone in natural conversational Urdu/English mix for beauty and grooming. Structure: Relatable daily beauty mistake/problem hook (0-10s), Root skin/hair cause, 3-step easy home fix or routine, Before/After proof, Pro tip, Audience question in comments, Subscribe CTA.',
    presenterPersonaPrompt: 'Mehr Zadi (Beauty Hub) — friendly beauty & grooming advisor, warm elder sister advice, approachable.',
    targetAudience: 'Women and youth looking for daily skincare, hair styling, bridal beauty tips, and budget product reviews',
    nicheKeywords: ['skincare routine', 'makeup hacks', 'haircare tips', 'bridal beauty', 'glow secrets', 'affordable beauty'],
    autonomousPriority: 'HIGH',
    aspectRatio: '9:16',
    searchGroundingRules: 'Focus on trending skincare ingredients (Hyaluronic, Niacinamide), bridal season looks, heatless hair hacks, and natural home remedies.'
  }
};

export const DEFAULT_CHANNELS: Record<string, ExtendedChannelProfile> = {
  itcafeteria: {
    ...CHANNEL_PROFILES.itcafeteria,
    isCustom: false,
    platform: 'YouTube + TikTok',
    hasCharacterTag: true,
    engineConfig: DEFAULT_ENGINE_CONFIGS.itcafeteria
  },
  beautyhub: {
    ...CHANNEL_PROFILES.beautyhub,
    isCustom: false,
    platform: 'YouTube Shorts',
    hasCharacterTag: true,
    engineConfig: DEFAULT_ENGINE_CONFIGS.beautyhub
  }
};

export function loadAllChannels(): Record<string, ExtendedChannelProfile> {
  if (typeof window === 'undefined') return DEFAULT_CHANNELS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        let modified = false;

        // Ensure itcafeteria has all 9 official @WM25 tags in its tags if present in storage
        if (parsed.itcafeteria) {
          if (!Array.isArray(parsed.itcafeteria.tags)) {
            parsed.itcafeteria.tags = CHANNEL_PROFILES.itcafeteria.tags;
            modified = true;
          } else {
            const officialTags = CHANNEL_PROFILES.itcafeteria.tags;
            for (const off of officialTags) {
              const existingIdx = parsed.itcafeteria.tags.findIndex((t: any) => t.value.toLowerCase() === off.value.toLowerCase());
              if (existingIdx === -1) {
                parsed.itcafeteria.tags.push({ ...off });
                modified = true;
              } else {
                // Ensure official aspect ratios are preserved/restored if missing
                if (!parsed.itcafeteria.tags[existingIdx].aspectRatios) {
                  parsed.itcafeteria.tags[existingIdx].aspectRatios = off.aspectRatios;
                  modified = true;
                }
                if (!parsed.itcafeteria.tags[existingIdx].path && off.path) {
                  parsed.itcafeteria.tags[existingIdx].path = off.path;
                  modified = true;
                }
              }
            }
          }

          // Ensure itcafeteria categories strictly match the official 10 categories from Image 2
          const isCorrupted = !Array.isArray(parsed.itcafeteria.categories) ||
            parsed.itcafeteria.categories.length !== 10 ||
            parsed.itcafeteria.categories.some((c: any) => c.name === 'Google' || c.name === 'Windows' || c.name.includes('etc.)') || c.name === 'Secrets (WhatsApp');

          if (isCorrupted) {
            parsed.itcafeteria.categories = CATEGORIES_IT_CAFETERIA.map(({ id, name, playlist, details, special }) => ({ id, name, playlist, details, special }));
            parsed.itcafeteria.rotationCategoryIds = [1, 2, 3, 4, 5, 6, 7, 8];
            parsed.itcafeteria.categoryRules = CHANNEL_PROFILES.itcafeteria.categoryRules;
            modified = true;
          }

          if (modified) {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            } catch {}
          }
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading channels', e);
  }

  return DEFAULT_CHANNELS;
}

/**
 * Filters a channel's tags by the active aspect ratio ('9:16' or '16:9').
 * Strictly follows explicit tag metadata; never guesses from the tag name.
 */
export function filterTagsByAspectRatio(
  tags: ChannelTagVariant[],
  ratio: '9:16' | '16:9' = '9:16'
): ChannelTagVariant[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter(tag => {
    if (tag.aspectRatios && Array.isArray(tag.aspectRatios) && tag.aspectRatios.length > 0) {
      return tag.aspectRatios.includes(ratio);
    }
    // Fallback if tag was created without explicit ratios: default to 9:16
    return ratio === '9:16';
  });
}

export function updateTagInChannel(
  channelId: string,
  tagValue: string,
  updates: Partial<ChannelTagVariant>
) {
  const current = loadAllChannels();
  const targetChannel = current[channelId] || DEFAULT_CHANNELS[channelId];
  if (!targetChannel || !Array.isArray(targetChannel.tags)) return current;

  const updatedTags = targetChannel.tags.map(t => {
    if (t.value.toLowerCase() === tagValue.toLowerCase()) {
      return { ...t, ...updates };
    }
    return t;
  });

  const updatedChannel: ExtendedChannelProfile = {
    ...targetChannel,
    tags: updatedTags
  };

  const updatedAll = {
    ...current,
    [channelId]: updatedChannel
  };

  saveAllChannels(updatedAll);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('itcafeteria_channels_updated', { detail: updatedAll }));
  }
  return updatedAll;
}

export function addTagToChannel(channelId: string, newTag: { value: string; label: string; imagePath?: string; aspectRatios?: ('9:16' | '16:9')[] }) {
  const current = loadAllChannels();
  const targetChannel = current[channelId] || DEFAULT_CHANNELS[channelId];
  if (!targetChannel) return current;

  const existingTags = targetChannel.tags || [];
  const tagExists = existingTags.some(t => t.value.toLowerCase() === newTag.value.toLowerCase());
  
  const formattedTag: ChannelTagVariant = {
    value: newTag.value,
    label: newTag.label,
    imagePath: newTag.imagePath,
    aspectRatios: newTag.aspectRatios || ['9:16']
  };

  const updatedTags = tagExists
    ? existingTags.map(t => t.value.toLowerCase() === newTag.value.toLowerCase() ? { ...t, ...formattedTag } : t)
    : [...existingTags, formattedTag];

  const updatedChannel: ExtendedChannelProfile = {
    ...targetChannel,
    tags: updatedTags
  };

  const updatedAll = {
    ...current,
    [channelId]: updatedChannel
  };

  saveAllChannels(updatedAll);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('itcafeteria_channels_updated', { detail: updatedAll }));
  }
  return updatedAll;
}

function saveHistoryState(currentChannels: Record<string, ExtendedChannelProfile>) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(currentChannels));
  } catch {}
}

export function saveAllChannels(channels: Record<string, ExtendedChannelProfile>) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      localStorage.setItem(HISTORY_KEY, raw);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(channels));
    if (!isHydratingRemoteState()) {
      pushStudioStatePatch({ channels }, 'channels_updated');
    }
  } catch (e) {
    console.error('Error saving channels', e);
  }
}

export function saveOrUpdateChannel(profile: ExtendedChannelProfile) {
  const current = loadAllChannels();
  const updated = {
    ...current,
    [profile.id]: profile
  };
  saveAllChannels(updated);
  return updated;
}

export function deleteChannel(channelId: string) {
  const current = loadAllChannels();
  const updated: Record<string, ExtendedChannelProfile> = {};
  Object.keys(current).forEach((key) => {
    if (key !== channelId) {
      updated[key] = current[key];
    }
  });
  saveAllChannels(updated);
  return updated;
}

export function undoLastChannelAction(): Record<string, ExtendedChannelProfile> | null {
  try {
    const historyRaw = localStorage.getItem(HISTORY_KEY);
    if (!historyRaw) return null;
    const historyState = JSON.parse(historyRaw);
    if (historyState && typeof historyState === 'object') {
      const current = loadAllChannels();
      // Swap history
      localStorage.setItem(HISTORY_KEY, JSON.stringify(current));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(historyState));
      return historyState;
    }
  } catch (e) {
    console.error('Error undoing channel action', e);
  }
  return null;
}

export function resetChannelsToDefault(): Record<string, ExtendedChannelProfile> {
  const current = loadAllChannels();
  saveHistoryState(current);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CHANNELS));
  return DEFAULT_CHANNELS;
}

const ENGINE_CONFIG_PREFIX = 'itcafeteria_engine_config_';

export function getDefaultEngineConfig(
  channelId: string,
  profile?: Partial<ExtendedChannelProfile>
): ChannelEngineConfig {
  if (DEFAULT_ENGINE_CONFIGS[channelId]) {
    return { ...DEFAULT_ENGINE_CONFIGS[channelId] };
  }

  const name = profile?.name || channelId;
  const presenter = profile?.presenter || name;
  const niche = profile?.niche || 'General Content';
  const tag = profile?.defaultTag || profile?.tags?.[0]?.value || '@Active';
  const sceneCount = profile?.defaultSceneCount || 10;
  const ratio = profile?.aspectRatio || '9:16';

  return {
    channelId,
    baselineTag: tag,
    defaultSceneCount: sceneCount,
    duplicateStrictness: 'balanced',
    dialectTone: 'formal',
    lockPersonaAcrossScenes: true,
    autoQueueSync: true,
    flowPromptFormat: 'cinematic_3d',
    customInstructions: `Channel rules for ${name} (${niche}) in Roman Urdu. Structure: High-impact hook (0-10s), problem/topic breakdown, practical step-by-step points, clear takeaways, audience question in comment CTA, subscribe outro.`,
    presenterPersonaPrompt: `${presenter} (${name}) — Expert creator in ${niche}, engaging and helpful in Roman Urdu.`,
    targetAudience: `Audience interested in ${niche}`,
    nicheKeywords: [niche.toLowerCase()],
    autonomousPriority: 'HIGH',
    aspectRatio: ratio,
    searchGroundingRules: `Prioritize latest trends, viral hooks, and verified practices in ${niche}.`
  };
}

export function getEngineConfigForChannel(channelId: string): ChannelEngineConfig {
  if (typeof window === 'undefined') {
    return getDefaultEngineConfig(channelId);
  }

  try {
    const raw = localStorage.getItem(`${ENGINE_CONFIG_PREFIX}${channelId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...getDefaultEngineConfig(channelId),
          ...parsed,
          channelId
        };
      }
    }

    // Check if channel profile in store has engineConfig
    const channels = loadAllChannels();
    if (channels[channelId]?.engineConfig) {
      return {
        ...getDefaultEngineConfig(channelId, channels[channelId]),
        ...channels[channelId].engineConfig,
        channelId
      };
    }
  } catch (e) {
    console.warn(`Error reading engine config for ${channelId}:`, e);
  }

  return getDefaultEngineConfig(channelId);
}

export function saveEngineConfigForChannel(
  channelId: string,
  updates: Partial<ChannelEngineConfig>
): ChannelEngineConfig {
  const current = getEngineConfigForChannel(channelId);
  const updated: ChannelEngineConfig = {
    ...current,
    ...updates,
    channelId
  };

  try {
    localStorage.setItem(`${ENGINE_CONFIG_PREFIX}${channelId}`, JSON.stringify(updated));

    // Also sync inside ExtendedChannelProfile in store
    const channels = loadAllChannels();
    if (channels[channelId]) {
      channels[channelId] = {
        ...channels[channelId],
        engineConfig: updated
      };
      saveAllChannels(channels);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('itcafeteria_engine_config_changed', {
          detail: { channelId, config: updated }
        })
      );
    }
  } catch (e) {
    console.error(`Error saving engine config for ${channelId}:`, e);
  }

  return updated;
}

export function resetEngineConfigForChannel(channelId: string): ChannelEngineConfig {
  const channels = loadAllChannels();
  const profile = channels[channelId];
  const fresh = getDefaultEngineConfig(channelId, profile);
  return saveEngineConfigForChannel(channelId, fresh);
}

