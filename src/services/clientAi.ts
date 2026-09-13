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

  // 5. Try standard parse
  try {
    const parsed = JSON.parse(candidate);
    if (isValidStructure(parsed)) return parsed;
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
  } catch {
    // Continue to regex extraction
  }

  return extractByRegex(cleaned);
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
  timeoutMs = 25000,
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
  model = 'openrouter/free',
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
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
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
      modelUsed: model,
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
export async function clientTestGeminiConnection(apiKey?: string, model = 'gemini-3.8-flash'): Promise<AiTestConnectionResult> {
  const settings = readLocalSettings();
  const effectiveKey = apiKey || settings.geminiApiKey;
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
    model,
    systemPrompt: 'Отвечай только валидным JSON: {"status": "ok", "message": "Swiss AI Connected"}',
    userPrompt: 'Пинг. Проверь связь с Google AI Studio.',
    timeoutMs: 12000
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

export async function clientTestOpenRouterConnection(apiKey?: string, model = 'openrouter/free'): Promise<AiTestConnectionResult> {
  const settings = readLocalSettings();
  const effectiveKey = apiKey || settings.openRouterApiKey;
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
    model,
    systemPrompt: 'Отвечай только валидным JSON: {"status": "ok", "message": "OpenRouter Connected"}',
    userPrompt: 'Ping OpenRouter.',
    timeoutMs: 15000
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

export async function clientTestCascadeConnection(params?: { geminiApiKey?: string; openRouterApiKey?: string }): Promise<AiTestConnectionResult> {
  const settings = readLocalSettings();
  const geminiKey = params?.geminiApiKey || settings.geminiApiKey;
  const openRouterKey = params?.openRouterApiKey || settings.openRouterApiKey;

  if (geminiKey) {
    const geminiRes = await clientTestGeminiConnection(geminiKey);
    if (geminiRes.connected) {
      return {
        ...geminiRes,
        message: `✨ Каскад готов: Google Gemini 3.8 Flash активен как основной провайдер (${geminiRes.latencyMs}ms)`
      };
    }
  }

  if (openRouterKey) {
    const openRouterRes = await clientTestOpenRouterConnection(openRouterKey);
    if (openRouterRes.connected) {
      return {
        ...openRouterRes,
        message: `⚡️ Каскад готов: OpenRouter активен как резервный провайдер (${openRouterRes.latencyMs}ms)`
      };
    }
  }

  return {
    connected: false,
    status: 401,
    statusText: 'Keys Not Configured',
    latencyMs: 0,
    message: 'Ни один API-ключ не настроен. Добавьте ключ Gemini или OpenRouter в Настройках.'
  };
}

// CLIENT-SIDE SCAN TRENDS
export async function clientScanTrendsAI(category = 'all', model?: string): Promise<{ trends: Trend[]; live: boolean; modelUsed?: string; telemetry?: AiTelemetry }> {
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

  const userPrompt = `Сгенерируй свежие виральные микро-тренды для категории: ${category}.`;

  // 1. Try Gemini
  if (geminiKey && (!settings.aiProviderMode || settings.aiProviderMode !== 'openrouter_only')) {
    const geminiRes = await clientCallGemini({
      apiKey: geminiKey,
      model: requestedModel.includes('gemini') ? requestedModel : 'gemini-3.8-flash',
      systemPrompt,
      userPrompt,
      parser: robustExtractTrendsJson
    });

    if (geminiRes.ok && Array.isArray(geminiRes.data)) {
      return {
        trends: geminiRes.data,
        live: true,
        modelUsed: geminiRes.modelUsed,
        telemetry: {
          status: geminiRes.status,
          statusText: geminiRes.statusText,
          latencyMs: geminiRes.latencyMs,
          tokens: geminiRes.tokens,
          provider: 'gemini',
          model: geminiRes.modelUsed || 'gemini-3.8-flash',
          live: true
        }
      };
    }
  }

  // 2. Try OpenRouter
  if (openRouterKey && (!settings.aiProviderMode || settings.aiProviderMode !== 'gemini_only')) {
    const orRes = await clientCallOpenRouter({
      apiKey: openRouterKey,
      model: requestedModel.includes('openrouter') || requestedModel.includes('/') ? requestedModel : 'openrouter/free',
      systemPrompt,
      userPrompt,
      parser: robustExtractTrendsJson
    });

    if (orRes.ok && Array.isArray(orRes.data)) {
      return {
        trends: orRes.data,
        live: true,
        modelUsed: orRes.modelUsed,
        telemetry: {
          status: orRes.status,
          statusText: orRes.statusText,
          latencyMs: orRes.latencyMs,
          tokens: orRes.tokens,
          provider: 'openrouter',
          model: orRes.modelUsed || 'openrouter/free',
          live: true
        }
      };
    }
  }

  // 3. Fallback to Local Swiss Generator
  return {
    trends: [
      {
        id: `trend-${Date.now()}-1`,
        title: 'Разбор ошибок в сетке сайтов известных брендов (Figma 8px)',
        category: 'branding',
        categoryLabel: 'Брендинг',
        source: 'Swiss Grid Design Lab 2026',
        description: 'Демонстрация профессионализма начинающего дизайнера через исправление нарушенных отступов и выравнивание иерархии.',
        tags: ['SwissGrid', 'JuniorPortfolio', 'Redesign', 'FigmaGuide'],
        relevanceScore: 98,
        keyTakeaway: 'Фокусируйтесь на логике: почему старый вариант вызывал когнитивную нагрузку и как сетка решила задачу.',
        suggestedFormat: 'carousel',
        dateAdded: new Date().toISOString().split('T')[0]
      },
      {
        id: `trend-${Date.now()}-2`,
        title: 'Челлендж 20 минут: Плакат в стиле Баухаус под звук метронома',
        category: 'motion',
        categoryLabel: 'Motion & Reels',
        source: 'TikTok #BauhausDesign',
        description: 'Динамичный таймлапс с крупной типографикой и контрастными цветами, демонстрирующий уверенное владение композицией.',
        tags: ['Bauhaus', 'Timelapse', 'PosterDesign', 'JuniorHacks'],
        relevanceScore: 95,
        keyTakeaway: 'Показывайте готовый результат в первой же секунде ролика, чтобы зацепить внимание зрителя.',
        suggestedFormat: 'reels',
        dateAdded: new Date().toISOString().split('T')[0]
      }
    ],
    live: false,
    modelUsed: 'swiss-local-safety-net',
    telemetry: {
      status: 200,
      statusText: 'Local Fallback',
      latencyMs: 12,
      tokens: 0,
      provider: 'fallback',
      model: 'swiss-local-safety-net',
      live: false
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
}): Promise<{
  result: any;
  live: boolean;
  modelUsed: string;
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

  // 1. Try Gemini
  if (geminiKey && (!settings.aiProviderMode || settings.aiProviderMode !== 'openrouter_only')) {
    const res = await clientCallGemini({
      apiKey: geminiKey,
      model: requestedModel.includes('gemini') ? requestedModel : 'gemini-3.8-flash',
      systemPrompt,
      userPrompt
    });

    if (res.ok && res.data) {
      return {
        result: res.data,
        live: true,
        modelUsed: res.modelUsed || 'gemini-3.8-flash',
        telemetry: {
          status: res.status,
          statusText: res.statusText,
          latencyMs: res.latencyMs,
          tokens: res.tokens,
          provider: 'gemini',
          model: res.modelUsed || 'gemini-3.8-flash',
          live: true
        }
      };
    }
  }

  // 2. Try OpenRouter
  if (openRouterKey && (!settings.aiProviderMode || settings.aiProviderMode !== 'gemini_only')) {
    const res = await clientCallOpenRouter({
      apiKey: openRouterKey,
      model: requestedModel.includes('openrouter') || requestedModel.includes('/') ? requestedModel : 'openrouter/free',
      systemPrompt,
      userPrompt
    });

    if (res.ok && res.data) {
      return {
        result: res.data,
        live: true,
        modelUsed: res.modelUsed || 'openrouter/free',
        telemetry: {
          status: res.status,
          statusText: res.statusText,
          latencyMs: res.latencyMs,
          tokens: res.tokens,
          provider: 'openrouter',
          model: res.modelUsed || 'openrouter/free',
          live: true
        }
      };
    }
  }

  // 3. Fallback to Local Swiss Template
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
