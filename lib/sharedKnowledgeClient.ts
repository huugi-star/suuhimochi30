import type { StorageLike } from './conversationTypes';
import { object, parseSharedDialogues, readSharedPreference, readSharedDictionary, readSharedDialogueCaches, safeSharedKeyword,
  SHARED_DICTIONARY_KEY, SHARED_DIALOGUES_KEY, SHARED_REFRESH_MS, SHARED_REQUEST_LIMIT, type SharedDialogueCache, type SharedDictionary } from './sharedKnowledge';

const inFlight = new WeakMap<StorageLike, Promise<void>>();
const retryAt = new WeakMap<StorageLike, number>();
export type SharedKnowledgeResult = { dictionary: SharedDictionary | null; caches: SharedDialogueCache[]; error: string | null };
export function getSharedKnowledgeCache(storage: StorageLike): SharedKnowledgeResult {
  return { dictionary: readSharedDictionary(storage), caches: readSharedDialogueCaches(storage), error: null };
}
/** Only surfaces are read locally. No WordEntry, IDs, descriptions, category, feelings or logs cross this boundary. */
export async function loadSharedKnowledge(storage: StorageLike, surfaces: readonly string[], fetcher: typeof fetch = fetch, now = new Date(), signal?: AbortSignal, options: { forceDialogues?: boolean } = {}): Promise<SharedKnowledgeResult> {
  if (!readSharedPreference(storage).enabled) return { dictionary: null, caches: [], error: null };
  const current = inFlight.get(storage); if (current) { await current; return loadSharedKnowledge(storage, surfaces, fetcher, now, signal, options); }
  const result = getSharedKnowledgeCache(storage);
  if (now.getTime() < (retryAt.get(storage) ?? 0)) return { ...result, error: 'SHARED_UNAVAILABLE' };
  const enabled = () => readSharedPreference(storage).enabled && !signal?.aborted;
  const getJSON = async (path: string) => {
    if (!enabled()) throw new Error('DISABLED');
    const controller = new AbortController(); const abort = () => controller.abort(); signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, 6000);
    try {
      const response = await fetcher(path, { signal: controller.signal, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', headers: { accept: 'application/json', 'x-shared-knowledge-consent': '1' } });
      if (!enabled() || !response.ok) throw new Error('SHARED_UNAVAILABLE');
      const text = await response.text(); if (text.length > 1000000) throw new Error('TOO_LARGE');
      return JSON.parse(text) as unknown;
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  };
  const task = (async () => {
    let dictionary = result.dictionary;
    try {
      if (!dictionary || now.getTime() - Date.parse(dictionary.fetchedAt) >= SHARED_REFRESH_MS) {
        try {
          const keywords = new Set<string>(); let offset = 0; let complete = false;
          for (let page = 0; page < 252; page++) {
            const data = object(await getJSON(`/api/shared-knowledge/dictionary?limit=200&offset=${offset}`));
            if (data?.status !== 'OK' || !Array.isArray(data.keywords) || data.keywords.length > 200) throw new Error('INVALID_DICTIONARY');
            for (const keyword of data.keywords) if (safeSharedKeyword(keyword)) keywords.add(keyword);
            if (data.nextOffset === null) { complete = true; break; }
            if (!Number.isInteger(data.nextOffset) || (data.nextOffset as number) <= offset || (data.nextOffset as number) > 50000) throw new Error('INVALID_CURSOR');
            offset = data.nextOffset as number;
          }
          if (!complete || !enabled()) throw new Error('INCOMPLETE_DICTIONARY');
          dictionary = { fetchedAt: now.toISOString(), keywords: [...keywords] };
          storage.setItem(SHARED_DICTIONARY_KEY, JSON.stringify(dictionary));
        } catch { if (enabled()) { result.error = 'SHARED_DICTIONARY_UNAVAILABLE'; retryAt.set(storage, now.getTime() + 5 * 60000); } }
      }
      if (!dictionary || !enabled()) return;
      result.dictionary = dictionary;
      const allowed = new Set(dictionary.keywords);
      let caches = result.caches.filter((cache) => allowed.has(cache.keyword));
      // Exact equality, with no NFKC/case folding/substring/fuzzy matching or category evidence.
      const matches = [...new Set(surfaces)].filter((word) => safeSharedKeyword(word) && allowed.has(word));
      let requests = 0;
      for (const keyword of matches) {
        const previous = caches.find((cache) => cache.keyword === keyword);
        if (previous && !options.forceDialogues && now.getTime() - Date.parse(previous.fetchedAt) < SHARED_REFRESH_MS) continue;
        if (!enabled() || requests++ >= SHARED_REQUEST_LIMIT) break;
        try {
          const data = await getJSON(`/api/shared-knowledge/dialogues?keyword=${encodeURIComponent(keyword)}`);
          if (object(data)?.status !== 'OK' || object(data)?.keyword !== keyword || !Array.isArray(object(data)?.items)) throw new Error('SHARED_UNAVAILABLE');
          const items = parseSharedDialogues(data, keyword);
          caches = [...caches.filter((cache) => cache.keyword !== keyword), { keyword, fetchedAt: now.toISOString(), items }].slice(-100);
        } catch { if (enabled()) { result.error = 'SHARED_DIALOGUES_UNAVAILABLE'; retryAt.set(storage, now.getTime() + 5 * 60000); } }
      }
      if (enabled()) { storage.setItem(SHARED_DIALOGUES_KEY, JSON.stringify(caches)); result.caches = caches; }
    } catch { result.error = 'SHARED_UNAVAILABLE'; }
  })();
  inFlight.set(storage, task);
  try { await task; } finally { inFlight.delete(storage); }
  return enabled() ? result : { dictionary: null, caches: [], error: null };
}
