import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { NOW, brief, feed } from './fixtures/external-monologues.mjs';
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
let passed = 0; const check = async (name, fn) => { await fn(); passed++; console.log('PASS', name); };
try {
  const { hasExternalWord, externalTopicMentions } = await vite.ssrLoadModule('/lib/externalWordMatch.ts');
  const { evaluateExternalTopics, startupDiscoveryLines } = await vite.ssrLoadModule('/lib/externalTopics.ts');
  const { parseExternalBriefFeed, pickExternalBrief } = await vite.ssrLoadModule('/lib/externalBriefs.ts');
  const { monologueCandidates, selectMonologue } = await vite.ssrLoadModule('/lib/externalMonologues.ts');
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const now = new Date(NOW), videoId = 'abcdefghijk';
  const topic = (title, relatedTerms = [], subcategory = 'AV_MEDIA_4') => ({ id: `youtube:${videoId}`, source: 'youtube', title,
    url: `https://www.youtube.com/watch?v=${videoId}`, category: subcategory === 'GAME_MEDIA_3' ? 'GAME_MEDIA' : 'AV_MEDIA', subcategory,
    updatedAt: NOW, publishedAt: NOW, relatedTerms });
  const word = (surface, category = 'TOOL', subcategory = 'TOOL_8') => ({ id: `word:${surface}`, surface, category, subcategory });
  const assess = (title, words, extra = {}) => evaluateExternalTopics({ topics: [topic(title)], words, relations: [], history: [], now, day: 16, ...extra });
  await check('「まり」を集まりました・つまり・たまり場・まりも・マリオから検出しない', () => {
    for (const title of ['濃いメンツで集まりました', 'つまり、話を聞こう', 'みんなのたまり場', '困りました', 'まりもを育てる', 'マリオカート', 'ひまりと遊ぶ']) {
      assert.equal(hasExternalWord(title, 'まり'), false, title);
      assert.equal(assess(title, [word('まり')]).selected, null, title);
      assert.equal(assess(title, [word('まり')], { allowGeneral: true }).selected.kind, 'general', title);
    }
  });
  await check('形態素境界に加え、短いかな・未知のカタカナ複合語は曖昧なら記憶を付けない', () => {
    assert.equal(hasExternalWord('まりで遊ぼう', 'まり'), false, '短いかなの単独トークンだけで意味を決めない');
    assert.equal(hasExternalWord('マインクラフトで遊ぼう', 'マイ'), false);
    assert.equal(hasExternalWord('マインクラフトで遊ぼう', 'クラフト'), false);
    assert.equal(hasExternalWord('猫耳の帽子', '猫'), false);
    assert.equal(externalTopicMentions({ title: '濃いメンツで集まりました', relatedTerms: ['集まりました'] }, 'まり'), false);
  });
  await check('独立語・明示された関連語・既知の複合名・英語の境界は認識する', () => {
    for (const [title, term] of [['まり', 'まり'], ['「まり」で遊ぼう', 'まり'], ['【マインクラフト】新しい建物', 'マインクラフト'],
      ['マインクラフトで建物を作る', 'まいんくらふと'], ['League of Legends の配信', 'League of Legends'], ['ＡＩ生成の絵', 'AI'], ['Thai / AI', 'AI']]) {
      assert.equal(hasExternalWord(title, term), true, `${term}: ${title}`);
    }
    for (const [title, term] of [['Thaiの料理', 'AI'], ['Minecrafting challenge', 'Minecraft'], ['a b の話題', 'ab']]) assert.equal(hasExternalWord(title, term), false);
    assert.equal(externalTopicMentions({ title: '遊びの道具', relatedTerms: ['まり'] }, 'まり'), true);
  });
  await check('派生語・明確な別名は残し、読みだけの部分一致を拒否する', () => {
    const named = topic('マインクラフトで建物を作る', [], 'GAME_MEDIA_3');
    const select = (entry, readings = {}) => evaluateExternalTopics({ topics: [named], words: [entry], relations: [], readings, history: [], now, day: 16 }).selected;
    assert.equal(select(word('マインクラフト', 'GAME_MEDIA', 'GAME_MEDIA_3')).kind, 'exact');
    assert.equal(select({ ...word('まいんくらふと', 'GAME_MEDIA', 'GAME_MEDIA_3'), firstDerivedFromWordId: 'root' }).kind, 'derived');
    assert.equal(select(word('マイクラ', 'GAME_MEDIA', 'GAME_MEDIA_3')).kind, 'alias');
    const reading = word('毬');
    assert.equal(assess('濃いメンツで集まりました', [reading], { readings: { [reading.id]: 'まり' } }).selected, null);
  });
  await check('中カテゴリーの根拠も単語単位にし、歌舞伎町やOLIVEを音楽の根拠にしない', () => {
    for (const title of ['歌舞伎町に集まった', 'OLIVEを育てる', '道路が曲がった']) {
      assert.equal(assess(title, [word('音楽', 'AV_MEDIA', 'AV_MEDIA_1')], { topics: [topic(title, [], 'AV_MEDIA_1')] }).selected, null);
    }
    assert.equal(assess('新しい歌 Music Video', [word('音楽', 'AV_MEDIA', 'AV_MEDIA_1')], { topics: [topic('新しい歌 Music Video', [], 'AV_MEDIA_1')] }).selected.kind, 'domain');
  });
  await check('関連なしでも元のGemmaセリフを改変せず表示し、誤った記憶・報酬・単語を増やさない', () => {
    const values = new Map(), storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
    let talk = new SuuhimochiConversation({ storage, now: () => now }); talk.setGoal('作品を作る');
    talk.startWordTeaching(); talk.submit('まり'); talk.chooseCategory('TOOL'); talk.chooseSubCategory('TOOL_8'); talk.choose('WORD_INTERESTED');
    const key = 'suuhimochi_conversation_v6_choices', save = JSON.parse(storage.getItem(key)); save.dayOverride = 16; storage.setItem(key, JSON.stringify(save));
    talk = new SuuhimochiConversation({ storage, now: () => now });
    assert.ok(talk.getWordEntries().some((item) => item.surface === 'まり'));
    const original = 'いろんな人が集まった動画なの。どんなお話になるのか、ぼくもちょっと気になるな。';
    const parsed = parseExternalBriefFeed(feed([{ ...brief(videoId, 'youtube', original, '濃いメンツで集まりました'), relatedTo: ['濃いメンツで集まりました'] }]));
    const card = selectMonologue(monologueCandidates(talk, storage, parsed, [], now), [], now);
    assert.equal(card.match.kind, 'general'); assert.equal(card.text, original); assert.equal(card.completed, true);
    const before = JSON.parse(storage.getItem(key));
    assert.ok(talk.recordExternalMonologue(card.match, card.text, 'boot:boundary-test', 'startup'));
    const after = JSON.parse(storage.getItem(key));
    for (const field of ['words', 'memories', 'relations', 'memoryRelations', 'memoryEpisodes', 'conversationCount', 'seenConversationIds', 'goalChecks']) assert.deepEqual(after[field], before[field], field);
    assert.equal(talk.getExternalTopicHistory().at(-1).wordId, '');
    assert.equal(talk.getExternalTopicHistory().at(-1).lines[0], original);
    // An old false positive remains historical data, not evidence for a fresh preview.
    after.externalTopicHistory[0] = { ...after.externalTopicHistory[0], kind: 'exact', wordId: talk.getWordEntries()[0].id, rootWordId: talk.getWordEntries()[0].id,
      word: 'まり', rootWord: 'まり', evidence: 'まり', evidenceKey: 'old-false-positive' }; storage.setItem(key, JSON.stringify(after));
    const restored = new SuuhimochiConversation({ storage, now: () => now });
    const preview = restored.previewExternalTopic(card.match.topic); assert.equal(preview.match.kind, 'general');
    assert.ok(preview.lines.every((line) => !line.includes('教えてもらったまり')));
    assert.equal(restored.getExternalTopicHistory()[0].word, 'まり', '過去の記録は勝手に書き換えない');
  });
  await check('完成セリフがなくても、関連なしの反応には過去の単語を挿入しない', () => {
    const match = assess('濃いメンツで集まりました', [word('まり')], { allowGeneral: true }).selected;
    for (let variation = 0; variation < 4; variation++) assert.ok(startupDiscoveryLines(match, variation).every((line) => !line.includes('教えてもらったまり')));
  });
  await check('旧カード選択も部分一致を使わず、本当に独立した語を含む候補を優先する', () => {
    const cards = parseExternalBriefFeed(feed([brief('a-false', 'google_trending_now', '元の文。', '濃いメンツで集まりました'), brief('z-true', 'google_trending_now', '元の文。', '「まり」で遊ぶ')])).items;
    assert.equal(pickExternalBrief(cards, ['まり'], new Set()).id, 'google:z-true');
  });
  await check('日本語の分割機能がない環境では、全文または区切られた語だけを採用する', async () => {
    const original = Intl.Segmenter;
    try {
      Intl.Segmenter = undefined;
      const fallback = await vite.ssrLoadModule('/lib/externalWordMatch.ts?without-segmenter');
      assert.equal(fallback.hasExternalWord('濃いメンツで集まりました', 'まり'), false);
      assert.equal(fallback.hasExternalWord('【まり】', 'まり'), true);
      assert.equal(fallback.hasExternalWord('マインクラフトで遊ぶ', 'マインクラフト'), false);
    } finally { Intl.Segmenter = original; }
  });
  console.log(`External word matching: ${passed} passed`);
} finally { await vite.close(); }
