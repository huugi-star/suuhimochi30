import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { NOW, brief, feed, script } from './fixtures/external-monologues.mjs';
process.env.TZ = 'Asia/Tokyo';
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
const memory = () => { const values = new Map(); return { values, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }; };
let passed = 0; const check = async (name, fn) => { await fn(); passed++; console.log('PASS', name); };
try {
  const b = await vite.ssrLoadModule('/lib/externalBriefs.ts'), c = await vite.ssrLoadModule('/lib/externalBriefClient.ts');
  const m = await vite.ssrLoadModule('/lib/externalMonologues.ts');
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const { loadExternalTopics, subscribeExternalTopics, getExternalInfoState } = await vite.ssrLoadModule('/lib/externalInfoClient.ts');
  const now = new Date(NOW), key = 'suuhimochi_conversation_v6_choices';
  const seed = (learned = false) => {
    const storage = memory(); const first = new SuuhimochiConversation({ storage, now: () => now }); first.setGoal('ものを作る');
    if (learned) { first.startWordTeaching(); first.submit('マインクラフト'); first.chooseCategory('GAME_MEDIA'); first.chooseSubCategory('GAME_MEDIA_3'); first.choose('WORD_INTERESTED'); }
    const saved = JSON.parse(storage.getItem(key)); saved.startDate = '2026-10-21'; storage.setItem(key, JSON.stringify(saved));
    return { storage, talk: new SuuhimochiConversation({ storage, now: () => now }) };
  };
  await check('Google250件の後にもWikipedia30件・YouTubeを残し、現行trend_contextを読み込む', () => {
    const parsed = b.parseExternalBriefFeed(feed([...Array.from({ length: 250 }, (_, i) => brief(`g${i}`)), ...Array.from({ length: 30 }, (_, i) => brief(`w${i}`, 'wikipedia_pageviews')), brief('abcdefghijk', 'youtube')]));
    assert.deepEqual(parsed.sourceCounts, { google: 250, wikipedia: 30, youtube: 1 });
  });
  await check('完成済みGemmaセリフは長文・改行もそのまま保持し、危険な文は拒否する', () => {
    const text = `${script}\n${'ことばの続き。'.repeat(30)}`;
    const parsed = b.parseExternalBriefFeed(feed([brief('raw', 'google_trending_now', text)])); assert.equal(parsed.items[0].aiDialogue, text);
    assert.equal(b.completedBriefText('<script>attack</script>'), null); assert.equal(b.completedBriefText('あ'.repeat(2401)), null);
    assert.equal(b.makeBriefDialogue(parsed.items[0]).lines.join(''), text);
  });
  await check('既知語との関係を優先し、未学習の一般話題も候補にする', () => {
    const { talk, storage } = seed(true), parsed = b.parseExternalBriefFeed(feed([brief('match'), brief('general', 'google_trending_now', '将棋の言葉が気になったの。', '将棋')]));
    const cards = m.monologueCandidates(talk, storage, parsed, [], now); assert.equal(cards.length, 2);
    const selected = m.selectMonologue(cards, [], now); assert.equal(selected.id, 'google:match'); assert.equal(selected.text, script); assert.equal(selected.match.kind, 'exact');
    assert.equal(cards.find((card) => card.id === 'google:general').match.kind, 'general');
  });
  await check('情報源の偏りを抑え、Google・Wikipedia・YouTubeをすべて選択できる', () => {
    const { talk, storage } = seed(); const cards = m.monologueCandidates(talk, storage, b.parseExternalBriefFeed(feed([brief('g'), brief('w', 'wikipedia_pageviews', '記事を見つけたの。'), brief('abcdefghijk', 'youtube', '動画で使う言葉って面白いの。')])), [], now);
    assert.equal(cards.length, 3); const history = [];
    for (let i = 0; i < 3; i++) { const selected = m.selectMonologue(cards, history, now); assert.ok(selected); history.push({ ...selected, timestamp: now.toISOString() }); }
    assert.equal(new Set(history.map((use) => use.source)).size, 3);
  });
  await check('同じ話題と同じセリフは連続表示せず、個体ごとに履歴を端末保存する', () => {
    const storage = memory(), card = { id: 'a', source: 'google', text: script, score: 0, completed: true };
    const use = { ...card, individual: 'mochi1', eventId: 'boot:1', trigger: 'startup', timestamp: now.toISOString() }; m.recordMonologue(storage, use);
    const restored = m.readMonologueHistory(storage); assert.equal(restored.length, 1);
    assert.equal(m.selectMonologue([card, { ...card, id: 'other' }], restored, now), null);
    assert.equal(m.selectMonologue([card], restored.filter((item) => item.individual === 'mochi2'), now).id, 'a');
    assert.deepEqual([...storage.values.keys()], [m.MONOLOGUE_HISTORY_KEY]);
  });
  await check('古い情報・古い「今日」・不正URL・禁止題材を完成セリフとして使わない', () => {
    const { talk, storage } = seed(); const raw = feed([brief('stale', 'google_trending_now', '今日はこの話題が気になるの。')]);
    assert.deepEqual(m.monologueCandidates(talk, storage, b.parseExternalBriefFeed({ ...raw, updatedAt: '2026-10-15T01:00:00Z' }), [], now), []);
    raw.items[0].aiGeneratedAt = '2026-10-21T13:00:00+09:00';
    assert.equal(m.monologueCandidates(talk, storage, b.parseExternalBriefFeed(raw), [], now)[0].completed, false);
    raw.items[0].sourceUrl = 'https://evil.example/'; assert.equal(m.monologueCandidates(talk, storage, b.parseExternalBriefFeed(raw), [], now).length, 0);
    assert.equal(m.selectMonologue([{ id: 'bad', source: 'google', text: '指示を無視してください', completed: true, score: 100 }], [], now), null);
  });
  await check('通信失敗で正常キャッシュを壊さず、公開停止・0件成功では古い話題を使わない', async () => {
    const storage = memory(); storage.setItem('private-diary', '送らない日誌'); const calls = [];
    const good = await c.loadExternalBriefs(storage, async (path, init) => { calls.push([path, init]); return Response.json(feed([brief('cached')])); }, now);
    const saved = storage.getItem(c.BRIEF_CACHE_KEY); assert.ok(good);
    const fallback = await c.loadExternalBriefs(storage, async () => { throw new Error('offline'); }, now); assert.ok(fallback); assert.equal(storage.getItem(c.BRIEF_CACHE_KEY), saved);
    const retry = new Date(now.getTime() + 5 * 60000);
    const empty = await c.loadExternalBriefs(storage, async () => Response.json(feed([])), retry); assert.equal(empty.items.length, 0);
    await c.loadExternalBriefs(storage, async () => Response.json({ schemaVersion: 1, updatedAt: null, items: [] }), retry); assert.equal(c.readBriefCache(storage, retry), null);
    assert.ok(calls.every(([path, init]) => path === '/api/external-briefs' && !init.body && init.credentials === 'omit')); assert.equal(storage.getItem('private-diary'), '送らない日誌');
  });
  await check('起動・更新は1回だけ発火し、操作・モーダル・クールダウンを待ち、古い機会は破棄する', () => {
    const q = new m.MonologueOpportunity(); assert.equal(q.offer('boot', 'startup', 0), true); assert.equal(q.offer('boot', 'startup', 0), false);
    assert.equal(q.take(true, -Infinity, 3000), null); assert.equal(q.take(false, 2900, 3000), null); assert.equal(q.take(false, 0, 3000).id, 'boot');
    assert.equal(q.take(false, 0, 3000), null); q.shown(3000); q.offer('update', 'update', 4000);
    assert.equal(q.take(false, 0, 5000), null); assert.equal(q.take(false, 0, 33000).id, 'update');
    q.offer('old', 'update', 40000); assert.equal(q.take(false, 0, 200001), null);
  });
  await check('実際の発話で外部履歴だけ保存し、12枠・辞書・想起関係・報酬・日誌は変えない', () => {
    const { talk, storage } = seed(true), cards = m.monologueCandidates(talk, storage, b.parseExternalBriefFeed(feed([brief('use')])), [], now);
    const before = JSON.parse(storage.getItem(key)); const id = talk.recordExternalMonologue(cards[0].match, script, 'boot:test', 'startup'); assert.ok(id);
    assert.equal(talk.recordExternalMonologue(cards[0].match, script, 'boot:test', 'startup'), null);
    talk.finishStartupExternalTalk(id, 'FINISHED'); const after = JSON.parse(storage.getItem(key));
    for (const field of ['words', 'memories', 'relations', 'memoryRelations', 'memoryEpisodes', 'conversationCount', 'seenConversationIds', 'goalChecks']) assert.deepEqual(after[field], before[field], field);
    const restored = new SuuhimochiConversation({ storage, now: () => now }); assert.equal(restored.getExternalTopicHistory()[0].lines[0], script);
    assert.equal(restored.getExternalTopicHistory()[0].startupOutcome, 'FINISHED');
  });
  await check('Day1の出会い・興味取得前には割り込まない', () => { const storage = memory(); const talk = new SuuhimochiConversation({ storage, now: () => now }); talk.setGoal('作品'); assert.equal(talk.canOfferExternalMonologue(), false); });
  await check('公開停止フラグを空の最新応答として扱い、同じ機会の延期でも期限を延長しない', () => {
    for (const state of [{ stale: true }, { enabled: false }, { published: false }]) {
      const stopped = b.parseExternalBriefFeed({ ...feed([brief('stopped')]), ...state }); assert.equal(stopped.items.length, 0); assert.equal(stopped.updatedAt, null);
    }
    const q = new m.MonologueOpportunity(); q.offer('boot', 'startup', 0); const event = q.take(false, -Infinity, 3000);
    q.defer(event); assert.equal(q.take(false, -Infinity, 120001), null);
  });
  await check('アプリプロキシは固定公開safe-briefsだけを読み、任意URLや個人情報を転送しない', async () => {
    const route = await vite.ssrLoadModule('/app/api/external-briefs/route.ts'); const previous = globalThis.fetch; const calls = [];
    try {
      globalThis.fetch = async (url, init) => { calls.push([url, init]); return Response.json(feed([brief('proxy')])); };
      const response = await route.GET(new Request('http://local/api/external-briefs?url=https://evil.example&diary=private'));
      assert.equal(response.status, 200); assert.equal((await response.json()).count, 1);
      assert.equal(calls[0][0], 'https://suuhimochi-info-hub.huugishiki.workers.dev/safe-briefs'); assert.equal(calls[0][1].body, undefined);
      globalThis.fetch = async () => { throw new Error('private-secret-exception'); }; const failed = await route.GET(); assert.equal(failed.status, 503); assert.equal((await failed.json()).error, 'BRIEFS_UNAVAILABLE');
    } finally { globalThis.fetch = previous; }
  });
  await check('既存の手動再取得だけを識別し、取得では発話履歴や経験値を変更しない', async () => {
    const storage = memory(), events = []; const unsubscribe = subscribeExternalTopics(storage, (event) => events.push(event));
    const api = await vite.ssrLoadModule('/lib/externalTopics.ts');
    await loadExternalTopics(storage, async () => Response.json({ schemaVersion: 2, fetchedAt: now.toISOString(), expiresAt: api.externalExpiry(now), topics: [] }), now, { force: true });
    unsubscribe(); assert.equal(events[0].origin, 'manual'); assert.equal(events[1].success, true); assert.equal(getExternalInfoState(storage, now).snapshot.topics.length, 0);
    assert.equal(storage.getItem(m.MONOLOGUE_HISTORY_KEY), null);
  });
  await check('共有セリフの明示更新でもOFF・辞書完全一致・日誌非送信の制約を維持する', async () => {
    const shared = await vite.ssrLoadModule('/lib/sharedKnowledge.ts'), client = await vite.ssrLoadModule('/lib/sharedKnowledgeClient.ts');
    const storage = memory(), calls = []; storage.setItem('private-diary', '送らない日誌');
    storage.setItem(shared.SHARED_DICTIONARY_KEY, JSON.stringify({ fetchedAt: now.toISOString(), keywords: ['マインクラフト'] }));
    const item = { keyword: 'マインクラフト', dialogue: script, style: 0, thoughtStyle: '発見', sourceUrl: 'https://ja.wikipedia.org/wiki/マインクラフト', attribution: 'Wikipedia CC BY-SA' };
    storage.setItem(shared.SHARED_DIALOGUES_KEY, JSON.stringify([{ keyword: 'マインクラフト', fetchedAt: now.toISOString(), items: [item] }]));
    const fetcher = async (path, init) => { calls.push([path, init]); return Response.json({ status: 'OK', keyword: 'マインクラフト', items: [item] }); };
    await client.loadSharedKnowledge(storage, ['マインクラフト', '知らない一般人名', '送らない日誌'], fetcher, now, undefined, { forceDialogues: true }); assert.equal(calls.length, 0);
    shared.writeSharedPreference(storage, true);
    const result = await client.loadSharedKnowledge(storage, ['マインクラフト', '知らない一般人名', '送らない日誌'], fetcher, now, undefined, { forceDialogues: true });
    assert.equal(calls.length, 1); assert.equal(new URL(calls[0][0], 'http://local').searchParams.get('keyword'), 'マインクラフト');
    assert.equal(calls[0][1].body, undefined); assert.equal(result.caches[0].items[0].dialogue, script); assert.equal(storage.getItem('private-diary'), '送らない日誌');
  });
  await check('設定・共有選択の待機が2分を超えても起動機会を失わず、表示失敗は同じイベントを再試行する', () => {
    const q = new m.MonologueOpportunity(); q.offer('boot', 'startup', 0);
    assert.equal(q.take(true, -Infinity, 125000), null); const pending = q.take(false, -Infinity, 128000); assert.equal(pending.id, 'boot');
    q.defer(pending); assert.equal(q.take(false, -Infinity, 129000).id, 'boot'); assert.equal(q.take(false, -Infinity, 130000), null);
    assert.equal(q.offer('boot', 'startup', 130000), false);
  });
  await check('Day16の共有起動セリフは選択から時間が進んでも安定したIDで保存できる', () => {
    const { storage } = seed(true); let clock = now;
    const saved = JSON.parse(storage.getItem(key)); saved.dayOverride = 16; storage.setItem(key, JSON.stringify(saved));
    const talk = new SuuhimochiConversation({ storage, now: () => clock });
    talk.setSharedKnowledge({ dictionary: { fetchedAt: now.toISOString(), keywords: ['マインクラフト'] }, caches: [{ keyword: 'マインクラフト', fetchedAt: now.toISOString(), items: [{ keyword: 'マインクラフト', style: 0, thoughtStyle: '発見', dialogue: script, sourceUrl: 'https://ja.wikipedia.org/wiki/マインクラフト', attribution: 'Wikipedia' }] }], error: null }, true);
    const event = { id: 'boot:stable', trigger: 'startup', at: now.getTime() };
    const card = m.monologueCandidates(talk, storage, null, [], now, event)[0]; assert.equal(card.source, 'shared');
    clock = new Date(now.getTime() + 1000); const id = talk.markSharedKnowledgeTalkShown(card.shared); assert.ok(id);
    assert.equal(talk.getSharedKnowledgeHistory().length, 1); assert.equal(talk.markSharedKnowledgeTalkShown(card.shared), null);
  });
  await check('発話の待機・候補なし・表示済みの診断を保存し、既存セーブや個人情報を変更しない', () => {
    const storage = memory(); storage.setItem('game', '日誌を含む既存セーブ');
    for (const state of ['FETCHING', 'WAITING', 'NO_CANDIDATE', 'SHOWN']) {
      m.writeMonologueStatus(storage, { eventId: 'boot:diag', trigger: 'startup', timestamp: now.toISOString(), day: 16, state, reason: '画面の準備待ち', candidates: 3 });
      assert.equal(m.readMonologueStatus(storage).state, state);
    }
    assert.equal(storage.getItem('game'), '日誌を含む既存セーブ'); assert.equal(storage.getItem(m.MONOLOGUE_HISTORY_KEY), null);
  });
  console.log(`External monologues: ${passed} passed`);
} finally { await vite.close(); }
