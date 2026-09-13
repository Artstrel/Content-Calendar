/**
 * SWISS WEB PARSER & LIVE SEARCH ENGINE
 * Provides real-time internet search and URL scraping for AI generation.
 * Works without requiring paid third-party search APIs.
 */

function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
}

/**
 * Searches the live web using DuckDuckGo HTML without paid API keys.
 * Returns up to maxResults results: { title, snippet, url }
 */
export async function searchWeb(query, maxResults = 5) {
  if (!query || !query.trim()) return [];

  const cleanQuery = query.trim();
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru,en;q=0.9',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[WEB PARSER] DuckDuckGo returned HTTP ${res.status}`);
      return await fallbackWikipediaSearch(cleanQuery, maxResults);
    }

    const html = await res.text();
    const results = [];
    const blocks = html.split(/<div[^>]*class=\"[^\"]*result results_links[^\"]*\"/i);

    for (let i = 1; i < blocks.length && results.length < maxResults; i++) {
      const block = blocks[i];
      const titleMatch = block.match(/<a[^>]*class=\"result__a\"[^>]*href=\"([^\"]*)\"[^>]*>([\s\S]*?)<\/a>/i);
      const snippetMatch = block.match(/<a[^>]*class=\"result__snippet\"[^>]*>([\s\S]*?)<\/a>/i) ||
                           block.match(/<div[^>]*class=\"result__snippet\"[^>]*>([\s\S]*?)<\/div>/i);

      if (titleMatch) {
        let rawUrl = titleMatch[1];
        const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
        if (uddgMatch) {
          try {
            rawUrl = decodeURIComponent(uddgMatch[1]);
          } catch {}
        }

        const rawTitle = titleMatch[2].replace(/<[^>]+>/g, '').trim();
        const title = decodeHtmlEntities(rawTitle);

        const rawSnippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '';
        const snippet = decodeHtmlEntities(rawSnippet);

        if (title && rawUrl.startsWith('http')) {
          results.push({
            title,
            snippet,
            url: rawUrl
          });
        }
      }
    }

    if (results.length > 0) {
      return results;
    }

    return await fallbackWikipediaSearch(cleanQuery, maxResults);
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[WEB PARSER] Search failed for "${query}":`, err.message);
    return await fallbackWikipediaSearch(cleanQuery, maxResults);
  }
}

/**
 * Fallback open search using Wikipedia Search API (always reliable and open)
 */
async function fallbackWikipediaSearch(query, maxResults = 3) {
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&utf8=1&srlimit=${maxResults}`;
    const res = await fetch(wikiUrl, {
      headers: { 'User-Agent': 'SwissContentStudio/1.0 (contact@swisscontent.local)' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const searchItems = data.query?.search || [];
    return searchItems.map(item => ({
      title: item.title,
      snippet: decodeHtmlEntities(item.snippet.replace(/<[^>]+>/g, '')),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`
    }));
  } catch {
    return [];
  }
}

/**
 * Parses and cleans public webpage content by URL.
 * Extracts title, description, headings, and cleaned main body text.
 */
export async function parseUrlContent(url, maxLength = 6000) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return {
      ok: false,
      error: 'Некорректный URL. Укажите ссылку, начинающуюся с http:// или https://'
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru,en;q=0.9'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: `Веб-страница вернула HTTP ${res.status}: ${res.statusText}`
      };
    }

    const html = await res.text();

    // Extract Title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/<[^>]+>/g, '').trim()) : '';

    // Extract Meta Description
    const descMatch = html.match(/<meta[^>]*name=[\"']description[\"'][^>]*content=[\"']([\s\S]*?)[\"']/i) ||
                      html.match(/<meta[^>]*property=[\"']og:description[\"'][^>]*content=[\"']([\s\S]*?)[\"']/i);
    const description = descMatch ? decodeHtmlEntities(descMatch[1].trim()) : '';

    // Extract Headings (H1, H2, H3)
    const headings = [];
    const hRegex = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let hMatch;
    while ((hMatch = hRegex.exec(html)) !== null && headings.length < 12) {
      const hText = decodeHtmlEntities(hMatch[2].replace(/<[^>]+>/g, '').trim());
      if (hText) headings.push(`H${hMatch[1]}: ${hText}`);
    }

    // Clean body text
    let cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    cleanText = decodeHtmlEntities(cleanText);
    if (cleanText.length > maxLength) {
      cleanText = cleanText.slice(0, maxLength) + '... [контент сокращен]';
    }

    return {
      ok: true,
      url,
      title: title || 'Без названия',
      description,
      headings,
      text: cleanText
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    return {
      ok: false,
      error: isTimeout ? 'Превышено время ожидания загрузки страницы (12s)' : `Ошибка парсинга URL: ${err.message}`
    };
  }
}

/**
 * Formats web search results into a clean markdown block to inject into AI prompts
 */
export function formatSearchResultsForPrompt(results) {
  if (!Array.isArray(results) || results.length === 0) return '';

  const lines = [
    '### АКТУАЛЬНЫЕ ДАННЫЕ ИЗ СЕТИ (LIVE WEB SEARCH):',
    'Используй эти свежие интернет-источники и цитаты для максимальной достоверности и актуальности контента:'
  ];

  results.forEach((item, index) => {
    lines.push(`[${index + 1}] Заголовок: ${item.title}`);
    if (item.snippet) lines.push(`    Цитата / Сниппет: ${item.snippet}`);
    if (item.url) lines.push(`    Источник (URL): ${item.url}`);
  });

  lines.push('---');
  return lines.join('\n');
}

/**
 * Formats parsed webpage content into a markdown block for AI prompt
 */
export function formatUrlContentForPrompt(parsed) {
  if (!parsed || !parsed.ok) return '';

  const lines = [
    `### ДАННЫЕ С РАССМОТРЕННОЙ СТРАНИЦЫ (URL: ${parsed.url}):`,
    `Заголовок страницы: ${parsed.title}`,
    parsed.description ? `Описание: ${parsed.description}` : '',
    parsed.headings?.length > 0 ? `Структура разделов:\n${parsed.headings.join('\n')}` : '',
    `\nТекстовое содержание:\n${parsed.text}`,
    '---'
  ].filter(Boolean);

  return lines.join('\n');
}
