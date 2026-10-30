import { EXTERNAL_CACHE_VERSION, externalExpiry, INFO_HUB_ORIGIN, inspectHubFeed, normalizeHubFeed, readExternalSnapshot, type ExternalSnapshot, type ExternalFeedDiagnostics } from './externalTopics';
import { INFO_HUB_RETRY_MS, publicResponseFailure } from './infoHubFailure';

export function isPublicTopicsRefresh(request?: Request) {
  return Boolean(request && new URL(request.url).searchParams.get('refresh') === '1');
}

/** Fixed public endpoints only. Neither the request URL nor user data is forwarded. */
export function createInfoHubService(fetcher: typeof fetch = fetch, clock = () => new Date(), timeoutMs = 4500) {
  let cache: ExternalSnapshot | null = null;
  let pending: Promise<ExternalSnapshot> | null = null;
  let retryAt = 0;
  let lastFailure: ExternalSnapshot | null = null;
  const failures = new Map<string, ExternalFeedDiagnostics['feeds'][number]>();
  return async function getPublicTopics(options: { forceRefresh?: boolean } = {}): Promise<ExternalSnapshot> {
    const now = clock();
    const cached = readExternalSnapshot(cache, now);
    if (!options.forceRefresh && now.getTime() < retryAt) {
      if (cached) return cached;
      if (lastFailure) return lastFailure;
    }
    if (pending) return pending;
    pending = (async () => {
      let failed = false;
      const diagnostics: ExternalFeedDiagnostics = { feeds: [], items: [] };
      const feeds = await Promise.all(['safe-trends', 'safe-youtube'].map(async (endpoint) => {
        const priorFailure = failures.get(endpoint);
        if (priorFailure?.retryAt && Date.parse(priorFailure.retryAt) > now.getTime()) {
          failed = true; diagnostics.feeds.push({ ...priorFailure }); return [];
        }
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        let error = 'NETWORK';
        try {
          const response = await fetcher(`${INFO_HUB_ORIGIN}/${endpoint}`, {
            signal: controller.signal, redirect: 'error', cache: 'no-store', headers: { accept: 'application/json' },
          });
          if (!response.ok) {
            const metadata = await publicResponseFailure(response, now);
            const report = { endpoint: endpoint as 'safe-trends' | 'safe-youtube', fetchedAt: now.toISOString(), updatedAt: null,
              status: 'ERROR' as const, received: 0, ...metadata };
            failed = true; failures.set(endpoint, report); diagnostics.feeds.push(report); return [];
          }
          const text = await response.text();
          if (text.length > 1000000) { error = 'TOO_LARGE'; throw new Error('Public feed too large'); }
          error = 'INVALID_JSON';
          const payload: unknown = JSON.parse(text);
          const report = inspectHubFeed(payload, endpoint as 'safe-trends' | 'safe-youtube', now);
          diagnostics.feeds.push(...report.feeds); diagnostics.items.push(...report.items);
          failures.delete(endpoint);
          if (report.feeds.some((feed) => feed.status === 'ERROR')) failed = true;
          return normalizeHubFeed(payload, endpoint as 'safe-trends' | 'safe-youtube', now);
        } catch {
          failed = true;
          const report = { endpoint: endpoint as 'safe-trends' | 'safe-youtube', fetchedAt: now.toISOString(), updatedAt: null,
            status: 'ERROR' as const, received: 0, error: controller.signal.aborted ? 'TIMEOUT' : error, retryAt: new Date(now.getTime() + INFO_HUB_RETRY_MS).toISOString() };
          failures.set(endpoint, report); diagnostics.feeds.push(report);
          return [];
        }
        finally { clearTimeout(timer); }
      }));
      diagnostics.feeds.sort((a, b) => a.endpoint.localeCompare(b.endpoint));
      diagnostics.items.sort((a, b) => a.id.localeCompare(b.id));
      for (const report of diagnostics.feeds) {
        const previous = cached?.diagnostics?.feeds.find((feed) => feed.endpoint === report.endpoint);
        report.lastSuccessAt = report.status === 'OK' ? now.toISOString() : previous?.lastSuccessAt ?? (previous?.status === 'OK' ? previous.fetchedAt : null);
      }
      if (diagnostics.feeds.every((feed) => feed.status === 'ERROR')) {
        // Do not replace a previously successful server cache with a failed/empty acquisition.
        retryAt = now.getTime() + 5 * 60000;
        lastFailure = { fetchedAt: now.toISOString(), expiresAt: new Date(Math.min(Date.parse(externalExpiry(now)), retryAt)).toISOString(), topics: [], diagnostics, schemaVersion: EXTERNAL_CACHE_VERSION };
        return lastFailure;
      }
      const retained = cached?.topics.filter((topic) => diagnostics.feeds.some((feed) => feed.status === 'ERROR'
        && (feed.endpoint === 'safe-youtube' ? topic.source === 'youtube' : topic.source !== 'youtube'))) ?? [];
      for (const topic of retained) {
        const prior = cached?.diagnostics?.items.find((item) => item.topicId === topic.id);
        if (prior) diagnostics.items.push(prior);
      }
      cache = { fetchedAt: now.toISOString(), expiresAt: externalExpiry(now), topics: [...feeds.flat(), ...retained], diagnostics, schemaVersion: EXTERNAL_CACHE_VERSION };
      lastFailure = null;
      // Empty/blocked successes remove earlier data; failed sources retain only valid cached topics.
      retryAt = failed ? now.getTime() + 5 * 60000 : Date.parse(cache.expiresAt);
      return cache;
    })();
    try { return await pending; } finally { pending = null; }
  };
}

export const getPublicTopics = createInfoHubService();
