import {
  Post,
  Trend,
  AppSettings,
  Platform,
  ContentFormat,
  AiTelemetry,
  AiTestConnectionResult,
  DuplicateCheckResult,
  PublishChannelResult
} from '../types/index.ts';

import { storageAdapter, checkLocalApiAvailability, testSupabaseConnection } from './storageAdapter.ts';
import {
  clientScanTrendsAI,
  clientGenerateScriptAI,
  clientTestGeminiConnection,
  clientTestOpenRouterConnection,
  clientTestCascadeConnection
} from './clientAi.ts';

// Re-export storage & database tools
export { testSupabaseConnection };
export const exportDatabase = () => storageAdapter.exportDatabase();
export const importDatabase = (jsonString: string) => storageAdapter.importDatabase(jsonString);

// TRENDS
export async function getTrends(): Promise<Trend[]> {
  return storageAdapter.getTrends();
}

export async function createTrend(trend: Partial<Trend>): Promise<Trend & { alreadyExisted?: boolean }> {
  return storageAdapter.createTrend(trend);
}

// WEB SEARCH & URL SCRAPING
export async function searchWeb(query: string, maxResults = 5): Promise<Array<{ title: string; snippet: string; url: string }>> {
  const hasServer = await checkLocalApiAvailability();
  if (hasServer) {
    try {
      const res = await fetch('/api/web/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, maxResults })
      });
      if (res.ok) {
        const data = await res.json();
        return data.results || [];
      }
    } catch {
      // Fallback
    }
  }
  return [];
}

export async function parseUrlContent(url: string): Promise<{
  ok: boolean;
  title?: string;
  description?: string;
  headings?: string[];
  text?: string;
  url?: string;
  error?: string;
}> {
  const hasServer = await checkLocalApiAvailability();
  if (hasServer) {
    try {
      const res = await fetch('/api/web/parse-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (res.ok) {
        return res.json();
      }
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }
  return { ok: false, error: 'Серверный парсер веб-страниц недоступен' };
}

export async function scanTrendsAI(
  categoryOrParams?: string | { category?: string; model?: string; query?: string; url?: string; useWebSearch?: boolean },
  modelArg?: string
): Promise<{
  trends: Trend[];
  live: boolean;
  modelUsed?: string;
  webSources?: any[];
  telemetry?: AiTelemetry;
}> {
  const isObj = typeof categoryOrParams === 'object' && categoryOrParams !== null;
  const payload = isObj ? categoryOrParams : { category: categoryOrParams || 'all', model: modelArg };

  const hasServer = await checkLocalApiAvailability();
  if (hasServer) {
    try {
      const res = await fetch('/api/trends/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return res.json();
    } catch {
      // Fallback to client-side AI
    }
  }
  return clientScanTrendsAI(categoryOrParams, modelArg);
}

// POSTS
export async function getPosts(): Promise<Post[]> {
  return storageAdapter.getPosts();
}

export async function getPost(id: string): Promise<Post> {
  return storageAdapter.getPost(id);
}

export async function checkDuplicatePost(title: string): Promise<DuplicateCheckResult> {
  if (!title || !title.trim()) return { exists: false };
  const posts = await storageAdapter.getPosts();
  const normalized = title.trim().toLowerCase();
  const found = posts.find(p => p.title.trim().toLowerCase() === normalized);
  if (found) {
    return {
      exists: true,
      post: found
    };
  }
  return { exists: false };
}

export async function createPost(post: Partial<Post>, forceDuplicate = false): Promise<Post & { duplicatePrevented?: boolean; alreadyExisted?: boolean; message?: string }> {
  return storageAdapter.createPost(post, forceDuplicate);
}

export async function updatePost(id: string, post: Partial<Post>): Promise<Post> {
  return storageAdapter.updatePost(id, post);
}

export async function deletePost(id: string): Promise<void> {
  return storageAdapter.deletePost(id);
}

// MEDIA UPLOADS
export async function uploadMedia(files: File[]): Promise<string[]> {
  const hasServer = await checkLocalApiAvailability();
  if (hasServer) {
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        return data.urls;
      }
    } catch (e) {
      console.warn('Server upload failed, converting to local data URLs', e);
    }
  }

  // Client-side fallback: Convert to Data URLs (Works 100% on GitHub Pages & offline)
  const dataUrlPromises = files.map(file => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  });

  return Promise.all(dataUrlPromises);
}

// SCRIPT & CONTENT GENERATION
export async function generateScriptAI(params: {
  title: string;
  topic?: string;
  format: ContentFormat;
  targetAudience?: string;
  tone?: string;
  channels: Platform[];
  model?: string;
  viralStrategy?: string;
  useWebSearch?: boolean;
  sourceUrl?: string;
}): Promise<{
  result: any;
  live: boolean;
  modelUsed: string;
  webSources?: any[];
  telemetry?: AiTelemetry;
}> {
  const hasServer = await checkLocalApiAvailability();
  if (hasServer) {
    try {
      const res = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) return res.json();
    } catch {
      // Fallback to client-side AI
    }
  }
  return clientGenerateScriptAI(params);
}

// CONNECTION TESTS
export async function testGeminiConnection(apiKey?: string, model?: string): Promise<AiTestConnectionResult> {
  const hasServer = await checkLocalApiAvailability();
  if (hasServer) {
    try {
      const res = await fetch('/api/ai/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, model })
      });
      if (res.ok) return res.json();
    } catch {
      // Fallback to client test
    }
  }
  return clientTestGeminiConnection(apiKey, model);
}

export async function testOpenRouterConnection(apiKey?: string, model?: string): Promise<AiTestConnectionResult> {
  const hasServer = await checkLocalApiAvailability();
  if (hasServer) {
    try {
      const res = await fetch('/api/ai/test-openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, model })
      });
      if (res.ok) return res.json();
    } catch {
      // Fallback to client test
    }
  }
  return clientTestOpenRouterConnection(apiKey, model);
}

export async function testCascadeConnection(params?: { geminiApiKey?: string; openRouterApiKey?: string }): Promise<AiTestConnectionResult> {
  const hasServer = await checkLocalApiAvailability();
  if (hasServer) {
    try {
      const res = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {})
      });
      if (res.ok) return res.json();
    } catch {
      // Fallback to client test
    }
  }
  return clientTestCascadeConnection(params);
}

// PUBLISH POST
export async function publishPost(params: {
  postId: string;
  channels?: Platform[];
  customTexts?: Record<string, string>;
  scheduledDate?: string;
  isScheduled?: boolean;
}) {
  const hasServer = await checkLocalApiAvailability();
  if (hasServer) {
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) return res.json();
    } catch {
      // Fallback to client-side simulation
    }
  }

  // Client-side simulation of publishing
  const channels = params.channels || ['instagram'];
  const publishResults: Record<string, PublishChannelResult> = {};

  channels.forEach(ch => {
    publishResults[ch] = {
      success: true,
      mode: 'simulated',
      message: `[СИМУЛЯЦИЯ GITHUB PAGES] Успешно запланировано в ${ch.toUpperCase()}`,
      messageId: `sim-${Date.now()}-${ch}`
    };
  });

  const updated = await storageAdapter.updatePost(params.postId, {
    status: params.isScheduled ? 'scheduled' : 'published',
    publishedAt: params.isScheduled ? null : new Date().toISOString(),
    scheduledDate: params.scheduledDate || new Date().toISOString(),
    publishResults
  });

  return {
    success: true,
    mode: 'simulated',
    post: updated,
    results: publishResults
  };
}

// SETTINGS
export async function getSettings(): Promise<AppSettings> {
  return storageAdapter.getSettings();
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<{ success: boolean }> {
  return storageAdapter.updateSettings(settings);
}
