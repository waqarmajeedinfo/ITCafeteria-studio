import { GoogleGenAI } from '@google/genai';
import {
  SCRIPT_PROVIDER_CATALOG,
  type ScriptProviderId,
  type ScriptProviderStatus,
} from './src/lib/scriptModelProviders';

type ConcreteProvider = Exclude<ScriptProviderId, 'auto'>;

export interface ScriptAttemptRecord {
  provider: ConcreteProvider;
  model: string;
  ok: boolean;
  durationMs: number;
  error?: string;
}

export interface MultiProviderScriptResult<T = any> {
  parsed: T;
  providerUsed: ConcreteProvider;
  modelUsed: string;
  failoverUsed: boolean;
  attempts: ScriptAttemptRecord[];
}

function getLlamaGatewayConfig(): {
  apiKey: string;
  baseUrl: string;
  gatewayLabel: string;
  providerKind: 'groq' | 'together' | 'openrouter' | 'meta';
} | null {
  const groqKey = (process.env.GROQ_API_KEY || '').trim();
  const togetherKey = (process.env.TOGETHER_API_KEY || '').trim();
  const openrouterKey = (process.env.OPENROUTER_API_KEY || '').trim();
  const llamaKey = (process.env.LLAMA_API_KEY || '').trim();
  const customBase = (process.env.LLAMA_API_BASE_URL || '').trim().replace(/\/+$/, '');

  if (llamaKey) {
    return {
      apiKey: llamaKey,
      baseUrl: customBase || 'https://api.llama.com/compat/v1',
      gatewayLabel: customBase ? 'Custom Llama Endpoint' : 'Meta Llama API',
      providerKind: 'meta',
    };
  }
  if (groqKey) {
    return {
      apiKey: groqKey,
      baseUrl: customBase || 'https://api.groq.com/openai/v1',
      gatewayLabel: 'Groq Cloud (Llama)',
      providerKind: 'groq',
    };
  }
  if (togetherKey) {
    return {
      apiKey: togetherKey,
      baseUrl: customBase || 'https://api.together.xyz/v1',
      gatewayLabel: 'Together AI (Llama)',
      providerKind: 'together',
    };
  }
  if (openrouterKey) {
    return {
      apiKey: openrouterKey,
      baseUrl: customBase || 'https://openrouter.ai/api/v1',
      gatewayLabel: 'OpenRouter (Llama)',
      providerKind: 'openrouter',
    };
  }
  return null;
}

function mapLlamaModelForGateway(
  canonicalId: string,
  kind: 'groq' | 'together' | 'openrouter' | 'meta'
): string {
  const map: Record<string, Record<'groq' | 'together' | 'openrouter' | 'meta', string>> = {
    'llama-4-maverick-17b-128e-instruct': {
      meta: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
      groq: 'meta-llama/llama-4-maverick-17b-128e-instruct',
      together: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
      openrouter: 'meta-llama/llama-4-maverick',
    },
    'llama-4-scout-17b-16e-instruct': {
      meta: 'Llama-4-Scout-17B-16E-Instruct-FP8',
      groq: 'meta-llama/llama-4-scout-17b-16e-instruct',
      together: 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
      openrouter: 'meta-llama/llama-4-scout',
    },
    'llama-3.3-70b-instruct': {
      meta: 'Llama-3.3-70B-Instruct',
      groq: 'llama-3.3-70b-versatile',
      together: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      openrouter: 'meta-llama/llama-3.3-70b-instruct',
    },
    'llama-3.1-8b-instruct': {
      meta: 'Llama-3.1-8B-Instruct',
      groq: 'llama-3.1-8b-instant',
      together: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      openrouter: 'meta-llama/llama-3.1-8b-instruct',
    },
  };
  return map[canonicalId]?.[kind] || canonicalId;
}

export function isScriptProviderConfigured(provider: ConcreteProvider): boolean {
  if (provider === 'gemini') return Boolean((process.env.GEMINI_API_KEY || '').trim());
  if (provider === 'claude') return Boolean((process.env.ANTHROPIC_API_KEY || '').trim());
  if (provider === 'openai') return Boolean((process.env.OPENAI_API_KEY || '').trim());
  if (provider === 'llama') return Boolean(getLlamaGatewayConfig());
  return false;
}

export function getScriptProvidersStatus(): ScriptProviderStatus[] {
  const llamaGw = getLlamaGatewayConfig();
  return SCRIPT_PROVIDER_CATALOG.map((item) => ({
    ...item,
    configured: isScriptProviderConfigured(item.id),
    ...(item.id === 'llama' && llamaGw ? { gatewayLabel: llamaGw.gatewayLabel } : {}),
  }));
}

function extractJsonObjectRobust(rawText: string): any {
  const cleaned = String(rawText || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const candidate = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        // Attempt repair for common trailing commas
        const repaired = candidate.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(repaired);
      }
    }
    throw new Error('Model ne valid JSON structure return nahi kiya');
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`Request timeout (${Math.round(timeoutMs / 1000)}s)`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function callGeminiModel(
  model: string,
  prompt: string,
  temperature: number,
  maxTokens: number,
  timeoutMs: number
): Promise<string> {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) throw new Error('GEMINI_API_KEY missing');
  const ai = new GoogleGenAI({
    apiKey: key,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  const needsZeroThinkingBudget = !model.includes('lite');
  const promise = ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature,
      maxOutputTokens: maxTokens,
      ...(needsZeroThinkingBudget ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    },
  });

  const resp = await new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Gemini timeout (${Math.round(timeoutMs / 1000)}s)`)), timeoutMs);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });

  return String(resp?.text || '');
}

async function callClaudeModel(
  model: string,
  prompt: string,
  temperature: number,
  maxTokens: number,
  timeoutMs: number
): Promise<string> {
  const key = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!key) throw new Error('ANTHROPIC_API_KEY missing');

  const safeMaxTokens = Math.min(Math.max(maxTokens, 1024), 8192);
  const resp = await fetchWithTimeout(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: safeMaxTokens,
        temperature: Math.min(1, Math.max(0, temperature)),
        system: 'You MUST respond with strictly valid raw JSON only. Do not include markdown fences or commentary outside JSON.',
        messages: [{ role: 'user', content: prompt }],
      }),
    },
    timeoutMs
  );

  const json: any = await resp.json().catch(() => null);
  if (!resp.ok) {
    throw new Error(json?.error?.message || `Anthropic HTTP ${resp.status}`);
  }
  const textBlocks = Array.isArray(json?.content)
    ? json.content.filter((b: any) => b?.type === 'text').map((b: any) => String(b.text || ''))
    : [];
  return textBlocks.join('\n');
}

async function callOpenAiModel(
  model: string,
  prompt: string,
  temperature: number,
  maxTokens: number,
  timeoutMs: number
): Promise<string> {
  const key = (process.env.OPENAI_API_KEY || '').trim();
  if (!key) throw new Error('OPENAI_API_KEY missing');

  const isReasoning = model.startsWith('o4') || model.startsWith('o3') || model.startsWith('o1');
  const body: Record<string, any> = {
    model,
    messages: [
      {
        role: 'system',
        content: 'Return strictly valid raw JSON matching the schema requested by the user prompt.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
  };
  if (!isReasoning) {
    body.temperature = temperature;
    body.max_tokens = Math.min(maxTokens, 16384);
  } else {
    body.max_completion_tokens = Math.min(maxTokens, 16384);
  }

  const resp = await fetchWithTimeout(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    },
    timeoutMs
  );

  const json: any = await resp.json().catch(() => null);
  if (!resp.ok) {
    throw new Error(json?.error?.message || `OpenAI HTTP ${resp.status}`);
  }
  return String(json?.choices?.[0]?.message?.content || '');
}

async function callLlamaModel(
  model: string,
  prompt: string,
  temperature: number,
  maxTokens: number,
  timeoutMs: number
): Promise<string> {
  const gw = getLlamaGatewayConfig();
  if (!gw) {
    throw new Error('Meta Llama API key missing (GROQ_API_KEY, TOGETHER_API_KEY, OPENROUTER_API_KEY, or LLAMA_API_KEY)');
  }

  const mappedModel = mapLlamaModelForGateway(model, gw.providerKind);
  const resp = await fetchWithTimeout(
    `${gw.baseUrl}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gw.apiKey}`,
      },
      body: JSON.stringify({
        model: mappedModel,
        temperature,
        max_tokens: Math.min(maxTokens, 8192),
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Return strictly valid raw JSON only. No markdown fences or preamble.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    },
    timeoutMs
  );

  const json: any = await resp.json().catch(() => null);
  if (!resp.ok) {
    throw new Error(json?.error?.message || `Meta Llama HTTP ${resp.status}`);
  }
  return String(json?.choices?.[0]?.message?.content || '');
}

export async function generateScriptJsonWithProviders<T = any>(options: {
  prompt: string;
  preferredProvider?: ScriptProviderId;
  preferredModel?: string;
  autoFailover?: boolean;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  validate?: (parsed: any) => void;
}): Promise<MultiProviderScriptResult<T>> {
  const {
    prompt,
    preferredProvider = 'auto',
    preferredModel = '',
    autoFailover = true,
    temperature = 0.85,
    maxTokens = 16384,
    timeoutMs = 55000,
    validate,
  } = options;

  const queue: Array<{ provider: ConcreteProvider; model: string }> = [];
  const seen = new Set<string>();
  const pushUnique = (provider: ConcreteProvider, model: string) => {
    const k = `${provider}:${model}`;
    if (!seen.has(k)) {
      seen.add(k);
      queue.push({ provider, model });
    }
  };

  const configuredProviders = SCRIPT_PROVIDER_CATALOG.filter((p) => isScriptProviderConfigured(p.id));
  if (configuredProviders.length === 0) {
    throw new Error(
      'Koi bhi Script AI service key configured nahi hai. Server env mein GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, ya GROQ_API_KEY/LLAMA_API_KEY add karein.'
    );
  }

  // 1. Enqueue preferred provider + requested version first
  if (preferredProvider !== 'auto') {
    const meta = SCRIPT_PROVIDER_CATALOG.find((p) => p.id === preferredProvider);
    if (!isScriptProviderConfigured(preferredProvider)) {
      if (!autoFailover) {
        throw new Error(`${meta?.name || preferredProvider} server env (${meta?.envHint || 'API key'}) par configured nahi hai.`);
      }
    } else if (meta) {
      if (preferredModel) {
        pushUnique(preferredProvider, preferredModel);
      }
      for (const ver of meta.versions) {
        pushUnique(preferredProvider, ver.id);
      }
    }
  } else if (preferredModel) {
    const matchProvider = SCRIPT_PROVIDER_CATALOG.find((p) =>
      p.versions.some((v) => v.id === preferredModel)
    );
    if (matchProvider && isScriptProviderConfigured(matchProvider.id)) {
      pushUnique(matchProvider.id, preferredModel);
    }
  }

  // 2. If autoFailover is enabled (or preferredProvider is 'auto'), enqueue all configured providers & versions
  if (preferredProvider === 'auto' || autoFailover) {
    for (const pMeta of configuredProviders) {
      for (const ver of pMeta.versions) {
        pushUnique(pMeta.id, ver.id);
      }
    }
  }

  const attempts: ScriptAttemptRecord[] = [];
  let lastErr: any = null;

  for (let i = 0; i < queue.length; i++) {
    const { provider, model } = queue[i];
    const started = Date.now();
    try {
      let rawText = '';
      if (provider === 'gemini') {
        rawText = await callGeminiModel(model, prompt, temperature, maxTokens, timeoutMs);
      } else if (provider === 'claude') {
        rawText = await callClaudeModel(model, prompt, temperature, maxTokens, timeoutMs);
      } else if (provider === 'openai') {
        rawText = await callOpenAiModel(model, prompt, temperature, maxTokens, timeoutMs);
      } else {
        rawText = await callLlamaModel(model, prompt, temperature, maxTokens, timeoutMs);
      }

      const parsed = extractJsonObjectRobust(rawText);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Model response empty JSON object tha');
      }
      if (validate) {
        validate(parsed);
      }

      attempts.push({
        provider,
        model,
        ok: true,
        durationMs: Date.now() - started,
      });

      return {
        parsed: parsed as T,
        providerUsed: provider,
        modelUsed: model,
        failoverUsed:
          i > 0 ||
          (preferredProvider !== 'auto' && provider !== preferredProvider) ||
          (Boolean(preferredModel) && model !== preferredModel),
        attempts,
      };
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || 'Unknown error').slice(0, 220);
      attempts.push({
        provider,
        model,
        ok: false,
        durationMs: Date.now() - started,
        error: msg,
      });
      console.warn(`[ScriptRouter] Attempt ${i + 1} (${provider}/${model}) failed:`, msg);
    }
  }

  throw lastErr || new Error('Tamam configured script services failover ke baad bhi fail ho gayin.');
}
