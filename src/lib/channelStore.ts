import { CHANNEL_PROFILES, type ChannelProfile } from '../data/channelData';

const STORAGE_KEY = 'itcafeteria_channels_store_v1';

export interface ExtendedChannelProfile extends ChannelProfile {
  isCustom?: boolean;
  platform?: string;
}

export function loadAllChannels(): Record<string, ExtendedChannelProfile> {
  const baseChannels: Record<string, ExtendedChannelProfile> = {
    itcafeteria: { ...CHANNEL_PROFILES.itcafeteria, isCustom: false, platform: 'YouTube + TikTok' },
    beautyhub: { ...CHANNEL_PROFILES.beautyhub, isCustom: false, platform: 'YouTube Shorts' }
  };

  if (typeof window === 'undefined') return baseChannels;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const customChannels = JSON.parse(raw);
      if (customChannels && typeof customChannels === 'object') {
        return { ...baseChannels, ...customChannels };
      }
    }
  } catch (e) {
    console.error('Error loading custom channels', e);
  }

  return baseChannels;
}

export function saveCustomChannel(profile: ExtendedChannelProfile) {
  try {
    const all = loadAllChannels();
    const customOnly: Record<string, ExtendedChannelProfile> = {};

    Object.keys(all).forEach((key) => {
      if (all[key].isCustom) {
        customOnly[key] = all[key];
      }
    });

    customOnly[profile.id] = { ...profile, isCustom: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly));
  } catch (e) {
    console.error('Error saving custom channel', e);
  }
}

export function deleteCustomChannel(channelId: string) {
  try {
    const all = loadAllChannels();
    const customOnly: Record<string, ExtendedChannelProfile> = {};

    Object.keys(all).forEach((key) => {
      if (all[key].isCustom && key !== channelId) {
        customOnly[key] = all[key];
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly));
  } catch (e) {
    console.error('Error deleting custom channel', e);
  }
}
