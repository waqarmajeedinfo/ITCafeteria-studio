export type ScriptProviderId = 'auto' | 'gemini' | 'claude' | 'openai' | 'llama';

export interface ScriptModelVersion {
  id: string;
  label: string;
  tier: 'flagship' | 'balanced' | 'fast' | 'reasoning';
  note: string;
}

export interface ScriptProviderMeta {
  id: Exclude<ScriptProviderId, 'auto'>;
  name: string;
  envHint: string;
  versions: ScriptModelVersion[];
}

export interface ScriptProviderStatus extends ScriptProviderMeta {
  configured: boolean;
  gatewayLabel?: string;
}

export const SCRIPT_PROVIDER_CATALOG: ScriptProviderMeta[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    envHint: 'GEMINI_API_KEY',
    versions: [
      { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', tier: 'balanced', note: 'Fast multi-scene Roman Urdu storyteller (Recommended)' },
      { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', tier: 'fast', note: 'Ultra-fast 3s JSON & idea discovery engine' },
      { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite', tier: 'fast', note: 'Lightweight high-quota backup (~4s)' },
      { id: 'gemini-4-hydrogen', label: 'Gemini 4 Hydrogen', tier: 'flagship', note: 'Deep reasoning JSON architect (slower preview)' },
      { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash', tier: 'balanced', note: 'Long-context director output backup' },
      { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', tier: 'fast', note: 'Structured story output backup' },
      { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', tier: 'balanced', note: '10-scene JSON backup engine' },
    ],
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    envHint: 'ANTHROPIC_API_KEY',
    versions: [
      { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', tier: 'flagship', note: 'Nuanced natural voice & cinematic storytelling' },
      { id: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet', tier: 'balanced', note: 'Structured dialogue & high retention hooks' },
      { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', tier: 'balanced', note: 'Consistent instruction following' },
      { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', tier: 'fast', note: 'Low-latency rapid script failover' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI GPT',
    envHint: 'OPENAI_API_KEY',
    versions: [
      { id: 'gpt-4.1', label: 'GPT-4.1', tier: 'flagship', note: 'Sharp creative hooks & strict JSON compliance' },
      { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', tier: 'fast', note: 'Fast & cost-efficient multi-scene drafts' },
      { id: 'gpt-4o', label: 'GPT-4o', tier: 'balanced', note: 'Multimodal commercial & UGC copywriter' },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini', tier: 'fast', note: 'High-throughput rapid script backup' },
      { id: 'o4-mini', label: 'o4-mini (Reasoning)', tier: 'reasoning', note: 'Deep pacing & argument optimization' },
    ],
  },
  {
    id: 'llama',
    name: 'Meta Llama',
    envHint: 'GROQ_API_KEY / TOGETHER_API_KEY / LLAMA_API_KEY',
    versions: [
      { id: 'llama-4-maverick-17b-128e-instruct', label: 'Llama 4 Maverick (17B-128E)', tier: 'flagship', note: 'Next-gen Meta MoE open-weights powerhouse' },
      { id: 'llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout (17B-16E)', tier: 'balanced', note: 'High-speed long-context Meta Llama 4' },
      { id: 'llama-3.3-70b-instruct', label: 'Llama 3.3 70B Instruct', tier: 'balanced', note: 'Flagship Llama 3 dense conversational writer' },
      { id: 'llama-3.1-8b-instruct', label: 'Llama 3.1 8B Instant', tier: 'fast', note: 'Ultra-fast uninterrupted fallback node' },
    ],
  },
];

export function getProviderCatalogItem(providerId: ScriptProviderId): ScriptProviderMeta | null {
  if (providerId === 'auto') return null;
  return SCRIPT_PROVIDER_CATALOG.find((p) => p.id === providerId) || null;
}

export function getDefaultModelForProvider(providerId: ScriptProviderId): string {
  if (providerId === 'auto') return 'gemini-3.8-flash';
  const found = getProviderCatalogItem(providerId);
  return found?.versions[0]?.id || 'gemini-3.8-flash';
}
