export interface ThumbnailIdentity {
  channelName: string;
  presenter: string;
  tagline: string;
  deskProps: string;
}

export interface MasterThumbnailInput {
  channelName: string;
  presenter: string;
  line1: string;
  line2: string;
  subBanner: string;
  hologram: string;
  tagline?: string;
  deskProps?: string;
  characterTag?: string;
  hasReferenceImage?: boolean;
}

export interface StoryThumbnailSource {
  channelName: string;
  presenter: string;
  title: string;
  ideaTitle?: string;
  headline?: string;
  line1?: string;
  line2?: string;
  subBanner?: string;
  hologram?: string;
  characterTag?: string;
  hasReferenceImage?: boolean;
}

export interface ResolvedThumbnailSpec {
  identity: ThumbnailIdentity;
  line1: string;
  line2: string;
  subBanner: string;
  hologram: string;
  prompt: string;
}

const clean = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();

export function getThumbnailIdentity(channelName: string, presenter: string): ThumbnailIdentity {
  const isItCafeteria = /it\s*cafeteria/i.test(channelName);
  return isItCafeteria
    ? {
        channelName: channelName || 'IT Cafeteria',
        presenter: presenter || 'Waqar Majeed',
        tagline: 'Learn • Build • Grow',
        deskProps: 'neatly stacked technology books',
      }
    : {
        channelName: channelName || 'Beauty Hub',
        presenter: presenter || 'Mehr Zadi',
        tagline: 'Beauty • Style • Confidence',
        deskProps: 'neatly stacked beauty and styling boxes',
      };
}

export function splitHeadline(headline: string): [string, string] {
  const words = clean(headline)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.toUpperCase());

  if (!words.length) return ['TECH', 'TRICK'];
  if (words.length === 1) return [words[0].slice(0, 22), ''];

  const otherWords = words.slice(0, 7);
  const splitAt = Math.ceil(otherWords.length / 2);
  const line1 = otherWords.slice(0, splitAt).join(' ').slice(0, 22).trim();
  const line2 = otherWords.slice(splitAt).join(' ').slice(0, 22).trim();
  return [line1, line2 || otherWords[otherWords.length - 1]];
}

export function buildMasterThumbnailPrompt(input: MasterThumbnailInput): string {
  const identity = getThumbnailIdentity(input.channelName, input.presenter);
  const tagline = clean(input.tagline) || identity.tagline;
  const deskProps = clean(input.deskProps) || identity.deskProps;
  const characterTag = clean(input.characterTag) || 'selected character tag';
  const line1 = clean(input.line1) || 'TECH';
  const line2 = clean(input.line2);
  const subBanner = clean(input.subBanner) || 'MUST TRY';
  const hologram = clean(input.hologram) || 'a glowing 3D hologram visualising the story topic with layered interface panels and data streams';
  const headline = line2
    ? `top line "${line1}" in solid bright white, and bottom line "${line2}" in solid high-pop neon-cyan`
    : `the single headline "${line1}" in solid bright white with a neon-cyan lower rim`;
  const characterLock = input.hasReferenceImage
    ? `Use the ATTACHED reference image as the exact identity reference for ${identity.presenter}: match the face, hair, skin tone, body proportions and the exact outfit from that image. Do not restyle the character or substitute a different person, hairstyle or clothing.`
    : `Match ${identity.presenter}'s official look for character tag "${characterTag}" (face, hair and outfit). If a reference image for this tag is attached, follow it exactly; never invent a different person, hairstyle or outfit.`;

  return `Master Thumbnail Agent v3.45 — create ONE finished 9:16 vertical YouTube Shorts thumbnail image for "${identity.channelName}" (tagline: "${tagline}"), presenter ${identity.presenter}. Clean photorealistic studio composite, 8K detail, sharp focus, high-CTR packaging.

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

export function resolveThumbnailSpec(source: StoryThumbnailSource): ResolvedThumbnailSpec {
  const identity = getThumbnailIdentity(source.channelName, source.presenter);
  const fallbackLines = splitHeadline(source.headline || source.title || 'TECH TRICK');
  const line1 = clean(source.line1) || fallbackLines[0];
  const line2 = clean(source.line2) || fallbackLines[1];
  const subBanner = clean(source.subBanner) || 'MUST TRY';
  const topic = clean(source.ideaTitle) || clean(source.title) || 'the story topic';
  const hologram =
    clean(source.hologram) ||
    `a glowing floating 3D hologram visualising "${topic}" with layered interface panels, topic-specific icons and animated data streams`;
  const prompt = buildMasterThumbnailPrompt({
    channelName: source.channelName,
    presenter: source.presenter,
    line1,
    line2,
    subBanner,
    hologram,
    characterTag: source.characterTag,
    hasReferenceImage: source.hasReferenceImage,
  });

  return { identity, line1, line2, subBanner, hologram, prompt };
}
