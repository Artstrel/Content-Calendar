import { Post, Trend, AppSettings, Platform, ContentFormat, AiTelemetry, AiTestConnectionResult, DuplicateCheckResult } from '../types/index.ts';

const BASE_URL = '/api';

export async function getTrends(): Promise<Trend[]> {
  const res = await fetch(`${BASE_URL}/trends`);
  if (!res.ok) throw new Error('Failed to fetch trends');
  return res.json();
}

export async function createTrend(trend: Partial<Trend>): Promise<Trend & { alreadyExisted?: boolean }> {
  const res = await fetch(`${BASE_URL}/trends`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(trend)
  });
  if (!res.ok) throw new Error('Failed to create trend');
  return res.json();
}

export async function scanTrendsAI(category?: string, model?: string): Promise<{ trends: Trend[]; live: boolean; modelUsed?: string; telemetry?: AiTelemetry }> {
  const res = await fetch(`${BASE_URL}/trends/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, model })
  });
  if (!res.ok) throw new Error('Failed to scan trends');
  return res.json();
}

export async function getPosts(): Promise<Post[]> {
  const res = await fetch(`${BASE_URL}/posts`);
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function getPost(id: string): Promise<Post> {
  const res = await fetch(`${BASE_URL}/posts/${id}`);
  if (!res.ok) throw new Error('Failed to fetch post');
  return res.json();
}

export async function checkDuplicatePost(title: string): Promise<DuplicateCheckResult> {
  if (!title || !title.trim()) return { exists: false };
  const res = await fetch(`${BASE_URL}/posts/check-duplicate?title=${encodeURIComponent(title.trim())}`);
  if (!res.ok) return { exists: false };
  return res.json();
}

export async function createPost(post: Partial<Post>, forceDuplicate = false): Promise<Post & { duplicatePrevented?: boolean; alreadyExisted?: boolean; message?: string }> {
  const res = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...post, forceDuplicate })
  });
  if (!res.ok) throw new Error('Failed to create post');
  return res.json();
}

export async function updatePost(id: string, post: Partial<Post>): Promise<Post> {
  const res = await fetch(`${BASE_URL}/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post)
  });
  if (!res.ok) throw new Error('Failed to update post');
  return res.json();
}

export async function deletePost(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/posts/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete post');
}

export async function uploadMedia(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));

  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.urls;
}

export async function generateScriptAI(params: {
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
  const res = await fetch(`${BASE_URL}/ai/generate-script`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Failed to generate script');
  return res.json();
}

export async function testGeminiConnection(apiKey?: string, model?: string): Promise<AiTestConnectionResult> {
  const res = await fetch(`${BASE_URL}/ai/test-gemini`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, model })
  });
  if (!res.ok) {
    return {
      connected: false,
      status: res.status,
      statusText: res.statusText,
      latencyMs: 0,
      message: `Сервер вернул ошибку HTTP ${res.status}`
    };
  }
  return res.json();
}

export async function testOpenRouterConnection(apiKey?: string, model?: string): Promise<AiTestConnectionResult> {
  const res = await fetch(`${BASE_URL}/ai/test-openrouter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, model })
  });
  if (!res.ok) {
    return {
      connected: false,
      status: res.status,
      statusText: res.statusText,
      latencyMs: 0,
      message: `Сервер вернул ошибку HTTP ${res.status}`
    };
  }
  return res.json();
}

export async function testCascadeConnection(params?: { geminiApiKey?: string; openRouterApiKey?: string }): Promise<AiTestConnectionResult> {
  const res = await fetch(`${BASE_URL}/ai/test-connection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params || {})
  });
  if (!res.ok) {
    return {
      connected: false,
      status: res.status,
      statusText: res.statusText,
      latencyMs: 0,
      message: `Сервер вернул ошибку HTTP ${res.status}`
    };
  }
  return res.json();
}

export async function publishPost(params: {
  postId: string;
  channels?: Platform[];
  customTexts?: Record<string, string>;
  scheduledDate?: string;
  isScheduled?: boolean;
}) {
  const res = await fetch(`${BASE_URL}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Failed to publish');
  return res.json();
}

export async function getSettings(): Promise<AppSettings> {
  const res = await fetch(`${BASE_URL}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE_URL}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}
