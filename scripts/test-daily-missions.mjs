import assert from 'node:assert/strict';
import { createServer } from 'vite';
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
let passed = 0; const check = async (label, fn) => { await fn(); passed++; console.log('PASS', label); };
try {
  const m = await vite.ssrLoadModule('/lib/dailyMissions.ts');
  const { EMPTY_SAVE, loadSave, storeSave } = await vite.ssrLoadModule('/lib/storage.ts');
  const { getActivityDateKey } = await vite.ssrLoadModule('/lib/dailyProgress.ts');
  const { saveJournalFootprint } = await vite.ssrLoadModule('/lib/journalProgress.ts');
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const now = new Date('2026-10-25T13:00:00+09:00'), yesterday = new Date('2026-10-24T18:00:00+09:00');
  const fresh = () => structuredClone(EMPTY_SAVE);
  const summary = (save, date = '2026-10-25') => m.getDailyMissionSummary(save, date);
  const status = (save, id, date) => summary(save, date).missions.find((item) => item.id === id).status;
  const memory = () => { const values = new Map(); return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }; };
  await check('JSTの日付・月末・年末・うるう日を端末のタイムゾーンと独立して扱う', () => {
    assert.equal(m.missionDateKey(new Date('2026-10-24T14:59:59Z')), '2026-10-24');
    assert.equal(m.missionDateKey(new Date('2026-10-24T15:00:00Z')), '2026-10-25');
    assert.equal(m.shiftMissionDate('2026-12-31', 1), '2027-01-01');
    assert.equal(m.shiftMissionDate('2028-03-01', -1), '2028-02-29');
    assert.equal(m.shiftMissionDate('2026-03-01', -1), '2026-02-28');
  });
  await check('初回起動でログインだけ1/6になり、同日反復で時刻や状態を変えない', () => {
    const save = m.reconcileDailyMissions(fresh(), [], now);
    assert.equal(summary(save).completed, 1); assert.equal(summary(save).total, 6);
    assert.equal(status(save, 'login'), 'completed'); assert.equal(status(save, 'report'), 'pending');
    assert.equal(m.reconcileDailyMissions(save, [], new Date('2026-10-25T20:00:00+09:00')), save);
  });
  await check('当日の予定を1件登録すると達成し、空欄・同じ予定の二重追加を無視する', () => {
    const save = m.addTaskPlans(fresh(), '2026-10-25', ['  本を読む  ', '', '本を読む'], now);
    assert.equal(save.taskPlans['2026-10-25'].length, 1); assert.equal(status(save, 'plan'), 'completed');
    assert.equal(m.addTaskPlans(save, '2026-10-25', ['本を読む'], now), save);
    assert.deepEqual(save.journalNotes, {}); assert.deepEqual(save.dailyProgressRecords, []);
  });
  await check('前日に書いた翌日の予定は対象日にだけ反映する', () => {
    const planned = m.addTaskPlans(fresh(), '2026-10-25', ['散歩する'], yesterday);
    assert.equal(status(planned, 'plan', '2026-10-24'), 'pending');
    assert.equal(planned.dailyMissions['2026-10-25'], undefined);
    const today = m.reconcileDailyMissions(planned, [], now);
    assert.equal(status(today, 'plan'), 'completed'); assert.equal(today.taskPlans['2026-10-25'][0].createdAt, yesterday.toISOString());
    const tomorrow = m.addTaskPlans(fresh(), '2026-10-26', ['読書'], now);
    assert.equal(status(tomorrow, 'plan'), 'pending');
  });
  await check('今日・明日以外への新規予定登録と日付越えした古いフォームを拒否する', () => {
    const save = fresh();
    for (const date of ['2026-10-24', '2026-10-27', 'bad-date']) assert.equal(m.addTaskPlans(save, date, ['予定'], now), save);
    const midnight = new Date('2026-10-25T00:00:01+09:00');
    assert.equal(m.canPlanFor('2026-10-24', midnight), false);
  });
  await check('日誌の「やったこと」・ホップ等の評価は予定・報告として数えない', () => {
    let save = { ...fresh(), journalNotes: { '2026-10-24': ['昨日したこと'] }, dailyProgressRecords: [{ reviewedDate: '2026-10-24', date: '2026-10-25', yesterdayEvaluation: 'JUMP', doneItems: ['昨日したこと'], wasHard: false, recordedAt: now.toISOString() }] };
    save = m.reconcileDailyMissions(save, [], now);
    assert.equal(status(save, 'plan'), 'pending'); assert.equal(status(save, 'report'), 'pending'); assert.equal(summary(save).total, 6);
  });
  await check('昨日の予定がある日は全件の達成・未達成報告で達成する', () => {
    let save = m.addTaskPlans(fresh(), '2026-10-24', ['本を読む', '散歩する'], yesterday);
    save = m.reconcileDailyMissions(save, [], now); assert.equal(summary(save).total, 6); assert.equal(status(save, 'report'), 'pending');
    const [a, b] = save.taskPlans['2026-10-24'];
    save = m.reportTaskResult(save, '2026-10-24', a.id, 'not_done', now); assert.equal(status(save, 'report'), 'pending');
    save = m.reportTaskResult(save, '2026-10-24', b.id, 'done', now); assert.equal(status(save, 'report'), 'completed');
    assert.equal(save.taskPlans['2026-10-24'][0].result, 'not_done');
    assert.equal(m.reportTaskResult(save, '2026-10-24', b.id, 'done', now), save);
    const at = save.dailyMissions['2026-10-25'].completedAt.report;
    save = m.reportTaskResult(save, '2026-10-24', b.id, 'not_done', new Date('2026-10-25T18:00:00+09:00'));
    assert.equal(save.dailyMissions['2026-10-25'].completedAt.report, at, '訂正で達成時刻を再発行しない');
  });
  await check('未報告の予定を自動的に未達成とせず、昨日以外の結果報告を拒否する', () => {
    const save = m.addTaskPlans(fresh(), '2026-10-24', ['本を読む'], yesterday), task = save.taskPlans['2026-10-24'][0];
    assert.equal(m.reconcileDailyMissions(save, [], now).taskPlans['2026-10-24'][0].result, null);
    assert.equal(m.reportTaskResult(save, '2026-10-24', task.id, 'done', new Date('2026-10-26T13:00:00+09:00')), save);
    assert.equal(m.reportTaskResult(save, '2026-10-25', task.id, 'done', now), save);
    assert.equal(m.reportTaskResult(save, '2026-10-24', 'missing', 'done', now), save);
  });
  let clock = yesterday; const storage = memory(), key = 'suuhimochi_conversation_v6_choices';
  let talk = new SuuhimochiConversation({ storage, now: () => clock });
  const teach = (surface) => { talk.startWordTeaching(); talk.submit(surface); talk.chooseCategory('GAME_MEDIA'); talk.chooseSubCategory('GAME_MEDIA_3'); talk.choose('WORD_INTERESTED'); };
  await check('単語登録の中央処理で初回時刻を記録し、再起動と重複登録で維持する', () => {
    talk.setGoal('作品'); teach('将棋');
    const first = talk.getWordEntries().find((word) => word.surface === '将棋'); assert.equal(first.learnedAt, yesterday.toISOString());
    clock = now; talk = new SuuhimochiConversation({ storage, now: () => clock }); teach('将棋');
    assert.equal(talk.getWordEntries().filter((word) => word.surface === '将棋').length, 1);
    assert.equal(talk.getWordEntries().find((word) => word.surface === '将棋').learnedAt, first.learnedAt);
    assert.equal(status(m.reconcileDailyMissions(fresh(), talk.getWordEntries(), now), 'teach'), 'pending');
    teach('マインクラフト');
    assert.equal(status(m.reconcileDailyMissions(fresh(), talk.getWordEntries(), now), 'teach'), 'completed');
  });
  await check('旧単語のfirstSeenDayやIDから今日の学習を推測しない', () => {
    const words = [{ id: `word_${now.toISOString()}`, surface: '旧語', firstSeenDay: 1, learnedOrder: 1, category: 'UNKNOWN', rootWordId: 'old', mentionCount: 1 }];
    assert.equal(status(m.reconcileDailyMissions(fresh(), words, now), 'teach'), 'pending');
    const state = JSON.parse(storage.getItem(key)); for (const entry of Object.values(state.words)) delete entry.learnedAt; storage.setItem(key, JSON.stringify(state));
    const restored = new SuuhimochiConversation({ storage, now: () => now });
    assert.ok(restored.getWordEntries().every((entry) => entry.learnedAt === undefined));
  });
  await check('ことばコンボの派生語は対象、掘り下げだけの回答は単語として数えない', () => {
    const isolated = memory(); clock = yesterday;
    const engine = new SuuhimochiConversation({ storage: isolated, now: () => clock }); engine.setGoal('作品');
    engine.startWordTeaching(); engine.submit('マインクラフト'); engine.chooseCategory('GAME_MEDIA'); engine.chooseSubCategory('GAME_MEDIA_3'); engine.choose('WORD_INTERESTED');
    const parent = engine.getWordEntries().find((word) => word.surface === 'マインクラフト'); clock = now;
    assert.ok(engine.selectPersonWordComboParent(parent.id));
    let added = false;
    for (let i = 0; i < 6; i++) {
      const question = engine.getNextPersonComboQuestion(parent.id); assert.ok(question);
      if (question.kind === 'deepDive') {
        engine.submitPersonComboAnswer(parent.id, question.id, '友達と遊ぶのが好き');
        assert.equal(status(m.reconcileDailyMissions(fresh(), engine.getWordEntries(), now), 'teach'), 'pending');
      } else {
        assert.equal(engine.submitPersonComboAnswer(parent.id, question.id, 'ポケモン').ok, true); added = true; break;
      }
    }
    assert.equal(added, true); assert.equal(status(m.reconcileDailyMissions(fresh(), engine.getWordEntries(), now), 'teach'), 'completed');
  });
  await check('日本時間5時にミッションを切替し、日誌の予定日付は0時のまま維持する', () => {
    const oldTZ = process.env.TZ; process.env.TZ = 'Asia/Tokyo';
    try {
      const at = new Date('2026-10-25T00:00:01+09:00'); assert.equal(getActivityDateKey(at), '2026-10-24');
      let save = m.addTaskPlans(fresh(), '2026-10-25', ['新しい予定'], yesterday);
      save = m.reconcileDailyMissions(save, [{ learnedAt: at.toISOString() }], at);
      for (const id of ['login', 'plan', 'teach']) assert.equal(status(save, id, '2026-10-24'), 'completed');
      assert.equal(save.dailyMissions['2026-10-25'], undefined);
      const next = m.reconcileDailyMissions(save, [], new Date('2026-10-25T05:00:00+09:00'));
      assert.equal(status(next, 'teach'), 'pending'); assert.equal(summary(next).total, 6);
    } finally { if (oldTZ === undefined) delete process.env.TZ; else process.env.TZ = oldTZ; }
  });
  await check('保存・復元・旧セーブ移行で予定と達成を維持し、壊れた項目だけを除く', () => {
    const localStorage = memory(), previousWindow = globalThis.window; globalThis.window = { localStorage };
    try {
      localStorage.setItem('suuhimochi-30days-save-v1', JSON.stringify({ ...fresh(), journalNotes: { '2026-10-24': ['足あと'] }, taskPlans: undefined, dailyMissions: undefined }));
      const legacy = loadSave(); assert.deepEqual(legacy.taskPlans, {}); assert.deepEqual(legacy.dailyMissions, {}); assert.deepEqual(legacy.journalNotes['2026-10-24'], ['足あと']);
      const save = m.addTaskPlans(legacy, '2026-10-25', ['読書'], now); storeSave(save);
      const restored = loadSave(); assert.deepEqual(restored.taskPlans, save.taskPlans); assert.deepEqual(restored.dailyMissions, save.dailyMissions);
      const corrupt = { ...save, taskPlans: { ...save.taskPlans, '2026-02-30': save.taskPlans['2026-10-25'], '2026-10-26': [{ id: 'bad', text: '', createdAt: 'not-a-date', result: 'done' }] }, dailyMissions: { ...save.dailyMissions, 'invalid': { completedAt: { login: 'bad' } } } };
      storeSave(corrupt); const clean = loadSave(); assert.deepEqual(Object.keys(clean.taskPlans), ['2026-10-25']); assert.equal(clean.dailyMissions.invalid, undefined);
    } finally { globalThis.window = previousWindow; }
  });
  await check('5時直前に登録して直後に画面へ反映された言葉は元の活動日へ達成を残す', () => {
    const before = new Date('2026-10-25T04:59:59+09:00'), after = new Date('2026-10-25T05:00:01+09:00');
    const logged = m.reconcileDailyMissions(fresh(), [], before);
    const save = m.reconcileDailyMissions(logged, [{ learnedAt: before.toISOString() }], after);
    assert.equal(status(save, 'teach', '2026-10-24'), 'completed'); assert.equal(status(save, 'teach'), 'pending');
    assert.equal(save.dailyMissions['2026-10-24'].completedAt.teach, before.toISOString());
  });
  await check('従来の4項目のみではコインを作らず、果実・交友度・日誌を更新しない', () => {
    const before = { ...fresh(), gachaCoins: 7, friendship: 12, personaExp: 18, wordFragments: 2, journalNotes: { '2026-10-24': ['やったこと'] } };
    let save = m.addTaskPlans(before, '2026-10-24', ['散歩'], yesterday);
    save = m.addTaskPlans(save, '2026-10-25', ['読書'], now);
    save = m.reportTaskResult(save, '2026-10-24', save.taskPlans['2026-10-24'][0].id, 'not_done', now);
    save = m.reconcileDailyMissions(save, [{ learnedAt: now.toISOString() }], now);
    assert.equal(summary(save).completed, 4); assert.equal(summary(save).total, 6);
    for (const field of Object.keys(before).filter((field) => !['taskPlans', 'dailyMissions'].includes(field))) assert.deepEqual(save[field], before[field], field);
    const once = JSON.stringify(save.dailyMissions); save = m.reconcileDailyMissions(save, [{ learnedAt: now.toISOString() }], now); assert.equal(JSON.stringify(save.dailyMissions), once);
    const footprint = saveJournalFootprint(save, '2026-10-24', ['実際にしたこと'], { currentDay: 2, memories: [], words: [], now });
    assert.deepEqual(footprint.taskPlans, save.taskPlans); assert.deepEqual(footprint.dailyMissions, save.dailyMissions);
    assert.ok(footprint.experienceFruits.length > 0, '既存の日誌の実は維持する');
    assert.deepEqual({ ...save, day: 1, journalNotes: {} }.taskPlans, save.taskPlans, '30日サイクルと独立した予定を保持');
  });
  console.log(`Daily missions: ${passed} passed`);
} finally { await vite.close(); }



