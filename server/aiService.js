/**
 * SWISS AI SERVICE // DUAL-PROVIDER CASCADE
 * Primary: Google Gemini API (gemini-3.8-flash / generous free quota + native JSON mode)
 * Fallback: OpenRouter API (openrouter/free + failover router)
 * Local: Swiss High-Fidelity Junior Positioning Fallback
 */

import {
  searchWeb,
  parseUrlContent,
  formatSearchResultsForPrompt,
  formatUrlContentForPrompt
} from './webParser.js';

/**
 * Robust JSON extraction & repair utility.
 * Handles markdown fences, <think> reasoning tokens, trailing commas,
 * unescaped quotes/newlines, and provides regex-based fallback extraction.
 */
export function robustExtractJson(rawText) {
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

  // 5. Try standard parse
  try {
    const parsed = JSON.parse(candidate);
    if (isValidScriptStructure(parsed)) return parsed;
  } catch (e) {
    // Continue to repair
  }

  // 6. Repair pass: trailing commas and control characters
  try {
    let repaired = candidate
      .replace(/,\s*([}\]])/g, '$1') // remove trailing commas
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, ''); // remove control chars
    const parsed = JSON.parse(repaired);
    if (isValidScriptStructure(parsed)) return parsed;
  } catch (e) {
    // Continue to regex extraction
  }

  // 7. Fallback regex extraction of schema properties
  return extractByRegex(cleaned);
}

function isValidScriptStructure(obj) {
  return obj && typeof obj === 'object' && (obj.hook || obj.caption || obj.slides || obj.videoScript);
}

/**
 * Regex extractor if LLM produced non-strict JSON
 */
function extractByRegex(text) {
  if (!text) return null;
  const result = {
    hook: '',
    caption: '',
    slides: [],
    storiesChain: [],
    videoScript: [],
    threadPosts: [],
    telegramPost: '',
    linkedinPost: '',
    pinterestDescription: ''
  };

  const hookMatch = text.match(/"hook"\s*:\s*"([^"]+)"/i) || text.match(/hook[:\s]+([^\n\r"]+)/i);
  if (hookMatch) result.hook = hookMatch[1].trim();

  const captionMatch = text.match(/"caption"\s*:\s*"([\s\S]*?)(?=",\s*"(?:slides|storiesChain|videoScript|hook)|\n\s*"\w+":)/i);
  if (captionMatch) {
    result.caption = captionMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
  }

  const tgMatch = text.match(/"telegramPost"\s*:\s*"([\s\S]*?)(?=",\s*"\w+":|"\s*})/i);
  if (tgMatch) result.telegramPost = tgMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();

  const liMatch = text.match(/"linkedinPost"\s*:\s*"([\s\S]*?)(?=",\s*"\w+":|"\s*})/i);
  if (liMatch) result.linkedinPost = liMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();

  if (result.hook || result.caption) {
    return result;
  }
  return null;
}

/**
 * Robust JSON extraction for trends arrays or { "trends": [...] }
 */
export function robustExtractTrendsJson(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  let cleaned = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
    .trim();

  cleaned = cleaned.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();

  // 1. Direct parse
  try {
    const direct = JSON.parse(cleaned);
    if (Array.isArray(direct) && direct.length > 0) return direct;
    if (direct && Array.isArray(direct.trends) && direct.trends.length > 0) return direct.trends;
  } catch (e) {}

  // 2. Bracket slice [...]
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const candidateArray = cleaned.slice(firstBracket, lastBracket + 1);
    try {
      const parsed = JSON.parse(candidateArray);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      try {
        const repaired = candidateArray
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '');
        const parsed = JSON.parse(repaired);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e2) {}
    }
  }

  // 3. Brace slice {...}
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidateObj = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(candidateObj);
      if (parsed && Array.isArray(parsed.trends) && parsed.trends.length > 0) return parsed.trends;
    } catch (e) {
      try {
        const repaired = candidateObj
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '');
        const parsed = JSON.parse(repaired);
        if (parsed && Array.isArray(parsed.trends) && parsed.trends.length > 0) return parsed.trends;
      } catch (e2) {}
    }
  }

  return null;
}

/**
 * Call Google Gemini API (gemini-3.8-flash)
 * Uses native responseMimeType: 'application/json' for guaranteed valid JSON.
 */
export async function callGemini({
  apiKey,
  model = 'gemini-3.8-flash',
  systemPrompt,
  userPrompt,
  useWebSearch = false,
  timeoutMs = 25000,
  parser = robustExtractJson
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

  const payload = {
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
    const groundingMetadata = candidate?.groundingMetadata || null;
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
      grounding: groundingMetadata
    };
  } catch (err) {
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

/**
 * Call OpenRouter API with robust handling and model sanitization
 */
export async function callOpenRouter({
  apiKey,
  model = 'google/gemma-4-31b-it:free',
  systemPrompt,
  userPrompt,
  timeoutMs = 35000,
  parser = robustExtractJson
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

  let effectiveModel = model || 'google/gemma-4-31b-it:free';
  if (effectiveModel.includes('gemini') || effectiveModel.includes('claude') || effectiveModel.includes('gpt')) {
    effectiveModel = 'google/gemma-4-31b-it:free';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'HTTP-Referer': 'https://github.com/swiss-content-calendar',
        'X-Title': 'Swiss Content Studio',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: effectiveModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 3500,
        temperature: 0.7
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const generationId = res.headers.get('x-generation-id');

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      let parsedErr = {};
      try { parsedErr = JSON.parse(errText); } catch {}
      const errMsg = parsedErr.error?.message || errText || res.statusText;
      return {
        ok: false,
        status: res.status,
        statusText: res.statusText,
        latencyMs,
        generationId,
        error: errMsg,
        isRateLimited: res.status === 429
      };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    const modelUsed = data.model || effectiveModel;
    const tokens = data.usage?.total_tokens || 0;

    const parsed = parser(content);
    if (!parsed) {
      return {
        ok: false,
        status: 200,
        statusText: 'JSON Parse Error',
        latencyMs,
        generationId,
        modelUsed,
        error: 'Модель ответила HTTP 200, но вывод содержал невалидную разметку JSON',
        rawText: content?.slice(0, 400)
      };
    }

    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      data: parsed,
      latencyMs,
      generationId,
      modelUsed,
      tokens
    };
  } catch (err) {
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

/**
 * Quick Ping Sandbox Test for Gemini
 */
export async function testGeminiPing(apiKey, model = 'gemini-3.8-flash') {
  const startTime = Date.now();
  if (!apiKey || apiKey.trim() === '') {
    return {
      connected: false,
      status: 401,
      statusText: 'Key Missing',
      latencyMs: 0,
      error: 'Ключ Google Gemini не задан',
      message: 'Укажите ключ Gemini API в настройках'
    };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with exactly: PING_OK' }] }]
      })
    });
    const latencyMs = Date.now() - startTime;
    if (res.ok) {
      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'PING_OK';
      return {
        connected: true,
        status: 200,
        statusText: 'OK',
        latencyMs,
        model,
        reply,
        message: `Подключение к Google Gemini успешно (${model}, ${latencyMs}ms)`
      };
    } else {
      const errJson = await res.json().catch(() => ({}));
      const errMsg = errJson.error?.message || res.statusText;
      return {
        connected: false,
        status: res.status,
        statusText: res.statusText,
        latencyMs,
        error: errMsg,
        message: `Gemini API вернул ошибку HTTP ${res.status}: ${errMsg}`
      };
    }
  } catch (err) {
    return {
      connected: false,
      status: 500,
      statusText: 'Network Error',
      latencyMs: Date.now() - startTime,
      error: err.message,
      message: `Сбой сетевого запроса к Gemini: ${err.message}`
    };
  }
}

/**
 * Quick Ping Sandbox Test for OpenRouter
 */
export async function testOpenRouterPing(apiKey, model = 'google/gemma-4-31b-it:free') {
  const startTime = Date.now();
  if (!apiKey || apiKey.trim() === '') {
    return {
      connected: false,
      status: 401,
      statusText: 'Key Missing',
      latencyMs: 0,
      error: 'Ключ OpenRouter не задан',
      message: 'Укажите ключ OpenRouter в настройках'
    };
  }

  let effectiveModel = model || 'google/gemma-4-31b-it:free';
  if (effectiveModel.includes('gemini') || effectiveModel.includes('claude') || effectiveModel.includes('gpt')) {
    effectiveModel = 'google/gemma-4-31b-it:free';
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'HTTP-Referer': 'https://github.com/swiss-content-calendar',
        'X-Title': 'Swiss Content Studio',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: effectiveModel,
        messages: [{ role: 'user', content: 'Say PING_OK' }],
        max_tokens: 20
      })
    });
    const latencyMs = Date.now() - startTime;
    const generationId = res.headers.get('x-generation-id');

    if (res.ok) {
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || 'PING_OK';
      return {
        connected: true,
        status: 200,
        statusText: 'OK',
        latencyMs,
        generationId,
        actualModel: data.model || effectiveModel,
        reply,
        message: `Подключение к OpenRouter успешно (${data.model || effectiveModel}, ID: ${generationId})`
      };
    } else {
      const errText = await res.text().catch(() => '');
      let parsedErr = {};
      try { parsedErr = JSON.parse(errText); } catch {}
      const errMsg = parsedErr.error?.message || errText || res.statusText;
      return {
        connected: false,
        status: res.status,
        statusText: res.statusText,
        latencyMs,
        generationId,
        error: errMsg,
        message: `OpenRouter вернул ошибку HTTP ${res.status}: ${errMsg}`
      };
    }
  } catch (err) {
    return {
      connected: false,
      status: 500,
      statusText: 'Network Error',
      latencyMs: Date.now() - startTime,
      error: err.message,
      message: `Сбой сети при запросе к OpenRouter: ${err.message}`
    };
  }
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

/**
 * Builds the prioritized queue of AI models for automatic cascade failover.
 * If user has a preferredModel, it goes FIRST.
 * If that model fails, remaining models in the same provider and then fallback provider are tried in order.
 */
export function buildCascadeCandidateQueue({
  preferredModel,
  geminiApiKey,
  openRouterApiKey,
  aiProviderMode = 'cascade'
}) {
  const hasGemini = Boolean(geminiApiKey && geminiApiKey.trim() !== '');
  const hasOpenRouter = Boolean(openRouterApiKey && openRouterApiKey.trim() !== '');
  const allowGemini = hasGemini && aiProviderMode !== 'openrouter_only';
  const allowOpenRouter = hasOpenRouter && aiProviderMode !== 'gemini_only';

  const candidates = [];
  const addedModels = new Set();

  const addCandidate = (provider, model) => {
    if (!model || addedModels.has(model)) return;
    if (provider === 'gemini' && !allowGemini) return;
    if (provider === 'openrouter' && !allowOpenRouter) return;
    addedModels.add(model);
    candidates.push({ provider, model });
  };

  // 1. Preferred model FIRST if set
  if (preferredModel) {
    const isGeminiModel = preferredModel.includes('gemini');
    if (isGeminiModel && allowGemini) {
      addCandidate('gemini', preferredModel);
    } else if (!isGeminiModel && allowOpenRouter) {
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

/**
 * Executes an AI generation task across the full pool of available models.
 * If the preferred model fails (rate limit, quota 429, timeout, parse error, 503),
 * it iterates through all other models until one succeeds.
 */
export async function executeCascadeGeneration({
  systemPrompt,
  userPrompt,
  parser = robustExtractJson,
  preferredModel,
  geminiApiKey,
  openRouterApiKey,
  aiProviderMode = 'cascade',
  useWebSearch = false,
  webQuery,
  sourceUrl,
  onLog
}) {
  const queue = buildCascadeCandidateQueue({
    preferredModel,
    geminiApiKey,
    openRouterApiKey,
    aiProviderMode
  });

  if (queue.length === 0) {
    return {
      ok: false,
      status: 401,
      error: 'Нет доступных моделей для генерации. Проверьте API-ключи Gemini и OpenRouter в настройках.',
      attemptTrail: []
    };
  }

  // Pre-fetch live web search or scrape target URL if requested
  let enrichedUserPrompt = userPrompt;
  let webSources = [];

  if (sourceUrl && typeof sourceUrl === 'string' && sourceUrl.startsWith('http')) {
    try {
      if (onLog) onLog(`Парсинг целевого URL: ${sourceUrl}...`);
      const parsedUrl = await parseUrlContent(sourceUrl);
      if (parsedUrl.ok) {
        const urlBlock = formatUrlContentForPrompt(parsedUrl);
        enrichedUserPrompt = `${urlBlock}\n\n${userPrompt}`;
        webSources.push({
          title: parsedUrl.title,
          url: parsedUrl.url,
          snippet: parsedUrl.description || parsedUrl.text.slice(0, 160)
        });
      }
    } catch (e) {
      console.warn('[AI CASCADE] Error parsing sourceUrl:', e.message);
    }
  } else if (useWebSearch) {
    try {
      const q = webQuery || userPrompt.replace(/[^\w\s\u0400-\u04FF]/gi, ' ').trim().slice(0, 80);
      if (onLog) onLog(`Живой веб-поиск по запросу: "${q}"...`);
      const searchResults = await searchWeb(q, 4);
      if (searchResults && searchResults.length > 0) {
        const searchBlock = formatSearchResultsForPrompt(searchResults);
        enrichedUserPrompt = `${searchBlock}\n\n${userPrompt}`;
        webSources = searchResults;
      }
    } catch (e) {
      console.warn('[AI CASCADE] Error searching web:', e.message);
    }
  }

  const attemptTrail = [];
  let preferredErrorReason = '';

  for (let i = 0; i < queue.length; i++) {
    const candidate = queue[i];
    const isPreferred = i === 0;

    try {
      let res;
      if (candidate.provider === 'gemini') {
        res = await callGemini({
          apiKey: geminiApiKey,
          model: candidate.model,
          systemPrompt,
          userPrompt: enrichedUserPrompt,
          useWebSearch: Boolean(useWebSearch),
          timeoutMs: 14000,
          parser
        });
      } else {
        res = await callOpenRouter({
          apiKey: openRouterApiKey,
          model: candidate.model,
          systemPrompt,
          userPrompt: enrichedUserPrompt,
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
          generationId: res.generationId,
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
        status: res.status,
        error: reason,
        latencyMs: res.latencyMs
      });
      if (onLog) {
        onLog(`[CASCADE FAILOVER] ${candidate.model} failed (${reason}). Trying next candidate...`);
      }
    } catch (err) {
      attemptTrail.push({
        provider: candidate.provider,
        model: candidate.model,
        status: 500,
        error: err.message,
        latencyMs: 0
      });
    }
  }

  return {
    ok: false,
    status: 500,
    error: `Все опрошенные модели (${attemptTrail.length} шт.) вернули ошибку.`,
    attemptTrail
  };
}
