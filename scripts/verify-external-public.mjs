import assert from 'node:assert/strict';
import { createServer } from 'vite';
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  const { createInfoHubService } = await vite.ssrLoadModule('/lib/infoHubServer.ts');
  const { loadExternalTopics, getExternalInfoState } = await vite.ssrLoadModule('/lib/externalInfoClient.ts');
  const { INFO_HUB_CACHE_KEY, evaluateExternalTopics } = await vite.ssrLoadModule('/lib/externalTopics.ts');
  const now = new Date();
  const service = createInfoHubService(fetch, () => now, 15000);
  const snapshot = await service({ forceRefresh: true });
  const values = new Map(); const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  // Simulate a pre-v6.4 zero-trend cache. These are isolated test values, not the user's game data.
  const legacy = { ...snapshot, topics: snapshot.topics.filter((topic) => topic.source === 'youtube') }; delete legacy.schemaVersion;
  storage.setItem(INFO_HUB_CACHE_KEY, JSON.stringify(legacy)); storage.setItem('test-game-data', JSON.stringify({ diary: ['保持'], experience: 12, conversationCount: 3 }));
  const before = storage.getItem('test-game-data');
  const result = await loadExternalTopics(storage, async (url, init) => {
    assert.equal(url, '/api/external-topics?refresh=1');
    if (process.env.SUUHIMOCHI_TEST_URL) return fetch(new URL(url, process.env.SUUHIMOCHI_TEST_URL), init);
    return Response.json(snapshot);
  }, now, { force: true });
  assert.ok(result); assert.equal(storage.getItem('test-game-data'), before);
  const cached = getExternalInfoState(storage, now).snapshot;
  const words = ['google', 'wikipedia', 'youtube'].flatMap((source) => {
    const topic = cached.topics.find((topic) => topic.source === source && topic.title.length >= 2 && topic.title.length <= 30);
    return topic ? [{ id: `verification-only-${source}`, surface: topic.title, category: topic.category, subcategory: topic.subcategory }] : [];
  });
  const assessments = evaluateExternalTopics({ topics: cached.topics, words, relations: [], history: [], now, day: 2 }).assessments;
  const rows = ['google', 'wikipedia', 'youtube'].map((source) => {
    const feed = result.diagnostics?.feeds.find((feed) => feed.endpoint === (source === 'youtube' ? 'safe-youtube' : 'safe-trends'));
    const items = result.diagnostics?.items.filter((item) => item.source === source) ?? [];
    return { source, published: feed?.published?.[source] ?? null, received: feed?.sourceCounts?.[source] ?? 0,
      converted: result.topics.filter((topic) => topic.source === source).length,
      saved: cached.topics.filter((topic) => topic.source === source).length,
      candidatesWithVerificationWords: assessments.filter((row) => row.candidate && row.topic.source === source).length,
      candidatesWithEmptyDictionary: 0,
      excluded: items.filter((item) => item.status !== 'ACCEPTED').map((item) => ({ title: item.title, reason: item.reason })),
      dataDates: [...new Set(cached.topics.filter((topic) => topic.source === source).map((topic) => topic.dataDate).filter(Boolean))],
    };
  });
  console.log(JSON.stringify({ checkedAt: now.toISOString(), mode: process.env.SUUHIMOCHI_TEST_URL ? 'live public APIs + built application API + isolated cache' : 'live public APIs + converter + isolated cache',
    fetchedAt: result.fetchedAt, feeds: result.diagnostics?.feeds, verificationWords: words.map((word) => word.surface), rows, gameDataUnchanged: before === storage.getItem('test-game-data') }, null, 2));
  assert.ok(result.diagnostics?.feeds.every((feed) => feed.status === 'OK'), 'Public feed failed; report partial results above, do not claim success');
} finally { await vite.close(); }
