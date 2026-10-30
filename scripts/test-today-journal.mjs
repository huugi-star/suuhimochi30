import assert from 'node:assert/strict';
import {createServer} from 'vite';
const vite=await createServer({configFile:false,root:process.cwd(),server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
try{
 const m=await vite.ssrLoadModule('/lib/dailyMissions.ts'),{EMPTY_SAVE,loadSave,storeSave}=await vite.ssrLoadModule('/lib/storage.ts');
 const {removeJournalItem}=await vite.ssrLoadModule('/lib/journalProgress.ts');
 const now=new Date('2026-10-30T14:00:00+09:00'), tomorrow='2026-10-31';
 let save=m.addTaskPlans(structuredClone(EMPTY_SAVE),tomorrow,['散歩','読書'],now);const task=save.taskPlans[tomorrow][0];
 const before=structuredClone(save);save=m.updateTaskPlan(save,tomorrow,task.id,'長い散歩',now);
 assert.deepEqual(save.taskPlans[tomorrow][0],{...task,text:'長い散歩'});
 for(const key of Object.keys(before).filter(k=>k!=='taskPlans'))assert.deepEqual(save[key],before[key],key);
 for(const text of ['','読書','長い散歩','x'.repeat(641)])assert.equal(m.updateTaskPlan(save,tomorrow,task.id,text,now),save);
 for(const date of ['2026-10-29','2026-10-30','2026-11-01'])assert.equal(m.updateTaskPlan(save,date,task.id,'別の文面',now),save,'cannot change past/current/other days');
 assert.equal(m.updateTaskPlan(save,tomorrow,'missing','別の文面',now),save);
 const data=new Map(),oldWindow=globalThis.window;globalThis.window={localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}};
 try{storeSave(save);assert.deepEqual(loadSave().taskPlans,save.taskPlans);}finally{globalThis.window=oldWindow;}
 const next=m.reconcileDailyMissions(save,[],new Date('2026-10-31T05:00:00+09:00'));
 assert.equal(next.taskPlans[tomorrow][0].id,task.id);assert.equal(next.taskPlans[tomorrow][0].text,'長い散歩');
 assert.equal(m.getDailyMissionSummary(next,tomorrow).missions.find(x=>x.id==='plan').status,'completed');
 const early=new Date('2026-10-31T01:00:00+09:00');assert.equal(m.dailyMissionDateKey(early),'2026-10-30');
 assert.equal(m.updateTaskPlan(save,tomorrow,task.id,'変更禁止',early),save,'editing follows target dates without changing activity days');
 const withToday=m.addTaskPlans(save,'2026-10-30',['今日の行動'],now),todayTask=withToday.taskPlans['2026-10-30'][0];
 const withNotes={...withToday,journalNotes:{'2026-10-29':['過去の記録'],'2026-10-30':['今日の行動','旧形式の実績']},suuhimochiDiaries:{'2026-10-29':{text:'過去の絵日記コメント'}}};
 const removed=removeJournalItem(withNotes,'2026-10-30',{taskId:todayTask.id,text:'今日の行動'},now);
 assert.deepEqual(removed.taskPlans['2026-10-30'],[]);assert.deepEqual(removed.journalNotes['2026-10-30'],['旧形式の実績']);
 assert.deepEqual(removed.journalNotes['2026-10-29'],withNotes.journalNotes['2026-10-29']);assert.deepEqual(removed.suuhimochiDiaries,withNotes.suuhimochiDiaries);
 for(const key of Object.keys(withNotes).filter(k=>!['taskPlans','journalNotes'].includes(k)))assert.deepEqual(removed[key],withNotes[key],key);
 assert.equal(removeJournalItem(withNotes,'2026-10-29',{text:'過去の記録'},now),withNotes,'past cannot be deleted');
 assert.equal(removeJournalItem(withNotes,'2026-11-01',{taskId:task.id,text:'長い散歩'},now),withNotes);
 const removedGoal=removeJournalItem(withNotes,tomorrow,{taskId:task.id,text:'長い散歩'},now);assert.equal(removedGoal.taskPlans[tomorrow].length,1);assert.deepEqual(removedGoal.journalNotes,withNotes.journalNotes);assert.deepEqual(removedGoal.dailyMissions,withNotes.dailyMissions);
 const removedLegacy=removeJournalItem(removed,'2026-10-30',{text:'旧形式の実績'},now);assert.deepEqual(removedLegacy.journalNotes['2026-10-30'],[]);
 console.log('PASS tomorrow text edit: same ID/date/result, duplicate guard, past untouched, restore, next-day carryover, 05:00 and rewards preserved');
}finally{await vite.close();}

