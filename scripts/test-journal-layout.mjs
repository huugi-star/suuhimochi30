import assert from 'node:assert/strict';
import { createServer } from 'vite';
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
let passed = 0;
const check = async (label, fn) => { await fn(); passed++; console.log('PASS', label); };
try {
  const view = await vite.ssrLoadModule('/lib/journalPresentation.ts');
  const m = await vite.ssrLoadModule('/lib/dailyMissions.ts');
  const { EMPTY_SAVE, loadSave, storeSave } = await vite.ssrLoadModule('/lib/storage.ts');
  const { saveJournalFootprint } = await vite.ssrLoadModule('/lib/journalProgress.ts');
  const data = new Map(), storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  const today = '2026-10-26', yesterday = '2026-10-25';
  await check('初回は昨日、描画反復は同じ、記録後の再オープン・再起動は今日、翌JST日は昨日', () => {
    assert.equal(view.initialJournalDate(today, true, storage), yesterday);
    assert.equal(view.initialJournalDate(today, true, storage), yesterday);
    view.markJournalOpened(today, storage);
    assert.equal(view.initialJournalDate(today, true, storage), today);
    assert.equal(view.initialJournalDate('2026-10-27', true, storage), today);
    assert.deepEqual([...data.keys()], [view.JOURNAL_OPEN_DATE_KEY]);
  });
  await check('初日・保存不可でも日誌を利用できる', () => {
    assert.equal(view.initialJournalDate(today, false, storage), today);
    const blocked = { getItem() { throw Error(); }, setItem() { throw Error(); } };
    assert.equal(view.initialJournalDate(today, true, blocked), yesterday);
    assert.doesNotThrow(() => view.markJournalOpened(today, blocked));
  });
  await check('コメントは既存日記の引用か実際の語の列挙に限定し、未知の経験を補わない', () => {
    assert.equal(view.pictureDiaryComment(['将棋'], '将棋という言葉を覚えたの。\nまだ知らないことがいっぱい。'), '将棋という言葉を覚えたの。');
    assert.equal(view.pictureDiaryComment(['将棋', '野球', '将棋']), 'この日に覚えたことば：「将棋」、「野球」。');
    assert.equal(view.pictureDiaryComment([], undefined), '');
  });
  await check('前日の予定をそのまま当日へ引き継ぎ、当日の結果は報告ミッションを先取りしない', () => {
    let save = m.addTaskPlans(structuredClone(EMPTY_SAVE), today, ['本を読む'], new Date('2026-10-25T19:00:00+09:00'));
    const task = save.taskPlans[today][0];
    save = m.reportTaskResult(save, today, task.id, 'done', new Date('2026-10-26T12:00:00+09:00'));
    save = m.reportTaskResult(save, today, task.id, 'in_progress', new Date('2026-10-26T12:15:00+09:00'));
    assert.equal(save.taskPlans[today][0].result, 'in_progress');
    save = m.reportTaskResult(save, today, task.id, 'done', new Date('2026-10-26T12:30:00+09:00'));
    assert.equal(save.taskPlans[today][0].createdAt, task.createdAt);
    assert.equal(save.taskPlans[today][0].result, 'done');
    assert.equal(m.getDailyMissionSummary(save, '2026-10-27').missions.find(x => x.id === 'report').status, 'pending');
    save = m.reportTaskResult(save, today, task.id, 'done', new Date('2026-10-27T09:00:00+09:00'));
    assert.equal(m.getDailyMissionSummary(save, '2026-10-27').missions.find(x => x.id === 'report').status, 'completed');
    assert.equal(m.reportTaskResult(save, today, task.id, 'done', new Date('2026-10-27T10:00:00+09:00')), save);
  });
  await check('当日の結果を旧セーブ互換の復元処理で保持する', () => {
    const now = new Date('2026-10-26T13:00:00+09:00');
    let save = m.addTaskPlans(structuredClone(EMPTY_SAVE), today, ['下書き'], now);
    save = m.reportTaskResult(save, today, save.taskPlans[today][0].id, 'not_done', now);
    const oldWindow = globalThis.window;
    globalThis.window = { localStorage: storage };
    try { storeSave(save); assert.deepEqual(loadSave().taskPlans, save.taskPlans); } finally { globalThis.window = oldWindow; }
  });
  await check('JST0〜7時の今日の追記は保存でき、活動日報酬を早めたり予定へ変換したりしない', () => {
    const original = structuredClone(EMPTY_SAVE);
    const next = saveJournalFootprint(original, today, ['予定外に片付けた'], { currentDay: 4, memories: [], words: [], now: new Date('2026-10-26T00:30:00+09:00') });
    assert.deepEqual(next.journalNotes[today], ['予定外に片付けた']);
    assert.deepEqual(next.experienceFruits, original.experienceFruits);
    assert.deepEqual(next.dailyMissions, original.dailyMissions);
    assert.deepEqual(next.taskPlans, original.taskPlans);
    assert.equal(saveJournalFootprint(original, '2026-10-27', ['未来'], { currentDay: 4, memories: [], words: [], now: new Date('2026-10-26T00:30:00+09:00') }), original);
  });
  console.log(`Journal presentation: ${passed} passed`);
} finally { await vite.close(); }
