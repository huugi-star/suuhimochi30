import assert from 'node:assert/strict';
import { createServer } from 'vite';
process.env.TZ = 'Asia/Tokyo';
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false }, appType: 'custom' });
const memory = () => { const values = new Map(); return { values, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }; };
let passed = 0;
const check = async (name, test) => { await test(); passed++; console.log('PASS', name); };
try {
  const api = await vite.ssrLoadModule('/lib/externalTopics.ts');
  const { createInfoHubService } = await vite.ssrLoadModule('/lib/infoHubServer.ts');
  const { getExternalInfoState, loadExternalTopics } = await vite.ssrLoadModule('/lib/externalInfoClient.ts');
  const { buildExternalMonitor } = await vite.ssrLoadModule('/lib/externalTopicMonitor.ts');
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const now = new Date('2026-10-18T12:00:00+09:00');
  const video = (id, title, extra = {}) => ({ source: 'youtube', videoId: id, title, url: `https://www.youtube.com/watch?v=${id}`,
    categoryId: 'GAME_MEDIA', subcategoryId: 'GAME_MEDIA_3', publishedAt: now.toISOString(), ...extra });
  const youtube = { updatedAt: now.toISOString(), items: [video('aaaaaaaaaaa', 'マインクラフトの紹介'), video('bbbbbbbbbbb', '知らない作品の紹介'),
    video('ccccccccccc', '昔のマインクラフト', { publishedAt: '2020-01-01T00:00:00Z' }), video('ddddddddddd', '分類なし', { subcategoryId: null }),
    video('eeeeeeeeeee', '<script>do-not-display</script>')] };
  const trends = { updatedAt: now.toISOString(), items: [
    { id: 'craft', source: 'google', title: 'マインクラフト', categoryId: 'GAME_MEDIA', subcategoryId: 'GAME_MEDIA_3', url: 'https://trends.google.com/trending' },
    { id: 'aurora', source: 'wikipedia', title: 'オーロラ', categoryId: 'NATURE_TIME', subcategoryId: 'NATURE_TIME_6', url: 'https://ja.wikipedia.org/wiki/オーロラ' },
  ] };
  const service = createInfoHubService(async (url) => Response.json(url.endsWith('safe-youtube') ? youtube : trends), () => now);
  const snapshot = await service();
  const seed = (word = 'マインクラフト') => {
    const storage = memory(); const talk = new SuuhimochiConversation({ storage, now: () => now, random: () => 0 });
    talk.setGoal('作品を作る'); talk.startWordTeaching(); talk.submit(word); talk.chooseCategory('GAME_MEDIA'); talk.chooseSubCategory('GAME_MEDIA_3'); talk.choose('WORD_INTERESTED');
    return { storage, talk };
  };
  const { talk, storage } = seed();
  const info = { snapshot, cache: 'VALID', loading: false, attemptedAt: null, error: null };
  await check('公開APIの取得項目を安全な診断へ残し、3情報源と除外を集計する', () => {
    const model = buildExternalMonitor(info, talk, now);
    assert.equal(model.received, 7); assert.deepEqual(model.sourceCounts, { google: 1, wikipedia: 1, youtube: 5, unknown: 0 });
    assert.equal(Object.values(model.sourceCounts).reduce((a, b) => a + b, 0), model.received);
    assert.equal(model.valid, 4); assert.equal(model.candidates, 4);
    assert.equal(model.rows.length, 7); assert.equal(model.rows.filter((row) => row.state === 'STALE').length, 1);
    assert.equal(model.rows.filter((row) => row.state === 'INVALID').length, 2);
    assert.equal(model.rows.some((row) => /script|do-not-display/.test(row.title)), false);
  });
  await check('診断の選択結果は既存セレクターと同一で、不一致・優先候補を区別する', () => {
    const args = { topics: snapshot.topics, words: talk.getWordEntries(), relations: talk.getMemoryRelations(), history: [], now, day: 1 };
    assert.deepEqual(api.selectExternalMatch(args), api.evaluateExternalTopics(args).selected);
    assert.equal(api.evaluateExternalTopics(args).assessments.filter((row) => row.state === 'SELECTED').length, 1);
    assert.equal(api.evaluateExternalTopics(args).assessments.filter((row) => row.state === 'NO_MATCH').length, 2);
  });
  await check('ことばコンボの派生語・起点と照合方法を表示できる', () => {
    const { talk: combo } = seed('創作ゲーム'); const parent = combo.getWordEntries()[0];
    const question = combo.getNextPersonComboQuestion(parent.id);
    assert.equal(combo.submitPersonComboAnswer(parent.id, question.id, 'マインクラフト').ok, true);
    const model = buildExternalMonitor(info, combo, now);
    assert.ok(model.rows.some((row) => row.matches.some((match) => match.kind === 'derived' && match.rootWord === '創作ゲーム')));
  });
  await check('表示と全話題のプレビューが辞書・履歴・起動フラグを含む保存全体を書き換えない', () => {
    const before = [...storage.values];
    for (let index = 0; index < 3; index++) {
      buildExternalMonitor(info, talk, now);
      for (const topic of snapshot.topics) talk.previewExternalTopic(topic);
    }
    assert.deepEqual([...storage.values], before); assert.deepEqual(talk.getExternalTopicHistory(), []); assert.deepEqual(talk.getStartupExternalAttempts(), []);
    assert.equal(talk.previewExternalTopic(snapshot.topics.find((topic) => topic.title === 'オーロラ')).match.kind, 'general');
  });
  await check('使用済みの話題と日付、一覧から消えた話題の履歴も参照できる', () => {
    talk.setExternalTopics(snapshot); talk.openExternalDiscovery('normal');
    const model = buildExternalMonitor(info, talk, now); assert.equal(model.used, 1);
    const row = model.rows.find((row) => row.uses.length); assert.equal(row.uses[0].date, '2026-10-18');
    assert.equal(row.state, 'USED'); assert.equal(model.candidates, 3);
    assert.equal(model.rows.some((row) => row.state === 'DAILY_LIMIT'), false);
    const absent = buildExternalMonitor({ ...info, snapshot: { ...snapshot, topics: [], diagnostics: { feeds: [], items: [] } } }, talk, now);
    assert.equal(absent.rows.length, 1); assert.equal(absent.rows[0].state, 'USED');
  });
  await check('否定した根拠は新しい話題でも不採用、プレビューで肯定しない', () => {
    talk.choose('EXTERNAL_CORRECT'); talk.submit('別の作品です');
    const used = talk.getExternalTopicHistory()[0];
    const other = { ...used.topic, id: `${used.topic.source}:fffffffffff`, title: 'マインクラフトの新しい紹介' };
    assert.equal(talk.inspectExternalTopics([other]).assessments[0].state, 'REJECTED');
    assert.equal(talk.previewExternalTopic(other), null);
    assert.equal(talk.previewExternalTopic(talk.getExternalTopicHistory()[0].topic), null);
  });
  await check('今すぐ再取得は固定アプリAPIだけを呼び、正常な結果で更新する', async () => {
    const cache = memory(); cache.setItem(api.INFO_HUB_CACHE_KEY, JSON.stringify(snapshot));
    let calls = 0;
    const result = await loadExternalTopics(cache, async (url, init) => {
      calls++; assert.equal(url, '/api/external-topics?refresh=1'); assert.equal(init.body, undefined); assert.equal(init.credentials, 'omit');
      return Response.json({ ...snapshot, topics: [] });
    }, now, { force: true });
    assert.equal(calls, 1); assert.deepEqual(result.topics, []); assert.deepEqual(getExternalInfoState(cache, now).snapshot.topics, []);
  });
  await check('HTTP・通信・全情報源失敗時は正常キャッシュを破棄せずエラーを記録する', async () => {
    for (const fail of [async () => new Response('', { status: 503 }), async () => { throw new Error('SECRET_ADMIN_TOKEN'); },
      async () => Response.json({ ...snapshot, topics: [], diagnostics: { feeds: ['safe-trends', 'safe-youtube'].map((endpoint) => ({ endpoint,
        fetchedAt: now.toISOString(), updatedAt: null, received: 0, status: 'ERROR', error: 'TIMEOUT' })), items: [] } })]) {
      const cache = memory(); const raw = JSON.stringify(snapshot); cache.setItem(api.INFO_HUB_CACHE_KEY, raw);
      const result = await loadExternalTopics(cache, fail, now, { force: true });
      assert.equal(cache.getItem(api.INFO_HUB_CACHE_KEY), raw); assert.equal(result.topics.length, 4);
      assert.ok(getExternalInfoState(cache, now).error); assert.equal(JSON.stringify(getExternalInfoState(cache, now)).includes('SECRET_ADMIN_TOKEN'), false);
    }
  });
  await check('期限切れキャッシュは診断に残っても会話に採用せず、失敗時にも復活させない', async () => {
    const cache = memory(); cache.setItem(api.INFO_HUB_CACHE_KEY, JSON.stringify(snapshot));
    const tomorrow = new Date('2026-10-19T12:00:00+09:00');
    assert.equal(await loadExternalTopics(cache, async () => { throw new Error('offline'); }, tomorrow, { force: true }), null);
    const status = getExternalInfoState(cache, tomorrow); assert.equal(status.cache, 'EXPIRED');
    const model = buildExternalMonitor(status, seed().talk, tomorrow); assert.equal(model.valid, 0); assert.equal(model.candidates, 0);
    assert.ok(model.rows.some((row) => row.reason.includes('有効期限切れ')));
  });
  await check('診断メタデータがない旧キャッシュも復元し、判定不能項目を推測しない', () => {
    const old = { ...snapshot }; delete old.diagnostics;
    const restored = api.readExternalSnapshot(old, now); assert.ok(restored);
    const model = buildExternalMonitor({ ...info, snapshot: restored }, seed().talk, now);
    assert.equal(model.hasDiagnostics, false); assert.equal(model.received, 4);
  });
  await check('サーバーの失敗診断にHTTP・タイムアウトを出し、秘密の例外文を出さない', async () => {
    const service = createInfoHubService(async (url) => { if (url.endsWith('safe-trends')) return new Response('', { status: 502 }); throw new Error('PRIVATE_KEY=secret'); }, () => now);
    const result = await service(); assert.equal(result.diagnostics.feeds.length, 2);
    assert.ok(result.diagnostics.feeds.some((feed) => feed.error === 'HTTP_502'));
    assert.equal(JSON.stringify(result).includes('PRIVATE_KEY'), false);
    const malicious = api.sanitizeExternalDiagnostics({ feeds: [{ endpoint: 'safe-trends', fetchedAt: now.toISOString(), status: 'ERROR', error: 'PRIVATE_KEY=secret' }], items: [] });
    assert.equal(malicious.feeds[0].error, null);
  });
  console.log(`External monitor: ${passed} passed`);
} finally { await vite.close(); }
