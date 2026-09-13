/**
 * SWISS AI SERVICE // DUAL-PROVIDER CASCADE
 * Primary: Google Gemini API (gemini-3.8-flash / generous free quota + native JSON mode)
 * Fallback: OpenRouter API (openrouter/free + failover router)
 * Local: Swiss High-Fidelity Junior Positioning Fallback
 */

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
 * Call Google Gemini API (gemini-3.8-flash / gemini-2.5-flash)
 * Uses native responseMimeType: 'application/json' for guaranteed valid JSON.
 */
export async function callGemini({
  apiKey,
  model = 'gemini-3.8-flash',
  systemPrompt,
  userPrompt,
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
      responseMimeType: 'application/json',
      temperature: 0.7
    }
  };

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
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
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
      error: isTimeout ? `Превышено время ожидания Gemini (${timeoutMs / 1000}s)` : err.message
    };
  }
}

/**
 * Call OpenRouter API with robust handling and model sanitization
 */
export async function callOpenRouter({
  apiKey,
  model = 'openrouter/free',
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

  let effectiveModel = model;
  if (effectiveModel.includes('llama-3.3-70b-instruct:free') || effectiveModel.includes('gemini-2.0-flash-exp:free')) {
    effectiveModel = 'openrouter/free';
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
export async function testOpenRouterPing(apiKey, model = 'openrouter/free') {
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

  let effectiveModel = model;
  if (effectiveModel.includes('llama-3.3-70b-instruct:free')) {
    effectiveModel = 'openrouter/free';
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
