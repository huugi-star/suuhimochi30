import { EXTERNAL_CACHE_VERSION, INFO_HUB_CACHE_KEY, readExternalSnapshot, type ExternalSnapshot, type ExternalFeedDiagnostics } from './externalTopics';
import type { StorageLike } from './conversationTypes';
import { EXTERNAL_CHECK_INTERVAL, externalTopicRevision } from './startupExperience';

export type ExternalInfoState = {
  snapshot: ExternalSnapshot | null; cache: 'NONE' | 'VALID' | 'EXPIRED' | 'INVALID';
  loading: boolean; attemptedAt: string | null; error: string | null;
  attemptDiagnostics?: ExternalFeedDiagnostics;
  checkedAt?: string | null;
  newTopicCount?: number;
};
type ExternalInfoEvent = { phase: 'start'; requestId: number; origin: 'manual' | 'background' | 'monologue' } | { phase: 'complete'; requestId: number; snapshot: ExternalSnapshot | null; success: boolean };
const listeners = new WeakMap<StorageLike, Set<(event: ExternalInfoEvent) => void>>();
const CHECK_KEY = `${INFO_HUB_CACHE_KEY}-checked`;
let requestSequence = 0;
export function subscribeExternalTopics(storage: StorageLike, listener: (event: ExternalInfoEvent) => void) {
  const group = listeners.get(storage) ?? new Set(); group.add(listener); listeners.set(storage, group);
  return () => { group.delete(listener); };
}
function emit(storage: StorageLike, event: ExternalInfoEvent) {
  for (const listener of listeners.get(storage) ?? []) { try { listener(event); } catch { /* Diagnostics cannot break acquisition. */ } }
}
const states = new WeakMap<StorageLike, ExternalInfoState>();
const pending = new WeakMap<StorageLike, Promise<ExternalSnapshot | null>>();
function cachedState(storage: StorageLike, now: Date): ExternalInfoState {
  try {
    const raw = storage.getItem(INFO_HUB_CACHE_KEY);
    if (!raw) return { snapshot: null, cache: 'NONE', loading: false, attemptedAt: null, error: null };
    const data = JSON.parse(raw);
    const valid = readExternalSnapshot(data, now);
    // Historic data is diagnostic-only, never a fresh conversation source.
    const archived = (typeof data?.fetchedAt === 'string' && Number.isFinite(Date.parse(data.fetchedAt))
      ? readExternalSnapshot(data, new Date(data.fetchedAt)) : null) ?? valid;
    return { snapshot: archived, cache: valid ? 'VALID' : archived ? 'EXPIRED' : 'INVALID', loading: false, attemptedAt: null, error: null };
  } catch { return { snapshot: null, cache: 'INVALID', loading: false, attemptedAt: null, error: null }; }
}
export function getExternalInfoState(storage: StorageLike, now = new Date()): ExternalInfoState {
  const saved = states.get(storage);
  const cached = cachedState(storage, now);
  let checkedAt = saved?.checkedAt ?? cached.snapshot?.fetchedAt ?? null;
  try { const value = storage.getItem(CHECK_KEY); if (value && Number.isFinite(Date.parse(value))) checkedAt = value; } catch { /* Optional. */ }
  return { ...(saved ?? cached), snapshot: cached.snapshot, cache: cached.cache, checkedAt };
}

/** Explicit refresh and the one-time v6.4 migration bypass both app caches, never the Worker's Cron. */
export function loadExternalTopics(storage: StorageLike, fetcher: typeof fetch = fetch, now = new Date(), options: { force?: boolean; checkUpdates?: boolean; origin?: 'manual' | 'background' | 'monologue' } = {}): Promise<ExternalSnapshot | null> {
  const active = pending.get(storage);
  if (active) return active;
  const prior = getExternalInfoState(storage, now);
  const cached = readExternalSnapshot(prior.snapshot, now);
  if (options.origin === 'monologue' && cached?.diagnostics?.feeds.some((feed) => feed.status === 'ERROR'
    && feed.retryAt && Date.parse(feed.retryAt) > now.getTime())) return Promise.resolve(cached);
  const migration = Boolean(cached && cached.schemaVersion !== EXTERNAL_CACHE_VERSION);
  const checkDue = !prior.checkedAt || now.getTime() - Date.parse(prior.checkedAt) >= EXTERNAL_CHECK_INTERVAL;
  if (!options.force && !migration && options.checkUpdates && !checkDue) return Promise.resolve(cached);
  if (cached && !options.force && !(options.checkUpdates && checkDue) && (!migration || (prior.attemptedAt && now.getTime() - Date.parse(prior.attemptedAt) < 5 * 60000))) return Promise.resolve(cached);
  const requestId = ++requestSequence;
  try { storage.setItem(CHECK_KEY, now.toISOString()); } catch { /* Optional. */ }
  states.set(storage, { ...prior, loading: true, attemptedAt: now.toISOString(), checkedAt: now.toISOString(), error: null });
  emit(storage, { phase: 'start', requestId, origin: options.origin ?? (options.force ? 'manual' : 'background') });
  const task = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    let error = 'NETWORK';
    let attemptDiagnostics: ExternalFeedDiagnostics | undefined;
    try {
      const response = await fetcher(options.force || migration || options.checkUpdates ? '/api/external-topics?refresh=1' : '/api/external-topics', {
        signal: controller.signal, credentials: 'omit', cache: 'no-store', headers: { accept: 'application/json' },
      });
      if (!response.ok) { error = `HTTP_${response.status}`; throw new Error('Unavailable'); }
      error = 'INVALID_RESPONSE';
      const snapshot = readExternalSnapshot(await response.json(), now);
      if (!snapshot) throw new Error('Invalid public topics');
      attemptDiagnostics = snapshot.diagnostics;
      if (snapshot.diagnostics?.feeds.length && snapshot.diagnostics.feeds.every((feed) => feed.status === 'ERROR')) {
        error = snapshot.diagnostics.feeds.map((feed) => `${feed.endpoint}: ${feed.error ?? 'INVALID_FEED'}`).join(' / ');
        throw new Error('Public sources unavailable');
      }
      // The server may be cold after deployment. A partial success must not erase the device's
      // good topics for the failed endpoint. Successful empty/stopped sources still clear theirs.
      const retained = cached?.topics.filter((topic) => snapshot.diagnostics?.feeds.some((feed) => feed.status === 'ERROR'
        && (feed.endpoint === 'safe-youtube' ? topic.source === 'youtube' : topic.source !== 'youtube'))) ?? [];
      const current = { ...snapshot, schemaVersion: EXTERNAL_CACHE_VERSION,
        topics: [...new Map([...retained, ...snapshot.topics].map((topic) => [topic.id, topic])).values()] };
      if (current.diagnostics && retained.length) {
        const known = new Set(current.diagnostics.items.map((item) => item.topicId));
        current.diagnostics = { ...current.diagnostics, items: [...current.diagnostics.items,
          ...(cached?.diagnostics?.items.filter((item) => retained.some((topic) => topic.id === item.topicId) && !known.has(item.topicId)) ?? [])] };
      }
      const previous = new Set(prior.snapshot?.topics.map(externalTopicRevision) ?? []);
      const newTopicCount = current.topics.filter((topic) => !previous.has(externalTopicRevision(topic))).length;
      try { storage.setItem(INFO_HUB_CACHE_KEY, JSON.stringify(current)); } catch { /* Optional cache. */ }
      states.set(storage, { snapshot: current, cache: 'VALID', loading: false, attemptedAt: now.toISOString(), checkedAt: now.toISOString(), newTopicCount, error: null, attemptDiagnostics });
      emit(storage, { phase: 'complete', requestId, snapshot: current, success: true });
      return current;
    } catch {
      if (!prior.snapshot) { try { storage.removeItem(INFO_HUB_CACHE_KEY); } catch { /* Optional cache. */ } }
      states.set(storage, { ...prior, loading: false, attemptedAt: now.toISOString(), checkedAt: now.toISOString(), error: controller.signal.aborted ? 'TIMEOUT' : error, attemptDiagnostics });
      emit(storage, { phase: 'complete', requestId, snapshot: cached, success: false });
      return cached;
    } finally { clearTimeout(timer); }
  })();
  pending.set(storage, task);
  void task.finally(() => pending.delete(storage));
  return task;
}
