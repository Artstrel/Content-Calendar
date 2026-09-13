-- ==============================================================================
-- SWISS CONTENT CALENDAR // SUPABASE CLOUD DATABASE SCHEMA
-- ==============================================================================
-- Инструкция по установке:
-- 1. Создайте бесплатный проект на https://supabase.com
-- 2. Перейдите в раздел "SQL Editor" в боковом меню
-- 3. Вставьте содержимое этого файла и нажмите "Run"
-- 4. Перейдите в "Project Settings" -> "API" и скопируйте:
--    - Project URL (SUPABASE_URL)
--    - anon / public key (SUPABASE_ANON_KEY)
-- 5. Вставьте их в Swiss Content Calendar в разделе «Настройки» -> «Облачная база данных»
-- ==============================================================================

-- 1. ТАБЛИЦА ПУБЛИКАЦИЙ (POSTS)
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idea',
  scheduled_date TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Индексы для быстрого поиска и сортировки
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_date ON public.posts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON public.posts(updated_at DESC);

-- 2. ТАБЛИЦА ВИРАЛЬНЫХ ТРЕНДОВ (TRENDS)
CREATE TABLE IF NOT EXISTS public.trends (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'branding',
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_trends_category ON public.trends(category);

-- 3. ТАБЛИЦА НАСТРОЕК (SETTINGS)
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'app_settings',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ПОЛИТИКИ БЕЗОПАСНОСТИ ROW LEVEL SECURITY (RLS) ДЛЯ ANON КЛЮЧА
-- ==============================================================================
-- Позволяет клиенту с публичным anon-ключом безопасно работать со статического сайта

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Posts: полный доступ для публичного анонимного пользователя
DROP POLICY IF EXISTS "Public access for posts" ON public.posts;
CREATE POLICY "Public access for posts" ON public.posts
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Trends: полный доступ для публичного анонимного пользователя
DROP POLICY IF EXISTS "Public access for trends" ON public.trends;
CREATE POLICY "Public access for trends" ON public.trends
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Settings: полный доступ для публичного анонимного пользователя
DROP POLICY IF EXISTS "Public access for settings" ON public.settings;
CREATE POLICY "Public access for settings" ON public.settings
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- НАЧАЛЬНЫЕ ДАННЫЕ (SEED DATA)
-- ==============================================================================

INSERT INTO public.posts (id, title, status, scheduled_date, data)
VALUES 
  (
    'post-1',
    'Редизайн вывески кофейни у дома: как сетка спасает дизайн',
    'published',
    '2026-03-10T14:00:00.000Z',
    '{
      "id": "post-1",
      "title": "Редизайн вывески кофейни у дома: как сетка спасает дизайн",
      "status": "published",
      "channels": ["instagram", "tiktok", "telegram", "threads"],
      "category": "branding",
      "scheduledDate": "2026-03-10T14:00:00.000Z",
      "format": "carousel",
      "hook": "Увидел эту вывеску по дороге за кофе — и не смог пройти мимо. Исправляем ошибки за 15 минут.",
      "caption": "Я начинающий графический дизайнер, и моя главная привычка — анализировать всё, что вижу на улице.\n\nВ этой вывеске было нарушено главное швейцарское правило: текст центрирован, но из-за разной длины строк визуальный вес заваливался вправо.\n\nПереверстал макет по модульной сетке 8px.",
      "slides": [
        { "slideNumber": 1, "title": "COVER // BEFORE/AFTER", "text": "РЕДИЗАЙН ВЫВЕСКИ: ДО И ПОСЛЕ", "visualPrompt": "Разделенный пополам постер: слева старая вывеска, справа швейцарский вариант." },
        { "slideNumber": 2, "title": "АНАЛИЗ ОШИБКИ", "text": "Проблема: оптический дисбаланс и хаотичный интерлиньяж.", "visualPrompt": "Красные маркеры на старом дизайне." }
      ],
      "mediaUrls": ["./demo-assets/swiss-grid-preview.svg"],
      "publishedAt": "2026-03-10T14:02:11.000Z",
      "timeSpentMinutes": 75
    }'::jsonb
  ),
  (
    'post-2',
    'Тестовое задание в дизайн-студию: за что меня похвалил арт-директор',
    'scheduled',
    '2026-03-14T16:30:00.000Z',
    '{
      "id": "post-2",
      "title": "Тестовое задание в дизайн-студию: за что меня похвалил арт-директор",
      "status": "scheduled",
      "channels": ["instagram", "linkedin", "threads", "telegram"],
      "category": "editorial",
      "scheduledDate": "2026-03-14T16:30:00.000Z",
      "format": "stories",
      "hook": "Я отправил 20 откликов на вакансии джуниора. Вот главное замечание от арт-директора.",
      "caption": "Когда ты начинающий специалист, твой главный страх — что тестовое задание даже не откроют.",
      "storiesChain": [
        { "screenNumber": 1, "title": "STORY 1 // РЕАЛИТИ", "textOverlay": "Мне пришел разбор тестового от арт-директора студии моей мечты.", "stickerType": "poll", "stickerContent": "Интересно? (Да / Очень)" }
      ],
      "mediaUrls": [],
      "timeSpentMinutes": 45
    }'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.trends (id, title, category, data)
VALUES
  (
    'trend-1',
    'Редизайн логотипов и упаковки новичком: разбор в Figma',
    'branding',
    '{
      "id": "trend-1",
      "title": "Редизайн логотипов и упаковки новичком: разбор в Figma",
      "category": "branding",
      "categoryLabel": "Брендинг",
      "source": "TikTok #DesignTok & Behance 2026",
      "description": "Виральный формат для джуниоров: взять логотип известного бренда с нарушенной оптикой, исправить по швейцарской сетке и показать процесс До/После.",
      "tags": ["Brand Redesign", "Junior Portfolio", "Before After"],
      "relevanceScore": 99,
      "keyTakeaway": "Покажите ход мыслей: почему старый вариант разваливался и как сетка решила проблему.",
      "suggestedFormat": "carousel",
      "dateAdded": "2026-03-10"
    }'::jsonb
  ),
  (
    'trend-2',
    'Интерактивные Stories-тесты: «Угадай, где факап в кернинге»',
    'typography',
    '{
      "id": "trend-2",
      "title": "Интерактивные Stories-тесты: «Угадай, где факап в кернинге»",
      "category": "typography",
      "categoryLabel": "Типографика",
      "source": "Instagram Stories Creator Strategy",
      "description": "Серия из 4 сторис со стикерами-опросами. Подписчики голосуют за правильный вариант интервалов.",
      "tags": ["Stories Quiz", "Poll Sticker", "Kerning Game"],
      "relevanceScore": 98,
      "keyTakeaway": "Интерактив со стикером-опросом на первой сторис поднимает досмотр всей цепочки.",
      "suggestedFormat": "stories",
      "dateAdded": "2026-03-11"
    }'::jsonb
  )
ON CONFLICT (id) DO NOTHING;
