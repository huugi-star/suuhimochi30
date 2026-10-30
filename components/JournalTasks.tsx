'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PenLine, Plus, ChevronLeft, ChevronRight, Check, X, Minus, Circle } from 'lucide-react';
import { shiftMissionDate, type DailyMissionSummary, type JournalTaskPlans } from '@/lib/dailyMissions';
import { journalChecklist, type JournalChecklistChange } from '@/lib/journalChecklist';
import styles from './JournalTasks.module.css';
import { JournalSheet } from './JournalSheet';
import type { JournalMissionEntry } from '@/lib/missionNavigation';

function FlowerStamp() {
  return <span className={styles.flower} data-stamp="hanamaru" aria-hidden="true"><svg viewBox="0 0 48 48" focusable="false">
    <g fill="none" stroke="#bf3432" strokeWidth="1.8">
      <circle cx="24" cy="6" r="4.2" /><circle cx="36.7" cy="11.3" r="4.2" />
      <circle cx="42" cy="24" r="4.2" /><circle cx="36.7" cy="36.7" r="4.2" />
      <circle cx="24" cy="42" r="4.2" /><circle cx="11.3" cy="36.7" r="4.2" />
      <circle cx="6" cy="24" r="4.2" /><circle cx="11.3" cy="11.3" r="4.2" />
      <circle cx="24" cy="24" r="16" strokeWidth="2.1" /><circle cx="24" cy="24" r="12.6" strokeWidth="1.7" />
    </g>
    <text x="24" y="27.8">花</text>
  </svg></span>;
}

export function JournalTasks({ summary, plans, notes, onAddPlan, onChangeItem, selectedDate = summary.date, onYesterday, readOnly = false, entryAction }: {
  summary: DailyMissionSummary; plans: JournalTaskPlans; notes: readonly string[];
  onAddPlan: (date: string, items: string[]) => boolean;
  onChangeItem: (date: string, change: JournalChecklistChange) => void;
  selectedDate?: string; onYesterday?: () => void; readOnly?: boolean;
  entryAction?: JournalMissionEntry['action'];
}) {
  const focusInput = useCallback((node: HTMLInputElement | null) => { node?.focus(); }, []);
  const [adding, setAdding] = useState(entryAction === 'actual'), [draft, setDraft] = useState(''), [error, setError] = useState('');
  const [planOpen, setPlanOpen] = useState(entryAction === 'plan'), [planDraft, setPlanDraft] = useState('');
  const [editing, setEditing] = useState<string | null>(null), [editText, setEditText] = useState('');
  const [tomorrowDraft, setTomorrowDraft] = useState(''), [tomorrowOpen, setTomorrowOpen] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const tomorrowInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (entryAction === 'tomorrow') { tomorrowInputRef.current?.focus(); tomorrowInputRef.current?.scrollIntoView({ block: 'nearest' }); }
      if (entryAction === 'report') {
        const button = listRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="false"]');
        button?.focus(); button?.scrollIntoView({ block: 'nearest' });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [entryAction]);
  const [page, setPage] = useState(0), [pageSize, setPageSize] = useState(999);
  useEffect(() => {
    const list = listRef.current; if (!list) return;
    const media = window.matchMedia('(max-width:1024px)');
    const measure = () => {
      if (!media.matches) { setPageSize(999); return; }
      const style = getComputedStyle(list), row = parseFloat(style.gridAutoRows) || 90, gap = parseFloat(style.rowGap) || 0;
      setPageSize(Math.max(1, Math.floor((list.clientHeight + gap) / (row + gap))));
    };
    const observer = new ResizeObserver(measure); observer.observe(list); media.addEventListener('change', measure); measure();
    return () => { observer.disconnect(); media.removeEventListener('change', measure); };
  }, []);
  const isToday = selectedDate === summary.date, tomorrow = shiftMissionDate(summary.date, 1);
  const items = journalChecklist(plans[selectedDate] ?? [], notes), tomorrowTasks = plans[tomorrow] ?? [];
  const currentPage = Math.min(page, Math.max(0, Math.ceil(items.length / pageSize) - 1));
  const visibleItems = items.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const checklist = <section className={`${styles.today}${isToday ? '' : ` ${styles.past}`}`} aria-label={isToday ? 'きょうの日誌' : 'この日やったこと'}>
    <header><h2>{isToday ? 'きょうの日誌' : 'この日やったこと'}</h2>{!readOnly && <button className={styles.add} type="button" aria-label="完了したことを追加" aria-expanded={adding}
      onClick={() => { setAdding(value => !value); setError(''); }}><Plus size={19} />追加</button>}</header>
    <ul ref={listRef} className={styles.taskList}>{visibleItems.map(item => <li key={item.id} data-completed={item.completed}>
      {editing === item.id ? <form className={styles.inlineForm} onSubmit={event => {
        event.preventDefault(); const text = editText.trim(); if (!text) return;
        if (items.some(other => other.id !== item.id && other.text === text)) { setError('同じ内容がすでにあります。'); return; }
        onChangeItem(selectedDate, { taskId: item.taskId, originalText: item.text, text, result: item.result }); setEditing(null); setError('');
      }}><input aria-label="項目を修正" ref={focusInput} maxLength={640} value={editText} onChange={event => setEditText(event.target.value)} />
        <button type="submit" aria-label="修正を保存"><Check size={19} /></button><button type="button" onClick={() => { setEditing(null); setError(''); }} aria-label="修正をやめる"><X size={18} /></button></form>
      : <><span className={styles.taskText}>{item.text}{item.completed && <FlowerStamp />}</span></>}
      {editing !== item.id && <fieldset className={styles.stamps} aria-label={`${item.text}の状態`}>
        {(['done', 'in_progress', 'not_done'] as const).map(result => {
          const label = result === 'done' ? 'できた' : result === 'in_progress' ? '途中' : 'まだ';
          const Icon = result === 'done' ? Check : result === 'in_progress' ? Minus : Circle;
          return <button type="button" key={result} className={styles.stamp} data-result={result} disabled={readOnly}
            aria-label={`${item.text}：${label}`} aria-pressed={item.result === result}
            onClick={() => onChangeItem(selectedDate, { taskId:item.taskId, originalText:item.text, text:item.text, result })}>
            <Icon size={17} aria-hidden="true" /><span>{label}</span></button>;
        })}
      </fieldset>}
      {!readOnly && editing !== item.id && <button className={styles.edit} type="button" aria-label={`${item.text}を修正`} onClick={() => { setEditing(item.id); setEditText(item.text); setError(''); }}><PenLine size={16} /></button>}
    </li>)}</ul>
    {!items.length && <p className={styles.empty}>できたことを、ひとつ残そう。</p>}
    {pageSize < 999 && items.length > 1 && <nav className={styles.pager} aria-label="日誌の項目ページ">
      <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 0} aria-label="前の項目"><ChevronLeft size={18} /></button>
      <output>{currentPage * pageSize + 1}–{Math.min(items.length, (currentPage + 1) * pageSize)} / {items.length}件</output>
      <button type="button" onClick={() => setPage(currentPage + 1)} disabled={(currentPage + 1) * pageSize >= items.length} aria-label="次の項目"><ChevronRight size={18} /></button>
    </nav>}
    {adding && <form className={styles.inlineForm} onSubmit={event => { event.preventDefault(); const text = draft.trim(); if (!text) return;
      if (items.some(item => item.text === text && item.completed)) { setError('同じ内容がすでにあります。'); return; }
      onChangeItem(selectedDate, { text, result: 'done' }); setPage(Math.floor(items.length / pageSize)); setDraft(''); setAdding(false); setError('');
    }}><input ref={focusInput} aria-label="完了したことを入力" value={draft} maxLength={640} onChange={event => setDraft(event.target.value)} placeholder="できたことを書く" />
      <button type="submit" disabled={!draft.trim()}>追加する</button></form>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </section>;
  const planSheet = planOpen && <JournalSheet title="今日の予定を書く" onClose={() => setPlanOpen(false)}>
    <form className={styles.inlineForm} onSubmit={event => { event.preventDefault(); const text = planDraft.trim(); if (!text) return;
      if (onAddPlan(selectedDate, [text])) { setPlanDraft(''); setPlanOpen(false); setError(''); } else setError('日付が変わりました。手帳を開き直してください。');
    }}><input ref={focusInput} autoFocus aria-label="今日の予定を入力" maxLength={640} value={planDraft} onChange={event => setPlanDraft(event.target.value)} placeholder="今日すること" />
      <button type="submit" disabled={!planDraft.trim()}>予定を保存</button></form>{error && <p role="alert">{error}</p>}
  </JournalSheet>;
  if (!isToday) return checklist;
  return <section className={styles.panel} aria-label="日誌と予定">
    <button className={styles.bookmark} type="button" disabled={!onYesterday} onClick={onYesterday} aria-label="昨日の手帳を開く"><span>きのうの足跡</span><small>足あとをめくる</small><ChevronRight size={17} /></button>
    {checklist}
    {planSheet}
    <section className={styles.tomorrow} aria-label="あしたの予定"><span className={styles.tape} aria-hidden="true" /><h3>あしたの予定</h3>{tomorrowTasks.length > 0 && <button className={styles.tomorrowCount} type="button" onClick={() => setTomorrowOpen(true)} aria-label="あしたの予定一覧を開く">{tomorrowTasks.length}件 ›</button>}
      {tomorrowTasks.length > 0 && <ul>{tomorrowTasks.map(task => <li key={task.id}>{task.text}</li>)}</ul>}
      <form className={styles.inlineForm} onSubmit={event => { event.preventDefault(); const text = tomorrowDraft.trim(); if (!text) return;
        if (onAddPlan(tomorrow, [text])) { setTomorrowDraft(''); setError(''); } else setError('日付が変わりました。手帳を開き直してください。');
      }}><input ref={tomorrowInputRef} aria-label="明日のもくひょうを入力" maxLength={640} value={tomorrowDraft} onChange={event => setTomorrowDraft(event.target.value)} placeholder="明日のもくひょう" />
        <button type="submit" disabled={!tomorrowDraft.trim()} aria-label="あしたの予定を追加"><Plus size={18} /></button></form>
    </section>
    {tomorrowOpen && <JournalSheet title="あしたの予定" onClose={() => setTomorrowOpen(false)}><ul>{tomorrowTasks.map(task => <li key={task.id}>{task.text}</li>)}</ul></JournalSheet>}
  </section>;
}
