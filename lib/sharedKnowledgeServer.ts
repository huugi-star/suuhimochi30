import { INFO_HUB_ORIGIN } from './externalTopics';
import { object, parseSharedDialogues, safeSharedKeyword, SHARED_REFRESH_MS } from './sharedKnowledge';

/** Read-only bridge. A request cannot supply an upstream URL, dictionary, category, or free-form body. */
export function createSharedKnowledgeService(fetcher: typeof fetch = fetch, now = () => new Date(), timeoutMs = 5000) {
  type Dictionary = { keywords: string[]; fetchedAt: string };
  let cache: Dictionary | null = null;
  let pending: Promise<Dictionary> | null = null;
  let retryAt = 0;
  async function getJSON(path: string) {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetcher(`${INFO_HUB_ORIGIN}${path}`, { signal: controller.signal, redirect: 'error', credentials: 'omit', cache: 'no-store', headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      const text = await response.text(); if (text.length > 1000000) throw new Error('TOO_LARGE');
      return JSON.parse(text) as unknown;
    } catch { throw new Error(controller.signal.aborted ? 'TIMEOUT' : 'SHARED_UNAVAILABLE'); }
    finally { clearTimeout(timer); }
  }
  async function dictionary(): Promise<{ keywords: string[]; fetchedAt: string }> {
    if (cache && (now().getTime() - Date.parse(cache.fetchedAt) < SHARED_REFRESH_MS || now().getTime() < retryAt)) return cache;
    if (now().getTime() < retryAt) throw new Error('SHARED_UNAVAILABLE');
    if (pending) return pending;
    pending = (async () => {
      const words = new Set<string>(); let offset = 0;
      for (let page = 0; page < 252; page++) {
        const data = object(await getJSON(`/shared-dictionary?limit=200&offset=${offset}`));
        if (data?.status !== 'OK' || !Array.isArray(data.keywords) || data.keywords.length > 200) throw new Error('SHARED_UNAVAILABLE');
        for (const keyword of data.keywords) if (safeSharedKeyword(keyword)) words.add(keyword);
        if (data.nextOffset === null) return { keywords: [...words], fetchedAt: now().toISOString() };
        if (!Number.isInteger(data.nextOffset) || (data.nextOffset as number) <= offset || (data.nextOffset as number) > 50000) throw new Error('INVALID_CURSOR');
        offset = data.nextOffset as number;
      }
      throw new Error('TOO_MANY_PAGES');
    })();
    try { cache = await pending; return cache; }
    catch { retryAt = now().getTime() + 5 * 60000; if (cache) return cache; throw new Error('SHARED_UNAVAILABLE'); }
    finally { pending = null; }
  }
  async function dialogues(keyword: string) {
    if (!safeSharedKeyword(keyword)) return [];
    // Second allowlist gate, independent of the browser's claims or category.
    const allowed = await dictionary(); if (!allowed.keywords.includes(keyword)) return [];
    const data = object(await getJSON(`/shared-dialogues?keyword=${encodeURIComponent(keyword)}`));
    if (data?.status !== 'OK' || data.keyword !== keyword || !Array.isArray(data.items)) throw new Error('SHARED_UNAVAILABLE');
    return parseSharedDialogues(data, keyword);
  }
  return { dictionary, dialogues };
}
export const sharedKnowledgeService = createSharedKnowledgeService();
