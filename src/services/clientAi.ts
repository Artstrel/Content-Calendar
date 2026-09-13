/**
 * SWISS CLIENT-SIDE AI ENGINE // SECURE BROWSER EXECUTION
 * Calls Gemini and OpenRouter directly from the browser via CORS.
 * API keys are never transmitted to any third-party server or backend;
 * they are kept exclusively in the user's browser localStorage.
 */

import { readLocalSettings } from './storageAdapter.ts';
import { AiTelemetry, AiTestConnectionResult, ContentFormat, Platform, Trend } from '../types/index.ts';

// Robust JSON extraction & repair utility
export function robustExtractJson(rawText: string | null | undefined): any {
  if (!rawText || typeof rawText !== 'string') return null;

  // 1. Strip reasoning tokens (<think>...</think>, <thought>...</thought>)
  let cleaned = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
    .trim();

  // 2. Strip markdown fences ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();

  // 3. Find first '{'
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace === -1) {
    return extractByRegex(cleaned);
  }

  // 4. Find matching closing '}' using balanced brace counter
  let depth = 0;
  let inString = false;
  let escape = false;
  let lastBrace = -1;

  for (let i = firstBrace; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          lastBrace = i;
          break;
        }
      }
    }
  }

  const candidate = lastBrace !== -1 ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned.slice(firstBrace);

  let parsedFallback: any = null;

  // 5. Try standard parse
  try {
    const parsed = JSON.parse(candidate);
    if (isValidStructure(parsed)) return parsed;
    parsedFallback = parsed;
  } catch {
    // Continue to repair
  }

  // 6. Repair pass: trailing commas and control characters
  try {
    const repaired = candidate
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '');
    const parsed = JSON.parse(repaired);
    if (isValidStructure(parsed)) return parsed;
    if (!parsedFallback) parsedFallback = parsed;
  } catch {
    // Continue to regex extraction
  }

  const regexResult = extractByRegex(cleaned);
  if (regexResult) return regexResult;

  return parsedFallback;
}

function parsePingResponse(rawText: string | null | undefined): any {
  if (!rawText) return null;
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const braceMatch = cleaned.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch {
        // Continue
      }
    }
    if (cleaned.length > 0) {
      return { status: 'ok', message: cleaned };
    }
    return null;
  }
}

function isValidStructure(obj: any): boolean {
  return !!(obj && typeof obj === 'object' && (obj.hook || obj.caption || obj.slides || obj.videoScript || obj.trends));
}

function extractByRegex(text: string): any {
  if (!text) return null;
  const result: any = {
    hook: '',
    caption: '',
    slides: [],
    videoScript: [],
    storiesChain: [],
    threadPosts: []
  };

  const hookMatch = text.match(/"hook"\s*:\s*"([^"]+)"/i) || text.match(/Хук[:\s]+([^\n]+)/i);
  if (hookMatch) result.hook = hookMatch[1];

  const captionMatch = text.match(/"caption"\s*:\s*"([^"]+)"/i) || text.match(/Текст[:\s]+([\s\S]+?)(?=\n\n|\n[А-ЯA-Z0-9_]+:|$)/i);
  if (captionMatch) result.caption = captionMatch[1].replace(/\\n/g, '\n');

  return result.hook || result.caption ? result : null;
}

export function robustExtractTrendsJson(rawText: string | null | undefined): Trend[] | null {
  if (!rawText) return null;
  const obj = robustExtractJson(rawText);
  if (obj && Array.isArray(obj.trends)) return obj.trends;
  if (Array.isArray(obj)) return obj;

  const arrayMatch = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Continue
    }
  }
  return null;
}

// DIRECT GOOGLE GEMINI CALL FROM BROWSER
export async function clientCallGemini({
  apiKey,
  model = 'gemini-3.8-flash',
  systemPrompt,
  userPrompt,
  useWebSearch = false,
  timeoutMs = 25000,
  parser = robustExtractJson
}: {
  apiKey: string;
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  useWebSearch?: boolean;
  timeoutMs?: number;
  parser?: (text: string) => any;
}) {
  const startTime = Date.now();
  if (!apiKey || apiKey.trim() === '') {
    return {
      ok: false,
      status: 401,
      statusText: 'API Key Missing',
      latencyMs: 0,
      error: 'Google Gemini API-ключ не указан в настройках'
    };
  }

  const cleanKey = apiKey.trim();
  const cleanModel = model.replace(/^models\//, '');
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${cleanKey}`;

  const payload: any = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7
    }
  };

  if (useWebSearch) {
    // Enable live Google Search Grounding for Gemini
    payload.tools = [{ googleSearch: {} }];
  } else {
    payload.generationConfig.responseMimeType = 'application/json';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const errMsg = errJson.error?.message || res.statusText || 'Gemini error';
      return {
        ok: false,
        status: res.status,
        statusText: res.statusText,
        latencyMs,
        error: errMsg,
        isRateLimited: res.status === 429
      };
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const candidateText = candidate?.content?.parts?.[0]?.text;
    const grounding = candidate?.groundingMetadata || null;
    const tokens = data.usageMetadata?.totalTokenCount || 0;
    const parsed = parser(candidateText);

    if (!parsed) {
      return {
        ok: false,
        status: 200,
        statusText: 'JSON Parse Error',
        latencyMs,
        error: 'Gemini вернул ответ, но его структуру не удалось разобрать как JSON',
        rawText: candidateText?.slice(0, 300)
      };
    }

    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      data: parsed,
      latencyMs,
      modelUsed: cleanModel,
      tokens,
      grounding
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    return {
      ok: false,
      status: isTimeout ? 408 : 500,
      statusText: isTimeout ? 'Timeout' : 'Network Error',
      latencyMs: Date.now() - startTime,
      error: isTimeout ? `Превышено время ожидания Gemini (${timeoutMs / 1000}s)` : err.message
    };
  }
}

// DIRECT OPENROUTER CALL FROM BROWSER
export async function clientCallOpenRouter({
  apiKey,
  model = 'google/gemma-4-31b-it:free',
  systemPrompt,
  userPrompt,
  timeoutMs = 35000,
  parser = robustExtractJson
}: {
  apiKey: string;
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  timeoutMs?: number;
  parser?: (text: string) => any;
}) {
  const startTime = Date.now();
  if (!apiKey || apiKey.trim() === '') {
    return {
      ok: false,
      status: 401,
      statusText: 'API Key Missing',
      latencyMs: 0,
      error: 'API-ключ OpenRouter не указан в настройках'
    };
  }

  // Ensure model is strictly a free model and never a Gemini or paid model
  let effectiveModel = model || 'google/gemma-4-31b-it:free';
  if (effectiveModel.includes('gemini') || effectiveModel.includes('claude') || effectiveModel.includes('gpt-4')) {
    effectiveModel = 'google/gemma-4-31b-it:free';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Swiss Content Calendar'
      },
      body: JSON.stringify({
        model: effectiveModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        ok: false,
        status: res.status,
        statusText: res.statusText,
        latencyMs,
        error: errJson.error?.message || res.statusText || 'OpenRouter error'
      };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    const tokens = data.usage?.total_tokens || 0;
    const parsed = parser(content);

    if (!parsed) {
      return {
        ok: false,
        status: 200,
        statusText: 'JSON Parse Error',
        latencyMs,
        error: 'OpenRouter вернул ответ, но JSON не удалось разобрать',
        rawText: content?.slice(0, 300)
      };
    }

    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      data: parsed,
      latencyMs,
      modelUsed: data.model || effectiveModel,
      tokens
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    return {
      ok: false,
      status: isTimeout ? 408 : 500,
      statusText: isTimeout ? 'Timeout' : 'Network Error',
      latencyMs: Date.now() - startTime,
      error: isTimeout ? `Превышено время ожидания OpenRouter (${timeoutMs / 1000}s)` : err.message
    };
  }
}

// TEST CONNECTION FUNCTIONS
export async function clientTestGeminiConnection(apiKey?: string, model?: string): Promise<AiTestConnectionResult> {
  const settings = readLocalSettings();
  const effectiveKey = apiKey || settings.geminiApiKey;
  const effectiveModel = model || settings.defaultGeminiModel || settings.defaultModel || 'gemini-3.8-flash';

  if (!effectiveKey) {
    return {
      connected: false,
      status: 401,
      statusText: 'Missing Key',
      latencyMs: 0,
      message: 'Введите API-ключ Gemini для проверки связи'
    };
  }

  const res = await clientCallGemini({
    apiKey: effectiveKey,
    model: effectiveModel,
    systemPrompt: 'Отвечай только валидным JSON: {"status": "ok", "message": "Swiss AI Connected"}',
    userPrompt: 'Пинг. Проверь связь с Google AI Studio.',
    timeoutMs: 12000,
    parser: parsePingResponse
  });

  return {
    connected: res.ok,
    status: res.status,
    statusText: res.statusText,
    latencyMs: res.latencyMs,
    message: res.ok
      ? `Подключение к Google Gemini (${res.modelUsed}) успешно! Задержка: ${res.latencyMs}ms`
      : `Ошибка подключения к Gemini: ${res.error}`
  };
}

export async function clientTestOpenRouterConnection(apiKey?: string, model?: string): Promise<AiTestConnectionResult> {
  const settings = readLocalSettings();
  const effectiveKey = apiKey || settings.openRouterApiKey;
  let effectiveModel = model;
  if (!effectiveModel || effectiveModel.includes('gemini') || effectiveModel.includes('claude') || effectiveModel.includes('gpt')) {
    effectiveModel = (settings.defaultModel?.includes('/') && settings.defaultModel?.includes(':free'))
      ? settings.defaultModel
      : 'google/gemma-4-31b-it:free';
  }

  if (!effectiveKey) {
    return {
      connected: false,
      status: 401,
      statusText: 'Missing Key',
      latencyMs: 0,
      message: 'Введите API-ключ OpenRouter для проверки связи'
    };
  }

  const res = await clientCallOpenRouter({
    apiKey: effectiveKey,
    model: effectiveModel,
    systemPrompt: 'Отвечай только валидным JSON: {"status": "ok", "message": "OpenRouter Connected"}',
    userPrompt: 'Ping OpenRouter.',
    timeoutMs: 15000,
    parser: parsePingResponse
  });

  return {
    connected: res.ok,
    status: res.status,
    statusText: res.statusText,
    latencyMs: res.latencyMs,
    message: res.ok
      ? `Подключение к OpenRouter (${res.modelUsed}) успешно! Задержка: ${res.latencyMs}ms`
      : `Ошибка подключения к OpenRouter: ${res.error}`
  };
}

export const GEMINI_CASCADE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-pro-preview'
];

export const OPENROUTER_FREE_CASCADE_MODELS = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3.5-lightning:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'nex-agi/nex-n2.5-pro:free',
  'nex-agi/nex-n2.5-mini:free',
  'thinkingmachines/inkling:free',
  'inclusionai/ling-3.0-flash-vl:free',
  'dots-studio/dots-3-note-preview:free',
  'poolside/laguna-xs-2.1:free',
  'openrouter/free'
];

export function buildCascadeCandidateQueue({
  preferredModel,
  geminiApiKey,
  openRouterApiKey,
  aiProviderMode = 'cascade'
}: {
  preferredModel?: string;
  geminiApiKey?: string;
  openRouterApiKey?: string;
  aiProviderMode?: 'cascade' | 'gemini_only' | 'openrouter_only';
}) {
  const hasGemini = Boolean(geminiApiKey && geminiApiKey.trim() !== '');
  const hasOpenRouter = Boolean(openRouterApiKey && openRouterApiKey.trim() !== '');
  const allowGemini = hasGemini && aiProviderMode !== 'openrouter_only';
  const allowOpenRouter = hasOpenRouter && aiProviderMode !== 'gemini_only';

  const candidates: Array<{ provider: 'gemini' | 'openrouter'; model: string }> = [];
  const addedModels = new Set<string>();

  const addCandidate = (provider: 'gemini' | 'openrouter', model: string) => {
    if (!model || addedModels.has(model)) return;
    if (provider === 'gemini' && !allowGemini) return;
    if (provider === 'openrouter' && !allowOpenRouter) return;
    addedModels.add(model);
    candidates.push({ provider, model });
  };

  // 1. Preferred model FIRST
  if (preferredModel) {
    const isGemini = preferredModel.includes('gemini');
    if (isGemini && allowGemini) {
      addCandidate('gemini', preferredModel);
    } else if (!isGemini && allowOpenRouter) {
      addCandidate('openrouter', preferredModel);
    }
  }

  // 2. If the first candidate was an OpenRouter model, prioritize remaining OpenRouter models, then Gemini
  const firstIsOR = candidates.length > 0 && candidates[0].provider === 'openrouter';

  if (firstIsOR) {
    for (const m of OPENROUTER_FREE_CASCADE_MODELS) {
      addCandidate('openrouter', m);
    }
    for (const m of GEMINI_CASCADE_MODELS) {
      addCandidate('gemini', m);
    }
  } else {
    for (const m of GEMINI_CASCADE_MODELS) {
      addCandidate('gemini', m);
    }
    for (const m of OPENROUTER_FREE_CASCADE_MODELS) {
      addCandidate('openrouter', m);
    }
  }

  return candidates;
}

async function clientFetchWebData(query?: string, sourceUrl?: string): Promise<{ webBlock: string; webSources: any[] }> {
  const webSources: any[] = [];
  let webBlock = '';

  try {
    if (sourceUrl && sourceUrl.startsWith('http')) {
      const res = await fetch('/api/web/parse-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sourceUrl })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          webSources.push({ title: data.title, url: data.url, snippet: data.description || data.text?.slice(0, 160) });
          webBlock = `### ДАННЫЕ С РАССМОТРЕННОЙ СТРАНИЦЫ (URL: ${data.url}):\nЗаголовок: ${data.title}\n${data.description ? `Описание: ${data.description}\n` : ''}\nТекст:\n${data.text}\n---`;
        }
      }
    } else if (query) {
      const res = await fetch('/api/web/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, maxResults: 4 })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.results) && data.results.length > 0) {
          webSources.push(...data.results);
          const lines = [
            '### АКТУАЛЬНЫЕ ДАННЫЕ ИЗ СЕТИ (LIVE WEB SEARCH):',
            'Используй эти свежие интернет-источники:'
          ];
          data.results.forEach((item: any, idx: number) => {
            lines.push(`[${idx + 1}] ${item.title} (${item.url})\n    ${item.snippet}`);
          });
          lines.push('---');
          webBlock = lines.join('\n');
        }
      }
    }
  } catch {
    // Backend offline or unreachable
  }

  return { webBlock, webSources };
}

export async function clientExecuteCascadeGeneration({
  systemPrompt,
  userPrompt,
  parser = robustExtractJson,
  preferredModel,
  geminiApiKey,
  openRouterApiKey,
  aiProviderMode = 'cascade',
  useWebSearch = false,
  webQuery,
  sourceUrl
}: {
  systemPrompt: string;
  userPrompt: string;
  parser?: (text: string) => any;
  preferredModel?: string;
  geminiApiKey?: string;
  openRouterApiKey?: string;
  aiProviderMode?: 'cascade' | 'gemini_only' | 'openrouter_only';
  useWebSearch?: boolean;
  webQuery?: string;
  sourceUrl?: string;
}): Promise<{
  ok: boolean;
  data?: any;
  provider?: 'gemini' | 'openrouter';
  modelUsed?: string;
  latencyMs: number;
  tokens?: number;
  generationId?: string | null;
  cascadeTriggered: boolean;
  message?: string;
  error?: string;
  webSources?: any[];
  grounding?: any;
  attemptTrail: Array<{ provider: string; model: string; error?: string; latencyMs: number }>;
}> {
  const queue = buildCascadeCandidateQueue({
    preferredModel,
    geminiApiKey,
    openRouterApiKey,
    aiProviderMode
  });

  if (queue.length === 0) {
    return {
      ok: false,
      latencyMs: 0,
      cascadeTriggered: false,
      error: 'Нет доступных моделей для генерации. Проверьте API-ключи Gemini и OpenRouter в настройках.',
      attemptTrail: []
    };
  }

  let enrichedPrompt = userPrompt;
  let webSources: any[] = [];

  if (sourceUrl || (useWebSearch && webQuery)) {
    const fetched = await clientFetchWebData(webQuery, sourceUrl);
    if (fetched.webBlock) {
      enrichedPrompt = `${fetched.webBlock}\n\n${userPrompt}`;
      webSources = fetched.webSources;
    }
  }

  const attemptTrail: Array<{ provider: string; model: string; error?: string; latencyMs: number }> = [];
  let preferredErrorReason = '';

  for (let i = 0; i < queue.length; i++) {
    const candidate = queue[i];
    const isPreferred = i === 0;

    try {
      let res: any;
      if (candidate.provider === 'gemini') {
        res = await clientCallGemini({
          apiKey: geminiApiKey!,
          model: candidate.model,
          systemPrompt,
          userPrompt: enrichedPrompt,
          useWebSearch: Boolean(useWebSearch),
          timeoutMs: 14000,
          parser
        });
      } else {
        res = await clientCallOpenRouter({
          apiKey: openRouterApiKey!,
          model: candidate.model,
          systemPrompt,
          userPrompt: enrichedPrompt,
          timeoutMs: 20000,
          parser
        });
      }

      if (res.ok && res.data) {
        const cascadeTriggered = i > 0;
        let message = '';
        if (cascadeTriggered) {
          message = `⚡️ [АВТО-КАСКАД]: Модель ${queue[0].model} не ответила (${preferredErrorReason || 'ошибка/квота'}). Успешно получено через ${candidate.model} (${res.latencyMs}мс).`;
        } else {
          message = `Успешно выполнено через ${candidate.model} (${res.latencyMs}мс).`;
        }

        return {
          ok: true,
          data: res.data,
          provider: candidate.provider,
          modelUsed: candidate.model,
          latencyMs: res.latencyMs,
          tokens: res.tokens || 0,
          generationId: res.generationId || null,
          cascadeTriggered,
          attemptTrail,
          message,
          webSources,
          grounding: res.grounding || null
        };
      }

      const reason = res.error || res.statusText || 'Error';
      if (isPreferred) {
        preferredErrorReason = res.isRateLimited ? 'Лимит 429' : reason;
      }
      attemptTrail.push({
        provider: candidate.provider,
        model: candidate.model,
        error: reason,
        latencyMs: res.latencyMs
      });
    } catch (err: any) {
      attemptTrail.push({
        provider: candidate.provider,
        model: candidate.model,
        error: err.message,
        latencyMs: 0
      });
    }
  }

  return {
    ok: false,
    latencyMs: 0,
    cascadeTriggered: true,
    error: `Все опрошенные модели (${attemptTrail.length} шт.) вернули ошибку.`,
    attemptTrail,
    webSources
  };
}

export async function clientTestCascadeConnection(params?: { geminiApiKey?: string; openRouterApiKey?: string }): Promise<AiTestConnectionResult> {
  const settings = readLocalSettings();
  const geminiKey = params?.geminiApiKey || settings.geminiApiKey;
  const openRouterKey = params?.openRouterApiKey || settings.openRouterApiKey;

  let geminiRes: AiTestConnectionResult | null = null;
  if (geminiKey) {
    geminiRes = await clientTestGeminiConnection(geminiKey, 'gemini-3.8-flash');
    if (!geminiRes.connected) {
      for (const altModel of GEMINI_CASCADE_MODELS) {
        if (altModel !== 'gemini-3.8-flash') {
          const alt = await clientTestGeminiConnection(geminiKey, altModel);
          if (alt.connected) {
            geminiRes = {
              ...alt,
              message: `✓ Подключение к Google Gemini успешно (через ${altModel}, ${alt.latencyMs}мс)`
            };
            break;
          }
        }
      }
    }
  }

  let openRouterRes: AiTestConnectionResult | null = null;
  if (openRouterKey) {
    const preferredOrModel = (settings.defaultModel?.includes('/') && settings.defaultModel?.includes(':free'))
      ? settings.defaultModel
      : 'google/gemma-4-31b-it:free';
    openRouterRes = await clientTestOpenRouterConnection(openRouterKey, preferredOrModel);
    if (!openRouterRes.connected) {
      for (const altModel of OPENROUTER_FREE_CASCADE_MODELS) {
        if (altModel !== preferredOrModel) {
          const alt = await clientTestOpenRouterConnection(openRouterKey, altModel);
          if (alt.connected) {
            openRouterRes = {
              ...alt,
              message: `✓ Подключение к OpenRouter успешно (через ${altModel}, ${alt.latencyMs}мс)`
            };
            break;
          }
        }
      }
    }
  }

  const cascadeActive = Boolean(geminiRes?.connected || openRouterRes?.connected);
  let summaryMessage = '';
  if (geminiRes?.connected && openRouterRes?.connected) {
    summaryMessage = `Каскад полностью готов: Google Gemini (${geminiRes.latencyMs}мс) и OpenRouter (${openRouterRes.latencyMs}мс) активны.`;
  } else if (geminiRes?.connected) {
    summaryMessage = `Google Gemini активен (${geminiRes.latencyMs}мс). OpenRouter резерв не подключен.`;
  } else if (openRouterRes?.connected) {
    summaryMessage = `OpenRouter активен (${openRouterRes.latencyMs}мс). Google Gemini не подключен или лимит исчерпан.`;
  } else {
    summaryMessage = 'Оба провайдера не ответили. Проверьте правильность API-ключей.';
  }

  return {
    connected: cascadeActive,
    status: cascadeActive ? 200 : 400,
    statusText: cascadeActive ? 'Cascade Ready' : 'No Providers Ready',
    latencyMs: Math.max(geminiRes?.latencyMs || 0, openRouterRes?.latencyMs || 0),
    message: summaryMessage,
    gemini: geminiRes ? {
      connected: geminiRes.connected,
      status: geminiRes.status,
      statusText: geminiRes.statusText,
      latencyMs: geminiRes.latencyMs,
      model: geminiRes.actualModel || geminiRes.modelRequested,
      reply: geminiRes.reply,
      error: geminiRes.error,
      message: geminiRes.message
    } : undefined,
    openRouter: openRouterRes ? {
      connected: openRouterRes.connected,
      status: openRouterRes.status,
      statusText: openRouterRes.statusText,
      latencyMs: openRouterRes.latencyMs,
      generationId: openRouterRes.generationId || undefined,
      actualModel: openRouterRes.actualModel,
      reply: openRouterRes.reply,
      error: openRouterRes.error,
      message: openRouterRes.message
    } : undefined
  };
}

// CLIENT-SIDE SCAN TRENDS
export async function clientScanTrendsAI(
  categoryOrParams: string | { category?: string; model?: string; query?: string; url?: string; useWebSearch?: boolean } = 'all',
  modelArg?: string
): Promise<{ trends: Trend[]; live: boolean; modelUsed?: string; webSources?: any[]; telemetry?: AiTelemetry }> {
  const isObj = typeof categoryOrParams === 'object' && categoryOrParams !== null;
  const category = isObj ? (categoryOrParams.category || 'all') : categoryOrParams;
  const model = isObj ? categoryOrParams.model : modelArg;
  const query = isObj ? categoryOrParams.query : undefined;
  const url = isObj ? categoryOrParams.url : undefined;
  const useWebSearch = isObj ? (categoryOrParams.useWebSearch ?? true) : true;

  const settings = readLocalSettings();
  const geminiKey = settings.geminiApiKey;
  const openRouterKey = settings.openRouterApiKey;
  const requestedModel = model || settings.defaultModel || 'gemini-3.8-flash';

  const systemPrompt = `Ты — топовый виральный продюсер и наставник для НАЧИНАЮЩИХ графических дизайнеров (Junior Graphic Designers), ищущих первую работу в студии или клиентов на фрилансе.
Найди 3 ультра-виральных микро-тренда для TikTok, Instagram Stories/Reels, Threads и LinkedIn.
Формат ответа СТРОГО JSON:
{
  "trends": [
    {
      "id": "trend-timestamp",
      "title": "Заголовок тренда",
      "category": "branding",
      "categoryLabel": "Брендинг",
      "source": "TikTok #DesignTok",
      "description": "Описание идеи",
      "tags": ["Tag1", "Tag2"],
      "relevanceScore": 95,
      "keyTakeaway": "Главный инсайт",
      "suggestedFormat": "carousel",
      "dateAdded": "2026-03-13"
    }
  ]
}`;

  const userPrompt = url
    ? `Проанализируй контент по указанному URL (${url}) и выдели 3 ультра-виральных микро-тренда или формата для джуниор-дизайнера.`
    : `Сгенерируй свежие виральные микро-тренды для категории: ${category}.${query ? ` Запрос: ${query}` : ''}`;

  const cascadeRes = await clientExecuteCascadeGeneration({
    systemPrompt,
    userPrompt,
    parser: robustExtractTrendsJson,
    preferredModel: requestedModel,
    geminiApiKey: geminiKey,
    openRouterApiKey: openRouterKey,
    aiProviderMode: settings.aiProviderMode,
    useWebSearch,
    webQuery: query || (category !== 'all' ? `Junior graphic design trends ${category} 2026` : 'Junior graphic design portfolio trends 2026'),
    sourceUrl: url
  });

  if (cascadeRes.ok && Array.isArray(cascadeRes.data) && cascadeRes.data.length > 0) {
    const trends = cascadeRes.data.map((item: any, idx: number) => {
      const matched = cascadeRes.webSources?.[idx] || cascadeRes.webSources?.[0];
      return {
        ...item,
        id: item.id || `trend-client-${Date.now()}-${idx}`,
        source: matched?.title ? `${item.source || 'Online'} [${matched.title.slice(0, 30)}]` : (item.source || 'Web Search 2026'),
        sourceUrl: matched?.url || url || undefined,
        dateAdded: new Date().toISOString().split('T')[0]
      };
    });

    return {
      trends,
      live: true,
      modelUsed: cascadeRes.modelUsed,
      webSources: cascadeRes.webSources,
      telemetry: {
        status: 200,
        statusText: 'OK',
        latencyMs: cascadeRes.latencyMs,
        tokens: cascadeRes.tokens,
        provider: cascadeRes.provider,
        model: cascadeRes.modelUsed || 'gemini-3.8-flash',
        live: true,
        cascadeTriggered: cascadeRes.cascadeTriggered,
        message: cascadeRes.message,
        webGrounded: (cascadeRes.webSources && cascadeRes.webSources.length > 0) || Boolean(cascadeRes.grounding)
      }
    };
  }

  // Fallback: If Web Parser obtained sources from URL or search, convert THEM directly into trend cards!
  if (cascadeRes.webSources && cascadeRes.webSources.length > 0) {
    const webTrends = cascadeRes.webSources.slice(0, 4).map((source: any, idx: number) => {
      let hostname = 'Web';
      if (source.url) {
        try { hostname = new URL(source.url).hostname.replace(/^www\./, ''); } catch {}
      }
      const categoryLabelMap: Record<string, string> = {
        typography: 'Типографика',
        branding: 'Брендинг',
        '3d': '3D & Пространство',
        motion: 'Motion & AI',
        editorial: 'Editorial / Карьера'
      };
      const assignedCategory: any = category !== 'all' ? category : (idx % 2 === 0 ? 'branding' : 'typography');

      return {
        id: `trend-client-web-${Date.now()}-${idx}`,
        title: source.title || `Практика из сети #${idx + 1}`,
        category: assignedCategory,
        categoryLabel: categoryLabelMap[assignedCategory] || 'Швейцарский дизайн',
        source: `Парсер [${hostname}]`,
        sourceUrl: source.url || url || undefined,
        description: source.snippet || `Свежий материал по теме «${query || 'Швейцарский дизайн'}» для разбора и адаптации в портфолио начинающего дизайнера.`,
        tags: [assignedCategory, 'WebRadar', 'LiveSearch', 'JuniorPortfolio'],
        relevanceScore: 92 + (idx * 2) % 7,
        keyTakeaway: `Разберите этот проект (${(source.title || '').slice(0, 40)}) в Figma и покажите в Reels/Stories логику модульной сетки 8px.`,
        suggestedFormat: (idx % 2 === 0 ? 'carousel' : 'reels') as ContentFormat,
        dateAdded: new Date().toISOString().split('T')[0]
      };
    });

    return {
      trends: webTrends,
      live: false,
      modelUsed: 'Web Scraper & Live Search',
      webSources: cascadeRes.webSources,
      telemetry: {
        status: 200,
        statusText: 'Web Grounded',
        latencyMs: cascadeRes.latencyMs || 45,
        tokens: 0,
        provider: 'fallback',
        model: 'Web Parser Engine',
        live: false,
        isFallback: true,
        cascadeTriggered: cascadeRes.cascadeTriggered,
        webGrounded: true,
        message: `✓ Парсер успешно нашел веб-источники (${cascadeRes.webSources.length} шт.) и сформировал карточки трендов.`
      }
    };
  }

  // Fallback to Dynamic Swiss Generator
  const timeHash = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const queryClean = query && !query.includes('Junior graphic design') ? query : '';

  return {
    trends: [
      {
        id: `trend-${Date.now()}-1`,
        title: queryClean 
          ? `«${queryClean}»: разбор модульной сетки и композиции [${timeHash}]`
          : `Анатомия швейцарского плаката: иерархия кеглей и сетка 8px [${timeHash}]`,
        category: (category !== 'all' ? category : 'typography') as any,
        categoryLabel: category === 'branding' ? 'Брендинг' : category === 'editorial' ? 'Editorial / Карьера' : 'Типографика',
        source: 'Trend Radar Engine',
        description: `Пошаговый разбор тренда ${queryClean ? `«${queryClean}»` : 'в швейцарском стиле'}: как начинающему дизайнеру исключить хаос отступов и выстроить четкий визуальный ритм.`,
        tags: ['SwissGrid', '8pxRule', 'PortfolioCase', queryClean ? queryClean.split(' ')[0] : 'Typography'].filter(Boolean),
        relevanceScore: 96,
        keyTakeaway: 'Покажите направляющие модульной сетки в Figma поверх макета в первые 2 секунды ролика.',
        suggestedFormat: 'carousel' as ContentFormat,
        dateAdded: new Date().toISOString().split('T')[0]
      },
      {
        id: `trend-${Date.now()}-2`,
        title: queryClean 
          ? `Челлендж 20 минут: Редизайн по теме «${queryClean}» (До/После) [${timeHash}]`
          : `Интерактивный квест в Stories: найди 3 ошибки в кернинге [${timeHash}]`,
        category: (category !== 'all' ? category : 'branding') as any,
        categoryLabel: 'Брендинг',
        source: 'TikTok #DesignTok & Reels',
        description: 'Демонстрация профессионального мышления новичка через исправление оптических неточностей реального макета.',
        tags: ['BeforeAfter', 'Redesign', 'JuniorDesigner', 'ViralHook'],
        relevanceScore: 95,
        keyTakeaway: 'Начинайте с интригующего кадра: «Я не мог спокойно смотреть на это меню...»',
        suggestedFormat: 'reels' as ContentFormat,
        dateAdded: new Date().toISOString().split('T')[0]
      },
      {
        id: `trend-${Date.now()}-3`,
        title: `«Ищу работу джуниором»: открытый разбор отказов и пересборка портфолио [${timeHash}]`,
        category: (category !== 'all' ? category : 'editorial') as any,
        categoryLabel: 'Карьера / Editorial',
        source: 'LinkedIn & Threads Discussions',
        description: 'Открытый сериал-дневник начинающего дизайнера: показ переписки с арт-директорами и эволюция кейсов.',
        tags: ['BuildInPublic', 'CareerHunt', 'JuniorPortfolio'],
        relevanceScore: 94,
        keyTakeaway: 'Делитесь исходником Figma в закрепленном сообщении — это доказывает уверенность в решениях.',
        suggestedFormat: 'thread' as ContentFormat,
        dateAdded: new Date().toISOString().split('T')[0]
      }
    ],
    live: false,
    modelUsed: 'swiss-local-safety-net',
    telemetry: {
      status: 200,
      statusText: 'Local Fallback',
      latencyMs: 20,
      tokens: 0,
      provider: 'fallback',
      model: 'swiss-local-safety-net',
      live: false,
      message: cascadeRes.error ? `Локальный радар. Причина: ${cascadeRes.error}` : 'Сформированы карточки трендов.'
    }
  };
}

// CLIENT-SIDE GENERATE SCRIPT
export async function clientGenerateScriptAI(params: {
  title: string;
  topic?: string;
  format: ContentFormat;
  targetAudience?: string;
  tone?: string;
  channels: Platform[];
  model?: string;
  viralStrategy?: string;
  useWebSearch?: boolean;
  sourceUrl?: string;
}): Promise<{
  result: any;
  live: boolean;
  modelUsed: string;
  webSources?: any[];
  telemetry?: AiTelemetry;
}> {
  const settings = readLocalSettings();
  const geminiKey = settings.geminiApiKey;
  const openRouterKey = settings.openRouterApiKey;
  const requestedModel = params.model || settings.defaultModel || 'gemini-3.8-flash';

  const systemPrompt = `Ты — профессиональный арт-директор и контент-стратег для начинающих графических дизайнеров.
Твоя задача: написать контент-план и текст публикации для швейцарского стиля (Swiss Style, чистая типографика, модульные сетки, поиск первой работы в студии).
Формат: ${params.format}.
Каналы: ${params.channels.join(', ')}.

Отвечай СТРОГО валидным JSON:
{
  "hook": "Мощный цепляющий хук первой строки",
  "caption": "Полный текст поста с абзацами и тегами",
  "slides": [
    { "slideNumber": 1, "title": "Заголовок слайда", "text": "Текст слайда", "visualPrompt": "Что нарисовать/показать в Figma" }
  ],
  "videoScript": [
    { "time": "00:00 - 00:03", "visual": "Что в кадре", "audio": "Что говорим", "textOverlay": "Текст на экране" }
  ],
  "storiesChain": [
    { "screenNumber": 1, "title": "Интро", "textOverlay": "Текст сторис", "stickerType": "poll", "stickerContent": "Да/Нет", "visualPrompt": "Визуальный фон" }
  ],
  "threadPosts": ["Твит 1", "Твит 2"]
}`;

  const userPrompt = `Тема: ${params.title}. ${params.topic ? `Дополнительно: ${params.topic}` : ''}`;

  const cascadeRes = await clientExecuteCascadeGeneration({
    systemPrompt,
    userPrompt,
    parser: robustExtractJson,
    preferredModel: requestedModel,
    geminiApiKey: geminiKey,
    openRouterApiKey: openRouterKey,
    aiProviderMode: settings.aiProviderMode,
    useWebSearch: params.useWebSearch ?? true,
    webQuery: params.title,
    sourceUrl: params.sourceUrl
  });

  if (cascadeRes.ok && cascadeRes.data) {
    return {
      result: cascadeRes.data,
      live: true,
      modelUsed: cascadeRes.modelUsed || 'gemini-3.8-flash',
      webSources: cascadeRes.webSources,
      telemetry: {
        status: 200,
        statusText: 'OK',
        latencyMs: cascadeRes.latencyMs,
        tokens: cascadeRes.tokens,
        provider: cascadeRes.provider,
        model: cascadeRes.modelUsed || 'gemini-3.8-flash',
        live: true,
        cascadeTriggered: cascadeRes.cascadeTriggered,
        message: cascadeRes.message,
        webGrounded: (cascadeRes.webSources && cascadeRes.webSources.length > 0) || Boolean(cascadeRes.grounding)
      }
    };
  }

  // Fallback to Local Swiss Template
  return {
    result: {
      hook: `Почему 90% новичков спотыкаются на этом при верстке «${params.title}»`,
      caption: `Как начинающий графический дизайнер, я постоянно анализирую чужие ошибки и пересобираю их по швейцарской модульной сетке.\n\nВ проекте «${params.title}» главное — не усложнять, а подчинить все элементы единому ритму 8px.\n\nПоделился исходником и ходом мыслей. Что думаете о таком решении?\n\n#juniorgraphicdesigner #swissstyle #buildinpublic #figmatips #designsystem`,
      slides: [
        { slideNumber: 1, title: 'COVER // СУТЬ ПРОБЛЕМЫ', text: params.title, visualPrompt: 'Крупный заголовок черным по белому в стиле швейцарского плаката.' },
        { slideNumber: 2, title: 'РАЗБОР ОШИБКИ', text: 'Хаотичный интерлиньяж и нарушенная иерархия кеглей.', visualPrompt: 'Скринкаст с красными направляющими линиями.' },
        { slideNumber: 3, title: 'РЕШЕНИЕ ПО СЕТКЕ', text: 'Шаг 8px и выравнивание смысловой доминанты влево.', visualPrompt: 'Модульная сетка поверх макета в Figma.' },
        { slideNumber: 4, title: 'РЕЗУЛЬТАТ', text: 'Финальный чистый макет, готовый к публикации.', visualPrompt: 'Мокап постера в среде современного городского интерьера.' }
      ],
      storiesChain: [
        { screenNumber: 1, title: 'ОПРОС', textOverlay: 'Заметили ошибку в этом макете?', stickerType: 'poll', stickerContent: 'Да / Пока нет', visualPrompt: 'Сравнение двух вариантов' },
        { screenNumber: 2, title: 'ОТВЕТ', textOverlay: 'Сетка решает всё. Полный разбор в новом посте ленты!', stickerType: 'link', stickerContent: 'Смотреть пост', visualPrompt: 'Стрелка на профиль' }
      ],
      videoScript: [
        { time: '00:00 - 00:03', visual: 'Показываю макет крупно', audio: 'Вот почему этот дизайн разваливался...', textOverlay: 'ОШИБКА ДЖУНА' },
        { time: '00:03 - 00:10', visual: 'Включаю сетку в Figma', audio: 'Смотрите, как 3 линии меняют всё.', textOverlay: 'СЕТКА 8PX' },
        { time: '00:10 - 00:15', visual: 'Финальный результат', audio: 'Напишите в комментах, взяли бы меня в студию?', textOverlay: 'ИЩУ РАБОТУ' }
      ]
    },
    live: false,
    modelUsed: 'swiss-local-safety-net',
    telemetry: {
      status: 200,
      statusText: 'Local Fallback',
      latencyMs: 15,
      tokens: 0,
      provider: 'fallback',
      model: 'swiss-local-safety-net',
      live: false
    }
  };
}
