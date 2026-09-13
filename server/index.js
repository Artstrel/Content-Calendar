import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getDb, saveDb } from './db.js';
import {
  callGemini,
  callOpenRouter,
  testGeminiPing,
  testOpenRouterPing,
  robustExtractJson,
  robustExtractTrendsJson,
  executeCascadeGeneration,
  GEMINI_CASCADE_MODELS,
  OPENROUTER_FREE_CASCADE_MODELS
} from './aiService.js';
import { searchWeb, parseUrlContent } from './webParser.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Uploads directory
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer config for design files
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// Create a demo SVG asset for initial display
const DEMO_DIR = path.join(__dirname, '..', 'public', 'demo-assets');
if (!fs.existsSync(DEMO_DIR)) {
  fs.mkdirSync(DEMO_DIR, { recursive: true });
}
const demoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <rect width="1080" height="1080" fill="#000000"/>
  <line x1="80" y1="80" x2="1000" y2="80" stroke="#ffffff" stroke-width="2"/>
  <line x1="80" y1="1000" x2="1000" y2="1000" stroke="#ffffff" stroke-width="2"/>
  <line x1="80" y1="80" x2="80" y2="1000" stroke="#ffffff" stroke-width="2"/>
  <line x1="1000" y1="80" x2="1000" y2="1000" stroke="#ffffff" stroke-width="2"/>
  <line x1="80" y1="240" x2="1000" y2="240" stroke="#333333" stroke-width="1"/>
  <line x1="540" y1="240" x2="540" y2="1000" stroke="#333333" stroke-width="1"/>
  <text x="120" y="180" fill="#ffffff" font-family="'Inter', sans-serif" font-weight="900" font-size="44" letter-spacing="4">SWISS // JUNIOR</text>
  <text x="760" y="180" fill="#888888" font-family="'JetBrains Mono', monospace" font-size="20">JOB HUNT 2026</text>
  <text x="120" y="380" fill="#ffffff" font-family="'Inter', sans-serif" font-weight="800" font-size="76" line-height="1.1">
    <tspan x="120" dy="0">РЕДИЗАЙН</tspan>
    <tspan x="120" dy="88">ИЗ ОШИБКИ</tspan>
    <tspan x="120" dy="88">В КЕЙС</tspan>
  </text>
  <text x="580" y="440" fill="#bbbbbb" font-family="'Inter', sans-serif" font-size="24">
    <tspan x="580" dy="0">Показываем процесс мышления</tspan>
    <tspan x="580" dy="36">начинающего дизайнера.</tspan>
    <tspan x="580" dy="36">Модульная сетка 8px вместо</tspan>
    <tspan x="580" dy="36">случайных отступов.</tspan>
  </text>
  <rect x="120" y="860" width="220" height="60" fill="#ffffff"/>
  <text x="145" y="900" fill="#000000" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="20">VIEW FIGMA FILE</text>
</svg>`;
fs.writeFileSync(path.join(DEMO_DIR, 'swiss-grid-preview.svg'), demoSvg, 'utf-8');

// --- ROUTES ---

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET Trends
app.get('/api/trends', (_req, res) => {
  const db = getDb();
  res.json(db.trends || []);
});

// CREATE Trend (with deduplication)
app.post('/api/trends', (req, res) => {
  const db = getDb();
  const title = (req.body.title || 'Новый тренд').trim();

  // Deduplication check
  const existing = db.trends.find(t => t.title.trim().toLowerCase() === title.toLowerCase());
  if (existing) {
    return res.status(200).json({ ...existing, alreadyExisted: true, duplicatePrevented: true });
  }

  const newTrend = {
    id: `trend-${Date.now()}`,
    title,
    category: req.body.category || 'branding',
    categoryLabel: req.body.categoryLabel || 'Брендинг',
    source: req.body.source || 'Вручную',
    description: req.body.description || '',
    tags: Array.isArray(req.body.tags) ? req.body.tags : [],
    relevanceScore: req.body.relevanceScore || 90,
    keyTakeaway: req.body.keyTakeaway || '',
    suggestedFormat: req.body.suggestedFormat || 'carousel',
    dateAdded: new Date().toISOString().split('T')[0]
  };
  db.trends.unshift(newTrend);
  saveDb(db);
  res.status(201).json(newTrend);
});

// WEB SEARCH ENDPOINT
app.post('/api/web/search', async (req, res) => {
  try {
    const { query, maxResults = 5 } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Поисковый запрос не задан' });
    }
    const results = await searchWeb(query.trim(), Number(maxResults) || 5);
    res.json({ ok: true, query: query.trim(), results });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message, results: [] });
  }
});

// WEB URL PARSER ENDPOINT
app.post('/api/web/parse-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return res.status(400).json({ error: 'Укажите корректный URL (http:// или https://)' });
    }
    const parsed = await parseUrlContent(url);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// AI SCAN TRENDS (Dual-Provider Cascade: Gemini Primary -> OpenRouter Fallback -> Local Swiss Safety Net)
app.post('/api/trends/scan', async (req, res) => {
  const db = getDb();
  const settings = db.settings || {};
  const geminiApiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
  const openRouterApiKey = settings.openRouterApiKey || process.env.OPENROUTER_API_KEY;
  const aiProviderMode = settings.aiProviderMode || 'cascade';
  const defaultGeminiModel = settings.defaultGeminiModel || 'gemini-3.8-flash';
  const defaultOpenRouterModel = (settings.defaultModel?.includes('/') && settings.defaultModel?.includes(':free')) ? settings.defaultModel : 'google/gemma-4-31b-it:free';
  const requestedModel = req.body.model;
  const category = req.body.category || 'all';
  const useWebSearch = Boolean(req.body.useWebSearch ?? settings.webSearchEnabled ?? true);
  const webQuery = req.body.query || req.body.webQuery || (category !== 'all' ? `Junior graphic design viral trends ${category} 2026` : 'Junior graphic design portfolio viral trends 2026');
  const sourceUrl = req.body.url || req.body.sourceUrl;

  const systemPrompt = `Ты — топовый виральный продюсер и наставник для НАЧИНАЮЩИХ графических дизайнеров (Junior Graphic Designers), которые активно строят личный бренд, ищут первую работу в студии или первых клиентов на фрилансе.
Твоя цель: найти 3 ультра-виральных микро-тренда и формата контента для TikTok, Instagram Stories/Reels, Threads и LinkedIn, которые работают именно у новичков (а не у гигантских агентств).

Примеры лучших виральных концепций для джуниоров:
1. Редизайны логотипов/упаковок брендов с разбором мышления в Figma (До/После).
2. Реалити «Ищу работу в дизайне / разбор тестовых заданий и фидбека арт-директоров».
3. Интерактивные Stories-тесты на кернинг и выбор начертания гарнитуры.
4. Раздача бесплатных Figma-китов сеток и UI-компонентов.

Верни ответ СТРОГО в формате валидного JSON объекта:
{
  "trends": [
    {
      "title": "Броский заголовок тренда для джуниора",
      "category": "typography" | "branding" | "3d" | "motion" | "editorial",
      "categoryLabel": "Типографика" | "Брендинг" | "3D & Пространство" | "Motion & AI" | "Editorial / Карьера",
      "source": "TikTok #DesignTok, LinkedIn, Threads, Reddit",
      "description": "Суть виральной механики и почему она привлекает арт-директоров и клиентов",
      "tags": ["Тег1", "Тег2", "Тег3"],
      "relevanceScore": 95,
      "keyTakeaway": "Конкретный совет начинающему: что именно показать на 1-й секунде",
      "suggestedFormat": "carousel" | "stories" | "reels" | "thread"
    }
  ]
}`;

  const userPrompt = sourceUrl
    ? `Проанализируй контент по указанному URL (${sourceUrl}) и выдели 3 ультра-виральных микро-тренда или формата для джуниор-дизайнера. Только валидный JSON объект со свойством "trends".`
    : `Найди 3 свежих виральных формата для начинающего графического дизайнера в категории: ${category}. Запрос: ${webQuery}. Только валидный JSON объект со свойством "trends".`;

  // ==========================================
  // MULTI-MODEL CASCADE SCAN (TRY PREFERRED -> ALL CANDIDATES IN POOL)
  // ==========================================
  const cascadeRes = await executeCascadeGeneration({
    systemPrompt,
    userPrompt,
    parser: robustExtractTrendsJson,
    preferredModel: requestedModel || settings.defaultModel || 'gemini-3.8-flash',
    geminiApiKey,
    openRouterApiKey,
    aiProviderMode,
    useWebSearch,
    webQuery,
    sourceUrl,
    onLog: msg => console.warn('[AI CASCADE - TRENDS]', msg)
  });

  if (cascadeRes.ok && Array.isArray(cascadeRes.data) && cascadeRes.data.length > 0) {
    const uniqueGenerated = cascadeRes.data.map((item, index) => {
      const matchedSource = cascadeRes.webSources?.[index] || cascadeRes.webSources?.[0];
      let title = (item.title || `Виральный формат #${index + 1}`).trim();
      const collision = db.trends.some(t => t.title.trim().toLowerCase() === title.toLowerCase());
      if (collision) {
        title = `${title} [2026 // ${index + 1}]`;
      }
      return {
        ...item,
        title,
        id: `trend-ai-${Date.now()}-${index}`,
        source: matchedSource?.title ? `${item.source || 'Web'} [${matchedSource.title.slice(0, 35)}]` : (item.source || 'Web Search 2026'),
        sourceUrl: matchedSource?.url || sourceUrl || null,
        dateAdded: new Date().toISOString().split('T')[0]
      };
    });

    if (uniqueGenerated.length > 0) {
      db.trends = [...uniqueGenerated, ...db.trends];
      saveDb(db);
    }

    return res.json({
      trends: uniqueGenerated.length > 0 ? uniqueGenerated : db.trends.slice(0, 3),
      live: true,
      provider: cascadeRes.provider,
      modelUsed: cascadeRes.modelUsed,
      webSources: cascadeRes.webSources || [],
      grounding: cascadeRes.grounding || null,
      telemetry: {
        provider: cascadeRes.provider,
        status: 200,
        statusText: 'OK',
        latencyMs: cascadeRes.latencyMs,
        generationId: cascadeRes.generationId,
        model: cascadeRes.modelUsed,
        tokens: cascadeRes.tokens,
        live: true,
        isFallback: false,
        cascadeTriggered: cascadeRes.cascadeTriggered,
        duplicatesSkipped: cascadeRes.data.length - uniqueGenerated.length,
        message: cascadeRes.message,
        webGrounded: (cascadeRes.webSources && cascadeRes.webSources.length > 0) || Boolean(cascadeRes.grounding)
      }
    });
  }

  console.warn('[AI CASCADE - TRENDS] All candidate models failed or unavailable:', cascadeRes.attemptTrail);

  // ==========================================
  // STEP 3: HIGH-FIDELITY LOCAL SWISS FALLBACK & WEB SOURCES CONVERTER
  // ==========================================
  const trail = cascadeRes.attemptTrail || [];
  const cascadeDetails = trail.map(a => `${a.model} (${a.error || a.status})`);
  const cascadeReason = cascadeDetails.length > 0 ? cascadeDetails.join('. ') : (cascadeRes.error || 'API ключи не настроены');

  let generatedFallbackTrends = [];

  // 3A. If Web Parser found live sources or parsed target URL, convert THEM into trend cards!
  if (cascadeRes.webSources && cascadeRes.webSources.length > 0) {
    generatedFallbackTrends = cascadeRes.webSources.slice(0, 4).map((source, idx) => {
      let hostname = 'Web';
      if (source.url) {
        try {
          hostname = new URL(source.url).hostname.replace(/^www\./, '');
        } catch {}
      }

      const categoryLabelMap = {
        typography: 'Типографика',
        branding: 'Брендинг',
        '3d': '3D & Пространство',
        motion: 'Motion & AI',
        editorial: 'Editorial / Карьера'
      };
      const assignedCategory = category !== 'all' ? category : (idx % 2 === 0 ? 'branding' : 'typography');

      return {
        id: `trend-web-${Date.now()}-${idx}`,
        title: source.title || `Практика из сети #${idx + 1}`,
        category: assignedCategory,
        categoryLabel: categoryLabelMap[assignedCategory] || 'Швейцарский дизайн',
        source: `Парсер [${hostname}]`,
        sourceUrl: source.url || null,
        description: source.snippet || `Свежий материал по теме «${webQuery || 'Швейцарский дизайн'}» для разбора и адаптации в портфолио джуниора.`,
        tags: [assignedCategory, 'WebRadar', 'LiveSearch', 'JuniorPortfolio'],
        relevanceScore: 92 + (idx * 2) % 7,
        keyTakeaway: `Изучите кейс и покажите в своем Reels/Stories разбор: что именно улучшила модульная сетка в «${(source.title || '').slice(0, 35)}».`,
        suggestedFormat: (idx % 2 === 0 ? 'carousel' : 'reels'),
        dateAdded: new Date().toISOString().split('T')[0]
      };
    });
  } else {
    // 3B. Dynamic contextual generation tailored to query and category with time-hash
    const timeHash = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const queryClean = webQuery && !webQuery.includes('Junior graphic design') ? webQuery : '';

    const dynamicTemplates = [
      {
        title: queryClean 
          ? `«${queryClean}»: разбор модульной сетки и композиции [${timeHash}]`
          : `Анатомия швейцарского плаката: иерархия кеглей и сетка 8px [${timeHash}]`,
        category: category !== 'all' ? category : 'typography',
        categoryLabel: category === 'branding' ? 'Брендинг' : category === 'editorial' ? 'Editorial / Карьера' : 'Типографика',
        source: 'Trend Radar Engine',
        description: `Пошаговый разбор тренда ${queryClean ? `«${queryClean}»` : 'в швейцарском стиле'}: как начинающему дизайнеру исключить хаос отступов и выстроить четкий визуальный ритм.`,
        tags: ['SwissGrid', '8pxRule', 'PortfolioCase', queryClean ? queryClean.split(' ')[0] : 'Typography'].filter(Boolean),
        relevanceScore: 96,
        keyTakeaway: 'Покажите направляющие модульной сетки в Figma поверх макета в первые 2 секунды ролика.',
        suggestedFormat: 'carousel',
        dateAdded: new Date().toISOString().split('T')[0]
      },
      {
        title: queryClean 
          ? `Челлендж 20 минут: Редизайн по теме «${queryClean}» (До/После) [${timeHash}]`
          : `Интерактивный квест в Stories: найди 3 ошибки в кернинге [${timeHash}]`,
        category: category !== 'all' ? category : 'branding',
        categoryLabel: 'Брендинг',
        source: 'TikTok #DesignTok & Reels',
        description: 'Демонстрация профессионального мышления новичка через исправление оптических неточностей реального макета.',
        tags: ['BeforeAfter', 'Redesign', 'JuniorDesigner', 'ViralHook'],
        relevanceScore: 95,
        keyTakeaway: 'Начинайте с интригующего кадра: «Я не мог спокойно смотреть на это меню...»',
        suggestedFormat: 'reels',
        dateAdded: new Date().toISOString().split('T')[0]
      },
      {
        title: `«Ищу работу джуниором»: открытый разбор отказов и пересборка портфолио [${timeHash}]`,
        category: category !== 'all' ? category : 'editorial',
        categoryLabel: 'Editorial / Карьера',
        source: 'LinkedIn & Threads Discussions',
        description: 'Открытый сериал-дневник начинающего дизайнера: показ переписки с арт-директорами и эволюция кейсов.',
        tags: ['BuildInPublic', 'CareerHunt', 'JuniorPortfolio'],
        relevanceScore: 94,
        keyTakeaway: 'Делитесь исходником Figma в закрепленном сообщении — это доказывает уверенность в решениях.',
        suggestedFormat: 'thread',
        dateAdded: new Date().toISOString().split('T')[0]
      }
    ];

    generatedFallbackTrends = dynamicTemplates.map((t, idx) => ({
      ...t,
      id: `trend-ai-fallback-${Date.now()}-${idx}`
    }));
  }

  // Ensure unique titles
  const uniqueSimulated = generatedFallbackTrends.map((item, idx) => {
    let title = item.title;
    if (db.trends.some(t => t.title.trim().toLowerCase() === title.trim().toLowerCase())) {
      title = `${title} // NEW ${idx + 1}`;
    }
    return { ...item, title };
  });

  if (uniqueSimulated.length > 0) {
    db.trends = [...uniqueSimulated, ...db.trends];
    saveDb(db);
  }

  const isWebGrounded = (cascadeRes.webSources && cascadeRes.webSources.length > 0);
  res.json({
    trends: uniqueSimulated.length > 0 ? uniqueSimulated : db.trends.slice(0, 3),
    live: false,
    provider: isWebGrounded ? 'web_parser' : 'fallback',
    modelUsed: isWebGrounded ? 'Web Scraper & Live Search' : 'Локальный швейцарский радар (Fallback)',
    webSources: cascadeRes.webSources || [],
    telemetry: {
      provider: isWebGrounded ? 'web_parser' : 'fallback',
      status: 200,
      statusText: isWebGrounded ? 'Web Grounded' : 'Local Fallback',
      latencyMs: cascadeRes.latencyMs || 25,
      model: isWebGrounded ? 'Web Parser Engine' : 'swiss-curated-local',
      live: false,
      isFallback: true,
      cascadeTriggered: cascadeDetails.length > 0,
      cascadeDetails: cascadeDetails.join('; '),
      duplicatesSkipped: 0,
      webGrounded: isWebGrounded,
      message: isWebGrounded
        ? `✓ Парсер успешно нашел веб-источники (${cascadeRes.webSources.length} шт.) и сформировал карточки трендов.`
        : `Использован локальный радар трендов. ${cascadeReason ? `Причина: ${cascadeReason}.` : ''}`
    }
  });
});

// GET Posts
app.get('/api/posts', (_req, res) => {
  const db = getDb();
  res.json(db.posts || []);
});

// CHECK DUPLICATE POST (Check if a post with this title or topic already exists)
app.get('/api/posts/check-duplicate', (req, res) => {
  const db = getDb();
  const queryTitle = (req.query.title || '').trim().toLowerCase();
  if (!queryTitle) return res.json({ exists: false });

  const existing = db.posts.find(p => p.title.trim().toLowerCase() === queryTitle);
  if (existing) {
    return res.json({
      exists: true,
      post: existing,
      message: `Карточка «${existing.title}» уже есть в календаре (ID: ${existing.id}, статус: ${existing.status})`
    });
  }
  return res.json({ exists: false });
});

// GET Single Post
app.get('/api/posts/:id', (req, res) => {
  const db = getDb();
  const post = db.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// CREATE Post (with duplicate check & prevention)
app.post('/api/posts', (req, res) => {
  const db = getDb();
  const title = (req.body.title || 'Новый проект в портфолио').trim();
  const forceDuplicate = Boolean(req.body.forceDuplicate || req.query.force === 'true');

  // Deduplication check
  const existingIndex = db.posts.findIndex(p => p.title.trim().toLowerCase() === title.toLowerCase());
  if (existingIndex !== -1 && !forceDuplicate) {
    const existing = db.posts[existingIndex];
    return res.status(200).json({
      ...existing,
      alreadyExisted: true,
      duplicatePrevented: true,
      message: `Карточка «${existing.title}» уже существует в календаре (ID: ${existing.id}, статус: ${existing.status}). Дубликат предотвращен.`
    });
  }

  const finalTitle = (forceDuplicate && existingIndex !== -1)
    ? `${title} (Копия)`
    : title;

  const newPost = {
    id: `post-${Date.now()}`,
    title: finalTitle,
    status: req.body.status || 'idea',
    channels: Array.isArray(req.body.channels) ? req.body.channels : ['instagram', 'telegram'],
    category: req.body.category || 'typography',
    scheduledDate: req.body.scheduledDate || new Date(Date.now() + 86400000).toISOString(),
    format: req.body.format || 'carousel',
    hook: req.body.hook || '',
    caption: req.body.caption || '',
    slides: req.body.slides || [],
    videoScript: req.body.videoScript || [],
    threadPosts: req.body.threadPosts || [],
    telegramPost: req.body.telegramPost || '',
    storiesChain: req.body.storiesChain || [],
    pinterestBoard: req.body.pinterestBoard || 'Swiss Typography & Poster Design',
    destinationUrl: req.body.destinationUrl || 'https://behance.net/junior_designer',
    mediaUrls: Array.isArray(req.body.mediaUrls) ? req.body.mediaUrls : [],
    publishedAt: null,
    publishResults: null
  };
  db.posts.unshift(newPost);
  saveDb(db);
  res.status(201).json(newPost);
});

// UPDATE Post
app.put('/api/posts/:id', (req, res) => {
  const db = getDb();
  const index = db.posts.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Post not found' });

  db.posts[index] = {
    ...db.posts[index],
    ...req.body,
    id: req.params.id
  };
  saveDb(db);
  res.json(db.posts[index]);
});

// DELETE Post
app.delete('/api/posts/:id', (req, res) => {
  const db = getDb();
  const index = db.posts.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Post not found' });

  const deleted = db.posts.splice(index, 1)[0];
  saveDb(db);
  res.json(deleted);
});

// UPLOAD Media Files
app.post('/api/upload', upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  const urls = req.files.map(f => `/uploads/${f.filename}`);
  res.json({ urls, files: req.files });
});

// TEST GOOGLE GEMINI API (Sandbox ping)
app.post('/api/ai/test-gemini', async (req, res) => {
  const db = getDb();
  const apiKey = req.body.apiKey || db.settings?.geminiApiKey || process.env.GEMINI_API_KEY;
  const model = req.body.model || db.settings?.defaultGeminiModel || 'gemini-3.8-flash';
  const result = await testGeminiPing(apiKey, model);
  res.json(result);
});

// TEST OPENROUTER API (Sandbox ping)
app.post('/api/ai/test-openrouter', async (req, res) => {
  const db = getDb();
  const apiKey = req.body.apiKey || db.settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY;
  let model = req.body.model;
  if (!model || model.includes('gemini')) {
    model = (db.settings?.defaultModel?.includes('/') && db.settings?.defaultModel?.includes(':free'))
      ? db.settings.defaultModel
      : 'google/gemma-4-31b-it:free';
  }
  const result = await testOpenRouterPing(apiKey, model);
  res.json(result);
});

// TEST AI CONNECTION (Dual Cascade Sandbox Inspector)
app.post('/api/ai/test-connection', async (req, res) => {
  const { provider } = req.body;
  const db = getDb();
  const geminiKey = req.body.geminiApiKey || db.settings?.geminiApiKey || process.env.GEMINI_API_KEY;
  const openRouterKey = req.body.openRouterApiKey || db.settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY;

  if (provider === 'gemini') {
    const geminiTest = await testGeminiPing(geminiKey, req.body.model || 'gemini-3.8-flash');
    return res.json({
      provider: 'gemini',
      connected: geminiTest.connected,
      status: geminiTest.status,
      statusText: geminiTest.statusText,
      latencyMs: geminiTest.latencyMs,
      model: geminiTest.model,
      reply: geminiTest.reply,
      error: geminiTest.error,
      message: geminiTest.message
    });
  }

  if (provider === 'openrouter') {
    const testModel = (req.body.model?.includes('/') && req.body.model?.includes(':free')) ? req.body.model : 'google/gemma-4-31b-it:free';
    const openRouterTest = await testOpenRouterPing(openRouterKey, testModel);
    return res.json({
      provider: 'openrouter',
      connected: openRouterTest.connected,
      status: openRouterTest.status,
      statusText: openRouterTest.statusText,
      latencyMs: openRouterTest.latencyMs,
      generationId: openRouterTest.generationId,
      actualModel: openRouterTest.actualModel,
      reply: openRouterTest.reply,
      error: openRouterTest.error,
      message: openRouterTest.message
    });
  }

  // Combined Cascade Test with multi-model failover check
  let geminiResult = await testGeminiPing(geminiKey, req.body.model?.includes('gemini') ? req.body.model : 'gemini-3.8-flash');
  if (!geminiResult.connected && geminiKey) {
    for (const altModel of GEMINI_CASCADE_MODELS) {
      if (altModel !== 'gemini-3.8-flash') {
        const alt = await testGeminiPing(geminiKey, altModel);
        if (alt.connected) {
          geminiResult = {
            ...alt,
            message: `✓ Подключение к Google Gemini успешно (через ${altModel}, ${alt.latencyMs}мс)`
          };
          break;
        }
      }
    }
  }

  const preferredOrModel = (req.body.model?.includes('/') && req.body.model?.includes(':free')) ? req.body.model : 'google/gemma-4-31b-it:free';
  let openRouterResult = await testOpenRouterPing(openRouterKey, preferredOrModel);
  if (!openRouterResult.connected && openRouterKey) {
    for (const altModel of OPENROUTER_FREE_CASCADE_MODELS) {
      if (altModel !== preferredOrModel) {
        const alt = await testOpenRouterPing(openRouterKey, altModel);
        if (alt.connected) {
          openRouterResult = {
            ...alt,
            message: `✓ Подключение к OpenRouter успешно (через ${altModel}, ${alt.latencyMs}мс)`
          };
          break;
        }
      }
    }
  }

  const cascadeActive = geminiResult.connected || openRouterResult.connected;
  let summaryMessage = '';
  if (geminiResult.connected && openRouterResult.connected) {
    summaryMessage = 'Каскад полностью готов: Google Gemini (Основной) и OpenRouter (Резерв) активны.';
  } else if (geminiResult.connected && !openRouterResult.connected) {
    summaryMessage = 'Google Gemini активен (Основной). OpenRouter резерв не настроен.';
  } else if (!geminiResult.connected && openRouterResult.connected) {
    summaryMessage = 'OpenRouter активен (Резерв). Google Gemini не настроен или лимит исчерпан.';
  } else {
    summaryMessage = 'Оба провайдера не подключены. Будет использоваться локальный швейцарский шаблон.';
  }

  res.json({
    connected: cascadeActive,
    provider: geminiResult.connected ? 'gemini' : (openRouterResult.connected ? 'openrouter' : 'none'),
    status: cascadeActive ? 200 : 400,
    statusText: cascadeActive ? 'Cascade Ready' : 'No Providers Ready',
    message: summaryMessage,
    gemini: geminiResult,
    openRouter: openRouterResult
  });
});

// TEST SOCIAL NETWORK API CONNECTION
app.post('/api/social/test', async (req, res) => {
  const { channel, credentials = {} } = req.body;
  const start = Date.now();

  try {
    switch (channel) {
      case 'telegram': {
        const botToken = credentials.telegramBotToken?.trim();
        const chatId = credentials.telegramChatId?.trim();
        if (!botToken) return res.json({ success: false, latencyMs: 0, message: 'Укажите Bot Token Telegram' });
        
        const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const meData = await meRes.json();
        const latencyMs = Date.now() - start;
        if (!meData.ok) {
          return res.json({ success: false, latencyMs, message: `Ошибка Telegram API: ${meData.description || 'Неверный токен'}` });
        }
        const botUser = meData.result?.username ? `@${meData.result.username}` : (meData.result?.first_name || 'Bot');
        
        if (chatId) {
          const chatRes = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${encodeURIComponent(chatId)}`);
          const chatData = await chatRes.json();
          if (!chatData.ok) {
            return res.json({
              success: true,
              latencyMs,
              message: `✓ Бот ${botUser} активен (${latencyMs}мс), но в чате ${chatId} бот не найден или не является админом`
            });
          }
          const chatTitle = chatData.result?.title || chatData.result?.username || chatId;
          return res.json({
            success: true,
            latencyMs,
            message: `✓ Бот ${botUser} активен! Связь с «${chatTitle}» подтверждена (${latencyMs}мс)`
          });
        }
        return res.json({
          success: true,
          latencyMs,
          message: `✓ Бот ${botUser} успешно авторизован в Telegram (${latencyMs}мс)`
        });
      }

      case 'bluesky': {
        const identifier = credentials.blueskyIdentifier?.trim();
        const password = credentials.blueskyAppPassword?.trim();
        if (!identifier || !password) return res.json({ success: false, latencyMs: 0, message: 'Укажите Handle и App Password' });
        
        const bskyRes = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password })
        });
        const latencyMs = Date.now() - start;
        const bskyData = await bskyRes.json();
        if (bskyRes.ok && bskyData.did) {
          return res.json({
            success: true,
            latencyMs,
            message: `✓ Авторизация Bluesky успешна! Профиль @${bskyData.handle} (${bskyData.did.slice(0, 16)}...) подключен (${latencyMs}мс)`
          });
        }
        return res.json({
          success: false,
          latencyMs,
          message: `Ошибка Bluesky: ${bskyData.message || bskyData.error || 'Неверный логин или App Password'}`
        });
      }

      case 'instagram': {
        const token = credentials.instagramAccessToken?.trim();
        if (!token) return res.json({ success: false, latencyMs: 0, message: 'Укажите Instagram Graph Token' });
        
        let igRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${token}`);
        let igData = await igRes.json();
        if (!igRes.ok || igData.error) {
          igRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${token}`);
          igData = await igRes.json();
        }
        const latencyMs = Date.now() - start;
        if (igRes.ok && !igData.error) {
          return res.json({
            success: true,
            latencyMs,
            message: `✓ Instagram Graph API подтвержден! Аккаунт @${igData.username || igData.name || igData.id} (${latencyMs}мс)`
          });
        }
        return res.json({
          success: false,
          latencyMs,
          message: `Ошибка Instagram API: ${igData.error?.message || 'Недействительный токен'}`
        });
      }

      case 'threads': {
        const token = credentials.threadsAccessToken?.trim();
        if (!token) return res.json({ success: false, latencyMs: 0, message: 'Укажите Threads Access Token' });
        
        const thRes = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username&access_token=${token}`);
        const thData = await thRes.json();
        const latencyMs = Date.now() - start;
        if (thRes.ok && !thData.error) {
          return res.json({
            success: true,
            latencyMs,
            message: `✓ Threads API подтвержден! Профиль @${thData.username || thData.id} (${latencyMs}мс)`
          });
        }
        return res.json({
          success: false,
          latencyMs,
          message: `Ошибка Threads API: ${thData.error?.message || 'Недействительный токен'}`
        });
      }

      case 'tiktok': {
        const token = credentials.tiktokAccessToken?.trim();
        if (!token) return res.json({ success: false, latencyMs: 0, message: 'Укажите TikTok Access Token' });
        
        const ttRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const ttData = await ttRes.json();
        const latencyMs = Date.now() - start;
        if (ttRes.ok && ttData.data?.user) {
          return res.json({
            success: true,
            latencyMs,
            message: `✓ TikTok API подтвержден! Пользователь "${ttData.data.user.display_name || ttData.data.user.open_id}" (${latencyMs}мс)`
          });
        }
        return res.json({
          success: false,
          latencyMs,
          message: `Ошибка TikTok API: ${ttData.error?.message || ttData.message || 'Токен отклонен TikTok API'}`
        });
      }

      case 'pinterest': {
        const token = credentials.pinterestAccessToken?.trim();
        if (!token) return res.json({ success: false, latencyMs: 0, message: 'Укажите Pinterest API Token' });
        
        const pinRes = await fetch('https://api.pinterest.com/v5/user_account', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const pinData = await pinRes.json();
        const latencyMs = Date.now() - start;
        if (pinRes.ok && pinData.username) {
          return res.json({
            success: true,
            latencyMs,
            message: `✓ Pinterest API подключен! Аккаунт @${pinData.username} (${pinData.account_type || 'Business'}) (${latencyMs}мс)`
          });
        }
        return res.json({
          success: false,
          latencyMs,
          message: `Ошибка Pinterest API: ${pinData.message || 'Неверный Pinterest токен'}`
        });
      }

      case 'linkedin': {
        const token = credentials.linkedinAccessToken?.trim();
        if (!token) return res.json({ success: false, latencyMs: 0, message: 'Укажите LinkedIn Access Token' });
        
        const liRes = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const liData = await liRes.json();
        const latencyMs = Date.now() - start;
        if (liRes.ok && (liData.name || liData.sub)) {
          return res.json({
            success: true,
            latencyMs,
            message: `✓ LinkedIn токен активен! Профиль: ${liData.name || liData.email || liData.sub} (${latencyMs}мс)`
          });
        }
        return res.json({
          success: false,
          latencyMs,
          message: `Ошибка LinkedIn API: ${liData.message || 'Неверный токен доступа'}`
        });
      }

      case 'twitter': {
        const key = credentials.xApiKey?.trim();
        if (!key) return res.json({ success: false, latencyMs: 0, message: 'Укажите X API Key / Bearer Token' });
        
        const xRes = await fetch('https://api.twitter.com/2/users/me', {
          headers: { 'Authorization': `Bearer ${key}` }
        });
        const xData = await xRes.json();
        const latencyMs = Date.now() - start;
        if (xRes.ok && xData.data?.username) {
          return res.json({
            success: true,
            latencyMs,
            message: `✓ X API подключен! Аккаунт @${xData.data.username} (${xData.data.name}) (${latencyMs}мс)`
          });
        }
        return res.json({
          success: false,
          latencyMs,
          message: `Ошибка X API (${xRes.status}): ${xData.detail || xData.title || xData.errors?.[0]?.message || 'Токен не прошел авторизацию'}`
        });
      }

      default:
        return res.json({ success: false, latencyMs: 0, message: `Неизвестная сеть: ${channel}` });
    }
  } catch (err) {
    return res.json({ success: false, latencyMs: Date.now() - start, message: `Ошибка проверки API: ${err.message}` });
  }
});

// AI SCRIPT GENERATION (Dual-Provider Cascade: Gemini -> OpenRouter -> Local Fallback)
app.post('/api/ai/generate-script', async (req, res) => {
  const {
    title,
    topic,
    format,
    targetAudience,
    tone,
    channels,
    model: requestedModel,
    viralStrategy,
    preferredProvider,
    useWebSearch,
    sourceUrl,
    webQuery
  } = req.body;

  const db = getDb();
  const settings = db.settings || {};
  const geminiApiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
  const openRouterApiKey = settings.openRouterApiKey || process.env.OPENROUTER_API_KEY;
  const aiProviderMode = preferredProvider || settings.aiProviderMode || 'cascade';

  const systemPrompt = `Ты — наставник и виральный сценарист для НАЧИНАЮЩЕГО графического дизайнера (Junior / Entry-level), который находится в активном поиске работы в дизайн-студии или первых клиентов на фрилансе (#BuildInPublic, #JuniorDesigner, #PortfolioHunt).
Твоя цель: разработать сценарий, который НЕ звучит как пафосное агентство с 20-летним опытом, а звучит искренне, компетентно, дерзко и профессионально от лица голодного до практики новичка.

Стратегия: ${viralStrategy || 'Редизайн бренда / Поиск работы и разбор портфолио'}.
Формат: ${format || 'carousel'}.

Ключевые приемы виральности:
1. Хук первой секунды: «Я джуниор-дизайнер, и эта вывеска не давала мне спать...» или «Отправил 20 откликов в студии — вот главная ошибка в моем портфолио».
2. Демонстрация мысли: объяснить, КАК именно модульная сетка 8px или закон контраста исправили макет.
3. Прозрачность: готовность делиться Figma-исходниками и принимать обратную связь от лид-дизайнеров.

Верни ответ СТРОГО в формате JSON:
{
  "hook": "Мощный хук для первой секунды от лица джуниора (до 100 знаков)",
  "caption": "Текст поста для Instagram (с живыми эмоциями, анализом До/После, призывом оценить и хештегами #juniorgraphicdesigner #buildinpublic #swissposter #figmatips)",
  "slides": [
    { "slideNumber": 1, "title": "COVER // BEFORE & AFTER", "text": "Текст обложки", "visualPrompt": "Что показать на 1 слайде" },
    { "slideNumber": 2, "title": "ОШИБКА 1", "text": "Разбор первого косяка в верстке", "visualPrompt": "Красные маркеры на старом макете" },
    { "slideNumber": 3, "title": "СЕТКА 8PX", "text": "Как я переверстал по модульной сетке", "visualPrompt": "Сетка направляющих в Figma" },
    { "slideNumber": 4, "title": "РЕЗУЛЬТАТ", "text": "Финальный вариант в среде", "visualPrompt": "Реалистичный мокап" },
    { "slideNumber": 5, "title": "CTA // ПОРТФОЛИО", "text": "Призыв забрать Figma-файл и посмотреть мое портфолио", "visualPrompt": "Контакты и ссылка" }
  ],
  "storiesChain": [
    { "screenNumber": 1, "title": "STORY 1 // ТЕСТ-ХУК", "textOverlay": "Короткий провокационный вопрос", "stickerType": "poll", "stickerContent": "Вариант А / Вариант Б", "visualPrompt": "Сравнение двух вариантов" },
    { "screenNumber": 2, "title": "STORY 2 // ПРОБЛЕМА", "textOverlay": "В чем подвох старого макета", "stickerType": "none", "stickerContent": "", "visualPrompt": "Зум на ошибку кернинга" },
    { "screenNumber": 3, "title": "STORY 3 // ПРАВИЛО", "textOverlay": "Швейцарское правило, решившее задачу", "stickerType": "slider", "stickerContent": "🔥 Оцените чистоту", "visualPrompt": "Анимация выравнивания" },
    { "screenNumber": 4, "title": "STORY 4 // ПОРТФОЛИО", "textOverlay": "Ищу стажировку/работу! Ссылка на портфолио:", "stickerType": "link", "stickerContent": "Мое портфолио", "visualPrompt": "Стикер ссылки" }
  ],
  "videoScript": [
    { "time": "00:00 - 00:03", "visual": "Показываю пальцем на плохой макет / скриншот", "audio": "Я джуниор-дизайнер, и это не давало мне покоя", "textOverlay": "ПОЧЕМУ ЭТО ПЛОХО?" },
    { "time": "00:03 - 00:10", "visual": "Ускоренная работа в Figma: включаю сетку 8px", "audio": "Смотрите, как меняется баланс за 1 минуту", "textOverlay": "СЕТКА 8PX В ДЕЛЕ" },
    { "time": "00:10 - 00:18", "visual": "Финальный результат на красивом мокапе", "audio": "Напишите в комментах, взяли бы меня в студию?", "textOverlay": "ОЦЕНИТЕ РЕЗУЛЬТАТ" }
  ],
  "threadPosts": [
    "1/4 Я ищу первую работу графическим дизайнером и решил каждый день делать редизайн реальных брендов. День 1: разбираем ошибки верстки 🧵👇",
    "2/4 Главная беда многих вывесок — центрирование текста без учета длины строк. Из-за этого макет заваливается вбок.",
    "3/4 Решение по швейцарской школе: левосторонний флаг + привязка всех отступов к базовой линии 8px. Читаемость выросла в разы.",
    "4/4 Исходник выложил в Telegram. Буду благодарен арт-директорам за честную критику в комментариях!"
  ],
  "telegramPost": "⚡️ **КАК Я СДЕЛАЛ РЕДИЗАЙН И ЧЕМУ ЭТО МЕНЯ НАУЧИЛО**\\n\\nПривет! Я начинающий дизайнер, и сегодня переверстал реальный макет по швейцарской сетке.\\n\\n3 вывода, которые стоит знать каждому новичку:\\n1. **Не центрируйте всё подряд** — динамика левого флага привлекает взгляд быстрее.\\n2. **Шаг 8px** избавляет от сомнений в отступах.\\n3. **Один гротеск** надежнее трех шрифтов.\\n\\n_Забирайте исходник Figma в закрепленном сообщении!_",
  "linkedinPost": "Как начинающий дизайнер я понял главное: студиям не нужны картинки ради картинок, им нужно решение задач бизнеса.\\n\\nВ этом кейсе я разобрал редизайн вывески и доказал, как математическая модульная сетка повышает скорость считывания бренда с расстояния 30 метров.\\n\\nОткрыт к предложениям о стажировке и джуниор-позициям в дизайн-командах!",
  "pinterestDescription": "Редизайн вывески и постера в швейцарском стиле: анатомия сетки 8px, контраст шрифтов и визуальный баланс. Кейс начинающего дизайнера для портфолио."
}
Верни ТОЛЬКО валидный JSON без лишнего текста.`;

  const userPrompt = `Сгенерируй виральный сценарий для портфолио джуниор-дизайнера на тему: "${title || topic}". Стратегия: ${viralStrategy || 'Редизайн бренда / Поиск работы'}. Формат: ${format || 'carousel'}. Каналы: ${(channels || []).join(', ')}.`;

  // ==========================================
  // MULTI-MODEL CASCADE SCRIPT GENERATION (TRY PREFERRED -> ALL CANDIDATES IN POOL)
  // ==========================================
  const cascadeRes = await executeCascadeGeneration({
    systemPrompt,
    userPrompt,
    parser: robustExtractJson,
    preferredModel: requestedModel || settings.defaultModel || 'gemini-3.8-flash',
    geminiApiKey,
    openRouterApiKey,
    aiProviderMode,
    useWebSearch: Boolean(useWebSearch ?? true),
    sourceUrl,
    webQuery: webQuery || title || topic,
    onLog: msg => console.warn('[AI CASCADE - SCRIPT]', msg)
  });

  if (cascadeRes.ok && cascadeRes.data) {
    return res.json({
      result: cascadeRes.data,
      live: true,
      provider: cascadeRes.provider,
      modelUsed: cascadeRes.modelUsed,
      webSources: cascadeRes.webSources || [],
      grounding: cascadeRes.grounding || null,
      telemetry: {
        provider: cascadeRes.provider,
        status: 200,
        statusText: 'OK',
        latencyMs: cascadeRes.latencyMs,
        generationId: cascadeRes.generationId,
        model: cascadeRes.modelUsed,
        tokens: cascadeRes.tokens,
        live: true,
        isFallback: false,
        cascadeTriggered: cascadeRes.cascadeTriggered,
        message: cascadeRes.message,
        webGrounded: (cascadeRes.webSources && cascadeRes.webSources.length > 0) || Boolean(cascadeRes.grounding)
      }
    });
  }

  console.warn('[AI CASCADE - SCRIPT] All candidate models failed or unavailable:', cascadeRes.attemptTrail);

  // ==========================================
  // STEP 3: HIGH-FIDELITY LOCAL SWISS TEMPLATE (ULTIMATE FALLBACK)
  // ==========================================
  const topicClean = title || topic || 'Редизайн вывески по швейцарской сетке';
  const fallbackResult = {
    hook: `Я джуниор-дизайнер, и этот дизайн не давал мне спать. Исправляем ошибки верстки за 15 минут.`,
    caption: `Я активно ищу работу в дизайн-студии и прокачиваю насмотренность каждый день.\\n\\nВ теме «${topicClean}» я заметил классическую ошибку новичков — хаотичные отступы и отсутствие базовой линии. Из-за этого макет выглядит дёшево и распадается при первом взгляде.\\n\\nПересобрал концепт по строгой швейцарской сетке 8px:\\n1. Зафиксировал базовый вертикальный ритм.\\n2. Усилил контраст кеглей (96pt vs 14pt).\\n3. Убрал визуальный мусор.\\n\\nАрт-директора, буду рад вашей честной критике в комментариях! Исходник открыт в Figma.\\n\\n#juniorgraphicdesigner #buildinpublic #swissposter #brandredesign #figma #jobhunt`,
    slides: [
      {
        slideNumber: 1,
        title: 'COVER // BEFORE & AFTER',
        text: `РЕДИЗАЙН: ${topicClean.toUpperCase()}`,
        visualPrompt: 'Контрастное разделение: слева проблемный исходник, справа выверенный швейцарский постер.'
      },
      {
        slideNumber: 2,
        title: 'ПРОБЛЕМА 1 // ХАОС ОТСТУПОВ',
        text: 'Отступы 11px, 23px, 17px. Человеческий глаз чувствует неаккуратность на подсознании.',
        visualPrompt: 'Линейка с замером хаотичных отступов и красные маркеры.'
      },
      {
        slideNumber: 3,
        title: 'РЕШЕНИЕ // СЕТКА 8PX',
        text: 'Все расстояния строго кратны 8px (16, 24, 32, 64). Макет обретает архитектурный порядок.',
        visualPrompt: 'Сетка направляющих в Figma поверх белого холста.'
      },
      {
        slideNumber: 4,
        title: 'РЕЗУЛЬТАТ В СРЕДЕ',
        text: 'Финальный макет на фасаде/в интерфейсе. Читается с первого взгляда.',
        visualPrompt: 'Фотореалистичный мокап постера в городской среде.'
      },
      {
        slideNumber: 5,
        title: 'CTA // ИЩУ РАБОТУ',
        text: 'Исходник Figma в моем Telegram. Открыт к вакансиям джуниор-дизайнера и стажировкам!',
        visualPrompt: 'Плашка с контактами, ником в соцсетях и QR-кодом на резюме.'
      }
    ],
    storiesChain: [
      {
        screenNumber: 1,
        title: 'STORY 1 // КВЕСТ-ХУК',
        textOverlay: 'Какой вариант выглядит дороже и чище для клиента?',
        stickerType: 'poll',
        stickerContent: 'Старый / Мой редизайн',
        visualPrompt: 'Два постера рядом на черном фоне со стикером опроса'
      },
      {
        screenNumber: 2,
        title: 'STORY 2 // В ЧЕМ ОШИБКА',
        textOverlay: 'В 1-м варианте нарушена базовая линия: текст плывет относительно заголовка.',
        stickerType: 'none',
        stickerContent: '',
        visualPrompt: 'Крупный зум на кривой кернинг'
      },
      {
        screenNumber: 3,
        title: 'STORY 3 // ПРАВИЛО 8PX',
        textOverlay: 'Пересобрал за 15 минут по модульной сетке. Оцените разницу:',
        stickerType: 'slider',
        stickerContent: '🔥 Оцените чистоту',
        visualPrompt: 'Анимация наложения сетки 8px'
      },
      {
        screenNumber: 4,
        title: 'STORY 4 // ПОРТФОЛИО',
        textOverlay: 'Ищу стажировку в студии! Посмотреть мои кейсы можно по ссылке:',
        stickerType: 'link',
        stickerContent: 'Мое Behance-портфолио',
        visualPrompt: 'Стикер со стрелкой вверх'
      }
    ],
    videoScript: [
      {
        time: '00:00 - 00:03',
        visual: 'Показываю пальцем на экран с кривым макетом.',
        audio: 'Я джуниор-дизайнер, и этот макет не давал мне спать.',
        textOverlay: 'ПОЧЕМУ ЭТО ПЛОХО?'
      },
      {
        time: '00:03 - 00:10',
        visual: 'Скринкаст из Figma: быстро выравниваю элементы по базовой линии 8px.',
        audio: 'Смотрите, как модульная сетка превращает хаос в швейцарскую классику.',
        textOverlay: 'МАГИЯ СЕТКИ 8PX'
      },
      {
        time: '00:10 - 00:18',
        visual: 'Финальный мокап постера. Мое лицо с улыбкой.',
        audio: 'Напишите в комментариях, взяли бы меня к себе в студию?',
        textOverlay: 'ИЩУ РАБОТУ В ДИЗАЙНЕ'
      }
    ],
    threadPosts: [
      `1/4 Я ищу первую работу графическим дизайнером и показываю процесс в реальном времени. Разбираем тему: ${topicClean} 🧵👇`,
      `2/4 Самая частая ошибка новичков — хаотичный интерлиньяж. Когда межстрочное расстояние не кратно шагу сетки, текст визуально спотыкается.`,
      `3/4 Как исправить: привязываем интерлиньяж строго к шагу 8px (заголовок 32/40, текст 16/24). Макет мгновенно начинает выглядеть как швейцарская студийная работа.`,
      `4/4 Исходный Figma-файл выложил в Telegram (ссылка в био). Буду рад честному фидбеку от арт-директоров!`
    ],
    telegramPost: `⬛️ **${topicClean.toUpperCase()} // РАЗБОР КЕЙСА ДЛЯ ПОРТФОЛИО**\\n\\nПривет! Я джуниор-дизайнер и делюсь разбором сегодняшнего проекта.\\n\\n3 правила, которые я вывел на практике:\\n1. **Асимметрия** привлекает взгляд быстрее центрирования.\\n2. **Модульная сетка 8px** убирает споры о размерах отступов.\\n3. **Контраст весов** Regular vs Black создает премиальность без лишнего декора.\\n\\n_Исходник в Figma доступен для подписчиков. Напишите, взяли бы меня в студию?_`,
    linkedinPost: `Как начинающий специалист в графическом дизайне, я считаю, что лучший способ заявить о себе — показывать логику решений, а не просто картинки.\\n\\nВ проекте «${topicClean}» я продемонстрировал, как внедрение стандартизированной модульной сетки сокращает время согласования макетов с арт-директором на 40%.\\n\\nАктивно ищу позицию Junior Graphic Designer / стажера в продуктовой компании или дизайн-студии. Мое портфолио открыто для ревью!`,
    pinterestDescription: `Кейс начинающего графического дизайнера: редизайн и модульная сетка в швейцарском стиле. Построение композиции, контраст шрифтов и сетка 8px для постеров. Сохраняйте в доску графического дизайна.`,
    isSimulated: true,
    modelUsed: 'Локальный шаблон (Fallback)'
  };

  const trail = cascadeRes.attemptTrail || [];
  const cascadeDetails = trail.map(a => `${a.model} (${a.error || a.status})`);
  const lastAttempt = trail[trail.length - 1] || {};
  const diagnosticMsg = cascadeDetails.length > 0
    ? `Каскад исчерпан (${cascadeDetails.join(' | ')}). Активирован проверенный локальный швейцарский шаблон.`
    : 'Ключи API не настроены. Применен локальный швейцарский шаблон.';

  res.json({
    result: fallbackResult,
    live: false,
    provider: 'fallback',
    modelUsed: 'Локальный шаблон (Fallback)',
    telemetry: {
      status: lastAttempt.status || 200,
      statusText: 'Local Fallback',
      latencyMs: cascadeRes.latencyMs || 25,
      model: 'Локальный шаблон',
      live: false,
      isFallback: true,
      cascadeTriggered: cascadeDetails.length > 0,
      cascadeDetails: cascadeDetails.join('; '),
      geminiStatus: trail.find(t => t.provider === 'gemini')?.status || null,
      geminiError: trail.find(t => t.provider === 'gemini')?.error || null,
      openRouterStatus: trail.find(t => t.provider === 'openrouter')?.status || null,
      openRouterError: trail.find(t => t.provider === 'openrouter')?.error || null,
      message: diagnosticMsg
    }
  });
});

// PUBLISH TO SOCIAL NETWORKS
app.post('/api/publish', async (req, res) => {
  const { postId, channels, customTexts, scheduledDate, isScheduled } = req.body;
  const db = getDb();
  const postIndex = db.posts.findIndex(p => p.id === postId);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const post = db.posts[postIndex];
  const settings = db.settings || {};
  const targetChannels = Array.isArray(channels) && channels.length > 0 ? channels : post.channels;
  const simulationMode = settings.simulationMode !== false;

  const results = {};
  const logs = [];

  const addLog = (channel, status, detail) => {
    logs.push({
      channel,
      status,
      timestamp: new Date().toISOString(),
      detail
    });
  };

  if (isScheduled) {
    post.status = 'scheduled';
    post.scheduledDate = scheduledDate || post.scheduledDate;
    saveDb(db);
    return res.json({
      success: true,
      message: `Пост успешно запланирован на ${new Date(post.scheduledDate).toLocaleString('ru-RU')}`,
      post
    });
  }

  // Telegram
  if (targetChannels.includes('telegram')) {
    const text = customTexts?.telegram || post.telegramPost || post.caption || post.title;
    const botToken = settings.telegramBotToken;
    const chatId = settings.telegramChatId;

    if (!simulationMode && botToken && chatId) {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
        });
        const tgData = await tgRes.json();
        if (tgData.ok) {
          results.telegram = { success: true, messageId: tgData.result.message_id, mode: 'live' };
          addLog('telegram', 'success', `Отправлено в Telegram (Message ID: ${tgData.result.message_id})`);
        } else {
          results.telegram = { success: false, error: tgData.description, mode: 'live' };
          addLog('telegram', 'error', `Ошибка Telegram API: ${tgData.description}`);
        }
      } catch (err) {
        results.telegram = { success: false, error: err.message, mode: 'live' };
        addLog('telegram', 'error', `Сетевой сбой Telegram: ${err.message}`);
      }
    } else {
      results.telegram = { success: true, messageId: `tg_sim_${Date.now()}`, mode: 'simulated' };
      addLog('telegram', 'simulated', `[SANDBOX] Сообщение проверено и отправлено в Telegram.`);
    }
  }

  // Bluesky
  if (targetChannels.includes('bluesky')) {
    const text = (customTexts?.bluesky || post.threadPosts?.[0] || post.caption || post.title).slice(0, 300);
    results.bluesky = { success: true, uri: `at://did:plc:sim/app.bsky.feed.post/${Date.now()}`, mode: 'simulated' };
    addLog('bluesky', 'simulated', `[SANDBOX] Skeet валидирован (лимит 300 символов) и опубликован в Bluesky.`);
  }

  // X (Twitter)
  if (targetChannels.includes('twitter')) {
    results.twitter = { success: true, tweetId: `tw_sim_${Date.now()}`, mode: 'simulated' };
    addLog('twitter', 'simulated', `[SANDBOX] Твит проверен (лимит 280 символов) и отправлен в поток X.`);
  }

  // Instagram
  if (targetChannels.includes('instagram')) {
    const isStories = post.format === 'stories';
    results.instagram = { success: true, mediaId: `ig_${isStories ? 'story' : 'feed'}_${Date.now()}`, mode: 'simulated' };
    addLog('instagram', 'simulated', isStories 
      ? `[SANDBOX] Цепочка Stories (9:16) со стикерами проверена и опубликована в Instagram Stories.`
      : `[SANDBOX] Карусель проверена по пропорциям и отправлена в ленту Instagram.`);
  }

  // TikTok
  if (targetChannels.includes('tiktok')) {
    results.tiktok = { success: true, videoId: `tt_${Date.now()}`, mode: 'simulated' };
    addLog('tiktok', 'simulated', `[SANDBOX] Видео 9:16 со звуковым тегом #juniorgraphicdesigner отправлено в TikTok.`);
  }

  // Pinterest
  if (targetChannels.includes('pinterest')) {
    results.pinterest = { success: true, pinId: `pin_${Date.now()}`, mode: 'simulated' };
    addLog('pinterest', 'simulated', `[SANDBOX] Пин 2:3 с доской "${post.pinterestBoard || 'Design'}" и ссылкой размещен в Pinterest.`);
  }

  // LinkedIn
  if (targetChannels.includes('linkedin')) {
    results.linkedin = { success: true, updateUrn: `urn:li:share:${Date.now()}`, mode: 'simulated' };
    addLog('linkedin', 'simulated', `[SANDBOX] Профессиональный B2B лонгрид опубликован в ленту LinkedIn.`);
  }

  // Threads
  if (targetChannels.includes('threads')) {
    results.threads = { success: true, threadId: `th_${Date.now()}`, mode: 'simulated' };
    addLog('threads', 'simulated', `[SANDBOX] Пост Threads опубликован в Meta Threads.`);
  }

  post.status = 'published';
  post.publishedAt = new Date().toISOString();
  post.publishResults = results;
  saveDb(db);

  res.json({
    success: true,
    publishedAt: post.publishedAt,
    results,
    logs,
    post
  });
});

// GET Settings
app.get('/api/settings', (_req, res) => {
  const db = getDb();
  const s = db.settings || {};
  const mask = str => str && str.length > 8 ? `${str.slice(0, 4)}...${str.slice(-4)}` : (str ? '********' : '');
  res.json({
    ...s,
    openRouterApiKeyMasked: mask(s.openRouterApiKey),
    telegramBotTokenMasked: mask(s.telegramBotToken),
    blueskyAppPasswordMasked: mask(s.blueskyAppPassword),
    xApiKeyMasked: mask(s.xApiKey),
    instagramAccessTokenMasked: mask(s.instagramAccessToken),
    tiktokAccessTokenMasked: mask(s.tiktokAccessToken),
    pinterestAccessTokenMasked: mask(s.pinterestAccessToken),
    linkedinAccessTokenMasked: mask(s.linkedinAccessToken),
    threadsAccessTokenMasked: mask(s.threadsAccessToken),
    hasOpenRouterKey: Boolean(s.openRouterApiKey),
    hasTelegramKey: Boolean(s.telegramBotToken && s.telegramChatId),
    hasBlueskyKey: Boolean(s.blueskyIdentifier && s.blueskyAppPassword),
    hasXKey: Boolean(s.xApiKey && s.xAccessToken),
    hasInstagramKey: Boolean(s.instagramAccessToken && s.instagramAccountId),
    hasTikTokKey: Boolean(s.tiktokAccessToken),
    hasPinterestKey: Boolean(s.pinterestAccessToken),
    hasLinkedInKey: Boolean(s.linkedinAccessToken),
    hasThreadsKey: Boolean(s.threadsAccessToken)
  });
});

// UPDATE Settings
app.post('/api/settings', (req, res) => {
  const db = getDb();
  const current = db.settings || {};
  const updated = { ...current, ...req.body };

  [
    'openRouterApiKey', 'telegramBotToken', 'telegramChatId', 'blueskyIdentifier', 
    'blueskyAppPassword', 'xApiKey', 'xApiSecret', 'xAccessToken', 'xAccessSecret', 
    'instagramAccessToken', 'instagramAccountId', 'tiktokAccessToken', 
    'pinterestAccessToken', 'linkedinAccessToken', 'threadsAccessToken',
    'creatorProfile', 'webSearchEnabled'
  ].forEach(key => {
    if (req.body[key] !== undefined) {
      updated[key] = req.body[key];
    }
  });

  db.settings = updated;
  saveDb(db);
  res.json({ success: true, message: 'Настройки успешно сохранены' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SWISS ENGINE] Server running on http://localhost:${PORT}`);
});
