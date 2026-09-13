# SWISS // Content Calendar 🗓️🇨🇭

> Интеллектуальная система планирования, генерации и кросс-постинга контента для графических дизайнеров и креаторов с эстетикой **Swiss Style / International Typographic Style**.
> Готова к запуску на **GitHub Pages** с поддержкой облачной базы данных **Supabase** и клиентской защитой API-ключей.

---

## 🌐 Запуск на GitHub Pages

Приложение адаптировано для статического хостинга на **GitHub Pages**:
- **URL**: `https://artstrel.github.io/Content-Calendar/` *(активируется в Settings -> Pages -> Source: GitHub Actions)*.
- **Автоматический деплой**: Каждый коммит в ветку `main` автоматически собирается и развертывается через workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

---

## 🔐 Безопасность API-ключей (Zero-Leak / BYOK)

Так как репозиторий открытый:
1. **Никаких секретов в коде и репозитории**: В коммитах и скомпилированных файлах GitHub Pages отсутствуют какие-либо приватные ключи.
2. **Client-Side Direct AI Execution**:
   - Google Gemini API и OpenRouter API вызываются **напрямую из браузера** через CORS.
   - Пользователь вводит свои ключи в интерфейсе (**Настройки** ➔ **AI Провайдеры**).
   - Ключи сохраняются исключительно в локальном хранилище вашего браузера (`localStorage`) и **никогда** не отправляются на сторонние серверы.
3. **Локальная разработка**:
   - При локальном запуске сервер Node.js считывает ключи из `.env`, который находится в [`.gitignore`](.gitignore).

---

## ☁️ Облачная база данных (Supabase PostgreSQL)

Для надежного хранения данных на GitHub Pages без локального сервера предусмотрена интеграция с **Supabase**:

### Шаги настройки Supabase:
1. Создайте бесплатный проект на [supabase.com](https://supabase.com).
2. Откройте **SQL Editor** в панели управления Supabase.
3. Вставьте и выполните скрипт [`supabase/schema.sql`](supabase/schema.sql) — он создаст таблицы `posts`, `trends`, `settings`, настроит политики Row Level Security (RLS) и добавит стартовые швейцарские шаблоны.
4. В **Project Settings -> API** скопируйте:
   - `Project URL`
   - `anon / public key`
5. В приложении перейдите в **«Настройки» ➔ «00 // ОБЛАЧНАЯ БАЗА ДАННЫХ»**, вставьте данные и нажмите **«ПРОВЕРИТЬ SUPABASE»**.

### Автономный режим (LocalStorage + Резервное копирование):
- Если Supabase не подключен, приложение работает **полностью автономно**, сохраняя публикации и тренды в памяти браузера.
- В любой момент можно выполнить **«ЭКСПОРТ ВСЕЙ БАЗЫ (JSON)»** или загрузить резервную копию кнопкой **«ИМПОРТ ИЗ JSON»**.
- Автоматический workflow [`.github/workflows/db-backup.yml`](.github/workflows/db-backup.yml) еженедельно валидирует схемы и создает снимки базы в виде артефактов GitHub Actions.

---

## 🚀 Быстрый старт (Локальная разработка)

```bash
# 1. Клонирование
git clone https://github.com/Artstrel/Content-Calendar.git
cd Content-Calendar

# 2. Установка зависимостей
npm install

# 3. Настройка окружения (опционально для локального сервера)
cp .env.example .env

# 4. Запуск (Frontend + Local Express Server)
npm run dev
```

- **Frontend (Vite)**: `http://localhost:3000`
- **Backend API**: `http://localhost:5001`

---

## 🛠️ Стек технологий

- **Frontend**: React 19, TypeScript, Vite, Lucide Icons, Vanilla CSS (Swiss Design System).
- **Хранение данных**: Supabase (PostgreSQL Cloud), LocalStorage Cache, Express JSON DB.
- **AI-интеграции**: Google Gemini API (3.8 Flash, 3.5, 2.5), OpenRouter API (Cascade Router), Direct Client CORS.
- **CI/CD**: GitHub Actions (Pages Deployment & Database Backup).

---

## 📄 Лицензия

MIT License
