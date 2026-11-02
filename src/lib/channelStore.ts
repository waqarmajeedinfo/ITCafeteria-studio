import { CHANNEL_PROFILES, type ChannelProfile } from '../data/channelData';

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
        // Ensure itcafeteria has @WM25-6 in its tags if present in storage
        if (parsed.itcafeteria && Array.isArray(parsed.itcafeteria.tags)) {
          const hasWM6 = parsed.itcafeteria.tags.some((t: any) => t.value === '@WM25-6');
          if (!hasWM6) {
            parsed.itcafeteria.tags.push({
              value: '@WM25-6',
              label: '@WM25-6 (Signature Studio / Black Jacket)'
            });
            saveAllChannels(parsed);
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

export function addTagToChannel(channelId: string, newTag: { value: string; label: string; imagePath?: string }) {
  const current = loadAllChannels();
  const targetChannel = current[channelId] || DEFAULT_CHANNELS[channelId];
  if (!targetChannel) return current;

  const existingTags = targetChannel.tags || [];
  const tagExists = existingTags.some(t => t.value.toLowerCase() === newTag.value.toLowerCase());
  
  const updatedTags = tagExists
    ? existingTags.map(t => t.value.toLowerCase() === newTag.value.toLowerCase() ? newTag : t)
    : [...existingTags, newTag];

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
    const previous = loadAllChannels();
    saveHistoryState(previous);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(channels));
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

