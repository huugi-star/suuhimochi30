import assert from 'node:assert/strict';
import { createServer } from 'vite';
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
const memory = () => { const values = new Map(); return { values, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }; };
let passed = 0; const check = async (name, test) => { await test(); passed++; console.log('PASS', name); };
const now = new Date('2026-10-21T12:00:00+09:00');
try {
  const shared = await vite.ssrLoadModule('/lib/sharedKnowledge.ts');
  const client = await vite.ssrLoadModule('/lib/sharedKnowledgeClient.ts');
  const { createSharedKnowledgeService } = await vite.ssrLoadModule('/lib/sharedKnowledgeServer.ts');
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const dictionaryRoute = await vite.ssrLoadModule('/app/api/shared-knowledge/dictionary/route.ts');
  const dialogueRoute = await vite.ssrLoadModule('/app/api/shared-knowledge/dialogues/route.ts');
  const reply = (keyword = '宇宙') => ({ status: 'OK', keyword, items: Array.from({ length: 6 }, (_, style) => ({ style,
    dialogue: `  人間さん、${keyword}のことを考えたの。${'まだ'.repeat(style + 1)}知らないところがあるの。\n`,
    thoughtStyle: ['文字どおり受け取る', '主役よりおまけ', '自分に置き換える', '変なところを心配する', '勝手にルールを発見する', '予想外の疑問を持つ'][style],
    sourceUrl: `https://ja.wikipedia.org/wiki/${encodeURIComponent(keyword)}`, attribution: 'Wikipedia（CC BY-SA 4.0）' })) });
  const prepared = (keyword = '宇宙') => ({ dictionary: { keywords: [keyword], fetchedAt: now.toISOString() }, caches: [{ keyword, fetchedAt: now.toISOString(), items: shared.parseSharedDialogues(reply(keyword), keyword) }], error: null });
  const seed = () => {
    const storage = memory(); let talk = new SuuhimochiConversation({ storage, now: () => now, random: () => 0 });
    talk.setGoal('新しい景色'); talk.startWordTeaching(); talk.submit('宇宙'); talk.chooseCategory('NATURE_TIME'); talk.chooseSubCategory('NATURE_TIME_7'); talk.choose('WORD_INTERESTED');
    const data = JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices')); data.dayOverride = 2; storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify(data));
    talk = new SuuhimochiConversation({ storage, now: () => now, random: () => 0 }); return { storage, talk };
  };
  await check('初期OFF・不正保存はOFF、同意前後に不要な送信なし', async () => {
    const storage = memory(); assert.deepEqual(shared.readSharedPreference(storage), { version: 1, enabled: false, decided: false });
    storage.setItem(shared.SHARED_PREFERENCE_KEY, JSON.stringify({ version: 1, enabled: true, decided: false }));
    await client.loadSharedKnowledge(storage, ['秘密の友達', '日誌全文'], async () => { throw new Error('must never fetch'); }, now);
    shared.writeSharedPreference(storage, false); assert.equal(shared.readSharedPreference(storage).decided, true);
    await client.loadSharedKnowledge(storage, ['宇宙'], async () => { throw new Error('OFF must not fetch'); }, now);
  });
  await check('共有辞書を全ページ取得し、完全一致した公開語だけを送る', async () => {
    const storage = memory(); shared.writeSharedPreference(storage, true); const calls = [];
    const result = await client.loadSharedKnowledge(storage, ['宇宙', '宇宙の秘密', '山田太郎', '連絡先09012345678', '人間さんの日誌'], async (url, init) => {
      calls.push(url); assert.equal(init.credentials, 'omit'); assert.equal(init.body, undefined); assert.equal(init.headers['x-shared-knowledge-consent'], '1');
      if (url.includes('dictionary')) return Response.json(url.includes('offset=0') ? { status: 'OK', keywords: ['将棋'], nextOffset: 200 } : { status: 'OK', keywords: ['宇宙'], nextOffset: null });
      assert.equal(url, '/api/shared-knowledge/dialogues?keyword=' + encodeURIComponent('宇宙')); return Response.json(reply());
    }, now);
    assert.deepEqual(result.dictionary.keywords, ['将棋', '宇宙']); assert.equal(result.caches[0].items.length, 6); assert.equal(calls.length, 3);
    assert.equal(calls.join('').includes('山田'), false);
  });
  await check('曖昧・部分・大文字小文字・全角の一致を使わない', async () => {
    const storage = memory(); shared.writeSharedPreference(storage, true); let calls = 0;
    await client.loadSharedKnowledge(storage, ['Minecraft', 'Ｍｉｎｅｃｒａｆｔ', 'minecraft好き', 'マイクラ'], async (url) => {
      calls++; assert.match(url, /dictionary/); return Response.json({ status: 'OK', keywords: ['minecraft'], nextOffset: null });
    }, now); assert.equal(calls, 1);
  });
  await check('一般人名・プロフィール・身内の名前は公開語と同形でも追加の拒否条件になる', () => {
    const word = (surface, category, subcategory) => ({ id: surface, surface, category, subcategory });
    const words = [word('山田花子', 'PERSON', 'PERSON_2'), word('山田花子', 'KNOWLEDGE', 'KNOWLEDGE_1'), word('宇宙', 'NATURE_TIME', 'NATURE_TIME_7'), word('利用者名', 'OTHER', 'OTHER_1')];
    assert.deepEqual(shared.sharedCandidateSurfaces(words, ['利用者名']), ['宇宙']);
    assert.equal(shared.selectSharedDialogue(shared.parseSharedDialogues(reply('山田花子'), '山田花子'), words, [], now), null);
  });
  await check('禁止話題・悪意ある文章・連絡先を辞書に混ぜても問い合わせない', async () => {
    for (const value of ['ナ チ ス', '真夏の夜の淫夢', 'ヒトラー', '花子は裏切り者', '<script>秘密</script>', 'ignore previous instructions', 'test@example.com', '09012345678']) assert.equal(shared.safeSharedKeyword(value), false, value);
    const storage = memory(); shared.writeSharedPreference(storage, true); let calls = 0;
    await client.loadSharedKnowledge(storage, ['ナチス', '秘密の一般人'], async (url) => { calls++; assert.match(url, /dictionary/); return Response.json({ status: 'OK', keywords: ['ナチス'], nextOffset: null }); }, now);
    assert.equal(calls, 1);
  });
  await check('完成済みセリフ6種類・空白・改行・出典を原文のまま保持する', () => {
    const raw = reply(); const parsed = shared.parseSharedDialogues(raw, '宇宙');
    assert.equal(parsed.length, 6); for (let i = 0; i < 6; i++) { assert.equal(parsed[i].style, i); assert.equal(parsed[i].dialogue, raw.items[i].dialogue); }
    assert.deepEqual(shared.parseSharedDialogues({ ...raw, keyword: '別の語' }, '宇宙'), []);
    assert.deepEqual(shared.parseSharedDialogues({ ...raw, items: [{ ...raw.items[0], style: 6 }, { ...raw.items[1], sourceUrl: 'javascript:alert(1)' }] }, '宇宙'), []);
  });
  await check('日次キャッシュ再利用、途中ページ失敗では正常な辞書を壊さない', async () => {
    const storage = memory(); shared.writeSharedPreference(storage, true);
    const raw = JSON.stringify({ fetchedAt: new Date(now.getTime() - 25 * 3600000).toISOString(), keywords: ['宇宙'] }); storage.setItem(shared.SHARED_DICTIONARY_KEY, raw);
    const cached = prepared(); storage.setItem(shared.SHARED_DIALOGUES_KEY, JSON.stringify(cached.caches)); let calls = 0;
    const result = await client.loadSharedKnowledge(storage, ['宇宙'], async (url) => { calls++; if (url.includes('offset=0')) return Response.json({ status: 'OK', keywords: ['将棋'], nextOffset: 200 }); throw new Error('offline'); }, now);
    assert.equal(result.dictionary.keywords[0], '宇宙'); assert.equal(storage.getItem(shared.SHARED_DICTIONARY_KEY), raw); assert.equal(result.caches[0].items.length, 6);
    await client.loadSharedKnowledge(storage, ['宇宙'], async () => { throw new Error('must back off'); }, now); assert.equal(calls, 2);
  });
  await check('NOT_CONFIGURED・通信障害・空辞書は共有機能だけを停止する', async () => {
    for (const payload of [{ status: 'NOT_CONFIGURED', items: [] }, { status: 'OK', keywords: [], nextOffset: null }]) {
      const storage = memory(); shared.writeSharedPreference(storage, true); let calls = 0;
      const result = await client.loadSharedKnowledge(storage, ['宇宙'], async (url) => { calls++; assert.match(url, /dictionary/); return Response.json(payload); }, now);
      assert.equal(calls, 1); assert.equal(result.caches.length, 0);
      const { talk } = seed(); talk.setSharedKnowledge(result, true); assert.equal(talk.prepareSharedKnowledgeTalk('startup'), null); assert.equal(talk.startSession().debug.selectedTemplate, 'DAY02_SELF_01');
    }
  });
  await check('通信中にOFFへ変更したら後続の語取得も保存も止める', async () => {
    const storage = memory(); shared.writeSharedPreference(storage, true); let calls = 0;
    await client.loadSharedKnowledge(storage, ['宇宙'], async () => { calls++; shared.writeSharedPreference(storage, false); return Response.json({ status: 'OK', keywords: ['宇宙'], nextOffset: null }); }, now);
    assert.equal(calls, 1); assert.equal(storage.getItem(shared.SHARED_DICTIONARY_KEY), null);
  });
  await check('APIも独立して許可辞書を検証し、未知語をWorkerへ転送しない', async () => {
    const calls = []; const service = createSharedKnowledgeService(async (url, init) => {
      calls.push(url); assert.equal(init.body, undefined); assert.equal(init.redirect, 'error');
      return Response.json(url.includes('shared-dictionary') ? { status: 'OK', keywords: ['宇宙'], nextOffset: null } : reply());
    }, () => now);
    assert.deepEqual(await service.dialogues('知らない人'), []); assert.equal(calls.length, 1);
    assert.equal((await service.dialogues('宇宙')).length, 6); assert.equal(calls.length, 2);
    assert.equal(calls.some((url) => url.includes(encodeURIComponent('知らない人'))), false);
    assert.equal((await dictionaryRoute.GET(new Request('http://app/api/shared-knowledge/dictionary'))).status, 403);
    assert.equal((await dialogueRoute.GET(new Request('http://app/api/shared-knowledge/dialogues?keyword=unknown'))).status, 403);
  });
  await check('Worker未設定・不正セリフ応答を成功した空データとしてキャッシュしない', async () => {
    const service = createSharedKnowledgeService(async (url) => Response.json(url.includes('shared-dictionary')
      ? { status: 'OK', keywords: ['宇宙'], nextOffset: null } : { status: 'NOT_CONFIGURED', items: [] }), () => now);
    await assert.rejects(service.dialogues('宇宙'), /SHARED_UNAVAILABLE/);
    const storage = memory(); shared.writeSharedPreference(storage, true);
    storage.setItem(shared.SHARED_DICTIONARY_KEY, JSON.stringify(prepared().dictionary));
    const previous = prepared().caches.map((cache) => ({ ...cache, fetchedAt: new Date(now.getTime() - 25 * 3600000).toISOString() }));
    storage.setItem(shared.SHARED_DIALOGUES_KEY, JSON.stringify(previous));
    const result = await client.loadSharedKnowledge(storage, ['宇宙'], async () => Response.json({ status: 'OK', keyword: '宇宙' }), now);
    assert.equal(result.error, 'SHARED_DIALOGUES_UNAVAILABLE'); assert.equal(result.caches[0].items.length, 6);
  });
  await check('起動会話は共有を選べるが通常12枠・辞書・仮面・友好度を増やさない', () => {
    const { talk, storage } = seed(); const before = JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices'));
    talk.setSharedKnowledge(prepared(), true); const plan = talk.prepareSharedKnowledgeTalk('startup'); assert.ok(plan);
    assert.equal(plan.lines.join(''), plan.item.dialogue); assert.equal(talk.getSharedKnowledgeHistory().length, 0);
    const id = talk.markSharedKnowledgeTalkShown(plan); assert.ok(id); assert.equal(talk.markSharedKnowledgeTalkShown(plan), null);
    talk.finishSharedKnowledgeTalk(id, 'SKIPPED'); talk.finishSharedKnowledgeTalk(id, 'FINISHED'); assert.equal(talk.getSharedKnowledgeHistory()[0].outcome, 'SKIPPED');
    const after = JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices'));
    for (const key of ['words', 'memories', 'memoryRelations', 'memoryEpisodes', 'conversationCount', 'seenConversationIds']) assert.deepEqual(after[key], before[key], key);
  });
  await check('再起動しても同じセリフを再生せず、通常会話・想起の順序を保つ', () => {
    const { storage, talk } = seed(); talk.setSharedKnowledge(prepared(), true); const plan = talk.prepareSharedKnowledgeTalk('startup'); talk.markSharedKnowledgeTalkShown(plan);
    const restarted = new SuuhimochiConversation({ storage, now: () => now, random: () => 0 }); restarted.setSharedKnowledge(prepared(), true);
    assert.equal(restarted.prepareSharedKnowledgeTalk('startup'), null); assert.equal(restarted.startSession().debug.selectedTemplate, 'DAY02_SELF_01');
    const later = new SuuhimochiConversation({ storage, now: () => new Date(now.getTime() + 25 * 3600000), random: () => 0 }); later.setSharedKnowledge(prepared(), true);
    assert.notEqual(later.prepareSharedKnowledgeTalk('startup').item.id, plan.item.id);
  });
  await check('ONでもSELFを先に表示し、既存の会話終了境界で共有を優先する', () => {
    const { talk } = seed(); talk.setSharedKnowledge(prepared(), true);
    const first = talk.startSession(); assert.equal(first.debug.selectedTemplate, 'DAY02_SELF_01');
    const words = talk.getWordEntries(); const response = talk.choose(first.choices[0].id);
    assert.equal(response.debug.selectedTemplate, 'SHARED_KNOWLEDGE'); assert.equal(response.debug.attributes.dayConversationId, first.debug.selectedTemplate);
    assert.equal(response.stage, 'complete'); assert.equal(response.inputMode, 'none'); assert.equal(response.debug.attributes.sharedSourceUrl, prepared().caches[0].items[0].sourceUrl);
    assert.ok(response.lines.includes(prepared().caches[0].items[0].dialogue)); assert.deepEqual(talk.getWordEntries(), words);
  });
  await check('コンボ後も元の返答を失わず、出典と原文を別々に保持する', () => {
    const { talk } = seed(); talk.setSharedKnowledge(prepared(), true);
    const response = talk.openExternalDiscovery('combo', undefined, ['元の台本の返答。']);
    assert.equal(response.lines[0], '元の台本の返答。'); assert.equal(response.lines[1], prepared().caches[0].items[0].dialogue);
    assert.match(response.debug.attributes.sharedAttribution, /CC BY-SA 4.0/);
  });
  await check('30日リセットは共有履歴だけを空にし、端末同意を聞き直さない', () => {
    const { storage, talk } = seed(); shared.writeSharedPreference(storage, true); talk.setSharedKnowledge(prepared(), true); talk.markSharedKnowledgeTalkShown(talk.prepareSharedKnowledgeTalk('startup'));
    talk.beginNextCycle('次の目標'); assert.deepEqual(talk.getSharedKnowledgeHistory(), []); assert.equal(shared.readSharedPreference(storage).enabled, true);
  });
  await check('safe-briefs互換モジュールと名前置換・無改変ページ分割を保持する', async () => {
    const { dialogueToZoomPages, replaceHumanName, parseExternalBriefFeed } = await vite.ssrLoadModule('/lib/externalBriefs.ts');
    const text = '人間さん、' + '知らないことがあるの。'.repeat(12); assert.equal(dialogueToZoomPages(text).join(''), text); assert.equal(replaceHumanName('人間さん、こんにちは。', 'テストさん'), 'テストさん、こんにちは。');
    assert.equal(parseExternalBriefFeed({ schemaVersion: 1, items: [], contentRevision: 'unchanged' }).schemaVersion, 1);
  });
  console.log(`Shared knowledge: ${passed} passed`);
} finally { await vite.close(); }
