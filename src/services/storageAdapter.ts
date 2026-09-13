import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Post, Trend, AppSettings } from '../types/index.ts';

// Initial Demo Trends for Swiss Design & Junior Job Search
export const INITIAL_TRENDS: Trend[] = [
  {
    id: 'trend-1',
    title: 'Редизайн логотипов и упаковки новичком: разбор в Figma',
    category: 'branding',
    categoryLabel: 'Брендинг',
    source: 'TikTok #DesignTok & Behance 2026',
    description: 'Виральный формат для джуниоров: взять логотип известного бренда с нарушенной оптикой, исправить по швейцарской сетке и показать процесс До/После. Привлекает арт-директоров студий.',
    tags: ['Brand Redesign', 'Junior Portfolio', 'Before After', 'Figma Breakdown'],
    relevanceScore: 99,
    keyTakeaway: 'Покажите не просто красивую картинку, а ход мыслей: почему старый вариант разваливался и как сетка решила проблему.',
    suggestedFormat: 'carousel',
    dateAdded: '2026-03-10'
  },
  {
    id: 'trend-2',
    title: 'Интерактивные Stories-тесты: «Угадай, где факап в кернинге»',
    category: 'typography',
    categoryLabel: 'Типографика',
    source: 'Instagram Stories Creator Strategy',
    description: 'Серия из 4 сторис со стикерами-опросами. Подписчики голосуют за правильный вариант интервалов, а на 4-й сторис получают ссылку на ваш разбор.',
    tags: ['Stories Quiz', 'Poll Sticker', 'Kerning Game', 'Viral Engagement'],
    relevanceScore: 98,
    keyTakeaway: 'Интерактив со стикером-опросом на первой сторис поднимает досмотр всей цепочки до 78%.',
    suggestedFormat: 'stories',
    dateAdded: '2026-03-11'
  },
  {
    id: 'trend-3',
    title: 'Реалити поиска первой работы в дизайне (#BuildInPublic)',
    category: 'editorial',
    categoryLabel: 'Editorial / Career',
    source: 'LinkedIn & Threads Viral Posts',
    description: 'Честный дневник начинающего дизайнера: тестовые задания, фидбек от арт-директоров, ошибки в резюме и пересборка портфолио в прямом эфире.',
    tags: ['Job Hunt', 'Build In Public', 'Junior Reality', 'Art Director Feedback'],
    relevanceScore: 96,
    keyTakeaway: 'Студии нанимают тех, кто умеет адекватно воспринимать критику и быстро расти. Честность привлекает лидов команд.',
    suggestedFormat: 'thread',
    dateAdded: '2026-03-12'
  },
  {
    id: 'trend-4',
    title: '30-минутный челлендж швейцарского плаката в TikTok',
    category: 'motion',
    categoryLabel: 'Motion & AI',
    source: 'TikTok Viral Creative Challenges',
    description: 'Таймлапс верстки плаката под динамичный трек: генерация случайных слов, натяжка сетки 8px и финальный результат с мокапом.',
    tags: ['Speed Design', '30Min Challenge', 'Swiss Poster', 'Timelapse'],
    relevanceScore: 94,
    keyTakeaway: 'Первые 2 секунды видео должны сразу показывать готовый постер, а затем таймер «00:00: Как я это сделал».',
    suggestedFormat: 'reels',
    dateAdded: '2026-03-12'
  }
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post-1',
    title: 'Редизайн вывески кофейни у дома: как сетка спасает дизайн',
    status: 'published',
    channels: ['instagram', 'tiktok', 'telegram', 'threads'],
    category: 'branding',
    scheduledDate: '2026-03-10T14:00:00.000Z',
    format: 'carousel',
    hook: 'Увидел эту вывеску по дороге за кофе — и не смог пройти мимо. Исправляем ошибки за 15 минут.',
    caption: 'Я начинающий графический дизайнер, и моя главная привычка — анализировать всё, что вижу на улице.\n\nВ этой вывеске было нарушено главное швейцарское правило: текст центрирован, но из-за разной длины строк визуальный вес заваливался вправо.\n\nПереверстал макет по модульной сетке 8px:\n1. Сместил смысловой акцент влево.\n2. Увеличил контраст кеглей с 1:1.2 до 1:2.5.\n3. Убрал лишние вензеля и оставил чистый гротеск.\n\nКак вам результат? Какой вариант выбрали бы для своего бизнеса?\n\n#juniorgraphicdesigner #brandredesign #buildinpublic #swissposter #figmatips',
    slides: [
      { slideNumber: 1, title: 'COVER // BEFORE/AFTER', text: 'РЕДИЗАЙН ВЫВЕСКИ: ДО И ПОСЛЕ', visualPrompt: 'Разделенный пополам постер: слева старая кривая вывеска, справа строгий швейцарский вариант.' },
      { slideNumber: 2, title: 'АНАЛИЗ ОШИБКИ', text: 'Проблема: оптический дисбаланс и хаотичный интерлиньяж.', visualPrompt: 'Красные маркеры на старом дизайне с замером расстояний.' },
      { slideNumber: 3, title: 'ПРАВИЛО 8PX', text: 'Строим модульную сетку с шагом 8px и выравниваем доминанту влево.', visualPrompt: 'Сетка направляющих поверх белого холста.' },
      { slideNumber: 4, title: 'РЕЗУЛЬТАТ В СРЕДЕ', text: 'Финальный макет на фасаде здания. Читается с 30 метров.', visualPrompt: 'Реалистичный мокап вывески на фасаде здания.' },
      { slideNumber: 5, title: 'CTA // ПОЛУЧИТЬ ФАЙЛ', text: 'Исходник в Figma выложил в Telegram. Ищу стажировку в дизайн-студии!', visualPrompt: 'Плашка с контактами и ссылкой на портфолио.' }
    ],
    storiesChain: [
      { screenNumber: 1, title: 'STORY 1 // ТЕСТ', textOverlay: 'Какая вывеска привлечет больше клиентов в кофейню?', stickerType: 'poll', stickerContent: 'Старая / Мой редизайн', visualPrompt: 'Сравнение двух вариантов на черном фоне' },
      { screenNumber: 2, title: 'STORY 2 // ПРОБЛЕМА', textOverlay: 'Старый вариант спотыкался на 3 ошибках композиции.', stickerType: 'none', stickerContent: '', visualPrompt: 'Увеличенный фрагмент с кривым кернингом' },
      { screenNumber: 3, title: 'STORY 3 // РЕШЕНИЕ', textOverlay: 'Пересобрал по швейцарской сетке за 20 минут. Оцените разницу:', stickerType: 'slider', stickerContent: '🔥 Оценка редизайна', visualPrompt: 'Анимированное появление сетки' },
      { screenNumber: 4, title: 'STORY 4 // РЕЗУЛЬТАТ', textOverlay: 'Полный разбор в новом посте ленты. Буду рад вашим комментариям!', stickerType: 'link', stickerContent: 'Смотреть карусель', visualPrompt: 'Стрелка перехода в пост' }
    ],
    videoScript: [
      { time: '00:00 - 00:03', visual: 'Показываю пальцем на старую кривую вывеску на улице.', audio: 'Я джуниор-дизайнер, и эта вывеска не давала мне спать.', textOverlay: 'ПОЧЕМУ ЭТО ПЛОХО?' },
      { time: '00:03 - 00:10', visual: 'Скринкаст: быстро обвожу ошибки красным, затем включаю сетку в Figma.', audio: 'Смотрите, как меняется восприятие, если включить базовую модульную сетку.', textOverlay: 'МАГИЯ СЕТКИ 8PX' },
      { time: '00:10 - 00:18', visual: 'Финальный постер на мокапе. Мое лицо с улыбкой.', audio: 'Напишите в комментариях, взяли бы меня джуном в свою студию?', textOverlay: 'ИЩУ РАБОТУ В ДИЗАЙНЕ' }
    ],
    mediaUrls: ['./demo-assets/swiss-grid-preview.svg'],
    publishedAt: '2026-03-10T14:02:11.000Z',
    timeSpentMinutes: 75
  },
  {
    id: 'post-2',
    title: 'Тестовое задание в дизайн-студию: за что меня похвалил арт-директор',
    status: 'scheduled',
    channels: ['instagram', 'linkedin', 'threads', 'telegram'],
    category: 'editorial',
    scheduledDate: '2026-03-14T16:30:00.000Z',
    format: 'stories',
    hook: 'Я отправил 20 откликов на вакансии джуниора. Вот главное замечание от арт-директора.',
    caption: 'Когда ты начинающий специалист, твой главный страх — что тестовое задание даже не откроют.\n\nНо на этой неделе я получил подробный разбор от лид-дизайнера крупной студии. Делюсь инсайтами в Stories.',
    storiesChain: [
      { screenNumber: 1, title: 'STORY 1 // РЕАЛИТИ', textOverlay: 'Мне пришел разбор тестового от арт-директора студии моей мечты.', stickerType: 'poll', stickerContent: 'Интересно, что ответили? (Да / Очень)', visualPrompt: 'Скриншот письма с размытым текстом' },
      { screenNumber: 2, title: 'STORY 2 // ПЛЮСЫ', textOverlay: '«Отличная работа с иерархией заголовков и чистота модульной сетки».', stickerType: 'none', stickerContent: '', visualPrompt: 'Цитата арт-директора крупным гротеском' },
      { screenNumber: 3, title: 'STORY 3 // ОШИБКА', textOverlay: 'Главный косяк: переборщил с декором во 2-м слайде. Простота всегда бьет украшательства.', stickerType: 'slider', stickerContent: '💡 Полезно знать', visualPrompt: 'Красный маркер на лишних элементах' },
      { screenNumber: 4, title: 'STORY 4 // ПОРТФОЛИО', textOverlay: 'Обновил кейс в портфолио с учетом замечаний. Ссылка тут:', stickerType: 'link', stickerContent: 'Мое портфолио', visualPrompt: 'Стикер-ссылка на Behance' }
    ],
    mediaUrls: [],
    publishedAt: null,
    timeSpentMinutes: 45
  }
];

export const INITIAL_SETTINGS: AppSettings = {
  geminiApiKey: '',
  openRouterApiKey: '',
  aiProviderMode: 'cascade',
  defaultModel: 'gemini-2.5-flash',
  defaultGeminiModel: 'gemini-2.5-flash',
  availableModels: [
    { id: 'gemini-2.5-flash', name: '✨ Google Gemini 2.5 Flash (Рекомендуемая // Баланс и скорость)' },
    { id: 'gemini-2.5-pro', name: '✨ Google Gemini 2.5 Pro (Глубокий reasoning // Сложные задачи)' },
    { id: 'gemini-2.5-flash-lite', name: '✨ Google Gemini 2.5 Flash-Lite (Экономия квоты)' },
    { id: 'gemini-2.0-flash', name: '✨ Google Gemini 2.0 Flash (Стабильная версия)' },
    { id: 'openrouter/free', name: '⚡️ OpenRouter Free Router (Резерв // Авто-подбор свободной модели)' },
    { id: 'google/gemma-4-31b-it:free', name: '⚡️ Google Gemma 4 31B (OpenRouter Free // 262K контекст)' },
    { id: 'google/gemma-4-26b-a4b-it:free', name: '⚡️ Google Gemma 4 26B A4B (OpenRouter Free // Быстрый MoE)' },
    { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: '⚡️ NVIDIA Nemotron 3 Ultra (OpenRouter Free // 550B MoE, 1M контекст)' },
    { id: 'nvidia/nemotron-3.5-lightning:free', name: '⚡️ NVIDIA Nemotron 3.5 Lightning (OpenRouter Free // 1M контекст)' },
    { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: '⚡️ NVIDIA Nemotron 3 Super (OpenRouter Free // 120B MoE)' },
    { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', name: '⚡️ NVIDIA Nemotron 3 Nano Omni (OpenRouter Free // 30B reasoning)' },
    { id: 'nex-agi/nex-n2.5-pro:free', name: '⚡️ Nex-N2.5 Pro (OpenRouter Free // Agentic reasoning)' },
    { id: 'nex-agi/nex-n2.5-mini:free', name: '⚡️ Nex-N2.5 Mini (OpenRouter Free // Быстрый агент)' },
    { id: 'thinkingmachines/inkling:free', name: '⚡️ Thinking Machines Inkling (OpenRouter Free // 1M контекст)' },
    { id: 'inclusionai/ling-3.0-flash-vl:free', name: '⚡️ Ling 3.0 Flash VL (OpenRouter Free // 124B MoE)' },
    { id: 'dots-studio/dots-3-note-preview:free', name: '⚡️ Dots Studio Dots3-Note (OpenRouter Free // 512K контекст)' },
    { id: 'poolside/laguna-xs-2.1:free', name: '⚡️ Poolside Laguna XS 2.1 (OpenRouter Free // Код и текст)' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Премиум OpenRouter)' },
    { id: 'openai/gpt-4o', name: 'GPT-4o (Премиум OpenRouter)' }
  ],
  telegramBotToken: '',
  telegramChatId: '',
  blueskyIdentifier: '',
  blueskyAppPassword: '',
  xApiKey: '',
  xAccessToken: '',
  instagramAccessToken: '',
  instagramAccountId: '',
  tiktokAccessToken: '',
  pinterestAccessToken: '',
  linkedinAccessToken: '',
  threadsAccessToken: '',
  simulationMode: true
};

const STORAGE_KEY_POSTS = 'swiss_calendar_posts_v1';
const STORAGE_KEY_TRENDS = 'swiss_calendar_trends_v1';
const STORAGE_KEY_SETTINGS = 'swiss_calendar_settings_v1';

let cachedSupabaseClient: SupabaseClient | null = null;
let currentSupabaseUrl = '';
let currentSupabaseKey = '';

export function getSupabaseClient(url?: string, key?: string): SupabaseClient | null {
  const metaEnv = (import.meta as any).env || {};
  const targetUrl = url || (typeof window !== 'undefined' ? (window as any).__SUPABASE_URL || localStorage.getItem('swiss_supabase_url') : '') || metaEnv.VITE_SUPABASE_URL || '';
  const targetKey = key || (typeof window !== 'undefined' ? (window as any).__SUPABASE_KEY || localStorage.getItem('swiss_supabase_anon_key') : '') || metaEnv.VITE_SUPABASE_ANON_KEY || '';

  if (!targetUrl || !targetKey) {
    return null;
  }

  if (cachedSupabaseClient && currentSupabaseUrl === targetUrl && currentSupabaseKey === targetKey) {
    return cachedSupabaseClient;
  }

  try {
    cachedSupabaseClient = createClient(targetUrl, targetKey);
    currentSupabaseUrl = targetUrl;
    currentSupabaseKey = targetKey;
    return cachedSupabaseClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string; latencyMs: number }> {
  const start = Date.now();
  try {
    const client = createClient(url, key);
    const { error } = await client.from('posts').select('id').limit(1);
    const latencyMs = Date.now() - start;
    if (error) {
      // If table does not exist (42P01 in Postgres or PGRST205 in PostgREST schema cache)
      if (
        error.code === '42P01' || 
        error.code === 'PGRST205' || 
        error.message?.includes('schema cache') || 
        error.message?.includes('Could not find the table')
      ) {
        return {
          success: false,
          latencyMs,
          message: 'Подключение к проекту Supabase успешно, но таблицы еще не созданы. Выполните SQL-скрипт из файла supabase/schema.sql в SQL Editor Supabase.'
        };
      }
      return { success: false, latencyMs, message: `Ошибка Supabase: ${error.message} (Код ${error.code})` };
    }
    return { success: true, latencyMs, message: `Подключение к Supabase успешно! (Отклик: ${latencyMs}ms)` };
  } catch (err: any) {
    return { success: false, latencyMs: Date.now() - start, message: err.message || 'Ошибка сети при обращении к Supabase' };
  }
}

// Local Storage Helpers
function readLocalPosts(): Post[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POSTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(INITIAL_POSTS));
      return INITIAL_POSTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_POSTS;
  }
}

function writeLocalPosts(posts: Post[]) {
  try {
    localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
  } catch (e) {
    console.error('Failed to save posts to localStorage', e);
  }
}

function readLocalTrends(): Trend[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRENDS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_TRENDS, JSON.stringify(INITIAL_TRENDS));
      return INITIAL_TRENDS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TRENDS;
  }
}

function writeLocalTrends(trends: Trend[]) {
  try {
    localStorage.setItem(STORAGE_KEY_TRENDS, JSON.stringify(trends));
  } catch (e) {
    console.error('Failed to save trends to localStorage', e);
  }
}

export function readLocalSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) {
      return { ...INITIAL_SETTINGS };
    }
    const parsed = JSON.parse(raw);
    // Ensure all curated models (including new free OpenRouter models) are always present
    const customModels = (parsed.availableModels || []).filter(
      (m: any) => !INITIAL_SETTINGS.availableModels.some(im => im.id === m.id)
    );
    const availableModels = [
      ...INITIAL_SETTINGS.availableModels,
      ...customModels
    ];
    return { ...INITIAL_SETTINGS, ...parsed, availableModels };
  } catch {
    return { ...INITIAL_SETTINGS };
  }
}

export function writeLocalSettings(settings: Partial<AppSettings>): AppSettings {
  const current = readLocalSettings();
  const updated: AppSettings = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
    if (updated.supabaseUrl) localStorage.setItem('swiss_supabase_url', updated.supabaseUrl);
    if (updated.supabaseAnonKey) localStorage.setItem('swiss_supabase_anon_key', updated.supabaseAnonKey);
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
  return updated;
}

// Check if local Express API is alive
let isLocalServerAvailable: boolean | null = null;
let lastServerCheck = 0;

export async function checkLocalApiAvailability(): Promise<boolean> {
  const now = Date.now();
  if (isLocalServerAvailable !== null && now - lastServerCheck < 30000) {
    return isLocalServerAvailable;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch('/api/health', { signal: controller.signal });
    clearTimeout(timeout);
    isLocalServerAvailable = res.ok;
  } catch {
    isLocalServerAvailable = false;
  }
  lastServerCheck = now;
  return isLocalServerAvailable;
}

// UNIFIED STORAGE ADAPTER

export const storageAdapter = {
  // GET POSTS
  async getPosts(): Promise<Post[]> {
    const settings = readLocalSettings();
    const supabase = getSupabaseClient(settings.supabaseUrl, settings.supabaseAnonKey);

    if (supabase) {
      try {
        const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({ ...(r.data || r), id: r.id }));
        }
        // If empty in cloud, seed with initial posts
        if (!error && data && data.length === 0) {
          for (const post of INITIAL_POSTS) {
            await supabase.from('posts').upsert({ id: post.id, title: post.title, status: post.status, scheduled_date: post.scheduledDate, data: post });
          }
          return INITIAL_POSTS;
        }
      } catch (err) {
        console.warn('Supabase getPosts failed, falling back to local storage', err);
      }
    }

    const hasServer = await checkLocalApiAvailability();
    if (hasServer) {
      try {
        const res = await fetch('/api/posts');
        if (res.ok) return res.json();
      } catch (e) {
        console.warn('Server /api/posts failed, falling back to local storage', e);
      }
    }

    return readLocalPosts();
  },

  // GET SINGLE POST
  async getPost(id: string): Promise<Post> {
    const posts = await this.getPosts();
    const found = posts.find(p => p.id === id);
    if (!found) throw new Error(`Post ${id} not found`);
    return found;
  },

  // CREATE POST
  async createPost(post: Partial<Post>, forceDuplicate = false): Promise<Post & { duplicatePrevented?: boolean; alreadyExisted?: boolean; message?: string }> {
    const posts = await this.getPosts();
    const title = (post.title || 'Новый пост').trim();

    if (!forceDuplicate) {
      const existing = posts.find(p => p.title.trim().toLowerCase() === title.toLowerCase());
      if (existing) {
        return { ...existing, alreadyExisted: true, duplicatePrevented: true };
      }
    }

    const newPost: Post = {
      id: post.id || `post-${Date.now()}`,
      title,
      status: post.status || 'idea',
      channels: post.channels || ['instagram'],
      category: post.category || 'branding',
      scheduledDate: post.scheduledDate || new Date().toISOString(),
      format: post.format || 'carousel',
      hook: post.hook || '',
      caption: post.caption || '',
      slides: post.slides || [],
      videoScript: post.videoScript || [],
      threadPosts: post.threadPosts || [],
      telegramPost: post.telegramPost || '',
      storiesChain: post.storiesChain || [],
      pinterestBoard: post.pinterestBoard || '',
      destinationUrl: post.destinationUrl || '',
      mediaUrls: post.mediaUrls || [],
      publishedAt: post.publishedAt || null,
      publishResults: post.publishResults || null,
      timeSpentMinutes: post.timeSpentMinutes || 0
    };

    const settings = readLocalSettings();
    const supabase = getSupabaseClient(settings.supabaseUrl, settings.supabaseAnonKey);

    if (supabase) {
      try {
        await supabase.from('posts').upsert({
          id: newPost.id,
          title: newPost.title,
          status: newPost.status,
          scheduled_date: newPost.scheduledDate,
          data: newPost,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase createPost failed', err);
      }
    }

    // Always update local storage as reliable cache
    const current = readLocalPosts();
    writeLocalPosts([newPost, ...current.filter(p => p.id !== newPost.id)]);

    const hasServer = await checkLocalApiAvailability();
    if (hasServer) {
      fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPost, forceDuplicate: true })
      }).catch(() => {});
    }

    return newPost;
  },

  // UPDATE POST
  async updatePost(id: string, postUpdates: Partial<Post>): Promise<Post> {
    const posts = await this.getPosts();
    const existingIndex = posts.findIndex(p => p.id === id);
    const existing = existingIndex !== -1 ? posts[existingIndex] : ({} as Post);
    const updatedPost: Post = { ...existing, ...postUpdates, id };

    const settings = readLocalSettings();
    const supabase = getSupabaseClient(settings.supabaseUrl, settings.supabaseAnonKey);

    if (supabase) {
      try {
        await supabase.from('posts').upsert({
          id: updatedPost.id,
          title: updatedPost.title,
          status: updatedPost.status,
          scheduled_date: updatedPost.scheduledDate,
          data: updatedPost,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase updatePost failed', err);
      }
    }

    const localPosts = readLocalPosts();
    const idx = localPosts.findIndex(p => p.id === id);
    if (idx !== -1) {
      localPosts[idx] = updatedPost;
    } else {
      localPosts.unshift(updatedPost);
    }
    writeLocalPosts(localPosts);

    const hasServer = await checkLocalApiAvailability();
    if (hasServer) {
      fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postUpdates)
      }).catch(() => {});
    }

    return updatedPost;
  },

  // DELETE POST
  async deletePost(id: string): Promise<void> {
    const settings = readLocalSettings();
    const supabase = getSupabaseClient(settings.supabaseUrl, settings.supabaseAnonKey);

    if (supabase) {
      try {
        await supabase.from('posts').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deletePost failed', err);
      }
    }

    const localPosts = readLocalPosts();
    writeLocalPosts(localPosts.filter(p => p.id !== id));

    const hasServer = await checkLocalApiAvailability();
    if (hasServer) {
      fetch(`/api/posts/${id}`, { method: 'DELETE' }).catch(() => {});
    }
  },

  // GET TRENDS
  async getTrends(): Promise<Trend[]> {
    const settings = readLocalSettings();
    const supabase = getSupabaseClient(settings.supabaseUrl, settings.supabaseAnonKey);

    if (supabase) {
      try {
        const { data, error } = await supabase.from('trends').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({ ...(r.data || r), id: r.id }));
        }
        if (!error && data && data.length === 0) {
          for (const trend of INITIAL_TRENDS) {
            await supabase.from('trends').upsert({ id: trend.id, title: trend.title, category: trend.category, data: trend });
          }
          return INITIAL_TRENDS;
        }
      } catch (err) {
        console.warn('Supabase getTrends failed, using local storage', err);
      }
    }

    const hasServer = await checkLocalApiAvailability();
    if (hasServer) {
      try {
        const res = await fetch('/api/trends');
        if (res.ok) return res.json();
      } catch (e) {
        console.warn('Server /api/trends failed', e);
      }
    }

    return readLocalTrends();
  },

  // CREATE TREND
  async createTrend(trend: Partial<Trend>): Promise<Trend & { alreadyExisted?: boolean }> {
    const trends = await this.getTrends();
    const title = (trend.title || 'Новый тренд').trim();
    const existing = trends.find(t => t.title.trim().toLowerCase() === title.toLowerCase());
    if (existing) {
      return { ...existing, alreadyExisted: true };
    }

    const newTrend: Trend = {
      id: trend.id || `trend-${Date.now()}`,
      title,
      category: trend.category || 'branding',
      categoryLabel: trend.categoryLabel || 'Брендинг',
      source: trend.source || 'Вручную',
      description: trend.description || '',
      tags: trend.tags || [],
      relevanceScore: trend.relevanceScore || 90,
      keyTakeaway: trend.keyTakeaway || '',
      suggestedFormat: trend.suggestedFormat || 'carousel',
      dateAdded: trend.dateAdded || new Date().toISOString().split('T')[0]
    };

    const settings = readLocalSettings();
    const supabase = getSupabaseClient(settings.supabaseUrl, settings.supabaseAnonKey);

    if (supabase) {
      try {
        await supabase.from('trends').upsert({
          id: newTrend.id,
          title: newTrend.title,
          category: newTrend.category,
          data: newTrend
        });
      } catch (err) {
        console.warn('Supabase createTrend failed', err);
      }
    }

    const current = readLocalTrends();
    writeLocalTrends([newTrend, ...current.filter(t => t.id !== newTrend.id)]);

    const hasServer = await checkLocalApiAvailability();
    if (hasServer) {
      fetch('/api/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrend)
      }).catch(() => {});
    }

    return newTrend;
  },

  // GET SETTINGS
  async getSettings(): Promise<AppSettings> {
    const local = readLocalSettings();
    const supabase = getSupabaseClient(local.supabaseUrl, local.supabaseAnonKey);

    if (supabase) {
      try {
        const { data, error } = await supabase.from('settings').select('*').eq('id', 'app_settings').single();
        if (!error && data?.data) {
          // Merge with local keys to preserve client-side secrets safely
          const merged: AppSettings = {
            ...local,
            ...data.data,
            // Keep local API keys if cloud has empty strings
            geminiApiKey: local.geminiApiKey || data.data.geminiApiKey || '',
            openRouterApiKey: local.openRouterApiKey || data.data.openRouterApiKey || '',
            hasGeminiKey: !!(local.geminiApiKey || data.data.geminiApiKey),
            hasOpenRouterKey: !!(local.openRouterApiKey || data.data.openRouterApiKey),
            hasSupabaseKey: !!(local.supabaseAnonKey || data.data.supabaseAnonKey)
          };
          return merged;
        }
      } catch (err) {
        console.warn('Supabase getSettings failed', err);
      }
    }

    const hasServer = await checkLocalApiAvailability();
    if (hasServer) {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const serverSettings = await res.json();
          return {
            ...INITIAL_SETTINGS,
            ...serverSettings,
            ...local,
            hasGeminiKey: !!(local.geminiApiKey || serverSettings.hasGeminiKey),
            hasOpenRouterKey: !!(local.openRouterApiKey || serverSettings.hasOpenRouterKey),
            hasSupabaseKey: !!(local.supabaseAnonKey || serverSettings.hasSupabaseKey)
          };
        }
      } catch (e) {
        console.warn('Server /api/settings failed', e);
      }
    }

    return {
      ...local,
      hasGeminiKey: !!local.geminiApiKey,
      hasOpenRouterKey: !!local.openRouterApiKey,
      hasSupabaseKey: !!local.supabaseAnonKey
    };
  },

  // UPDATE SETTINGS
  async updateSettings(updates: Partial<AppSettings>): Promise<{ success: boolean }> {
    const updated = writeLocalSettings(updates);

    const supabase = getSupabaseClient(updated.supabaseUrl, updated.supabaseAnonKey);
    if (supabase) {
      try {
        // Save non-sensitive settings to cloud
        const { geminiApiKey, openRouterApiKey, ...safeSettings } = updated;
        await supabase.from('settings').upsert({
          id: 'app_settings',
          data: safeSettings,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase updateSettings failed', err);
      }
    }

    const hasServer = await checkLocalApiAvailability();
    if (hasServer) {
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch (e) {
        console.warn('Server /api/settings update failed', e);
      }
    }

    return { success: true };
  },

  // EXPORT / IMPORT DATABASE (JSON)
  async exportDatabase(): Promise<string> {
    const [posts, trends, settings] = await Promise.all([
      this.getPosts(),
      this.getTrends(),
      this.getSettings()
    ]);
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      posts,
      trends,
      // Exclude API keys for privacy in export
      settings: {
        ...settings,
        geminiApiKey: '',
        openRouterApiKey: '',
        geminiApiKeyMasked: '',
        openRouterApiKeyMasked: ''
      }
    };
    return JSON.stringify(exportData, null, 2);
  },

  async importDatabase(jsonString: string): Promise<{ success: boolean; postsCount: number; trendsCount: number }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.posts || !Array.isArray(parsed.posts)) {
        throw new Error('Некорректный формат файла: отсутствует массив posts');
      }
      writeLocalPosts(parsed.posts);
      if (Array.isArray(parsed.trends)) {
        writeLocalTrends(parsed.trends);
      }
      if (parsed.settings) {
        writeLocalSettings(parsed.settings);
      }

      // Sync to Supabase if configured
      const settings = readLocalSettings();
      const supabase = getSupabaseClient(settings.supabaseUrl, settings.supabaseAnonKey);
      if (supabase) {
        for (const p of parsed.posts) {
          await supabase.from('posts').upsert({ id: p.id, title: p.title, status: p.status, scheduled_date: p.scheduledDate, data: p });
        }
        if (Array.isArray(parsed.trends)) {
          for (const t of parsed.trends) {
            await supabase.from('trends').upsert({ id: t.id, title: t.title, category: t.category, data: t });
          }
        }
      }

      return {
        success: true,
        postsCount: parsed.posts.length,
        trendsCount: Array.isArray(parsed.trends) ? parsed.trends.length : 0
      };
    } catch (err: any) {
      throw new Error(`Ошибка импорта: ${err.message}`);
    }
  }
};
