import { INFO_HUB_ORIGIN } from './externalTopics';
import { parseExternalBriefFeed, type ExternalBriefFeed } from './externalBriefs';
import { INFO_HUB_RETRY_MS, publicResponseFailure, type InfoHubFailure } from './infoHubFailure';

export function createBriefService(fetcher: typeof fetch = fetch, clock = () => new Date(), timeoutMs = 4500) {
  let pending: Promise<{ feed?: ExternalBriefFeed; diagnostic?: InfoHubFailure }> | null = null;
  let failure: InfoHubFailure | null = null;
  return async () => {
    const now = clock();
    if (failure?.retryAt && Date.parse(failure.retryAt) > now.getTime()) return { diagnostic: failure };
    if (pending) return pending;
    pending = (async () => {
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeoutMs);
      let error = 'NETWORK';
      try {
        const response = await fetcher(`${INFO_HUB_ORIGIN}/safe-briefs`, { signal: controller.signal, redirect: 'error', cache: 'no-store', headers: { accept: 'application/json' } });
        if (!response.ok) { failure = await publicResponseFailure(response, now); return { diagnostic: failure }; }
        const text = await response.text(); error = 'TOO_LARGE'; if (text.length > 3000000) throw new Error('Invalid public feed');
        error = 'INVALID_JSON'; const raw = JSON.parse(text); error = 'INVALID_FEED';
        const feed = parseExternalBriefFeed(raw?.stale === true || raw?.enabled === false || raw?.published === false
          ? { schemaVersion: 1, updatedAt: null, items: [] } : raw);
        failure = null; return { feed };
      } catch {
        failure = { error: controller.signal.aborted ? 'TIMEOUT' : error, retryAt: new Date(now.getTime() + INFO_HUB_RETRY_MS).toISOString() };
        return { diagnostic: failure };
      } finally { clearTimeout(timer); }
    })();
    try { return await pending; } finally { pending = null; }
  };
}
// Resolve fetch at call time too, so tests and runtime instrumentation use the same public proxy.
export const getPublicBriefs = createBriefService((input, init) => fetch(input, init));
