import { CHANNEL_PROFILES, type ChannelProfile } from '../data/channelData';

const STORAGE_KEY = 'itcafeteria_channels_store_v2';
const HISTORY_KEY = 'itcafeteria_channels_history_v2';

export interface ExtendedChannelProfile extends ChannelProfile {
  isCustom?: boolean;
  platform?: string;
  hasCharacterTag?: boolean;
  aspectRatio?: '9:16' | '16:9';
}

export const DEFAULT_CHANNELS: Record<string, ExtendedChannelProfile> = {
  itcafeteria: {
    ...CHANNEL_PROFILES.itcafeteria,
    isCustom: false,
    platform: 'YouTube + TikTok',
    hasCharacterTag: true
  },
  beautyhub: {
    ...CHANNEL_PROFILES.beautyhub,
    isCustom: false,
    platform: 'YouTube Shorts',
    hasCharacterTag: true
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
