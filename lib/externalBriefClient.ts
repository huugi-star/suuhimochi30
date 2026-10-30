import { parseExternalBriefFeed, type ExternalBriefFeed } from './externalBriefs';
import type { StorageLike } from './conversationTypes';
import { INFO_HUB_RETRY_MS, publicResponseFailure, sanitizeInfoHubFailure, type InfoHubFailure } from './infoHubFailure';

export const BRIEF_CACHE_KEY = 'suuhimochi-external-briefs-v1';
export const BRIEF_STATUS_KEY = `${BRIEF_CACHE_KEY}-status`;
export type BriefInfoState = { attemptedAt: string | null; lastSuccessAt: string | null; failure: InfoHubFailure | null };
export function getBriefInfoState(storage: StorageLike): BriefInfoState {
  try {
    const row = JSON.parse(storage.getItem(BRIEF_STATUS_KEY) ?? 'null');
    const time = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;
    return { attemptedAt: time(row?.attemptedAt), lastSuccessAt: time(row?.lastSuccessAt), failure: sanitizeInfoHubFailure(row?.failure) };
  } catch { return { attemptedAt: null, lastSuccessAt: null, failure: null }; }
}
function saveStatus(storage: StorageLike, value: BriefInfoState) { try { storage.setItem(BRIEF_STATUS_KEY, JSON.stringify(value)); } catch { /* Optional diagnostics. */ } }
const pending = new WeakMap<StorageLike, Promise<ExternalBriefFeed | null>>();
export function freshBriefFeed(feed: ExternalBriefFeed, now: Date) {
  const age = now.getTime() - Date.parse(feed.updatedAt ?? '');
  return Number.isFinite(age) && age >= -300000 && age < 36 * 3600000;
}
export function readBriefCache(storage: StorageLike, now = new Date()): ExternalBriefFeed | null {
  try { const feed = parseExternalBriefFeed(JSON.parse(storage.getItem(BRIEF_CACHE_KEY) ?? 'null')); return freshBriefFeed(feed, now) ? feed : null; }
  catch { return null; }
}
/** Fixed app proxy, public data only. Failed refreshes never overwrite a good cache. */
export function loadExternalBriefs(storage: StorageLike, fetcher: typeof fetch = fetch, now = new Date()): Promise<ExternalBriefFeed | null> {
  const active = pending.get(storage); if (active) return active;
  const previous = getBriefInfoState(storage);
  if (previous.failure?.retryAt && Date.parse(previous.failure.retryAt) > now.getTime()) return Promise.resolve(readBriefCache(storage, now));
  const task = (async () => {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 6000);
    let failure: InfoHubFailure = { error: 'NETWORK' };
    try {
      const response = await fetcher('/api/external-briefs', { signal: controller.signal, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', headers: { accept: 'application/json' } });
      if (!response.ok) { failure = await publicResponseFailure(response, now); throw new Error('Public feed unavailable'); }
      failure = { error: 'INVALID_RESPONSE' };
      const feed = parseExternalBriefFeed(await response.json());
      saveStatus(storage, { attemptedAt: now.toISOString(), lastSuccessAt: now.toISOString(), failure: null });
      if (!freshBriefFeed(feed, now)) { try { storage.removeItem(BRIEF_CACHE_KEY); } catch { /* Optional. */ } return null; }
      try { storage.setItem(BRIEF_CACHE_KEY, JSON.stringify(feed)); } catch { /* Optional cache. */ }
      return feed;
    } catch {
      saveStatus(storage, { ...previous, attemptedAt: now.toISOString(), failure: { ...failure,
        error: controller.signal.aborted ? 'TIMEOUT' : failure.error, retryAt: failure.retryAt ?? new Date(now.getTime() + INFO_HUB_RETRY_MS).toISOString() } });
      return readBriefCache(storage, now);
    } finally { clearTimeout(timer); }
  })();
  pending.set(storage, task); void task.finally(() => pending.delete(storage)); return task;
}
