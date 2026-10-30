import assert from 'node:assert/strict';
import { createServer } from 'vite';
process.env.TZ = 'Asia/Tokyo';
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false }, appType: 'custom' });
const memory = () => { const values = new Map(); return { values, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }; };
let passed = 0;
const check = async (name, test) => { await test(); passed++; console.log('PASS', name); };
try {
  const api = await vite.ssrLoadModule('/lib/externalTopics.ts');
  const { createInfoHubService, isPublicTopicsRefresh } = await vite.ssrLoadModule('/lib/infoHubServer.ts');
  const { getExternalInfoState, loadExternalTopics } = await vite.ssrLoadModule('/lib/externalInfoClient.ts');
  const { buildExternalMonitor } = await vite.ssrLoadModule('/lib/externalTopicMonitor.ts');
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const now = new Date('2026-10-19T16:00:00+09:00');
  const google = (index) => ({ source: 'google_trending_now', title: `Google話題${index}`, categoryId: 'SPORTS', subcategoryId: null, relatedTo: ['サッカー'] });
  const wiki = (index) => ({ source: 'wikipedia_pageviews', title: `Wikipedia記事${index}`, categoryId: 'PERSON', subcategoryId: null,
    sourceUrl: `https://ja.wikipedia.org/wiki/Test${index}`, dataDate: '2026-10-15' });
  const trends = { source: 'Google Trends Trending Now', updatedAt: now.toISOString(), wikipediaUpdatedAt: now.toISOString(), stale: false,
    sourceCounts: { google: 250, wikipedia: 30 }, count: 280,
    items: [...Array.from({ length: 250 }, (_, i) => google(i)), ...Array.from({ length: 30 }, (_, i) => wiki(i))] };
  const youtube = { source: 'YouTube', updatedAt: now.toISOString(), count: 1, items: [{ source: 'youtube', videoId: 'aaaaaaaaaaa', title: 'マインクラフトの動画',
    categoryId: 'GAME_MEDIA', subcategoryId: 'GAME_MEDIA_3', publishedAt: now.toISOString(), url: 'https://www.youtube.com/watch?v=aaaaaaaaaaa' }] };
  const service = createInfoHubService(async (url) => Response.json(url.endsWith('safe-youtube') ? youtube : trends), () => now);
  const snapshot = await service();
  await check('v6.4のID・URL・未確定中カテゴリーを受け入れ、250件の後のWikipedia30件も残す', () => {
    assert.equal(snapshot.topics.filter((topic) => topic.source === 'google').length, 250);
    assert.equal(snapshot.topics.filter((topic) => topic.source === 'wikipedia').length, 30);
    assert.equal(snapshot.topics.filter((topic) => topic.source === 'youtube').length, 1);
    assert.equal(snapshot.topics.find((topic) => topic.source === 'google').category, 'SPORTS');
    assert.equal(snapshot.topics.find((topic) => topic.source === 'wikipedia').category, 'PERSON');
    assert.equal(snapshot.topics.every((topic) => topic.source === 'youtube' || topic.subcategory === null), true);
  });
  await check('Wikipediaの集計対象日は更新時刻と別に保存し、古いフィード自体は除外する', () => {
    assert.equal(snapshot.topics.find((topic) => topic.source === 'wikipedia').dataDate, '2026-10-15');
    assert.equal(api.normalizeHubFeed({ ...trends, wikipediaUpdatedAt: '2026-10-15T00:00:00Z' }, 'safe-trends', now).filter((topic) => topic.source === 'wikipedia').length, 0);
    assert.equal(api.normalizeHubFeed({ ...trends, stale: true }, 'safe-trends', now).length, 0);
  });
  await check('Wikipediaの旧PERSON_5は既存の広い互換IDに対応し、職業を推測しない', () => {
    const topics = api.normalizeHubFeed({ ...trends, items: [{ ...wiki(1), subcategoryId: 'PERSON_5' }] }, 'safe-trends', now);
    assert.equal(topics[0].category, 'PERSON'); assert.equal(topics[0].subcategory, 'PERSON_LEGACY_FAMOUS');
    assert.equal(api.readExternalSnapshot({ ...snapshot, topics }, now).topics[0].subcategory, 'PERSON_LEGACY_FAMOUS');
  });
  await check('情報源別上限・重複除去で他情報源を押し出さず、端末再読込でも維持する', () => {
    const many = { ...trends, items: [...Array.from({ length: 3300 }, (_, i) => google(i)), ...trends.items, ...Array.from({ length: 30 }, (_, i) => wiki(i))] };
    const topics = api.normalizeHubFeed(many, 'safe-trends', now);
    assert.equal(topics.filter((topic) => topic.source === 'google').length, api.MAX_SOURCE_TOPICS);
    assert.equal(topics.filter((topic) => topic.source === 'wikipedia').length, 30);
    const restored = api.readExternalSnapshot({ ...snapshot, topics: [...topics, ...snapshot.topics.filter((topic) => topic.source === 'youtube')] }, now);
    assert.equal(restored.topics.length, 531);
    const report = api.inspectHubFeed(many, 'safe-trends', now);
    assert.ok(report.items.some((item) => item.reason === 'SOURCE_LIMIT')); assert.ok(report.items.some((item) => item.reason === 'DUPLICATE'));
  });
  await check('明示的な関連語だけで照合し、中カテゴリー未確定を勝手に補完しない', () => {
    const storage = memory(); const talk = new SuuhimochiConversation({ storage, now: () => now, random: () => 0 });
    talk.setGoal('試す'); talk.startWordTeaching(); talk.submit('サッカー'); talk.chooseCategory('SPORTS'); talk.chooseSubCategory('SPORTS_1'); talk.choose('WORD_INTERESTED');
    // A common-knowledge word need not be stored by the teaching fixture; use an explicit minimal known-word input here.
    const word = { id: 'known-soccer', surface: 'サッカー', category: 'SPORTS', subcategory: 'SPORTS_1' };
    const result = api.evaluateExternalTopics({ topics: snapshot.topics, words: [word], relations: [], history: [], now, day: 1 });
    assert.equal(result.assessments.filter((row) => row.candidate).length, 250);
    assert.equal(result.selected.topic.subcategory, null);
  });
  await check('0件の旧端末・日次サーバーキャッシュを明示再取得で更新し、通常時は再利用する', async () => {
    let live = false; let calls = 0;
    const server = createInfoHubService(async (url) => { calls++; return Response.json(url.endsWith('safe-youtube') ? youtube : live ? trends : { ...trends, items: [], sourceCounts: { google: 0, wikipedia: 0 } }); }, () => now);
    const storage = memory(); const old = await server(); delete old.schemaVersion; storage.setItem(api.INFO_HUB_CACHE_KEY, JSON.stringify(old));
    live = true;
    assert.equal((await server()).topics.length, 1);
    const fetcher = async (url) => { assert.equal(url, '/api/external-topics?refresh=1'); return Response.json(await server({ forceRefresh: true })); };
    const updated = await loadExternalTopics(storage, fetcher, now);
    assert.equal(updated.topics.length, 281); assert.equal(updated.schemaVersion, api.EXTERNAL_CACHE_VERSION); assert.equal(calls, 4);
    assert.equal((await loadExternalTopics(storage, async () => { throw new Error('should use cache'); }, now)).topics.length, 281);
    assert.equal(calls, 4);
  });
  await check('APIルートはrefresh=1だけを認識し、任意のURLや値を転送しない', () => {
    assert.equal(isPublicTopicsRefresh(), false);
    assert.equal(isPublicTopicsRefresh(new Request('http://local/api/external-topics')), false);
    assert.equal(isPublicTopicsRefresh(new Request('http://local/api/external-topics?refresh=1')), true);
    assert.equal(isPublicTopicsRefresh(new Request('http://local/api/external-topics?refresh=true&url=https://evil.test')), false);
  });
  await check('失敗時は正常な端末キャッシュとサーバーキャッシュを保持する', async () => {
    const storage = memory(); const raw = JSON.stringify(snapshot); storage.setItem(api.INFO_HUB_CACHE_KEY, raw);
    assert.equal((await loadExternalTopics(storage, async () => new Response('', { status: 503 }), now, { force: true })).topics.length, 281);
    assert.equal(storage.getItem(api.INFO_HUB_CACHE_KEY), raw);
    let failed = false; const server = createInfoHubService(async (url) => { if (failed) throw new Error('offline'); return Response.json(url.endsWith('safe-youtube') ? youtube : trends); }, () => now);
    await server(); failed = true; await server({ forceRefresh: true }); assert.equal((await server()).topics.length, 281);
  });
  await check('モニターで公開・受信・変換・保存・候補の各情報源別件数とエラーを区別する', async () => {
    const storage = memory(); storage.setItem(api.INFO_HUB_CACHE_KEY, JSON.stringify(snapshot));
    const talk = new SuuhimochiConversation({ storage, now: () => now, random: () => 0 });
    const before = [...storage.values].filter(([key]) => key !== api.INFO_HUB_CACHE_KEY);
    const model = buildExternalMonitor(getExternalInfoState(storage, now), talk, now);
    assert.deepEqual(model.stages.map((stage) => [stage.source, stage.published, stage.received, stage.converted, stage.saved, stage.candidates]),
      [['google', 250, 250, 250, 250, 250], ['wikipedia', 30, 30, 30, 30, 30], ['youtube', 1, 1, 1, 1, 1]]);
    await loadExternalTopics(storage, async () => new Response('', { status: 502 }), now, { force: true });
    assert.equal(buildExternalMonitor(getExternalInfoState(storage, now), talk, now).stages[0].lastError, 'HTTP_502');
    assert.deepEqual([...storage.values].filter(([key]) => key !== api.INFO_HUB_CACHE_KEY && key !== `${api.INFO_HUB_CACHE_KEY}-checked`), before);
  });
  await check('公開0件と変換全件除外を区別し、安全性検証は緩めない', () => {
    const empty = api.inspectHubFeed({ ...trends, items: [], sourceCounts: { google: 0, wikipedia: 0 } }, 'safe-trends', now);
    assert.equal(empty.feeds[0].published.google, 0);
    const invalid = api.inspectHubFeed({ ...trends, items: [{ ...google(0), categoryId: '__proto__' }, { ...wiki(0), sourceUrl: 'javascript:alert(1)' }] }, 'safe-trends', now);
    assert.deepEqual(invalid.items.map((item) => item.reason), ['INVALID_CATEGORY', 'INVALID_URL']);
  });
  console.log(`External v6.4: ${passed} passed`);
} finally { await vite.close(); }
