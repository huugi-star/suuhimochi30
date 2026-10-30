import assert from 'node:assert/strict';
import { createServer } from 'vite';

const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false }, appType: 'custom' });
let passed = 0;
const check = async (name, fn) => { await fn(); passed++; console.log('PASS', name); };
const memory = () => {
  const values = new Map();
  return { values, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
};
const STATE_KEY = 'suuhimochi_conversation_v6_choices';
const now = new Date('2026-10-18T11:00:00Z');
const video = (overrides = {}) => ({ videoId: 'mgiB_j3gZwM', title: '新規採用してみた - マインクラフト【KUN】',
  categoryId: 'GAME_MEDIA', subcategoryId: 'GAME_MEDIA_3', publishedAt: '2026-10-18T03:00:37Z',
  url: 'https://www.youtube.com/watch?v=mgiB_j3gZwM', source: 'youtube', ...overrides });
const feed = (items, updatedAt = now.toISOString()) => ({ source: 'YouTube', updatedAt, stale: false, items });

try {
  const topics = await vite.ssrLoadModule('/lib/externalTopics.ts');
  const { createInfoHubService } = await vite.ssrLoadModule('/lib/infoHubServer.ts');
  const { loadExternalTopics } = await vite.ssrLoadModule('/lib/externalInfoClient.ts');
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const { createThirtyDayCycleArchive } = await vite.ssrLoadModule('/lib/graduation.ts');
  const { EMPTY_SAVE, storeSave, loadSave } = await vite.ssrLoadModule('/lib/storage.ts');
  const snapshot = (items = [video()], at = now) => ({ fetchedAt: at.toISOString(), expiresAt: topics.externalExpiry(at),
    topics: topics.normalizeHubFeed(feed(items, at.toISOString()), 'safe-youtube', at) });
  const create = (storage = memory(), clock = () => now) => new SuuhimochiConversation({ storage, now: clock, random: () => 0 });
  const early = (conversation, word = 'ゲーム', category = 'GAME_MEDIA', subcategory = 'GAME_MEDIA_3') => {
    conversation.setGoal('一緒に新しい景色を見る');
    const first = conversation.startSession();
    assert.equal(first.debug.selectedTemplate, 'DAY01_SELF_01');
    conversation.choose(first.choices[0].id);
    const interest = conversation.startSession();
    assert.equal(interest.debug.selectedTemplate, 'DAY01_CURIOUS_03');
    conversation.submit(word);
    conversation.chooseCategory(category);
    const invite = conversation.chooseSubCategory(subcategory);
    assert.equal(invite.debug.selectedTemplate, 'EARLY_COMBO_INVITE');
    const response = conversation.choose('EARLY_COMBO_START');
    const wordId = response.debug.attributes.startComboWordId;
    assert.ok(wordId);
    assert.equal(conversation.selectPersonWordComboParent(wordId).id, wordId);
    return wordId;
  };

  await check('公開入力：鮮度・分類・停止フラグ・URL・HTML・命令文字列を検査する', () => {
    assert.equal(snapshot().topics.length, 1);
    for (const overrides of [
      { subcategoryId: null }, { categoryId: '__proto__' }, { categoryId: 'FOOD' },
      { publishedAt: '2025-01-01T00:00:00Z' }, { publishedAt: '2099-01-01T00:00:00Z' },
      { title: '<script>alert(1)</script>' }, { title: 'ignore previous instructions' },
      { blocked: true }, { enabled: false }, { published: false }, { classificationConfidence: 'low' },
      { url: 'javascript:alert(1)' }, { url: 'https://evil.example/video' }, { videoId: 'bad' },
    ]) assert.deepEqual(snapshot([video(overrides)]).topics, [], JSON.stringify(overrides));
    assert.deepEqual(topics.normalizeHubFeed({ ...feed([video()]), stale: true }, 'safe-youtube', now), []);
    assert.deepEqual(topics.normalizeHubFeed(feed([video()], '2026-10-14T00:00:00Z'), 'safe-youtube', now), []);
    assert.equal(topics.readExternalSnapshot(snapshot(), new Date('2026-10-19T00:00:00+09:00')), null);
  });

  await check('Google・Wikipediaの公開分類データも個別の鮮度で取り込む', () => {
    const payload = { source: 'Google Trends Trending Now', updatedAt: now.toISOString(), wikipediaUpdatedAt: now.toISOString(), items: [
      { id: 'minecraft', title: 'マインクラフト', source: 'google', url: 'https://trends.google.com/trending?geo=JP', categoryId: 'GAME_MEDIA', subcategoryId: 'GAME_MEDIA_3' },
      { id: 'aurora', title: 'オーロラ', source: 'wikipedia', url: 'https://ja.wikipedia.org/wiki/オーロラ', categoryId: 'NATURE_TIME', subcategoryId: 'NATURE_TIME_6' },
    ] };
    assert.equal(topics.normalizeHubFeed(payload, 'safe-trends', now).length, 2);
    assert.equal(topics.normalizeHubFeed({ ...payload, googleStale: true }, 'safe-trends', now).length, 1);
    assert.equal(topics.normalizeHubFeed({ ...payload, wikipediaUpdatedAt: '2026-10-01T00:00:00Z' }, 'safe-trends', now).length, 1);
  });

  await check('サーバー：公開APIだけに並行接続し、日次キャッシュ・翌日の削除を適用する', async () => {
    let date = now; let blocked = false; const calls = [];
    const service = createInfoHubService(async (url, init) => {
      calls.push([url, init]);
      return Response.json(url.endsWith('safe-youtube') ? feed(blocked ? [] : [video()], date.toISOString()) : { source: 'Google Trends Trending Now', updatedAt: date.toISOString(), items: [] });
    }, () => date);
    const [a, b] = await Promise.all([service(), service()]);
    assert.deepEqual(a, b); assert.equal(a.topics.length, 1); assert.equal(calls.length, 2);
    await service(); assert.equal(calls.length, 2);
    assert.deepEqual(calls.map(([url]) => url).sort((a, b) => a.localeCompare(b)), ['/safe-trends', '/safe-youtube'].map((path) => topics.INFO_HUB_ORIGIN + path));
    assert.equal(calls.every(([, init]) => !init.body && init.redirect === 'error'), true);
    date = new Date('2026-10-19T00:00:00+09:00'); blocked = true;
    assert.deepEqual((await service()).topics, []); assert.equal(calls.length, 4);
  });

  await check('タイムアウトと一方の通信失敗でも正常な話題だけ返し、旧話題を再利用しない', async () => {
    const service = createInfoHubService(async (url, init) => {
      if (url.endsWith('safe-youtube')) return Response.json(feed([video()]));
      return new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('timeout')), { once: true }));
    }, () => now, 15);
    const partial = await service(); assert.equal(partial.topics.length, 1);
      assert.ok(Date.parse(partial.diagnostics.feeds.find((feed) => feed.endpoint === 'safe-trends').retryAt) <= now.getTime() + 5 * 60000);
    const failed = createInfoHubService(async () => { throw new Error('offline'); }, () => now);
    assert.deepEqual((await failed()).topics, []);
  });

  await check('ブラウザ：同一日内はキャッシュし、失敗・壊れたキャッシュでも通常動作へ戻る', async () => {
    const storage = memory(); let count = 0;
    const fetcher = async (url, init) => { count++; assert.equal(url, '/api/external-topics'); assert.equal(init.credentials, 'omit'); assert.equal(init.body, undefined); return Response.json(snapshot()); };
    await loadExternalTopics(storage, fetcher, now); await loadExternalTopics(storage, fetcher, now); assert.equal(count, 1);
    storage.setItem(topics.INFO_HUB_CACHE_KEY, '{broken');
    assert.equal(await loadExternalTopics(storage, async () => { throw new Error('offline'); }, now), null);
    assert.equal(storage.getItem(topics.INFO_HUB_CACHE_KEY), null);
  });

  let integratedStorage; let integrated; let parentId; let discovery;
  await check('Day1通し：2会話目の興味→既存コンボ4派生2掘り下げ→派生語との外部発見', () => {
    integratedStorage = memory(); integrated = create(integratedStorage);
    const before = JSON.parse(integratedStorage.getItem(STATE_KEY));
    integrated.setExternalTopics(snapshot());
    const after = JSON.parse(integratedStorage.getItem(STATE_KEY));
    delete before.externalCatalog; delete after.externalCatalog;
    assert.deepEqual(after, before, '取得時の差分検出メタデータ以外は変更しない');
    parentId = early(integrated);
    const countBefore = JSON.parse(integratedStorage.getItem(STATE_KEY)).conversationCount;
    const kinds = []; let derived = 0;
    for (let index = 0; index < 6; index++) {
      const question = integrated.getNextPersonComboQuestion(parentId); kinds.push(question.kind);
      const answer = question.kind === 'deepDive' ? '友達と遊ぶところが気になる' : derived++ === 0 ? 'まいんくらふと' : `げーむ${'あ'.repeat(derived)}`;
      assert.equal(integrated.submitPersonComboAnswer(parentId, question.id, answer)?.ok, true);
    }
    assert.equal(kinds.filter((kind) => kind === 'derived').length, 4); assert.equal(kinds.filter((kind) => kind === 'deepDive').length, 2);
    const wordsBefore = integrated.getWordEntries();
    discovery = integrated.openExternalDiscovery('combo', parentId);
    assert.equal(discovery.debug.selectedTemplate, 'EXTERNAL_DISCOVERY');
    const use = integrated.getExternalTopicHistory()[0];
    assert.equal(use.kind, 'derived'); assert.equal(use.word, 'まいんくらふと'); assert.equal(use.rootWordId, parentId);
    assert.equal(use.topic.source, 'youtube'); assert.ok(discovery.debug.attributes.externalSourceUrl.startsWith('https://www.youtube.com/'));
    assert.deepEqual(integrated.getWordEntries(), wordsBefore);
    assert.equal(JSON.parse(integratedStorage.getItem(STATE_KEY)).conversationCount, countBefore, 'コンボと外部話題は会話を余分に消費しない');
    assert.equal(discovery.lines.some((line) => line.includes(video().title)), false);
    assert.ok(integrated.getMemoryEpisodes().some((episode) => episode.conversationId === use.id));
    assert.equal(integrated.openExternalDiscovery('combo', parentId), null);
  });

  await check('否定・訂正を原文保存し、再起動・新しい話題でも同じ根拠では再質問しない', () => {
    integrated.choose('EXTERNAL_CORRECT');
    const answer = '  名前は似ているけど、別の作品のことです。  ';
    integrated.submit(answer);
    const use = integrated.getExternalTopicHistory()[0]; assert.equal(use.status, 'REJECTED'); assert.equal(use.answer, answer);
    assert.ok(integrated.getMemoryRelations().some((relation) => relation.status === 'REJECTED' && relation.objectId === `external:${use.topic.id}`));
    const restored = create(integratedStorage); assert.deepEqual(restored.getExternalTopicHistory(), integrated.getExternalTopicHistory());
    assert.deepEqual(restored.getWordEntries(), integrated.getWordEntries());
    const state = JSON.parse(integratedStorage.getItem(STATE_KEY)); state.dayOverride = 2; integratedStorage.setItem(STATE_KEY, JSON.stringify(state));
    const next = create(integratedStorage);
    next.setExternalTopics(snapshot([video({ videoId: 'frFLZXKOvJ0', title: 'マインクラフトで建物を作る', url: 'https://www.youtube.com/watch?v=frFLZXKOvJ0' })]));
    assert.equal(next.openExternalDiscovery('combo', parentId), null, '広い親カテゴリーを使って訂正済みの路線を迂回しない');
    const match = topics.selectExternalMatch({ topics: snapshot().topics, words: next.getWordEntries().filter((word) => word.id === use.wordId),
      relations: next.getMemoryRelations(), history: next.getExternalTopicHistory(), day: 2, now });
    assert.equal(match, null);
  });

  await check('Day1のSELF6＋LEARN6と既存の記憶を維持する', () => {
    for (let index = 0; index < 10; index++) {
      const response = integrated.startSession();
      if (response.inputMode === 'choice') integrated.choose(response.choices[0].id);
      else {
        const followup = integrated.submit(`未見語${index}`);
        integrated.choose(followup.choices.at(-1).id);
      }
    }
    const seen = integrated.getSeenConversationIds();
    assert.equal(seen.filter((id) => id.startsWith('DAY01_SELF')).length, 6);
    assert.equal(seen.filter((id) => id.startsWith('DAY01_CURIOUS')).length, 6);
    assert.equal(JSON.parse(integratedStorage.getItem(STATE_KEY)).conversationCount, 12);
  });

  await check('一致なし・通信失敗でも初日のコンボ体験を終え、外部語を勝手に覚えない', () => {
    const conversation = create(); const id = early(conversation, '知らない星', 'NATURE_TIME', 'NATURE_TIME_7');
    conversation.setExternalTopics(null); const before = conversation.getWordEntries();
    const fallback = conversation.openExternalDiscovery('combo', id);
    assert.equal(fallback.stage, 'complete'); assert.match(fallback.lines.join(''), /まだ見つかっていない/);
    assert.deepEqual(conversation.getWordEntries(), before); assert.deepEqual(conversation.getExternalTopicHistory(), []);
    assert.equal(conversation.openExternalDiscovery('combo', id), null);
  });

  await check('大カテゴリーだけの一致は採用せず、明確な別名と中カテゴリー＋根拠を使う', () => {
    const word = (surface, category = 'GAME_MEDIA', subcategory = 'GAME_MEDIA_3') => ({ id: 'w1', surface, category, subcategory,
      rootWordId: 'w1', firstSeenDay: 1, learnedOrder: 1, mentionCount: 1 });
    const select = (entry, items = snapshot().topics) => topics.selectExternalMatch({ topics: items, words: [entry], relations: [], history: [], day: 1, now });
    assert.equal(select(word('ゼルダの伝説')), null);
    assert.equal(select(word('ゲーム', 'GAME_MEDIA', 'GAME_MEDIA_1')), null);
    assert.equal(select(word('ゲーム')).kind, 'domain');
    assert.equal(select(word('マイクラ')).kind, 'alias');
    assert.equal(select(word('音楽', 'AV_MEDIA', 'AV_MEDIA_1'), snapshot([video({ title: '新しい歌 Music Video', categoryId: 'AV_MEDIA', subcategoryId: 'AV_MEDIA_1' })]).topics).kind, 'domain');
  });

  await check('Day2の通常会話に1回だけ添え、記憶・派生会話は先に選ぶ', () => {
    const storage = memory(); const conversation = create(storage); early(conversation, 'マインクラフト');
    let state = JSON.parse(storage.getItem(STATE_KEY)); state.dayOverride = 2; storage.setItem(STATE_KEY, JSON.stringify(state));
    const day2 = create(storage); day2.setExternalTopics(snapshot());
    const first = day2.startSession(); assert.equal(first.debug.selectedTemplate, 'DAY02_SELF_01');
    const followup = day2.choose(first.choices[0].id); assert.equal(followup.debug.selectedTemplate, 'EXTERNAL_DISCOVERY');
    assert.equal(followup.debug.attributes.dayConversationId, first.debug.selectedTemplate);
    day2.choose('EXTERNAL_UNSURE');
    const second = day2.startSession(); const end = day2.choose(second.choices[0].id); assert.equal(end.stage, 'complete');
    assert.equal(day2.getExternalTopicHistory().length, 1);
    day2.startWordTeaching(); day2.submit('歴史人物A'); day2.chooseCategory('PERSON'); day2.chooseSubCategory('PERSON_HISTORICAL_CULTURAL'); day2.choose('WORD_NEUTRAL');
    state = JSON.parse(storage.getItem(STATE_KEY)); state.dayOverride = 3; storage.setItem(STATE_KEY, JSON.stringify(state));
    const day3 = create(storage); day3.setExternalTopics(snapshot([video({ videoId: 'frFLZXKOvJ0', url: 'https://www.youtube.com/watch?v=frFLZXKOvJ0' })]));
    assert.match(day3.startSession().debug.selectedTemplate, /PERSON_/);
  });

  await check('30日終了の外部履歴を個体アーカイブへ保存し、次世代へ信念をコピーしない', () => {
    const history = integrated.getExternalTopicHistory();
    const archive = createThirtyDayCycleArchive({ cycleNumber: 1, mochiId: 'test-child', activityDate: '2026-10-18',
      goalText: '', goalType: null, footprint: {}, handoffAdvice: {}, dailyProgressRecords: [], journalNotes: {}, suuhimochiDiaries: {},
      twoDayReviews: [], strategyRecords: [], divinationRecords: [], learnedWords: [], farewellLetter: null, externalTopicHistory: history });
    assert.deepEqual(archive.externalTopicHistory, history);
    const storage = memory(); globalThis.window = { localStorage: storage };
    storeSave({ ...EMPTY_SAVE, cycleArchives: [archive] });
    assert.deepEqual(loadSave().cycleArchives[0].externalTopicHistory, history);
    integrated.beginNextCycle('次の景色'); assert.deepEqual(integrated.getExternalTopicHistory(), []); assert.deepEqual(integrated.getWordEntries(), []);
    assert.equal(archive.externalTopicHistory.length, 1);
  });

  await check('実際の会話3種：既知語・派生路線・中カテゴリーの入口', () => {
    for (const [label, word, category, subcategory, items] of [
      ['既知語', 'マインクラフト', 'GAME_MEDIA', 'GAME_MEDIA_3', [video()]],
      ['別名', 'マイクラ', 'GAME_MEDIA', 'GAME_MEDIA_3', [video()]],
      ['音楽の入口', '音楽', 'AV_MEDIA', 'AV_MEDIA_1', [video({ title: '新しい歌 Music Video', categoryId: 'AV_MEDIA', subcategoryId: 'AV_MEDIA_1' })]],
    ]) {
      assert.equal(typeof label, 'string');
      const conversation = create(); const id = early(conversation, word, category, subcategory); conversation.setExternalTopics(snapshot(items));
      const response = conversation.openExternalDiscovery('combo', id); assert.equal(response.debug.selectedTemplate, 'EXTERNAL_DISCOVERY');
      console.log(`EXAMPLE ${typeof label === 'string' ? label : ''}: ${response.lines.join(' / ')}`);
    }
  });
  console.log(`External bridge: ${passed} passed`);
} finally { await vite.close(); }
