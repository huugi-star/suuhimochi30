import assert from 'node:assert/strict';
import { createServer } from 'vite';
process.env.TZ = 'Asia/Tokyo';
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false }, appType: 'custom' });
const values = new Map();
const memory = () => { const data = new Map(); return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) }; };
let passed = 0;
const check = (name, test) => { test(); passed++; console.log('PASS', name); };
try {
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const { StartupOpportunity } = await vite.ssrLoadModule('/lib/startupExperience.ts');
  const { getActivityDateKey } = await vite.ssrLoadModule('/lib/dailyProgress.ts');
  const { externalExpiry, normalizeHubFeed, startupDiscoveryLines } = await vite.ssrLoadModule('/lib/externalTopics.ts');
  const { saveJournalFootprint } = await vite.ssrLoadModule('/lib/journalProgress.ts');
  const { EMPTY_SAVE, loadSave, storeSave } = await vite.ssrLoadModule('/lib/storage.ts');
  let now = new Date('2026-10-18T09:00:00+09:00');
  const makeSnapshot = (id = 'mgiB_j3gZwM', title = 'マインクラフトの動画') => ({ fetchedAt: now.toISOString(), expiresAt: externalExpiry(now),
    topics: normalizeHubFeed({ source: 'YouTube', updatedAt: now.toISOString(), items: [{ videoId: id, title,
      url: `https://www.youtube.com/watch?v=${id}`, source: 'youtube', categoryId: 'GAME_MEDIA', subcategoryId: 'GAME_MEDIA_3', publishedAt: now.toISOString() }] }, 'safe-youtube', now) });
  const create = (storage = memory()) => new SuuhimochiConversation({ storage, now: () => now, random: () => 0 });
  const seed = () => {
    const storage = memory(); const talk = create(storage); talk.setGoal('自分の作品を作る');
    talk.startWordTeaching(); talk.submit('マインクラフト'); talk.chooseCategory('GAME_MEDIA'); talk.chooseSubCategory('GAME_MEDIA_3'); talk.choose('WORD_INTERESTED');
    const saved = JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices')); saved.startDate = '2026-10-17';
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify(saved));
    return { storage, talk: create(storage) };
  };
  check('Day1は起動会話の対象外、Day2から準備可能', () => {
    const first = create(); first.setExternalTopics(makeSnapshot());
    assert.equal(first.prepareStartupExternalTalk(), null); assert.deepEqual(first.getStartupExternalAttempts(), []);
    const { talk } = seed(); talk.setExternalTopics(makeSnapshot()); assert.ok(talk.prepareStartupExternalTalk());
  });
  check('部屋で最初の操作があったら、遅い取得・重複完了でズームしない', () => {
    const opportunity = new StartupOpportunity(); opportunity.interact();
    assert.equal(opportunity.take(false), 'BUSY'); assert.equal(opportunity.take(false), null);
    const late = new StartupOpportunity(); assert.equal(late.take(false), 'READY'); assert.equal(late.take(false), null);
    const modal = new StartupOpportunity(); assert.equal(modal.take(true), 'BUSY'); assert.equal(modal.take(false), null);
  });
  check('0件・通信待ち・操作中は別の起動結果として保存し、表示済みにしない', () => {
    const { storage, talk } = seed(); const before = talk.getWordEntries();
    assert.equal(talk.prepareStartupExternalTalk(), null); talk.recordStartupOpportunity('NO_TOPIC');
    talk.setExternalTopics(makeSnapshot()); assert.equal(talk.prepareStartupExternalTalk(), null);
    assert.deepEqual(talk.getExternalTopicHistory(), []); assert.deepEqual(talk.getWordEntries(), before);
    const restarted = create(storage); restarted.setExternalTopics(makeSnapshot()); assert.ok(restarted.prepareStartupExternalTalk(), '再起動は新しい機会として扱う');
    assert.equal(restarted.getStartupExternalAttempts()[0].outcome, 'NO_TOPIC');
    const busy = seed().talk; busy.recordStartupOpportunity('BUSY'); assert.equal(busy.getStartupExternalAttempts()[0].outcome, 'BUSY');
  });
  check('準備だけでは表示履歴が増えず、実表示の確定は一度だけ', () => {
    const { talk } = seed(); talk.setExternalTopics(makeSnapshot());
    const plan = talk.prepareStartupExternalTalk(); const duplicate = talk.prepareStartupExternalTalk();
    assert.equal(plan.lines.length, 2); assert.deepEqual(talk.getExternalTopicHistory(), []);
    assert.ok(talk.markStartupExternalTalkShown(plan)); assert.equal(talk.markStartupExternalTalkShown(duplicate), null);
    assert.equal(talk.getExternalTopicHistory().length, 1); assert.equal(talk.getExternalTopicHistory()[0].startupOutcome, 'SHOWN');
  });
  check('スキップを保存し、同じ活動日の再起動では再生しない', () => {
    const { storage, talk } = seed(); talk.setExternalTopics(makeSnapshot());
    const id = talk.markStartupExternalTalkShown(talk.prepareStartupExternalTalk());
    talk.finishStartupExternalTalk(id, 'SKIPPED'); talk.finishStartupExternalTalk(id, 'FINISHED');
    assert.equal(talk.getExternalTopicHistory()[0].startupOutcome, 'SKIPPED');
    const restarted = create(storage); restarted.setExternalTopics(makeSnapshot()); assert.equal(restarted.prepareStartupExternalTalk(), null);
    assert.equal(restarted.getStartupExternalAttempts()[0].outcome, 'SKIPPED');
  });
  check('同日の再起動でも新しい話題を選べ、活動日だけは7時に切り替わる', () => {
    const { storage, talk } = seed(); talk.setExternalTopics(makeSnapshot());
    const id = talk.markStartupExternalTalkShown(talk.prepareStartupExternalTalk()); talk.finishStartupExternalTalk(id, 'FINISHED');
    for (const time of ['2026-10-19T00:00:00+09:00', '2026-10-19T06:59:59+09:00']) {
      now = new Date(time); const restarted = create(storage); restarted.setExternalTopics(makeSnapshot('frFLZXKOvJ0', 'マインクラフトの別の紹介'));
      assert.equal(restarted.getCurrentDay(), 2); assert.ok(restarted.prepareStartupExternalTalk());
    }
    now = new Date('2026-10-19T07:00:00+09:00'); const next = create(storage); next.setExternalTopics(makeSnapshot('frFLZXKOvJ0', 'マインクラフトの新しい紹介'));
    assert.equal(next.getCurrentDay(), 3); assert.equal(getActivityDateKey(now), '2026-10-19'); assert.ok(next.prepareStartupExternalTalk());
    now = new Date('2026-10-18T09:00:00+09:00');
  });
  check('起動会話は通常12枠・辞書・報酬を消費せず、質問・選択肢を開始しない', () => {
    const { storage, talk } = seed(); talk.setExternalTopics(makeSnapshot());
    const before = JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices'));
    const words = talk.getWordEntries(); const id = talk.markStartupExternalTalkShown(talk.prepareStartupExternalTalk()); talk.finishStartupExternalTalk(id, 'FINISHED');
    const after = JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices'));
    assert.equal(before.conversationCount, after.conversationCount); assert.deepEqual(after.seenConversationIds, before.seenConversationIds);
    assert.deepEqual(talk.getWordEntries(), words); assert.equal(talk.startSession().debug.selectedTemplate, 'DAY02_SELF_01');
    assert.equal(talk.getMemoryEpisodes().at(-1).conversationId, id);
  });
  check('Day30でも重要イベント開始前は利用でき、別れ開始後は割り込まない', () => {
    const { storage } = seed(); const data = JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices'));
    data.dayOverride = 30; storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify(data));
    const talk = create(storage); talk.setExternalTopics(makeSnapshot()); assert.ok(talk.prepareStartupExternalTalk());
    talk.startSession(); assert.equal(talk.prepareStartupExternalTalk(), null);
  });
  check('旧保存を読み、進捗未記入の日も起動でき、次の個体には起動履歴を持ち越さない', () => {
    const { storage, talk } = seed(); talk.recordStartupOpportunity('NO_TOPIC');
    assert.equal(create(storage).getCurrentDay(), 2);
    const saved = JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices')); delete saved.startupExternalAttempts;
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify(saved)); assert.deepEqual(create(storage).getStartupExternalAttempts(), []);
    talk.beginNextCycle('次の作品'); assert.deepEqual(talk.getStartupExternalAttempts(), []); assert.deepEqual(talk.getExternalTopicHistory(), []);
  });
  const context = { currentDay: 3, memories: [], words: [], now };
  const record = { date: '2026-10-18', reviewedDate: '2026-10-17', yesterdayEvaluation: 'STEP', doneItems: ['作品をひとつ作った'], wasHard: true, recordedAt: now.toISOString() };
  check('日誌の保存は日記・経験リンゴ・友好度へ反映し、同じ日の追記で重複しない', () => {
    const save=saveJournalFootprint(structuredClone(EMPTY_SAVE),record.reviewedDate,record.doneItems,context);
    assert.deepEqual(save.dailyProgressRecords,[]); assert.equal(save.lastDailyProgressActivityDate,'');
    assert.deepEqual(save.journalNotes[record.reviewedDate],record.doneItems);assert.equal(save.experienceFruits.length,3);
    const twice=saveJournalFootprint(save,record.reviewedDate,record.doneItems,context);
    assert.equal(twice.friendship,save.friendship);assert.equal(twice.experienceFruits.length,3);assert.ok(save.suuhimochiDiaries[record.reviewedDate]);
  });
  check('旧評価記録を残しながら日誌本文だけを更新し、新しい評価は作らない', () => {
    const initial={...structuredClone(EMPTY_SAVE),dailyProgressRecords:[record]};
    let save=saveJournalFootprint(initial,'2026-10-17',['書いたこと'],context);
    save=saveJournalFootprint(save,'2026-10-16',['古い日のこと'],context);
    assert.equal(save.dailyProgressRecords.length,1);assert.equal(save.dailyProgressRecords[0].yesterdayEvaluation,'STEP');
    assert.deepEqual(save.dailyProgressRecords[0].doneItems,['書いたこと']);assert.equal(save.experienceFruits.length,6);
    const revised=saveJournalFootprint(save,'2026-10-17',['追記したこと'],context);
    assert.equal(revised.experienceFruits.length,6);assert.equal(revised.friendship,save.friendship);
  });
  check('日誌入力中に7時をまたいでも所属日を変更しない', () => {
    const save=saveJournalFootprint(structuredClone(EMPTY_SAVE),'2026-10-17',record.doneItems,{...context,now:new Date('2026-10-19T07:00:00+09:00')});
    assert.deepEqual(save.journalNotes['2026-10-17'],record.doneItems);assert.deepEqual(save.dailyProgressRecords,[]);
    assert.equal(save.lastDailyProgressActivityDate,'');
  });
  check('旧評価を保存復元でき、未記入を自動評価しない', () => {
    const initial=structuredClone(EMPTY_SAVE);assert.deepEqual(initial.dailyProgressRecords,[]);
    globalThis.window={localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}};
    const legacy={...initial,dailyProgressRecords:[{...record,noteDeferred:true}]};
    storeSave(legacy);assert.deepEqual(loadSave().dailyProgressRecords,legacy.dailyProgressRecords);
    assert.equal(loadSave().lastDailyProgressActivityDate,'');
  });
  check('起動用の会話は発見・比較・再会で変わり、2ページ以内・質問なし', () => {
    const { talk } = seed(); talk.setExternalTopics(makeSnapshot()); const match = talk.prepareStartupExternalTalk().match;
    const lines = [0, 1, 2].map((variation) => startupDiscoveryLines(match, variation));
    assert.equal(new Set(lines.flat()).size, 6);
    for (const line of lines) { assert.equal(line.length, 2); assert.equal(/[？?]/.test(line.join('')), false); console.log('EXAMPLE', line.join(' / ')); }
  });
  console.log(`Startup experience: ${passed} passed`);
} finally { await vite.close(); }
