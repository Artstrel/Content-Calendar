export interface LegalSection {
  id: string;
  number: string;
  title: string;
  summary: string;
  content: string[];
  subsections?: {
    subtitle: string;
    points: string[];
  }[];
}

export interface LegalDocument {
  title: string;
  subtitle: string;
  effectiveDate: string;
  lastUpdated: string;
  version: string;
  sections: LegalSection[];
}

export type Language = 'ru' | 'en';
export type LegalTab = 'tos' | 'privacy' | 'deletion' | 'compliance';

export const LEGAL_DATA: Record<Language, {
  tos: LegalDocument;
  privacy: LegalDocument;
  deletion: LegalDocument;
  compliance: {
    title: string;
    subtitle: string;
    lastVerified: string;
    badges: { label: string; status: string; description: string }[];
    platforms: {
      name: string;
      scopes: string[];
      purpose: string;
      dataRetention: string;
      deletionMethod: string;
    }[];
    faq: { q: string; a: string }[];
  };
}> = {
  en: {
    tos: {
      title: 'TERMS OF SERVICE',
      subtitle: 'KRAFTWERK // SWISS CONTENT ENGINE PLATFORM USAGE AGREEMENT',
      effectiveDate: 'March 1, 2026',
      lastUpdated: 'September 15, 2026',
      version: '1.4.0-CH',
      sections: [
        {
          id: 'acceptance',
          number: '01',
          title: 'Acceptance of Terms',
          summary: 'By using Swiss Content Engine, you agree to these Terms and related policies.',
          content: [
            'These Terms of Service ("Terms", "Agreement") govern your access to and use of Kraftwerk // Swiss Content Engine ("the Service", "Application", "We", "Us"), a software application designed for editorial planning, design workflow automation, AI-assisted content drafting, and multi-channel social media publishing.',
            'By initializing, connecting API credentials to, or utilizing any functionality of the Service, you acknowledge that you have read, understood, and agreed to be legally bound by these Terms.',
            'If you do not agree with any part of these Terms, you must immediately discontinue using the Application and clear all associated access credentials.'
          ]
        },
        {
          id: 'service-scope',
          number: '02',
          title: 'Description of the Service & Architecture',
          summary: 'A privacy-first, local-first editorial studio for creators and design teams.',
          content: [
            'Swiss Content Engine provides an integrated editorial environment including a Swiss Typographic Calendar, Trend Radar monitoring, Kanban publication pipeline, automated multi-format scripting (Carousels, Reels, Threads, Telegram broadcasts), and direct publishing integrations.',
            'Privacy-First / Local-First Principle: The Application is engineered so that your content drafts, visual assets, and secret API tokens are stored in your own local environment (browser localStorage/IndexedDB or self-hosted server) or your private user-provisioned database instance (Supabase PostgreSQL with Row-Level Security).',
            'We operate no central server that intercepts, pools, or monetizes your private creative output.'
          ]
        },
        {
          id: 'credentials',
          number: '03',
          title: 'User Credentials and API Token Security',
          summary: 'You control and bear responsibility for the API keys you provide.',
          content: [
            'To enable automated publishing or AI features, you may optionally provide your personal or organizational API credentials, including but not limited to: Meta (Instagram Graph API, Threads API), X (Twitter Developer API), TikTok for Developers, Telegram Bot API, Bluesky AT Protocol, Google Gemini API, and OpenRouter API keys.',
            'Responsibility: You remain solely responsible for the confidentiality, safekeeping, and usage permissions of all credentials entered into the Application.',
            'No Key Resale or Sharing: We will never transmit your API keys to unauthorized third parties, sell them to data brokers, or use them for any purpose other than executing your direct commands.',
            'Revocation: You may revoke, replace, or wipe any API key directly within the Settings menu at any moment with instantaneous effect.'
          ]
        },
        {
          id: 'acceptable-use',
          number: '04',
          title: 'Acceptable Use Policy & Platform Compliance',
          summary: 'Strict adherence to third-party social network developer terms is mandatory.',
          content: [
            'You agree to use the Application in full compliance with all applicable laws and regulations, as well as the terms and policies of each connected third-party service, including:',
            '• Meta Platform Terms and Instagram Graph API Developer Policies;',
            '• X (formerly Twitter) Developer Agreement & Policy;',
            '• TikTok Developer Terms of Service and Community Guidelines;',
            '• Google API Services User Data Policy and Gemini API Terms;',
            '• Pinterest Developer Terms and LinkedIn API Terms of Use;',
            '• Telegram Bot API Terms and Bluesky / AT Protocol Guidelines.',
            'Prohibited Conduct: You agree not to use the Application to distribute spam, malware, phishing links, hateful or unlawful materials, impersonate individuals without authorization, or violate rate limits and anti-abuse safeguards enforced by third-party networks.'
          ]
        },
        {
          id: 'intellectual-property',
          number: '05',
          title: 'Intellectual Property & Ownership of Content',
          summary: 'You retain 100% ownership over your content, drafts, and designs.',
          content: [
            'User Ownership: You retain full, unencumbered ownership of all intellectual property rights in and to the content, text, slide layouts, video scripts, graphics, prompts, and schedules you create using the Service.',
            'No License Claim: Swiss Content Engine claims zero ownership, royalties, or licensing rights over your creative materials.',
            'Application IP: The Kraftwerk // Swiss Content Engine software, source code, UI designs, Swiss grid stylesheets, and documentation are protected by copyright and intellectual property laws.'
          ]
        },
        {
          id: 'third-party-apis',
          number: '06',
          title: 'Third-Party Services, Social Networks & AI Models',
          summary: 'Third-party APIs operate independently under their respective terms.',
          content: [
            'The Application acts as a client interface communicating directly or via user-specified endpoints with external providers (such as Meta Graph API, X API, Google AI, OpenRouter, Supabase).',
            'We do not control the uptime, latency, changes in API schemas, sudden fee structures, or rate limits of these external providers.',
            'We are not liable for publication failures, account suspensions, or token expirations caused by changes in third-party platform rules or outages.'
          ]
        },
        {
          id: 'warranties',
          number: '07',
          title: 'Disclaimer of Warranties',
          summary: 'The application is provided "AS IS" without warranties.',
          content: [
            'THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR UNINTERRUPTED AVAILABILITY.',
            'WE DO NOT WARRANT THAT THE RESULTS OBTAINED FROM THE USE OF AI GENERATION MODELS WILL BE ACCURATE, COMPLETE, OR FREE FROM UNINTENDED ERRORS.'
          ]
        },
        {
          id: 'liability',
          number: '08',
          title: 'Limitation of Liability',
          summary: 'Liability is strictly limited to the maximum extent permitted by law.',
          content: [
            'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE DEVELOPERS, MAINTAINERS, OR AFFILIATES OF SWISS CONTENT ENGINE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF OR INABILITY TO USE THE APPLICATION.'
          ]
        },
        {
          id: 'termination',
          number: '09',
          title: 'Termination & Data Purge',
          summary: 'You may terminate your usage at any time with immediate effect.',
          content: [
            'You may terminate your agreement with these Terms at any time by simply ceasing use of the Application and deleting your stored configuration and database data.',
            'In accordance with our Data Deletion Instructions, executing "Clear Local Storage" or deleting your database tables immediately eradicates all stored records.'
          ]
        },
        {
          id: 'governing-law',
          number: '10',
          title: 'Governing Law & Amendments',
          summary: 'Terms may be updated periodically with notice on this page.',
          content: [
            'We reserve the right to revise these Terms at any time. Material modifications will be reflected with an updated "Last Updated" timestamp at the top of this document.',
            'Continued use of the Application after revisions constitutes acceptance of the modified Terms.'
          ]
        }
      ]
    },
    privacy: {
      title: 'PRIVACY POLICY',
      subtitle: 'KRAFTWERK // SWISS CONTENT ENGINE DATA PROTECTION AND PRIVACY STANDARD',
      effectiveDate: 'March 1, 2026',
      lastUpdated: 'September 15, 2026',
      version: '1.4.0-CH',
      sections: [
        {
          id: 'privacy-commitment',
          number: '01',
          title: 'Our Privacy-First Commitment',
          summary: 'We believe your creative strategies and API tokens belong solely to you.',
          content: [
            'Kraftwerk // Swiss Content Engine is constructed under strict data minimization and privacy-by-design standards.',
            'We do NOT sell, rent, monetize, or harvest your personal data, editorial calendars, creative drafts, or secret tokens.',
            'We do NOT deploy advertising trackers, third-party behavioral cookies, or invasive user telemetry.'
          ]
        },
        {
          id: 'data-collected',
          number: '02',
          title: 'Categories of Data Processed',
          summary: 'We only process data necessary for calendar functionality and publishing.',
          content: [
            '1. User-Provided API Keys and Credentials: Secret tokens for Meta (Instagram/Threads), X, TikTok, Telegram, Bluesky, Google Gemini, and OpenRouter. These are stored strictly within client-side encrypted local storage or your private Supabase instance.',
            '2. Editorial Content and Media: Post titles, hooks, scripts, slide content, tags, scheduled publication timestamps, and uploaded visual assets.',
            '3. Channel Analytics and Telemetry: Aggregated post reach, likes, impressions, and engagement metrics fetched strictly via read-only official API calls on your active accounts to display in your analytics view.',
            '4. Network Diagnostic Data: Transient HTTP response statuses and latency measurements for health checks displayed within the Settings modal.'
          ]
        },
        {
          id: 'ai-processing',
          number: '03',
          title: 'AI Processing & External Language Model Disclosures',
          summary: 'Prompts are sent only on explicit command and never used for public model training.',
          content: [
            'When you trigger an AI assistance action (such as generating post hooks, writing Instagram carousels, formulating Figma design breakdowns, or building video scripts), prompt text is transmitted directly via secure TLS 1.3 HTTPS to the provider configured in your Settings (Google Gemini API or OpenRouter).',
            'Zero Training Policy: Pursuant to the commercial terms of Google Gemini API and OpenRouter enterprise endpoints, prompts submitted through API keys are isolated and are NOT utilized to train foundation models.',
            'Local Sandbox Alternative: You may toggle "Sandbox Simulation Mode" at any time, allowing you to test all calendar features offline without transmitting any data to external AI servers.'
          ]
        },
        {
          id: 'social-permissions',
          number: '04',
          title: 'Social Network Permissions & OAuth Scopes',
          summary: 'Permissions requested are strictly limited to content scheduling and publishing.',
          content: [
            'The Application requests and utilizes only the minimum scopes necessary to execute your publishing directives:',
            '• Meta / Instagram Graph API: "instagram_basic", "instagram_content_publish", "instagram_manage_insights", "pages_show_list", "pages_read_engagement". These are used strictly to publish approved posts and display analytics.',
            '• X / Twitter Developer API: "tweet.read", "tweet.write", "users.read". Used strictly to publish threads and calculate engagement.',
            '• TikTok for Developers: "video.upload", "video.publish". Used strictly to push prepared short-form video content.',
            '• Pinterest API: "pins:read", "pins:write", "boards:read". Used to pin graphics and carousel frames to your design boards.',
            '• LinkedIn API: "w_member_social", "r_liteprofile". Used for professional editorial post dispatch.',
            '• Telegram Bot API: Used strictly through your private bot token to dispatch channel broadcasts.',
            '• Bluesky AT Protocol: Used through App Passwords strictly to post records to your personal repository.'
          ]
        },
        {
          id: 'data-storage',
          number: '05',
          title: 'Data Storage, Retention & Security Safeguards',
          summary: 'Multi-layer security with client-side masking and zero remote retention.',
          content: [
            'Local-First Storage: By default, your data resides directly on your machine within browser storage or your dedicated local backend.',
            'Cloud Synchronization (Optional): If you connect Supabase, data is stored in your private PostgreSQL instance secured by Supabase Row-Level Security (RLS) policies and HTTPS encryption in transit.',
            'UI Masking: All sensitive tokens are masked in the user interface (e.g. "sk-or-...****") to prevent accidental shoulder surfing or screen capture exposure.',
            'Export Sanitization: The built-in database export utility automatically offers the option to strip private keys before downloading JSON archives.'
          ]
        },
        {
          id: 'user-rights',
          number: '06',
          title: 'User Rights (GDPR, UK GDPR, CCPA / CPRA Compliance)',
          summary: 'Full control over your data: access, export, rectification, and erasure.',
          content: [
            'Under GDPR (Articles 15-22) and the California Consumer Privacy Act (CCPA), you enjoy comprehensive rights:',
            '• Right of Access: You can inspect all stored posts, trends, and tokens at any time directly in the UI.',
            '• Right to Rectification: You can modify or update any editorial item or credential instantly.',
            '• Right to Data Portability: You can export your complete calendar database in structured JSON format via Settings -> Export Database.',
            '• Right to Erasure ("Right to be Forgotten"): You can permanently delete individual posts or wipe the entire application state in one click.',
            '• Right to Non-Discrimination: We provide equal service regardless of privacy exercise.'
          ]
        },
        {
          id: 'children',
          number: '07',
          title: 'Children’s Privacy Protection',
          summary: 'The service is designed for design professionals and individuals aged 16+.',
          content: [
            'The Application is intended for adult design professionals, digital creators, and content teams. We do not knowingly collect, process, or solicit personal data from children under the age of 16. If we become aware that data has been collected without parental consent, we will take immediate measures to delete it.'
          ]
        },
        {
          id: 'contact',
          number: '08',
          title: 'Privacy Inquiries & Data Protection Officer Contact',
          summary: 'How to contact our team regarding privacy and compliance inquiries.',
          content: [
            'If you have questions, feedback, or requests regarding this Privacy Policy or our compliance with Meta, X, or EU/US privacy standards, please reach out via our GitHub repository or contact our compliance channel directly at privacy@swisscontentengine.local (or submit an issue via repository support).'
          ]
        }
      ]
    },
    deletion: {
      title: 'USER DATA DELETION INSTRUCTIONS',
      subtitle: 'COMPLIANCE WITH META (INSTAGRAM/THREADS), TIKTOK & GOOGLE DATA DELETION REQUIREMENTS',
      effectiveDate: 'March 1, 2026',
      lastUpdated: 'September 15, 2026',
      version: '1.4.0-CH',
      sections: [
        {
          id: 'deletion-overview',
          number: '01',
          title: 'Data Deletion Policy Overview',
          summary: 'In compliance with Meta Platform Policy and international regulations.',
          content: [
            'Swiss Content Engine respects your absolute right to delete all your personal data, media, credentials, and associated records.',
            'In accordance with Meta Platform Policy (Instagram Graph API, Facebook Login, Threads API) and developer data deletion mandates, this section outlines the precise, verifiable steps to delete your data from the Application and sever connected platform permissions.'
          ]
        },
        {
          id: 'deletion-step1',
          number: '02',
          title: 'Method 1: Instant In-App Data Purge (Recommended)',
          summary: 'Purge all data from your browser or self-hosted backend in 10 seconds.',
          content: [
            'Because Swiss Content Engine utilizes a local-first / self-hosted architecture, you can execute a total and irrevocable data deletion directly on your device:',
            '1. Open the Application and click on the "SETTINGS" button in the top navigation bar.',
            '2. Scroll down to the "Управление базой данных (Database & Storage)" section.',
            '3. Remove your API tokens or click "Сбросить подключение" (Reset Connection).',
            '4. To wipe all local posts, drafts, and cached analytics, open your browser Developer Tools -> Application -> Storage -> Clear Site Data.',
            '5. If using a Supabase database instance, run the following SQL command or delete the project in your Supabase dashboard: "DROP TABLE IF EXISTS posts, trends, settings CASCADE;".',
            'Result: All records, tokens, and media references are immediately and permanently erased.'
          ]
        },
        {
          id: 'deletion-step2',
          number: '03',
          title: 'Method 2: Revoking Permissions via Connected Social Platforms',
          summary: 'Sever API authorization directly within your social network settings.',
          content: [
            'You can instantly revoke Swiss Content Engine’s access to your social media accounts via the native security controls of each respective platform:',
            '• Meta / Instagram / Facebook: Navigate to Settings & Privacy -> Settings -> Apps and Websites -> Locate the App -> Click "Remove" -> Check "Delete posts, videos or events posted on your behalf" if desired.',
            '• X (Twitter): Go to Settings and Support -> Settings and privacy -> Security and account access -> Apps and sessions -> Connected apps -> Select App -> Click "Revoke app permissions".',
            '• TikTok: Open Profile -> Settings and Privacy -> Security & Permissions -> Manage App Permissions -> Select App -> Click "Remove Access".',
            '• Google / Gemini: Navigate to myaccount.google.com -> Security -> Third-party apps with account access -> Select App -> Click "Remove Access".',
            '• Telegram: Message @BotFather -> send /revoke or /deletebot -> select your bot to revoke tokens instantly.'
          ]
        },
        {
          id: 'deletion-step3',
          number: '04',
          title: 'Method 3: Formal Data Deletion Request (Meta Callback Protocol)',
          summary: 'Submit a formal request or utilize our automated callback endpoint.',
          content: [
            'For enterprise deployments or instances where you wish to request a confirmed erasure receipt for Meta App Review compliance:',
            '1. Send an email with subject line "DATA DELETION REQUEST" to privacy@swisscontentengine.local (or submit an issue on our GitHub repository) including your installation identifier or account reference.',
            '2. Automated Callback Endpoint: If your deployment operates behind an authentication proxy, our server processes Meta Deletion Callbacks at the endpoint: /api/meta/data-deletion-callback.',
            '3. Processing Window: Formal deletion requests are acknowledged within 24 hours and completed within 3 business days, accompanied by a cryptographically signed Deletion Confirmation Code.'
          ]
        }
      ]
    },
    compliance: {
      title: 'DEVELOPER & API COMPLIANCE OVERVIEW',
      subtitle: 'VERIFIED INTEGRATIONS FOR META, X, TIKTOK, GOOGLE & ENTERPRISE DEPLOYMENTS',
      lastVerified: 'September 2026',
      badges: [
        { label: 'META APP REVIEW', status: 'READY', description: 'Meets Instagram Graph API & Threads API public policy requirements' },
        { label: 'X DEVELOPER AGREEMENT', status: 'COMPLIANT', description: 'Adheres to v2 Developer Policy and Tweet rate-limit safeguards' },
        { label: 'TIKTOK FOR DEVELOPERS', status: 'COMPLIANT', description: 'Fully isolated direct-to-publish video payload specification' },
        { label: 'GDPR / CCPA', status: 'VERIFIED', description: 'Local-first zero telemetry architecture ensures continuous user data sovereignty' },
        { label: 'ENTERPRISE AI ISOLATION', status: 'ZERO-TRAIN', description: 'Google Gemini & OpenRouter APIs configured with zero training retention' }
      ],
      platforms: [
        {
          name: 'Meta / Instagram Graph API',
          scopes: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights', 'pages_show_list'],
          purpose: 'Publishing carousel slides, single images, and reels; reading user post impressions and likes.',
          dataRetention: 'Zero remote retention; tokens stored encrypted in local/Supabase storage.',
          deletionMethod: 'Native Meta Apps & Websites revocation + In-app Settings clear.'
        },
        {
          name: 'X (formerly Twitter) Developer API',
          scopes: ['tweet.read', 'tweet.write', 'users.read'],
          purpose: 'Publishing editorial threads and single tweets with media attachments.',
          dataRetention: 'Local cache only; deleted upon user request or app reset.',
          deletionMethod: 'X Connected Apps revocation + In-app credential removal.'
        },
        {
          name: 'TikTok for Developers API',
          scopes: ['video.upload', 'video.publish'],
          purpose: 'Direct dispatch of short-form vertical motion graphics and reels.',
          dataRetention: 'Transient upload payloads; purged immediately post-dispatch.',
          deletionMethod: 'TikTok Manage App Permissions revocation.'
        },
        {
          name: 'Google Gemini API / OpenRouter',
          scopes: ['API Key Authentication (Header: x-goog-api-key / Authorization Bearer)'],
          purpose: 'AI prompt assistance: hooks, typography breakdowns, scripts, tags.',
          dataRetention: 'Ephemeral session calls; enterprise zero-train API policies apply.',
          deletionMethod: 'Wipe API key in Settings modal.'
        },
        {
          name: 'Telegram Bot API & Bluesky AT Protocol',
          scopes: ['sendMessage, sendPhoto, sendMediaGroup', 'com.atproto.repo.createRecord'],
          purpose: 'Instant cross-posting to Telegram channel and Bluesky feeds.',
          dataRetention: 'Stored in user database only.',
          deletionMethod: 'Revoke Bot Token via @BotFather or App Password in Bluesky.'
        }
      ],
      faq: [
        {
          q: 'Does Swiss Content Engine sell user data or creative drafts?',
          a: 'Never. The platform operates on a local-first philosophy with zero ad-tracking, zero data brokerage, and zero surveillance.'
        },
        {
          q: 'Are my API keys sent to any external server other than the respective platform?',
          a: 'No. When you call Meta, the token is sent strictly to graph.facebook.com; when you call Gemini, it is sent strictly to generativelanguage.googleapis.com; when you call X, strictly to api.twitter.com.'
        },
        {
          q: 'What URL should I paste into Meta App Review for "Privacy Policy URL"?',
          a: 'Provide the public URL to this page or the standalone static page: https://[your-domain]/legal.html#privacy (or /privacy).'
        },
        {
          q: 'What URL should I paste into Meta App Review for "User Data Deletion"?',
          a: 'Provide the direct URL to the data deletion instructions: https://[your-domain]/legal.html#deletion (or /data-deletion).'
        }
      ]
    }
  },
  ru: {
    tos: {
      title: 'УСЛОВИЯ ИСПОЛЬЗОВАНИЯ (TOS)',
      subtitle: 'ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ СЕРВИСА KRAFTWERK // SWISS CONTENT ENGINE',
      effectiveDate: '1 марта 2026 г.',
      lastUpdated: '15 сентября 2026 г.',
      version: '1.4.0-CH',
      sections: [
        {
          id: 'acceptance',
          number: '01',
          title: 'Принятие условий соглашения',
          summary: 'Использование Swiss Content Engine означает ваше полное согласие с данными Условиями.',
          content: [
            'Настоящие Условия использования («Условия», «Соглашение») регулируют порядок использования программного комплекса Kraftwerk // Swiss Content Engine («Сервис», «Приложение», «Мы»), предназначенного для редакторского планирования, автоматизации дизайн-процессов, AI-генерации сценариев и кросс-постинга в социальные сети.',
            'Запуская Приложение, вводя API-ключи или используя любые его инструменты, вы подтверждаете, что ознакомились с настоящими Условиями и согласны соблюдать их в полном объеме.',
            'В случае несогласия с любым из положений вы обязаны прекратить использование Сервиса и удалить сохраненные токены доступа.'
          ]
        },
        {
          id: 'service-scope',
          number: '02',
          title: 'Архитектура и описание сервиса',
          summary: 'Приватная, локально-ориентированная студия контента для дизайнеров и креаторов.',
          content: [
            'Swiss Content Engine предоставляет единую цифровую среду: календарная швейцарская сетка 8px, радар трендов графического дизайна, канбан-пайплайн публикаций, генератор каруселей, рилс-сценариев и прямую публикацию по API.',
            'Принцип локальности и приватности (Local-First): Архитектура разработана так, что ваши черновики, визуальные ассеты и секретные ключи API хранятся исключительно на вашем устройстве (localStorage/IndexedDB браузера или локальный сервер) либо в вашей персональной базе данных Supabase (PostgreSQL с RLS-защитой).',
            'Мы не управляем центральными серверами, перехватывающими или продающими ваши творческие наработки.'
          ]
        },
        {
          id: 'credentials',
          number: '03',
          title: 'Учетные данные и безопасность API-токенов',
          summary: 'Вы сохраняете полный контроль над введенными API-ключами и несете за них ответственность.',
          content: [
            'Для активации публикации и AI-инструментов вы можете указать собственные API-токены: Meta (Instagram Graph API, Threads API), X (Twitter Developer API), TikTok for Developers, Telegram Bot API, Bluesky AT Protocol, Google Gemini API, OpenRouter API.',
            'Ответственность: Пользователь несет персональную ответственность за сохранность и конфиденциальность указанных ключей.',
            'Запрет передачи и перепродажи: Мы гарантируем, что ваши ключи никогда не будут переданы сторонним лицам, рекламным брокерам или использованы иначе, чем для выполнения ваших прямых команд.',
            'Отзыв ключей: Вы можете в любую секунду изменить или полностью стереть любой токен в окне Настроек (Settings).'
          ]
        },
        {
          id: 'acceptable-use',
          number: '04',
          title: 'Правила допустимого использования (AUP)',
          summary: 'Обязательное соблюдение политик подключаемых социальных платформ.',
          content: [
            'Пользователь обязуется использовать Сервис исключительно в законных целях и в строгом соответствии с правилами разработчиков внешних платформ:',
            '• Meta Platform Terms и Instagram Graph API Developer Policies;',
            '• X (Twitter) Developer Agreement & Policy;',
            '• TikTok Developer Terms of Service и Community Guidelines;',
            '• Google API Services User Data Policy и Gemini API Terms;',
            '• Pinterest Developer Guidelines и LinkedIn API Terms;',
            '• Telegram Bot API Terms и Bluesky / AT Protocol Guidelines.',
            'Запрещенные действия: Запрещено использовать Сервис для рассылки спама, распространения вредоносного ПО, фишинга, нарушения авторских прав, а также попыток искусственного обхода лимитов (rate limits) социальных сетей.'
          ]
        },
        {
          id: 'intellectual-property',
          number: '05',
          title: 'Интеллектуальная собственность на созданный контент',
          summary: 'Вы являетесь 100% владельцем всех созданных текстов, каруселей и сценариев.',
          content: [
            'Права пользователя: Все авторские права на созданные через Сервис тексты, карусели, дизайн-концепты, сценарии, промпты и контент-планы полностью принадлежат вам.',
            'Отсутствие претензий на роялти: Сервис не претендует на права собственности, лицензионные отчисления или использование ваших материалов.',
            'Права на платформу: Исходный код Swiss Content Engine, дизайн-система, компоненты интерфейса и документация защищены законами об интеллектуальной собственности.'
          ]
        },
        {
          id: 'third-party-apis',
          number: '06',
          title: 'Взаимодействие со сторонними сервисами и нейросетями',
          summary: 'Внешние платформы функционируют независимо согласно собственным регламентам.',
          content: [
            'Приложение выступает клиентом, отправляющим запросы напрямую к серверам провайдеров (Meta, Google, X, Telegram, Supabase).',
            'Мы не контролируем доступность, изменения в API, изменения тарифов или временные сбои на стороне этих сторонних компаний.',
            'Сервис не несет ответственности за блокировки аккаунтов или отклонения постов со стороны алгоритмов модерации социальных сетей.'
          ]
        },
        {
          id: 'warranties',
          number: '07',
          title: 'Отказ от гарантий',
          summary: 'Программное обеспечение предоставляется по принципу «КАК ЕСТЬ» (AS IS).',
          content: [
            'ПРИЛОЖЕНИЕ ПРЕДОСТАВЛЯЕТСЯ «КАК ЕСТЬ» И «ПО МЕРЕ ДОСТУПНОСТИ», БЕЗ КАКИХ-ЛИБО ЯВНЫХ ИЛИ ПОДРАЗУМЕВАЕМЫХ ГАРАНТИЙ, ВКЛЮЧАЯ, НО НЕ ОГРАНИЧИВАЯСЬ ГАРАНТИЯМИ БЕСПЕРЕБОЙНОСТИ, ТОЧНОСТИ ИЛИ ПРИГОДНОСТИ ДЛЯ КОНКРЕТНЫХ ЦЕЛЕЙ.',
            'МЫ НЕ ГАРАНТИРУЕМ, ЧТО РЕЗУЛЬТАТЫ РАБОТЫ ИСКУССТВЕННОГО ИНТЕЛЛЕКТА БУДУТ ЛИШЕНЫ ФАКТИЧЕСКИХ НЕТОЧНОСТЕЙ.'
          ]
        },
        {
          id: 'liability',
          number: '08',
          title: 'Ограничение ответственности',
          summary: 'Ответственность разработчиков ограничена в максимально допустимой законом степени.',
          content: [
            'НИ ПРИ КАКИХ ОБСТОЯТЕЛЬСТВАХ РАЗРАБОТЧИКИ СЕРВИСА НЕ НЕСУТ ОТВЕТСТВЕННОСТИ ЗА ЛЮБЫЕ КОСВЕННЫЕ, СЛУЧАЙНЫЕ ИЛИ ШТРАФНЫЕ УБЫТКИ, ПОТЕРЮ ДАННЫХ ИЛИ ПРИБЫЛИ, ВОЗНИКШИЕ В СВЯЗИ С ИСПОЛЬЗОВАНИЕМ ИЛИ НЕВОЗМОЖНОСТЬЮ ИСПОЛЬЗОВАНИЯ СЕРВИСА.'
          ]
        },
        {
          id: 'termination',
          number: '09',
          title: 'Прекращение использования и удаление данных',
          summary: 'Вы можете прекратить использование сервиса в любой момент.',
          content: [
            'Вы вправе в любое время прекратить работу с Приложением, очистив локальные данные и отозвав выданные токены.',
            'При очистке локального хранилища браузера или удалении таблиц базы данных вся ваша информация удаляется безвозвратно.'
          ]
        },
        {
          id: 'governing-law',
          number: '10',
          title: 'Изменение условий',
          summary: 'Условия могут обновляться с фиксацией даты изменения на этой странице.',
          content: [
            'Мы оставляем за собой право обновлять настоящие Условия. Актуальная версия с датой последнего обновления всегда доступна на данной странице.',
            'Продолжение использования Сервиса после публикации изменений означает согласие с новой редакцией.'
          ]
        }
      ]
    },
    privacy: {
      title: 'ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ',
      subtitle: 'СТАНДАРТ ЗАЩИТЫ ДАННЫХ И ПРИВАТНОСТИ KRAFTWERK // SWISS CONTENT ENGINE',
      effectiveDate: '1 марта 2026 г.',
      lastUpdated: '15 сентября 2026 г.',
      version: '1.4.0-CH',
      sections: [
        {
          id: 'privacy-commitment',
          number: '01',
          title: 'Принцип бескомпромиссной приватности',
          summary: 'Ваши творческие планы и секретные ключи принадлежат только вам.',
          content: [
            'Swiss Content Engine построен на принципах абсолютной минимизации данных и встроенной приватности (Privacy by Design).',
            'Мы НЕ продаем, НЕ сдаем в аренду и НЕ передаем ваши персональные данные, контент-планы или API-ключи рекламным брокерам.',
            'Мы НЕ используем рекламные трекеры, маркетинговые пиксели и следящие скрипты.'
          ]
        },
        {
          id: 'data-collected',
          number: '02',
          title: 'Категории обрабатываемых данных',
          summary: 'Только технически необходимые данные для работы контент-календаря.',
          content: [
            '1. Пользовательские токены и API-ключи: Токены Meta (Instagram/Threads), X, TikTok, Telegram, Bluesky, Google Gemini, OpenRouter. Сохраняются исключительно в вашем браузере или персональной базе Supabase.',
            '2. Контент публикаций и медиафайлы: Тексты постов, хуки, слайды каруселей, теги, даты отложенного постинга и ссылки на прикрепленные изображения.',
            '3. Статистика и аналитика: Охваты, лайки, просмотры и репосты, получаемые через официальные read-only методы API ваших подключенных аккаунтов исключительно для отображения на вашей личной панели аналитики.',
            '4. Диагностика сети: Временные статусы HTTP-ответов и миллисекунды задержки при тестировании подключений в окне Настроек.'
          ]
        },
        {
          id: 'ai-processing',
          number: '03',
          title: 'Обработка запросов через искусственный интеллект (AI)',
          summary: 'Промпты отправляются только по вашей команде и не обучают публичные нейросети.',
          content: [
            'При генерации сценариев, хуков или разборов дизайна промпт отправляется по защищенному протоколу TLS 1.3 HTTPS выбранному вами провайдеру (Google Gemini или OpenRouter).',
            'Политика Zero-Training: Согласно коммерческим регламентам Google Gemini API и OpenRouter Enterprise, запросы через API изолированы и НЕ используются для дообучения публичных базовых моделей.',
            'Режим песочницы (Sandbox Mode): Вы можете переключить Приложение в режим симуляции в настройках и работать полностью офлайн без обращения к серверам нейросетей.'
          ]
        },
        {
          id: 'social-permissions',
          number: '04',
          title: 'Разрешения социальных сетей (OAuth Scopes)',
          summary: 'Запрашиваются только минимальные права для отложенного постинга.',
          content: [
            'Приложение использует строго ограниченные права доступа:',
            '• Meta / Instagram Graph API: "instagram_basic", "instagram_content_publish", "instagram_manage_insights", "pages_show_list". Применяются исключительно для публикации утвержденных постов и просмотра аналитики.',
            '• X (Twitter) API: "tweet.read", "tweet.write", "users.read". Применяются для отправки тредов и расчета метрик вовлеченности.',
            '• TikTok for Developers: "video.upload", "video.publish". Используются только для загрузки коротких видеороликов.',
            '• Pinterest API: "pins:write", "pins:read", "boards:read". Для пинов графики в ваши доски.',
            '• LinkedIn API: "w_member_social", "r_liteprofile". Для деловых постов в ваш профиль.',
            '• Telegram Bot API: Для трансляции постов в указанный вами канал через вашего личного бота.',
            '• Bluesky AT Protocol: Для создания записей в вашем репозитории через специальный App Password.'
          ]
        },
        {
          id: 'data-storage',
          number: '05',
          title: 'Хранение, защита и локальность данных',
          summary: 'Многоуровневая защита с маскированием ключей и локальным хранением.',
          content: [
            'Локальное хранилище: По умолчанию все данные находятся исключительно на вашем компьютере.',
            'Облачная база (Supabase): При подключении Supabase данные размещаются в вашем личном кластере PostgreSQL с защитой политиками Row-Level Security (RLS) и шифрованием трафика TLS 1.3.',
            'Маскирование в интерфейсе: Ключи отображаются в скрытом виде (например, "sk-or-...****"), исключая случайную компрометацию при демонстрации экрана.',
            'Экспорт данных: Инструмент экспорта базы позволяет одним переключателем исключить секретные ключи перед сохранением JSON-файла.'
          ]
        },
        {
          id: 'user-rights',
          number: '06',
          title: 'Права пользователей (GDPR, CCPA)',
          summary: 'Полное управление: доступ, экспорт, редактирование и мгновенное удаление.',
          content: [
            'В рамках положений GDPR (статьи 15-22) и CCPA вам гарантируются следующие права:',
            '• Право на доступ: Вы можете просмотреть все сохраненные публикации, тренды и настройки в любой момент.',
            '• Право на изменение: Любой пост или токен можно изменить в один клик.',
            '• Право на переносимость данных: Выгрузка полной базы данных в формате JSON через Настройки -> Экспорт.',
            '• Право на забвение (удаление): Мгновенная очистка базы или выборочное удаление любой записи.',
            '• Право на отсутствие дискриминации за использование прав приватности.'
          ]
        },
        {
          id: 'children',
          number: '07',
          title: 'Защита конфиденциальности несовершеннолетних',
          summary: 'Сервис ориентирован на специалистов и лиц старше 16 лет.',
          content: [
            'Сервис предназначен для дизайнеров, маркетологов и креативных специалистов. Мы намеренно не собираем данные несовершеннолетних младше 16 лет. При выявлении таких сведений они подлежат незамедлительному удалению.'
          ]
        },
        {
          id: 'contact',
          number: '08',
          title: 'Контакты по вопросам конфиденциальности',
          summary: 'Как связаться с нами по вопросам обработки данных.',
          content: [
            'Если у вас есть вопросы касательно настоящей Политики или соответствия стандартам Meta и GDPR, вы можете направить запрос на privacy@swisscontentengine.local или открыть Issue в репозитории проекта.'
          ]
        }
      ]
    },
    deletion: {
      title: 'ИНСТРУКЦИЯ ПО УДАЛЕНИЮ ДАННЫХ',
      subtitle: 'СООТВЕТСТВИЕ ТРЕБОВАНИЯМ META (INSTAGRAM/THREADS), TIKTOK И GOOGLE DATA DELETION',
      effectiveDate: '1 марта 2026 г.',
      lastUpdated: '15 сентября 2026 г.',
      version: '1.4.0-CH',
      sections: [
        {
          id: 'deletion-overview',
          number: '01',
          title: 'Общие положения об удалении данных',
          summary: 'Обеспечение права на полное и безвозвратное стирание информации.',
          content: [
            'Swiss Content Engine уважает ваше право на удаление любой персональной информации, медиафайлов и токенов доступа.',
            'В соответствии с требованиями Meta Platform Policy (Instagram Graph API, Facebook Login, Threads API) и регламентами платформ для разработчиков, ниже описаны точные способы удаления ваших данных из Приложения и аннулирования прав доступа.'
          ]
        },
        {
          id: 'deletion-step1',
          number: '02',
          title: 'Способ 1: Мгновенное удаление данных внутри Приложения',
          summary: 'Очистка локального хранилища и базы за 10 секунд.',
          content: [
            'Благодаря локально-ориентированной архитектуре вы можете полностью стереть всю информацию самостоятельно:',
            '1. Откройте Приложение и нажмите «SETTINGS» в верхнем меню.',
            '2. Прокрутите до блока «Управление базой данных (Database & Storage)».',
            '3. Сотрите введенные токены или нажмите «Сбросить подключение».',
            '4. Чтобы удалить сохраненные посты и кэш аналитики, откройте в браузере DevTools -> вкладка Application (Приложение) -> Storage (Хранилище) -> нажмите «Clear site data» (Очистить данные сайта).',
            '5. Если вы используете облачную базу Supabase, удалите таблицы в Supabase Dashboard или выполните SQL: "DROP TABLE IF EXISTS posts, trends, settings CASCADE;".',
            'Результат: Все записи, черновики и ключи удаляются безвозвратно.'
          ]
        },
        {
          id: 'deletion-step2',
          number: '03',
          title: 'Способ 2: Отзыв разрешений в интерфейсе социальных сетей',
          summary: 'Аннулирование прав прямо в настройках ваших профилей.',
          content: [
            'Вы можете в любой момент отозвать доступ к своим аккаунтам через стандартные интерфейсы безопасности социальных платформ:',
            '• Meta / Instagram / Facebook: Настройки и конфиденциальность -> Настройки -> Приложения и сайты -> Найдите Swiss Content Engine -> Нажмите «Удалить» -> Отметьте «Удалить публикации, размещенные от вашего имени».',
            '• X (Twitter): Настройки и конфиденциальность -> Безопасность и доступ к аккаунту -> Приложения и сеансы -> Подключенные приложения -> Выберите Приложение -> Нажмите «Отозвать доступ».',
            '• TikTok: Профиль -> Настройки и конфиденциальность -> Безопасность и разрешения -> Управление разрешениями приложений -> Удалить доступ.',
            '• Google / Gemini: myaccount.google.com -> Безопасность -> Сторонние приложения с доступом к аккаунту -> Отозвать доступ.',
            '• Telegram: Напишите боту @BotFather команду /revoke или /deletebot для мгновенного отзыва токена.'
          ]
        },
        {
          id: 'deletion-step3',
          number: '04',
          title: 'Способ 3: Официальный запрос на удаление (Meta Deletion Protocol)',
          summary: 'Протокол удаления по запросу и автоматический callback-эндпоинт.',
          content: [
            'Для корпоративных инсталляций или получения подтверждения удаления данных в рамках проверки Meta App Review:',
            '1. Отправьте письмо с темой «DATA DELETION REQUEST» на privacy@swisscontentengine.local с указанием идентификатора вашего развертывания.',
            '2. Автоматический Callback: Если ваше приложение развернуто за сервером авторизации, наш сервер обрабатывает Deletion Callback по адресу: /api/meta/data-deletion-callback.',
            '3. Сроки: Запрос обрабатывается в течение 24 часов с предоставлением уникального криптографического кода подтверждения удаления (Confirmation Code).'
          ]
        }
      ]
    },
    compliance: {
      title: 'ОБЗОР СООТВЕТСТВИЯ СТАНДАРТАМ API И META REVIEW',
      subtitle: 'ПРОВЕРЕННЫЕ ИНТЕГРАЦИИ ДЛЯ META, X, TIKTOK, GOOGLE И КОРПОРАТИВНОГО ИСПОЛЬЗОВАНИЯ',
      lastVerified: 'Сентябрь 2026 г.',
      badges: [
        { label: 'META APP REVIEW', status: 'ГОТОВ', description: 'Полное соответствие требованиям Instagram Graph API и Threads API' },
        { label: 'X DEVELOPER AGREEMENT', status: 'СООТВЕТСТВУЕТ', description: 'Защита от превышения лимитов и соблюдение v2 Developer Policy' },
        { label: 'TIKTOK FOR DEVELOPERS', status: 'СООТВЕТСТВУЕТ', description: 'Изолированная отправка коротких видеороликов по прямому протоколу' },
        { label: 'GDPR / CCPA', status: 'ВЕРИФИЦИРОВАН', description: 'Архитектура без удаленной телеметрии гарантирует суверенитет данных' },
        { label: 'ИЗОЛЯЦИЯ AI-ДАННЫХ', status: 'ZERO-TRAIN', description: 'Google Gemini и OpenRouter не используют промпты для публичного обучения' }
      ],
      platforms: [
        {
          name: 'Meta / Instagram Graph API',
          scopes: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights', 'pages_show_list'],
          purpose: 'Публикация каруселей, отдельных изображений и Reels; чтение просмотров и лайков.',
          dataRetention: 'Отсутствует удаленное хранение; ключи только локально или в Supabase.',
          deletionMethod: 'Отзыв в настройках Meta «Приложения и сайты» + очистка в приложении.'
        },
        {
          name: 'X (ранее Twitter) Developer API',
          scopes: ['tweet.read', 'tweet.write', 'users.read'],
          purpose: 'Публикация тредов и отдельных твитов с прикрепленными изображениями.',
          dataRetention: 'Только локальный кэш; удаляется по запросу или сбросу.',
          deletionMethod: 'Отзыв в X Подключенных приложениях + удаление токена в настройках.'
        },
        {
          name: 'TikTok for Developers API',
          scopes: ['video.upload', 'video.publish'],
          purpose: 'Прямая отправка вертикальных видеороликов и моушн-дизайна.',
          dataRetention: 'Краткосрочная передача; файл не сохраняется после публикации.',
          deletionMethod: 'Отзыв в настройках безопасности TikTok.'
        },
        {
          name: 'Google Gemini API / OpenRouter',
          scopes: ['Аутентификация по API-ключу в HTTPS-заголовке'],
          purpose: 'AI-помощь: хуки, типографические сценарии, разбор кейсов, теги.',
          dataRetention: 'Сессионные вызовы; корпоративная политика без обучения.',
          deletionMethod: 'Очистка API-ключа в окне настроек.'
        },
        {
          name: 'Telegram Bot API & Bluesky AT Protocol',
          scopes: ['sendMessage, sendPhoto, sendMediaGroup', 'com.atproto.repo.createRecord'],
          purpose: 'Кросс-постинг в каналы Telegram и ленту Bluesky.',
          dataRetention: 'Только в личной базе данных пользователя.',
          deletionMethod: 'Отзыв бота через @BotFather или App Password в Bluesky.'
        }
      ],
      faq: [
        {
          q: 'Продает ли Swiss Content Engine данные пользователей или черновики постов?',
          a: 'Категорически нет. Сервис работает по концепции Local-First без рекламных трекеров, брокеров данных и слежки.'
        },
        {
          q: 'Передаются ли мои API-ключи куда-либо, кроме официальных серверов платформ?',
          a: 'Нет. Запросы к Instagram отправляются строго на graph.facebook.com, к Gemini — на generativelanguage.googleapis.com, к X — на api.twitter.com.'
        },
        {
          q: 'Какой URL указывать в заявке Meta App Review в поле «Privacy Policy URL»?',
          a: 'Указывайте публичный URL этой страницы или статического файла: https://[ваш-домен]/legal.html#privacy (или /privacy).'
        },
        {
          q: 'Какой URL указывать в заявке Meta App Review в поле «User Data Deletion»?',
          a: 'Указывайте прямую ссылку на раздел удаления данных: https://[ваш-домен]/legal.html#deletion (or /data-deletion).'
        }
      ]
    }
  }
};
