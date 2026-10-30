import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { NOW, brief, feed } from './fixtures/external-monologues.mjs';
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
const memory = () => { const data = new Map(); return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) }; };
const resourceError = () => Response.json({ cloudflare_error: true, error_code: 1102, ray_id: 'a50072f17e138340', detail: 'SECRET RESPONSE BODY' }, { status: 503 });
let passed = 0; const check = async (name, fn) => { await fn(); passed++; console.log('PASS', name); };
try {
  const t = await vite.ssrLoadModule('/lib/externalTopics.ts'), m = await vite.ssrLoadModule('/lib/externalMonologues.ts');
  const c = await vite.ssrLoadModule('/lib/externalInfoClient.ts'), b = await vite.ssrLoadModule('/lib/externalBriefClient.ts');
  const { createInfoHubService } = await vite.ssrLoadModule('/lib/infoHubServer.ts');
  const { createBriefService } = await vite.ssrLoadModule('/lib/infoHubBriefServer.ts');
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const now = new Date(NOW);
  const rawVideo = (i) => ({ source: 'youtube', videoId: `degraded${String(i).padStart(3, '0')}`, url: `https://www.youtube.com/watch?v=degraded${String(i).padStart(3, '0')}`, title: `話題${i}・長い動画のタイトルからも違う名前を見つける`, categoryId: 'GAME_MEDIA', subcategoryId: 'GAME_MEDIA_3', publishedAt: NOW });
  const youtube = { updatedAt: NOW, count: 50, items: Array.from({ length: 50 }, (_, i) => rawVideo(i)) };
  const trends = { updatedAt: NOW, items: [{ source: 'google_trending_now', title: '将棋', categoryId: 'SPORTS' },
    { source: 'wikipedia_pageviews', title: '将棋', categoryId: 'SPORTS', sourceUrl: 'https://ja.wikipedia.org/wiki/将棋' }] };
  const videoTopics = t.normalizeHubFeed(youtube, 'safe-youtube', now), trendTopics = t.normalizeHubFeed(trends, 'safe-trends', now);
  const snapshot = { schemaVersion: 2, fetchedAt: NOW, expiresAt: t.externalExpiry(now), topics: [...trendTopics, ...videoTopics] };
  await check('Worker 1102を特定し、Google/Wikipediaが失敗しても正常なYouTubeと有効キャッシュを維持する', async () => {
    let fail = false, clock = now; const calls = { trends: 0, youtube: 0 };
    const server = createInfoHubService(async (url) => {
      if (url.endsWith('safe-trends')) { calls.trends++; return fail ? resourceError() : Response.json(trends); }
      calls.youtube++; return Response.json(youtube);
    }, () => clock);
    await server(); fail = true; const partial = await server({ forceRefresh: true });
    assert.equal(partial.topics.length, 52); const error = partial.diagnostics.feeds.find((row) => row.endpoint === 'safe-trends');
    assert.equal(error.error, 'HTTP_503'); assert.equal(error.cloudflareCode, 1102); assert.equal(error.upstreamStatus, 503);
    assert.equal(error.rayId, 'a50072f17e138340'); assert.ok(!JSON.stringify(partial).includes('SECRET RESPONSE BODY'));
    for (let i = 0; i < 4; i++) await server({ forceRefresh: true });
    assert.equal(calls.trends, 2, '1102は強制更新でも1時間再試行しない');
    clock = new Date(now.getTime() + 6 * 60000); assert.equal((await server({ forceRefresh: true })).topics.length, 52, '再試行間隔は正常キャッシュの寿命を縮めない');
    assert.equal(calls.trends, 2); assert.ok(calls.youtube > 2);
  });
  await check('サーバーがコールド起動しても、一部成功で端末の別情報源を消さず、公開0件成功は反映する', async () => {
    const storage = memory(); storage.setItem(t.INFO_HUB_CACHE_KEY, JSON.stringify(snapshot));
    const partial = { ...snapshot, topics: videoTopics, diagnostics: { feeds: [
      { endpoint: 'safe-trends', fetchedAt: NOW, updatedAt: null, received: 0, status: 'ERROR', error: 'HTTP_503', retryAt: new Date(now.getTime() + 3600000).toISOString() },
      { endpoint: 'safe-youtube', fetchedAt: NOW, updatedAt: NOW, received: 50, status: 'OK', error: null }], items: [] } };
    const result = await c.loadExternalTopics(storage, async () => Response.json(partial), now, { force: true }); assert.equal(result.topics.length, 52);
    let retried = false;
    await c.loadExternalTopics(storage, async () => { retried = true; throw new Error('自動再試行してはいけない'); }, now, { force: true, origin: 'monologue' });
    assert.equal(retried, false);
    const cleared = await c.loadExternalTopics(storage, async () => Response.json({ ...partial, diagnostics: { ...partial.diagnostics, feeds: partial.diagnostics.feeds.map((row) => ({ ...row, status: 'OK', error: null })) } }), now, { force: true });
    assert.equal(cleared.topics.length, 50);
  });
  await check('/safe-briefsの1102はプロキシでも再読み込み後の端末でも抑制し、正常キャッシュ原文を維持する', async () => {
    let calls = 0; const server = createBriefService(async () => { calls++; return resourceError(); }, () => now);
    const error = await server(); assert.equal(error.diagnostic.cloudflareCode, 1102);
    for (let i = 0; i < 5; i++) await server(); assert.equal(calls, 1);
    const storage = memory(); await b.loadExternalBriefs(storage, async () => Response.json(feed([brief('old')])), now);
    const saved = storage.getItem(b.BRIEF_CACHE_KEY); let clientCalls = 0;
    const fetcher = async () => { clientCalls++; return Response.json({ error: 'BRIEFS_UNAVAILABLE', diagnostic: error.diagnostic }, { status: 503 }); };
    assert.ok(await b.loadExternalBriefs(storage, fetcher, now));
    for (let i = 0; i < 5; i++) assert.ok(await b.loadExternalBriefs(storage, fetcher, now));
    assert.equal(clientCalls, 1); assert.equal(storage.getItem(b.BRIEF_CACHE_KEY), saved);
    assert.equal(b.getBriefInfoState(storage).failure.cloudflareCode, 1102);
    assert.ok(!storage.getItem(b.BRIEF_STATUS_KEY).includes('SECRET RESPONSE BODY'));
  });
  await check('完成セリフ503＋長いYouTubeタイトル50件でも、旧汎用セリフ履歴の後に別話題を継続できる', () => {
    const storage = memory(); let talk = new SuuhimochiConversation({ storage, now: () => now }); talk.setGoal('作品');
    const key = 'suuhimochi_conversation_v6_choices', state = JSON.parse(storage.getItem(key)); state.dayOverride = 16; storage.setItem(key, JSON.stringify(state));
    talk = new SuuhimochiConversation({ storage, now: () => now });
    const before = JSON.parse(storage.getItem(key));
    const oldText = [
      '動画の紹介にまだ知らない名前があって、ぼく、目が止まったの。\n名前だけでは、どんなものか分からないね。知らないことを、ひとつ見つけちゃった。',
      'まだ知らない名前って、動画の紹介で見かけた名前なの。\n知ってる言葉と似ているかな、って考えたけど、まだ決められないの。並べて眺めるだけでも面白いね。',
      'ぼく、動画の紹介のまだ知らない名前が少し気になったの。\n名前を見ただけで、詳しくなった気になりかけちゃった。中身はまだ知らないんだった。えへへ。',
      '動画の紹介でまだ知らない名前に出会ったよ。人間さんに教わった言葉とは、まだ道がつながっていないの。\nでも、ぼくが気になるものも、少しずつ増えていくんだね。',
    ];
    const history = oldText.map((text, i) => ({ id: `old${i}`, text, source: 'youtube', timestamp: NOW }));
    for (let i = 0; i < 10; i++) {
      const cards = m.monologueCandidates(talk, storage, null, videoTopics, now);
      assert.equal(cards.length, 50 - i); assert.equal(new Set(cards.map((card) => card.text)).size, cards.length);
      const selected = m.selectMonologue(cards, history, now); assert.ok(selected); assert.equal(selected.completed, false);
      assert.match(selected.text, /「話題/); assert.doesNotMatch(selected.text, /まだ知らない名前/);
      assert.ok(talk.recordExternalMonologue(selected.match, selected.text, `boot:${i}`, 'startup'));
      history.push({ ...selected, timestamp: NOW });
    }
    const after = JSON.parse(storage.getItem(key)); for (const field of ['words', 'memories', 'memoryRelations', 'memoryEpisodes', 'conversationCount', 'seenConversationIds']) assert.deepEqual(after[field], before[field], field);
    assert.equal(m.eligibleMonologues(m.monologueCandidates(talk, storage, null, videoTopics, now), history, now).length, 40);
  });
  console.log(`External degraded sources: ${passed} passed`);
} finally { await vite.close(); }
