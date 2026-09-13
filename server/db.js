import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const INITIAL_TRENDS = [
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

const INITIAL_POSTS = [
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
    mediaUrls: ['/demo-assets/swiss-grid-preview.svg'],
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

const INITIAL_SETTINGS = {
  geminiApiKey: '',
  openRouterApiKey: '',
  aiProviderMode: 'cascade', // 'cascade' (Gemini -> OpenRouter fallback), 'gemini_only', 'openrouter_only'
  defaultModel: 'gemini-3.8-flash',
  availableModels: [
    { id: 'gemini-3.8-flash', name: '✨ Google Gemini 3.8 Flash (Новейшая флагманская // Документация AI Studio)' },
    { id: 'gemini-3.5-flash', name: '✨ Google Gemini 3.5 Flash (Скорость и рассуждения)' },
    { id: 'gemini-2.5-flash', name: '✨ Google Gemini 2.5 Flash (Рекомендуемая 2.5 // Баланс скорости и логики)' },
    { id: 'gemini-2.5-flash-lite', name: '✨ Google Gemini 2.5 Flash-Lite (Экономия квоты // Ультра-быстрый)' },
    { id: 'gemini-2.5-pro', name: '✨ Google Gemini 2.5 Pro (Глубокий reasoning // Сложные задачи)' },
    { id: 'gemini-2.0-flash', name: '✨ Google Gemini 2.0 Flash (Стабильная версия)' },
    { id: 'openrouter/free', name: '⚡️ OpenRouter Free Router (Резерв // Авто-подбор активной модели)' },
    { id: 'nvidia/nemotron-3.5-lightning:free', name: '⚡️ NVIDIA Nemotron 3.5 Lightning (Резерв OpenRouter // 1M контекст)' },
    { id: 'nex-agi/nex-n2.5-mini:free', name: '⚡️ Nex-N2.5 Mini (Резерв OpenRouter // Быстрый отклик)' },
    { id: 'poolside/laguna-xs-2.1:free', name: '⚡️ Poolside Laguna XS 2.1 (Резерв OpenRouter // Бесплатно)' },
    { id: 'dots-studio/dots-3-note-preview:free', name: '⚡️ Dots Studio Dots3-Note (Резерв OpenRouter // 512K контекст)' },
    { id: 'inclusionai/ling-3.0-flash-vl:free', name: '⚡️ Ling 3.0 Flash VL (Резерв OpenRouter // Скорость)' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Премиум OpenRouter)' },
    { id: 'openai/gpt-4o', name: 'GPT-4o (Премиум OpenRouter)' }
  ],
  creatorProfile: 'junior_job_seeker', // junior seeking employment
  webSearchEnabled: true,
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

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const data = {
      posts: INITIAL_POSTS,
      trends: INITIAL_TRENDS,
      settings: INITIAL_SETTINGS
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return data;
  }

  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    // Ensure free models are always in availableModels
    if (!parsed.settings?.availableModels || parsed.settings.availableModels.length < 4) {
      parsed.settings = { ...INITIAL_SETTINGS, ...(parsed.settings || {}) };
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch (err) {
    console.error('Error reading db.json, restoring defaults', err);
    const data = {
      posts: INITIAL_POSTS,
      trends: INITIAL_TRENDS,
      settings: INITIAL_SETTINGS
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return data;
  }
}

export function getDb() {
  return ensureDb();
}

export function saveDb(data) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  return data;
}
