export type Platform = 
  | 'instagram' 
  | 'twitter' 
  | 'bluesky' 
  | 'telegram' 
  | 'tiktok' 
  | 'pinterest' 
  | 'linkedin' 
  | 'threads';

export type Stage = 'idea' | 'script' | 'media' | 'scheduled' | 'published';

export type ContentFormat = 'carousel' | 'reels' | 'thread' | 'telegram' | 'stories';

export interface SlideItem {
  slideNumber: number;
  title: string;
  text: string;
  visualPrompt: string;
}

export interface VideoScriptItem {
  time: string;
  visual: string;
  audio: string;
  textOverlay: string;
}

export interface StoryScreenItem {
  screenNumber: number;
  title: string;
  textOverlay: string;
  stickerType?: 'poll' | 'slider' | 'link' | 'question' | 'none';
  stickerContent?: string;
  visualPrompt: string;
}

export interface PublishChannelResult {
  success: boolean;
  message?: string;
  messageId?: string;
  tweetId?: string;
  uri?: string;
  mediaId?: string;
  pinId?: string;
  error?: string;
  mode?: 'live' | 'simulated';
  note?: string;
}

export interface Post {
  id: string;
  title: string;
  status: Stage;
  channels: Platform[];
  category: string;
  scheduledDate: string;
  format: ContentFormat;
  hook?: string;
  caption?: string;
  slides?: SlideItem[];
  videoScript?: VideoScriptItem[];
  threadPosts?: string[];
  telegramPost?: string;
  storiesChain?: StoryScreenItem[];
  pinterestBoard?: string;
  destinationUrl?: string;
  mediaUrls: string[];
  publishedAt?: string | null;
  publishResults?: Record<string, PublishChannelResult> | null;
  timeSpentMinutes?: number;
}

export interface Trend {
  id: string;
  title: string;
  category: 'typography' | 'branding' | '3d' | 'motion' | 'editorial';
  categoryLabel: string;
  source: string;
  description: string;
  tags: string[];
  relevanceScore: number;
  keyTakeaway: string;
  suggestedFormat: ContentFormat;
  dateAdded: string;
  sourceUrl?: string;
}

export interface AiModelOption {
  id: string;
  name: string;
}

export interface AppSettings {
  // Database & Cloud configuration
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseAnonKeyMasked?: string;
  hasSupabaseKey?: boolean;
  dbMode?: 'supabase' | 'local_api' | 'browser';
  customApiUrl?: string;

  geminiApiKey?: string;
  geminiApiKeyMasked?: string;
  hasGeminiKey?: boolean;
  openRouterApiKey?: string;
  openRouterApiKeyMasked?: string;
  hasOpenRouterKey?: boolean;
  aiProviderMode?: 'cascade' | 'gemini_only' | 'openrouter_only';
  defaultModel: string;
  defaultGeminiModel?: string;
  availableModels: AiModelOption[];
  telegramBotToken?: string;
  telegramBotTokenMasked?: string;
  telegramChatId?: string;
  blueskyIdentifier?: string;
  blueskyAppPassword?: string;
  blueskyAppPasswordMasked?: string;
  xApiKey?: string;
  xApiKeyMasked?: string;
  xApiSecret?: string;
  xAccessToken?: string;
  xAccessSecret?: string;
  instagramAccessToken?: string;
  instagramAccessTokenMasked?: string;
  instagramAccountId?: string;
  tiktokAccessToken?: string;
  tiktokAccessTokenMasked?: string;
  pinterestAccessToken?: string;
  pinterestAccessTokenMasked?: string;
  linkedinAccessToken?: string;
  linkedinAccessTokenMasked?: string;
  threadsAccessToken?: string;
  threadsAccessTokenMasked?: string;
  simulationMode: boolean;
  hasTelegramKey?: boolean;
  hasBlueskyKey?: boolean;
  hasXKey?: boolean;
  hasInstagramKey?: boolean;
  hasTikTokKey?: boolean;
  hasPinterestKey?: boolean;
  hasLinkedInKey?: boolean;
  hasThreadsKey?: boolean;
}

export interface AiTelemetry {
  status: number | null;
  statusText: string | null;
  latencyMs: number;
  generationId?: string | null;
  model: string;
  live: boolean;
  provider?: 'gemini' | 'openrouter' | 'fallback';
  tokens?: number;
  error?: string | null;
  message?: string;
  isFallback?: boolean;
  cascadeTriggered?: boolean;
  cascadeDetails?: string;
  geminiStatus?: number | null;
  geminiError?: string | null;
  openRouterStatus?: number | null;
  openRouterError?: string | null;
  duplicatesSkipped?: number;
  webGrounded?: boolean;
  webSourcesCount?: number;
}

export interface AiTestConnectionResult {
  connected: boolean;
  status: number;
  statusText: string;
  latencyMs: number;
  provider?: string;
  generationId?: string | null;
  modelRequested?: string;
  actualModel?: string;
  tokensUsed?: number;
  reply?: string;
  error?: string;
  message: string;
  keyPresent?: boolean;
  gemini?: {
    connected: boolean;
    status: number;
    statusText: string;
    latencyMs: number;
    model?: string;
    reply?: string;
    error?: string;
    message?: string;
  };
  openRouter?: {
    connected: boolean;
    status: number;
    statusText: string;
    latencyMs: number;
    generationId?: string;
    actualModel?: string;
    reply?: string;
    error?: string;
    message?: string;
  };
}

export interface DuplicateCheckResult {
  exists: boolean;
  post?: Post;
  message?: string;
}
