import assert from 'node:assert/strict';
import { createServer } from 'vite';
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
let passed = 0;
const check = async (name, fn) => { await fn(); passed++; console.log('PASS', name); };
try {
  const { journalChecklist } = await vite.ssrLoadModule('/lib/journalChecklist.ts');
  const { saveJournalChecklistItem } = await vite.ssrLoadModule('/lib/journalProgress.ts');
  const { addTaskPlans, sanitizeTaskPlans, getDailyMissionSummary } = await vite.ssrLoadModule('/lib/dailyMissions.ts');
  const { EMPTY_SAVE, loadSave, storeSave } = await vite.ssrLoadModule('/lib/storage.ts');
  const now = new Date('2026-10-26T13:00:00+09:00'), today = '2026-10-26', yesterday = '2026-10-25';
  const context = { currentDay:16, memories:[], words:[], now };
  const write = (save,date,change) => saveJournalChecklistItem(save,date,change,context);
  const fresh = () => structuredClone(EMPTY_SAVE);
  const original = addTaskPlans(fresh(), today, ['下書き'], new Date('2026-10-25T19:00:00+09:00'));
  await check('既存予定と既存実績は同じ一覧に並び、同じ文章は二重表示しない', () => {
    const tasks = [{...original.taskPlans[today][0],result:'done'}];
    assert.deepEqual(journalChecklist(tasks,['下書き','片付け','片付け']).map(x=>[x.text,x.completed]), [['下書き',true],['片付け',true]]);
  });
  await check('予定のチェックは元IDと対象日を保ち、解除しても項目を消さない', () => {
    const task = original.taskPlans[today][0];
    const done = write(original,today,{taskId:task.id,text:task.text,completed:true});
    assert.equal(done.taskPlans[today][0].id,task.id); assert.equal(done.taskPlans[today][0].createdAt,task.createdAt);
    assert.deepEqual(done.journalNotes[today],['下書き']);
    const undone = write(done,today,{taskId:task.id,originalText:task.text,text:task.text,completed:false});
    assert.deepEqual(undone.journalNotes[today],[]); assert.equal(journalChecklist(undone.taskPlans[today],[])[0].completed,false);
    assert.equal(done.dailyMissions[today].completedAt.report,now.toISOString(),'昨日の予定がなければ今日の結果で達成');
  });
  await check('追加した実績は完了扱いで保存し、予定ミッションや翌日の報告対象を増やさない', () => {
    const done = write(fresh(),today,{text:'予定外の片付け',completed:true});
    assert.equal(done.taskPlans[today][0].kind,'actual'); assert.equal(done.taskPlans[today][0].result,'done');
    assert.deepEqual(done.journalNotes[today],['予定外の片付け']);
    assert.equal(done.dailyMissions[today].completedAt.plan,undefined);
    assert.equal(getDailyMissionSummary(done,'2026-10-27').total,6);
    assert.equal(done.dailyMissions[today].completedAt.actual,now.toISOString());
    assert.equal(write(done,today,{text:'予定外の片付け',completed:true}),done);
  });
  await check('実績と予定が同文なら予定1件を完了し、別の実績を作らない', () => {
    const done = write(original,today,{text:'下書き',completed:true});
    assert.equal(done.taskPlans[today].length,1); assert.deepEqual(done.journalNotes[today],['下書き']);
  });
  await check('既存の文章実績はその場で修正・チェック解除・再チェックできる', () => {
    const save = {...fresh(),journalNotes:{[yesterday]:['片付け']}};
    let next = write(save,yesterday,{originalText:'片付け',text:'机の片付け',completed:true});
    assert.deepEqual(next.journalNotes[yesterday],['机の片付け']); const task=next.taskPlans[yesterday][0];
    next=write(next,yesterday,{taskId:task.id,text:task.text,completed:false}); assert.deepEqual(next.journalNotes[yesterday],[]);
    assert.equal(journalChecklist(next.taskPlans[yesterday],[]).length,1);
    next=write(next,yesterday,{taskId:task.id,text:task.text,completed:true}); assert.deepEqual(next.journalNotes[yesterday],['机の片付け']);
    assert.equal(next.taskPlans[yesterday][0].id,task.id);
  });
  await check('古い日の後日修正と実績は保存復元後も対象日・チェック状態が残る', () => {
    const date='2026-10-20'; let next=addTaskPlans(fresh(),date,['散歩'],new Date('2026-10-19T13:00:00+09:00'));
    next=write(next,date,{taskId:next.taskPlans[date][0].id,text:'散歩',completed:true});
    next=write(next,date,{text:'読書',completed:true}); assert.deepEqual(sanitizeTaskPlans(next.taskPlans),next.taskPlans);
    const data=new Map(), old=globalThis.window;
    globalThis.window={localStorage:{getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)}};
    try { storeSave(next); assert.deepEqual(loadSave().taskPlans,next.taskPlans); assert.deepEqual(loadSave().journalNotes,next.journalNotes); } finally {globalThis.window=old;}
  });
  await check('同じ日の再記録・修正で友好度と経験のリンゴを二重付与しない', () => {
    let next=write(fresh(),yesterday,{text:'読書',completed:true}); const fruits=next.experienceFruits, score=next.friendship;
    next=write(next,yesterday,{text:'散歩',completed:true}); assert.deepEqual(next.experienceFruits,fruits); assert.equal(next.friendship,score);
  });
  await check('未来日の実績は拒否し、卒業後の修正はアーカイブ内へ保存する', () => {
    const save=fresh(); assert.equal(write(save,'2026-10-27',{text:'未来',completed:true}),save);
    const archived={id:'old',journalNotes:{[yesterday]:['読書']},dailyProgressRecords:[],suuhimochiDiaries:{}};
    const next=write({...save,cycleArchives:[archived]},yesterday,{archiveId:'old',originalText:'読書',text:'本を読んだ',completed:true});
    assert.deepEqual(next.cycleArchives[0].journalNotes[yesterday],['本を読んだ']); assert.deepEqual(next.journalNotes,save.journalNotes);
    assert.equal(next.friendship,save.friendship); assert.deepEqual(next.experienceFruits,save.experienceFruits);
  });
  await check('3択の状態だけを保存し、できた以外は完了実績に含めない', () => {
    let save=original; const id=save.taskPlans[today][0].id;
    for(const result of ['done','in_progress','not_done']) {
      save=write(save,today,{taskId:id,text:'下書き',result});
      assert.equal(save.taskPlans[today][0].result,result);
      const item=journalChecklist(save.taskPlans[today],save.journalNotes[today])[0];
      assert.equal(item.result,result); assert.equal(item.completed,result==='done');
      assert.deepEqual(save.journalNotes[today],result==='done'?['下書き']:[]);
      assert.deepEqual(sanitizeTaskPlans(save.taskPlans),save.taskPlans);
    }
  });
  await check('旧4段階の保存記録は削除せず、新しい項目の状態とは独立して復元する', () => {
    const data=new Map(),old=globalThis.window;
    globalThis.window={localStorage:{getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)}};
    try {
      const records=['HOP','STEP','JUMP','BREATH'].map((yesterdayEvaluation,index)=>({date:today,reviewedDate:`2026-10-${20+index}`,yesterdayEvaluation,doneItems:['旧日誌'],wasHard:false,recordedAt:now.toISOString()}));
      const save={...fresh(),dailyProgressRecords:records}; storeSave(save);
      assert.deepEqual(loadSave().dailyProgressRecords,records);
      const next=write(loadSave(),today,{text:'今日の行動',result:'in_progress'});
      storeSave(next);assert.deepEqual(loadSave().dailyProgressRecords,records);
      assert.equal(loadSave().taskPlans[today][0].result,'in_progress');
    }finally{globalThis.window=old;}
  });
  console.log(`Journal checklist: ${passed} passed`);
} finally {await vite.close();}
