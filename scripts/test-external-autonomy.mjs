import assert from 'node:assert/strict';
import { createServer } from 'vite';
process.env.TZ = 'Asia/Tokyo';
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
let passed = 0;
const check = async (name, fn) => { await fn(); passed++; console.log('PASS', name); };
const memory = () => { const values = new Map(); return { values, getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }; };
const KEY = 'suuhimochi_conversation_v6_choices';
try {
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const api = await vite.ssrLoadModule('/lib/externalTopics.ts');
  const { ExternalInteractionGate, externalTopicRevision } = await vite.ssrLoadModule('/lib/startupExperience.ts');
  const { loadExternalTopics, subscribeExternalTopics, getExternalInfoState } = await vite.ssrLoadModule('/lib/externalInfoClient.ts');
  let now = new Date('2026-10-19T10:00:00+09:00');
  const topic = (id, source = 'google', title = `話題${id}`) => ({ id: `${source}:${id}`, source, title,
    url: source === 'google' ? 'https://trends.google.com/trending?geo=JP' : source === 'wikipedia'
      ? `https://ja.wikipedia.org/wiki/${encodeURIComponent(title)}` : `https://www.youtube.com/watch?v=${id}`,
    category: 'GAME_MEDIA', subcategory: 'GAME_MEDIA_3', updatedAt: now.toISOString(), publishedAt: now.toISOString() });
  const snapshot = (topics) => ({ schemaVersion: 2, fetchedAt: now.toISOString(), expiresAt: api.externalExpiry(now), topics });
  const create = (storage = memory()) => new SuuhimochiConversation({ storage, now: () => now, random: () => 0 });
  const seed = (words = false) => {
    const storage = memory(); const first = create(storage); first.setGoal('作品づくり');
    if (words) { first.startWordTeaching(); first.submit('マインクラフト'); first.chooseCategory('GAME_MEDIA'); first.chooseSubCategory('GAME_MEDIA_3'); first.choose('WORD_INTERESTED'); }
    const saved = JSON.parse(storage.getItem(KEY)); saved.startDate = '2026-10-18';
    storage.setItem(KEY, JSON.stringify(saved)); return { storage, talk: create(storage) };
  };
  const show = (talk, trigger = 'startup', revision) => {
    const plan = talk.prepareStartupExternalTalk(trigger, revision); assert.ok(plan);
    const use = talk.markStartupExternalTalkShown(plan); assert.ok(use); talk.finishStartupExternalTalk(use, 'SKIPPED'); return plan;
  };
  await check('同日再起動・ページ更新は別の機会、同じインスタンスの二重表示は禁止', () => {
    const { storage, talk } = seed(); const feed = snapshot([topic('a'), topic('b'), topic('c')]); talk.setExternalTopics(feed, true);
    const first = show(talk); assert.equal(talk.prepareStartupExternalTalk(), null);
    for (let i = 0; i < 2; i++) { const next = create(storage); next.setExternalTopics(feed, true); assert.notEqual(show(next).match.topic.id, first.match.topic.id); }
    const history = create(storage).getExternalTopicHistory(); assert.equal(history.length, 3);
    assert.equal(new Set(history.map((use) => use.topic.id)).size, 3); assert.ok(history.every((use) => use.startupOutcome === 'SKIPPED' && use.eventId && use.timestamp));
  });
  await check('旧日次表示済みフラグは新しい起動を禁止しない', () => {
    const { storage } = seed(); const saved = JSON.parse(storage.getItem(KEY));
    saved.startupExternalAttempts = [{ activityDate: '2026-10-19', outcome: 'FINISHED' }]; storage.setItem(KEY, JSON.stringify(saved));
    const talk = create(storage); talk.setExternalTopics(snapshot([topic('legacy')])); assert.ok(talk.prepareStartupExternalTalk());
  });
  await check('一般話題は本人の好みとせず、辞書・感情・関係・報酬・12枠を増やさない', () => {
    const { storage, talk } = seed(); talk.setExternalTopics(snapshot([topic('general')]));
    const before = JSON.parse(storage.getItem(KEY)); const plan = show(talk); const after = JSON.parse(storage.getItem(KEY));
    assert.equal(plan.match.kind, 'general'); assert.equal(plan.lines.length, 2); assert.ok(plan.lines.join('').includes('ぼく'));
    for (const field of ['words', 'memories', 'relations', 'memoryRelations', 'memoryEpisodes', 'conversationCount', 'seenConversationIds', 'goalChecks']) assert.deepEqual(after[field], before[field], field);
    assert.equal(after.externalTopicHistory[0].wordId, '');
    assert.equal(talk.markStartupExternalTalkShown(plan), null);
  });
  await check('教わった語とコンボ派生語を一般話題より優先し、誤った関係を作らない', () => {
    const { talk } = seed(true); talk.setExternalTopics(snapshot([topic('aa'), topic('bb', 'wikipedia', 'マインクラフト')]));
    assert.equal(talk.prepareStartupExternalTalk().match.kind, 'exact');
    const parent = talk.getWordEntries()[0]; const question = talk.getNextPersonComboQuestion(parent.id);
    assert.equal(talk.submitPersonComboAnswer(parent.id, question.id, 'テラリア').ok, true);
    talk.setExternalTopics(snapshot([topic('cc', 'google', 'テラリア'), topic('dd')]));
    assert.equal(talk.prepareStartupExternalTalk().match.kind, 'derived');
  });
  await check('Google250件でも最初の3起動で3情報源を選べる', () => {
    const { storage, talk } = seed(); const feed = snapshot([...Array.from({ length: 250 }, (_, i) => topic(`g${i}`)), topic('wiki', 'wikipedia'), topic('abcdefghijk', 'youtube')]);
    const sources = new Set(); talk.setExternalTopics(feed, true); sources.add(show(talk).match.topic.source);
    for (let i = 0; i < 2; i++) { const next = create(storage); next.setExternalTopics(feed, true); sources.add(show(next).match.topic.source); }
    assert.deepEqual([...sources].sort((a, b) => a.localeCompare(b)), ['google', 'wikipedia', 'youtube']);
  });
  await check('Googleの既知語一致が大量でも他情報源を永久に押し出さない', () => {
    const { storage, talk } = seed(true); const feed = snapshot([...Array.from({ length: 250 }, (_, i) => topic(`g${i}`, 'google', `マインクラフト ${i}`)), topic('wiki', 'wikipedia'), topic('abcdefghijk', 'youtube')]);
    const sources = new Set(); talk.setExternalTopics(feed, true); assert.equal(talk.prepareStartupExternalTalk().match.kind, 'exact');
    sources.add(show(talk).match.topic.source);
    for (let i = 0; i < 5; i++) { const next = create(storage); next.setExternalTopics(feed, true); sources.add(show(next).match.topic.source); }
    assert.deepEqual([...sources].sort((a, b) => a.localeCompare(b)), ['google', 'wikipedia', 'youtube']);
  });
  await check('使用済みは24時間以上＋別話題を挟んだときだけ再利用する', () => {
    const { storage, talk } = seed(); let feed = snapshot([topic('repeat-a'), topic('repeat-b')]); talk.setExternalTopics(feed); const a = show(talk);
    const second = create(storage); second.setExternalTopics(feed); const b = show(second); assert.notEqual(a.match.topic.id, b.match.topic.id);
    const third = create(storage); third.setExternalTopics(feed); assert.equal(third.prepareStartupExternalTalk(), null);
    const savedNow = now; now = new Date(now.getTime() + 25 * 3600000); feed = snapshot(feed.topics.map((entry) => ({ ...entry, updatedAt: now.toISOString() })));
    const later = create(storage); later.setExternalTopics(feed); assert.equal(later.prepareStartupExternalTalk().match.topic.id, a.match.topic.id); now = savedNow;
  });
  await check('話題が1件しかなくても48時間を空ければ再利用できる', () => {
    const { storage, talk } = seed(); const entry = topic('single'); talk.setExternalTopics(snapshot([entry])); show(talk);
    const savedNow = now; now = new Date(now.getTime() + 49 * 3600000);
    const later = create(storage); later.setExternalTopics(snapshot([{ ...entry, updatedAt: now.toISOString(), publishedAt: now.toISOString() }]));
    assert.ok(later.prepareStartupExternalTalk()); now = savedNow;
  });
  await check('起動済みでも新規追加バッチから1件を選び、同じ更新は二重通知しない', () => {
    const { storage, talk } = seed(); talk.setExternalTopics(snapshot([topic('old')]), true); show(talk);
    const savedNow = now; now = new Date(now.getTime() + 16 * 60000);
    const feed = snapshot([topic('old'), topic('new-a'), topic('new-b', 'wikipedia')]); talk.setExternalTopics(feed);
    const batch = talk.getExternalUpdateBatch(); assert.equal(batch.count, 2);
    const plan = show(talk, 'update', batch.id); assert.ok(batch.topicIds.includes(plan.match.topic.id));
    assert.equal(talk.prepareStartupExternalTalk('update', batch.id), null);
    const restarted = create(storage); restarted.setExternalTopics(feed); assert.equal(restarted.prepareStartupExternalTalk('update', batch.id), null);
    assert.equal(restarted.getExternalTopicHistory().at(-1).context, 'update'); now = savedNow;
  });
  await check('更新日時・取得日時だけの変更は新しい話題としない', () => {
    const { talk } = seed(); const entry = topic('unchanged'); talk.setExternalTopics(snapshot([entry]), true);
    talk.setExternalTopics(snapshot([{ ...entry, updatedAt: new Date(now.getTime() + 60000).toISOString(), publishedAt: new Date(now.getTime() + 60000).toISOString() }]));
    assert.equal(talk.getExternalUpdateBatch(), null);
    assert.equal(externalTopicRevision(entry), externalTopicRevision({ ...entry, updatedAt: '2027-01-01' }));
    talk.setExternalTopics(snapshot([{ ...entry, title: '内容が変わった話題' }])); assert.equal(talk.getExternalUpdateBatch().count, 1);
  });
  await check('短時間の連続更新を15分のクールダウンで抑制し、見送り理由を保存する', () => {
    const { talk } = seed(); talk.setExternalTopics(snapshot([topic('old')]), true); show(talk);
    talk.setExternalTopics(snapshot([topic('new')])); const batch = talk.getExternalUpdateBatch();
    assert.equal(talk.prepareStartupExternalTalk('update', batch.id), null);
    assert.match(talk.getExternalAutoBlockReason('update'), /クールダウン/);
    talk.recordStartupOpportunity('NO_TOPIC', 'update', batch.id, talk.getExternalAutoBlockReason('update'));
    const count = talk.getStartupExternalAttempts().length; talk.recordStartupOpportunity('BUSY', 'update', batch.id); assert.equal(talk.getStartupExternalAttempts().length, count);
  });
  await check('遅延取得中の入力・最近の操作・モーダル中には割り込まない', () => {
    const gate = new ExternalInteractionGate(); const first = gate.capture(); assert.equal(gate.canOffer(first, false, 0), true);
    gate.interact(100); assert.equal(gate.canOffer(first, false, 40000), false);
    const next = gate.capture(); assert.equal(gate.canOffer(next, false, 29999), false);
    assert.equal(gate.canOffer(next, false, 30100), true); assert.equal(gate.canOffer(next, true, 40000), false);
  });
  await check('1時間・表示復帰チェックを間引き、強制再取得のみ間隔を無視する', async () => {
    const cache = memory(); cache.setItem(api.INFO_HUB_CACHE_KEY, JSON.stringify(snapshot([topic('cached')])));
    let calls = 0; const events = []; const unsubscribe = subscribeExternalTopics(cache, (event) => events.push(event.phase));
    const fetcher = async (url, init) => { calls++; assert.equal(url, '/api/external-topics?refresh=1'); assert.equal(init.body, undefined); return Response.json(snapshot([topic('fresh')])); };
    await loadExternalTopics(cache, fetcher, now, { checkUpdates: true }); assert.equal(calls, 0);
    const hour = new Date(now.getTime() + 3600000);
    await Promise.all([loadExternalTopics(cache, fetcher, hour, { checkUpdates: true }), loadExternalTopics(cache, fetcher, hour, { checkUpdates: true })]); assert.equal(calls, 1);
    await loadExternalTopics(cache, fetcher, new Date(hour.getTime() + 1000), { checkUpdates: true }); assert.equal(calls, 1);
    await loadExternalTopics(cache, fetcher, hour, { force: true }); assert.equal(calls, 2);
    assert.deepEqual(events, ['start', 'complete', 'start', 'complete']); assert.equal(getExternalInfoState(cache, hour).checkedAt, hour.toISOString()); unsubscribe();
  });
  await check('失敗時は正常キャッシュを維持し、再試行も間引き、0件は安全に反映する', async () => {
    const cache = memory(); const raw = JSON.stringify(snapshot([topic('keep')])); cache.setItem(api.INFO_HUB_CACHE_KEY, raw);
    let calls = 0; const fail = async () => { calls++; throw new Error('offline'); }; const hour = new Date(now.getTime() + 3600000);
    await loadExternalTopics(cache, fail, hour, { checkUpdates: true }); await loadExternalTopics(cache, fail, hour, { checkUpdates: true });
    assert.equal(calls, 1); assert.equal(cache.getItem(api.INFO_HUB_CACHE_KEY), raw);
    await loadExternalTopics(cache, async () => Response.json(snapshot([])), hour, { force: true }); assert.deepEqual(getExternalInfoState(cache, hour).snapshot.topics, []);
    const { talk } = seed(); talk.setExternalTopics(snapshot([])); assert.equal(talk.prepareStartupExternalTalk(), null);
  });
  await check('Day1は出会いに割り込まず、興味取得・コンボ導線の後には更新を利用できる', () => {
    const talk = create(); talk.setGoal('作品'); talk.setExternalTopics(snapshot([topic('initial')]), true);
    talk.setExternalTopics(snapshot([topic('before-interest')])); assert.equal(talk.prepareStartupExternalTalk('update', talk.getExternalUpdateBatch().id), null);
    const self = talk.startSession(); assert.equal(self.debug.selectedTemplate, 'DAY01_SELF_01'); talk.choose(self.choices[0].id);
    assert.equal(talk.startSession().debug.selectedTemplate, 'DAY01_CURIOUS_03');
    talk.submit('ゲーム'); talk.chooseCategory('GAME_MEDIA'); talk.chooseSubCategory('GAME_MEDIA_3'); talk.choose('EARLY_COMBO_START');
    talk.setExternalTopics(snapshot([topic('after-interest')])); assert.ok(talk.prepareStartupExternalTalk('update', talk.getExternalUpdateBatch().id));
    assert.equal(talk.prepareStartupExternalTalk(), null);
  });
  await check('30日リセットでは個体の使用履歴・差分検出情報・イベント履歴をリセットする', () => {
    const { talk } = seed(); talk.setExternalTopics(snapshot([topic('end')])); show(talk); talk.beginNextCycle('次の作品');
    assert.deepEqual(talk.getExternalTopicHistory(), []); assert.deepEqual(talk.getStartupExternalAttempts(), []); assert.equal(talk.getExternalUpdateBatch(), null);
  });
  console.log(`External autonomy: ${passed} passed`);
} finally { await vite.close(); }
