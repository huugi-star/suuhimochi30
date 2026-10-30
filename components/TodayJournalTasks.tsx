'use client';
import { useEffect, useRef, useState } from 'react';
import { Plus, PenLine, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { shiftMissionDate, type JournalTaskPlans, type TaskResult } from '@/lib/dailyMissions';
import { journalChecklist, type JournalChecklistChange, type JournalChecklistItem } from '@/lib/journalChecklist';
import type { JournalMissionEntry } from '@/lib/missionNavigation';
import { JournalSheet } from './JournalSheet';
import styles from './TodayJournalTasks.module.css';

type Editor = { kind:'actual'|'plan'|'task'|'goal'; text:string; item?:JournalChecklistItem; id?:string };
export function TodayJournalTasks({ date, plans, notes, onAddPlan, onEditPlan, onDeleteItem, onChangeItem, onYesterday, entryAction }: {
  date:string; plans:JournalTaskPlans; notes:readonly string[];
  onAddPlan:(date:string,items:string[])=>boolean;
  onEditPlan?:(date:string,id:string,text:string)=>boolean;
  onDeleteItem?:(date:string,item:{taskId?:string;text:string})=>boolean;
  onChangeItem:(date:string,change:JournalChecklistChange)=>void;
  onYesterday?:()=>void; entryAction?:JournalMissionEntry['action'];
}) {
  const items=journalChecklist(plans[date]??[],notes), tomorrow=shiftMissionDate(date,1), goals=plans[tomorrow]??[];
  const [editor,setEditor]=useState<Editor|null>(()=>entryAction==='actual'?{kind:'actual',text:''}:entryAction==='plan'?{kind:'plan',text:''}:null);
  const [draft,setDraft]=useState(''),[error,setError]=useState('');
  const [selected,setSelected]=useState(0),[goalsOpen,setGoalsOpen]=useState(false),[confirmDelete,setConfirmDelete]=useState(false);
  const current=Math.min(selected,Math.max(0,items.length-1)),visibleItems=items.slice(current,current+1);
  const tomorrowInput=useRef<HTMLInputElement>(null),list=useRef<HTMLUListElement>(null);
  useEffect(()=>{
    const input=tomorrowInput.current,page=input?.closest<HTMLElement>('.journal-page'),viewport=window.visualViewport;
    if(!input||!page)return;const original=page.style.maxHeight;let frame=0;
    const restore=()=>{cancelAnimationFrame(frame);page.style.maxHeight=original};
    const fit=()=>{cancelAnimationFrame(frame);if(document.activeElement!==input)return;frame=requestAnimationFrame(()=>{
      const top=viewport?.offsetTop??0,height=viewport?.height??innerHeight;
      page.style.maxHeight=`${Math.max(120,top+height-Math.max(top,page.getBoundingClientRect().top)-8)}px`;
      input.scrollIntoView({block:'nearest'});
    })};
    input.addEventListener('focus',fit);input.addEventListener('blur',restore);viewport?.addEventListener('resize',fit);viewport?.addEventListener('scroll',fit);
    return()=>{restore();input.removeEventListener('focus',fit);input.removeEventListener('blur',restore);viewport?.removeEventListener('resize',fit);viewport?.removeEventListener('scroll',fit)};
  },[]);
  useEffect(()=>{const frame=requestAnimationFrame(()=>{
    if(entryAction==='tomorrow'){tomorrowInput.current?.focus();tomorrowInput.current?.scrollIntoView({block:'nearest'});}
    if(entryAction==='report'){const button=list.current?.querySelector<HTMLButtonElement>('button[aria-pressed]');button?.focus();button?.scrollIntoView({block:'nearest'});}
  });return()=>cancelAnimationFrame(frame)},[entryAction]);
  const open=(next:Editor)=>{setError('');setConfirmDelete(false);setEditor(next)};
  const saveEditor=()=>{
    if(!editor)return;const text=editor.text.trim();if(!text)return;
    if(editor.kind==='goal'){
      if(goals.some(g=>g.id!==editor.id&&g.text.trim()===text)){setError('同じもくひょうがすでにあります。');return;}
      if(goals.find(g=>g.id===editor.id)?.text===text){setEditor(null);return;}
      if(!editor.id||!onEditPlan?.(tomorrow,editor.id,text)){setError('保存できませんでした。日付を確認してください。');return;}
    }else if(editor.kind==='plan'){
      if((plans[date]??[]).some(t=>t.text.trim()===text)){setError('同じ予定がすでにあります。');return;}
      if(!onAddPlan(date,[text])){setError('日付が変わりました。日誌を開き直してください。');return;}
    }else{
      if(items.some(i=>i.id!==editor.item?.id&&i.text===text&&(editor.kind!=='actual'||i.completed))){setError('同じ内容がすでにあります。');return;}
      onChangeItem(date,{taskId:editor.item?.taskId,originalText:editor.item?.text,text,result:editor.item?.result??'done'});
      if(editor.kind==='actual'){const old=items.findIndex(i=>i.text===text);setSelected(old<0?items.length:old);}
    }
    setError('');setEditor(null);
  };
  return <section className={styles.panel} aria-label="日誌と予定" data-today-journal>
    <section className={styles.actions} aria-labelledby="today-actions-title">
      <header className={styles.sectionHeading}><div><h2 id="today-actions-title">きょうの予定</h2></div>
        <div className={styles.tools}><button type="button" onClick={()=>open({kind:'plan',text:''})}>予定を書く</button><button type="button" className={styles.primary} aria-label="完了したことを追加" onClick={()=>open({kind:'actual',text:''})}><Plus size={18}/>追加</button></div>
      </header>
      <ul ref={list} className={styles.list}>{visibleItems.map(item=><li key={item.id} data-result={item.result}>
        <div className={styles.taskHeading}><p>{item.text}</p><button type="button" className={styles.edit} aria-label={`${item.text}を修正`} onClick={()=>open({kind:'task',text:item.text,item})}><PenLine size={17}/></button></div>
        <fieldset className={styles.results} aria-label={`${item.text}の状態`}>
          {(['done','in_progress','not_done'] as TaskResult[]).map(result=>{const label=result==='done'?'できた':result==='in_progress'?'途中':'まだ';return <button type="button" key={result} data-result={result} aria-label={`${item.text}：${label}`} aria-pressed={item.result===result} onClick={()=>onChangeItem(date,{taskId:item.taskId,originalText:item.text,text:item.text,result})}>{label}</button>})}
        </fieldset>
      </li>)}</ul>
      {items.length>0&&<nav className={styles.pager} aria-label="きょうの予定の切り替え"><button type="button" aria-label="前の予定" disabled={current===0} onClick={()=>setSelected(current-1)}><ChevronLeft size={20}/></button><output aria-live="polite">{current+1} / {items.length}<small>{items.filter(i=>i.completed).length}件できた</small></output><button type="button" aria-label="次の予定" disabled={current===items.length-1} onClick={()=>setSelected(current+1)}><ChevronRight size={20}/></button></nav>}
      {!items.length&&<div className={styles.empty}>予定があるときは「予定を書く」、<br/>できたことは「＋追加」から残せます。</div>}
    </section>
    <section className={styles.tomorrow} aria-label="あしたの予定">
      <header><span aria-hidden="true" className={styles.dayMark}>あした</span><h2>明日のもくひょう</h2></header>
      {goals.length>0&&<button type="button" className={styles.goalSummary} aria-label="明日のもくひょう一覧を開く" onClick={()=>setGoalsOpen(true)}>登録済み {goals.length}件<span>見る・編集 <ChevronRight size={16}/></span></button>}
      <form className={styles.goalForm} onSubmit={event=>{event.preventDefault();const text=draft.trim();if(!text)return;
        if(goals.some(g=>g.text.trim()===text)){setError('同じもくひょうがすでにあります。');return;}
        if(onAddPlan(tomorrow,[text])){setDraft('');setError('')}else setError('日付が変わりました。日誌を開き直してください。');
      }}><label htmlFor="tomorrow-goal">もくひょうを追加</label><div><input ref={tomorrowInput} id="tomorrow-goal" aria-label="明日のもくひょうを入力" placeholder="明日は、なにをしよう？" maxLength={640} value={draft} onChange={e=>setDraft(e.target.value)}/><button type="submit" aria-label="あしたの予定を追加" disabled={!draft.trim()}>追加</button></div></form>
      {error&&!editor&&<p role="alert" className={styles.error}>{error}</p>}
    </section>
    <button type="button" className={styles.yesterday} aria-label="昨日の手帳を開く" disabled={!onYesterday} onClick={onYesterday}><span>きのうの足跡<small>{onYesterday?'前日の日誌をひらく':'まだ前日の日誌はありません'}</small></span><ChevronRight size={20}/></button>
    {goalsOpen&&<JournalSheet title="明日のもくひょう" fitVisualViewport onClose={()=>setGoalsOpen(false)}><ul className={styles.goals}>{goals.map(goal=><li key={goal.id}><span>{goal.text}</span>{onEditPlan&&<button type="button" className={styles.edit} aria-label={`${goal.text}を編集`} onClick={()=>{setGoalsOpen(false);open({kind:'goal',id:goal.id,text:goal.text})}}><PenLine size={17}/></button>}</li>)}</ul></JournalSheet>}
    {editor&&<JournalSheet fitVisualViewport title={editor.kind==='goal'?'明日のもくひょうを編集':editor.kind==='task'?'行動の内容を修正':editor.kind==='plan'?'今日の予定を書く':'やったことを追加'} onClose={()=>{setEditor(null);setError('')}}>
      <form className={styles.editor} onSubmit={event=>{event.preventDefault();saveEditor()}}><label htmlFor="today-journal-editor">{editor.kind==='goal'?'明日のもくひょう':editor.kind==='plan'?'今日の予定':'行動の内容'}</label>
        <textarea id="today-journal-editor" autoFocus rows={3} maxLength={640} aria-label={editor.kind==='goal'?'明日のもくひょうを編集':editor.kind==='plan'?'今日の予定を入力':editor.kind==='task'?'項目を修正':'完了したことを入力'} value={editor.text} onChange={e=>setEditor({...editor,text:e.target.value})}/>
        {error&&<p role="alert" className={styles.error}>{error}</p>}<button type="submit" disabled={!editor.text.trim()}>{editor.kind==='goal'?'変更を保存':editor.kind==='task'?'修正を保存':editor.kind==='plan'?'予定を保存':'追加する'}</button>
        {onDeleteItem&&['goal','task'].includes(editor.kind)&&(confirmDelete?<div className={styles.deleteConfirm}><p>この項目を削除しますか？</p><button type="button" className={styles.danger} onClick={()=>{
          const target=editor.kind==='goal'?{taskId:editor.id,text:goals.find(g=>g.id===editor.id)?.text??editor.text}:{taskId:editor.item?.taskId,text:editor.item?.text??editor.text};
          if(onDeleteItem(editor.kind==='goal'?tomorrow:date,target)){setEditor(null);setConfirmDelete(false);setError('')}else setError('削除できませんでした。日付を確認してください。');
        }}>削除する</button><button type="button" onClick={()=>setConfirmDelete(false)}>やめる</button></div>:<button type="button" className={styles.danger} onClick={()=>setConfirmDelete(true)}><Trash2 size={16}/>この項目を削除</button>)}
      </form>
    </JournalSheet>}
  </section>;
}
