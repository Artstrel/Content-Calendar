# SWISS // Content Calendar 🗓️🇨🇭

> Интеллектуальная система планирования, генерации и кросс-постинга контента для графических дизайнеров и креаторов с эстетикой **Swiss Style / International Typographic Style**.

---

## ✨ Возможности

- **Swiss Grid & Minimal Design**: Строгая сетка, типографика на базе гротеска и акциденции, темная тема с акцентами.
- **Интерактивный календарь и канбан-доска**: Удобное переключение между представлениями (Сетка месяца / Канбан-доска / Список публикаций).
- **Радар виральных трендов (AI Trend Radar)**: Поиск виральных инфоповодов и форматов для начинающих дизайнеров (разборы кейсов, редизайны до/после, сторис-квизы, таймлапсы плакатов).
- **Мультимодальный AI-генератор**:
  - Каскад провайдеров: **Google Gemini API** (Gemini 3.8 Flash, 3.5, 2.5) + **OpenRouter API** (резервный fallback с бесплатными и премиум моделями).
  - Генерация хуков, заголовков, текстов публикаций, слайдов для каруселей, сценариев для Reels/TikTok и цепочек Stories.
- **Поддержка каналов**: Instagram, TikTok, Telegram, Threads, LinkedIn, Bluesky, Pinterest, X (Twitter).
- **Симуляция и прямой постинг**: Тестовый режим с мгновенным логом публикации и поддержка интеграции с API соцсетей.

---

## 🚀 Быстрый старт

### 1. Клонирование и установка зависимостей

```bash
git clone https://github.com/Artstrel/Content-Calendar.git
cd Content-Calendar
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта (на основе `.env.example`):

```bash
cp .env.example .env
```

Заполните ваши API-ключи:

```env
PORT=5001
OPENROUTER_API_KEY=ваш_ключ_openrouter (опционально)
GEMINI_API_KEY=ваш_ключ_gemini (опционально)
```

> Ключи также можно безопасно указать и сохранить прямо в интерфейсе приложения в разделе **«Настройки»**.

### 3. Запуск приложения в режиме разработки

```bash
npm run dev
```

Команда запустит одновременно:
- **Backend API-сервер**: `http://localhost:5001`
- **Frontend клиент (Vite + React)**: `http://localhost:3000`

---

## 🛠️ Стек технологий

- **Frontend**: React 19, TypeScript, Vite, Lucide Icons, Vanilla CSS (Swiss Design System).
- **Backend**: Node.js, Express, Multer, dotenv, cors.
- **AI-интеграции**: Google Gemini API, OpenRouter API (Cascade Router).

---

## 📄 Лицензия

MIT License
