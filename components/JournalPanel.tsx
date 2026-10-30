'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { initialJournalDate, journalBrowserStorage, markJournalOpened, pictureDiaryComment } from '@/lib/journalPresentation';
import { missionDateKey } from '@/lib/dailyMissions';
import type { JournalMissionEntry } from '@/lib/missionNavigation';
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  MessageCircle,
  ScrollText,
  Tags,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  DailyProgressRecord,
} from '@/lib/dailyProgress';
import { getDoneItems, normalizeDoneItems } from '@/lib/dailyProgress';
import { STRATEGIST_PROFILES, type StrategyRecord } from '@/lib/potenoLink';
import { DIVINATION_MASTER_PROFILES, type IChingResult, type LegacyTamamoResult, type SixDivinationRecord, type TaikoboResult, type TamamoResult } from '@/lib/potenoSixDivination';
import type { ConversationMemory, WordEntry } from '@/lib/wordMemory';
import type { ThirtyDayCycleArchive } from '@/lib/graduation';
import type { SuuhimochiDiaryEntry } from '@/lib/suuhimochiDiary';
import { JournalSheet } from '@/components/JournalSheet';
import notebook from './JournalPanel.module.css';
import { JournalTasks } from '@/components/JournalTasks';
import { TodayJournalTasks } from '@/components/TodayJournalTasks';
import todayUi from './TodayJournalTasks.module.css';
import indexUi from './JournalDateIndex.module.css';
import type { JournalChecklistChange } from '@/lib/journalChecklist';
import type { DailyMissionSummary, JournalTaskPlans } from '@/lib/dailyMissions';
import {
  TWO_DAY_REVIEW_GOAL_TYPES,
  TWO_DAY_REVIEW_GOAL_TYPE_LABELS,
  type TwoDayReviewGoalType,
} from '@/lib/twoDayReview';

type JournalPanelProps = {
  missionEntry?: JournalMissionEntry;
  pictureDiary?: (date: string, comment: string) => ReactNode;
  pictureDiaryDates?: string[];
  currentDay: number;
  currentPhase: string;
  currentActivityDate: string;
  dailyMissionSummary: DailyMissionSummary;
  taskPlans: JournalTaskPlans;
  onAddTaskPlans: (date: string, items: string[]) => boolean;
  onEditTaskPlan?: (date: string, id: string, text: string) => boolean;
  onDeleteJournalItem?: (date: string, item: {taskId?:string;text:string}) => boolean;
  onChecklistChange: (date: string, change: JournalChecklistChange) => void;
  userName: string;
  goalText: string;
  goalType: TwoDayReviewGoalType | null;
  records: DailyProgressRecord[];
  journalNotes: Record<string, string[]>;
  suuhimochiDiaries: Record<string, SuuhimochiDiaryEntry>;
  strategyRecords: StrategyRecord[];
  divinationRecords: SixDivinationRecord[];
  memories: ConversationMemory[];
  words: WordEntry[];
  farewellLetter: string | null;
  cycleArchives: ThirtyDayCycleArchive[];
  experienceFruitDates: string[];
  onClose: () => void;
  onChangeGoalType: (goalType: TwoDayReviewGoalType) => void;
  onReviewGoal: () => void;
  useSuuhimochiKeyboard?: boolean;
};

function taikoboJournalSummary(result: IChingResult) {
  if (!('calculationVersion' in result) || result.calculationVersion !== 'taikobo-iching-v1') return result.baseHexagram as string;
  const structured = result as TaikoboResult;
  return `${structured.baseHexagram.fullName} → ${structured.resultingHexagram.fullName}`;
}

function tamamoJournalSummary(result: TamamoResult) {
  if ('calculationVersion' in result && result.calculationVersion === 'tamamo-crossroads-v1') return `「${result.kotodama.word}」／${result.kotodama.themeLabel}`;
  return (result as LegacyTamamoResult).phrase;
}

function moveDate(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

export function JournalPanel({
  missionEntry,
  pictureDiary,
  pictureDiaryDates = [],
  currentDay,
  currentActivityDate,
  dailyMissionSummary,
  taskPlans,
  onAddTaskPlans,
  onEditTaskPlan,
  onDeleteJournalItem,
  onChecklistChange,
  userName,
  goalText,
  goalType,
  records,
  journalNotes,
  suuhimochiDiaries,
  strategyRecords,
  divinationRecords,
  memories,
  words,
  farewellLetter,
  cycleArchives,
  onClose,
  onChangeGoalType,
  onReviewGoal,
}: JournalPanelProps) {
  const safeCurrentDay = Math.min(30, Math.max(1, currentDay));
  const trimmedUserName = userName.trim();
  const journalOwnerLabel = trimmedUserName
    ? `${trimmedUserName}${/(さん|くん|ちゃん|様)$/.test(trimmedUserName) ? '' : 'さん'}`
    : 'あなた';
  const today = missionDateKey();
  const yesterday = moveDate(today, -1);
  const cycleFirstDate = moveDate(currentActivityDate, 1 - safeCurrentDay);
  const dateForDay = (day: number) => moveDate(currentActivityDate,day-safeCurrentDay);
  const dates = new Set([today,...Object.keys(journalNotes),...Object.keys(suuhimochiDiaries),...Object.keys(taskPlans),...pictureDiaryDates,...records.map(r=>r.reviewedDate)]);
  for(const archive of cycleArchives)for(const date of [...Object.keys(archive.journalNotes),...Object.keys(archive.suuhimochiDiaries??{}),...archive.dailyProgressRecords.map(r=>r.reviewedDate)])dates.add(date);
  for(const record of [...memories.map(m=>m.day),...strategyRecords.map(r=>r.consultedDay),...divinationRecords.map(r=>r.consultedDay)])if(record>=1&&record<=safeCurrentDay)dates.add(dateForDay(record));
  for(const word of words){if(word.learnedAt&&Number.isFinite(Date.parse(word.learnedAt)))dates.add(missionDateKey(new Date(word.learnedAt)));else if(word.firstSeenDay>=1&&word.firstSeenDay<=safeCurrentDay)dates.add(dateForDay(word.firstSeenDay));}
  const availableDates=[...dates].filter(date=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&date<=today&&Number.isFinite(Date.parse(date+'T12:00:00Z'))&&new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date)
    .filter(date=>{const day=safeCurrentDay+Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(currentActivityDate+'T12:00:00Z'))/86400000);return day>=1&&day<=30}).sort();
  const hasYesterday=availableDates.includes(yesterday);
  const [selectedDate, setSelectedDate] = useState(() => missionEntry?.date ?? initialJournalDate(today, hasYesterday, journalBrowserStorage()));
  useEffect(() => { markJournalOpened(today, journalBrowserStorage()); }, [today]);
  const selectedDay = safeCurrentDay + Math.round((Date.parse(`${selectedDate}T12:00:00Z`) - Date.parse(`${currentActivityDate}T12:00:00Z`)) / 86400000);
  const isToday = selectedDate === today;
  const indexRef=useRef<HTMLElement>(null);
  const archived = selectedDate < cycleFirstDate ? cycleArchives.find((archive) => archive.journalNotes[selectedDate] || archive.suuhimochiDiaries?.[selectedDate]
    || archive.dailyProgressRecords.some((record) => record.reviewedDate === selectedDate)) : undefined;
  const [turnDirection, setTurnDirection] = useState<'previous' | 'next'>(
    'next',
  );
  const [editingGoalType, setEditingGoalType] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState<string | null>(null);
  const [pastView, setPastView] = useState<'picture' | 'records'>(missionEntry?.action === 'report' ? 'records' : 'picture');
  const [textDiaryOpen, setTextDiaryOpen] = useState(false);

  const reviewRecord = (archived?.dailyProgressRecords ?? records).find(
    (record) => record.reviewedDate === selectedDate,
  );
  const savedItems = Object.prototype.hasOwnProperty.call(
    archived?.journalNotes ?? journalNotes,
    selectedDate,
  )
    ? (archived?.journalNotes ?? journalNotes)[selectedDate]
    : getDoneItems(reviewRecord);
  const lines = normalizeDoneItems(savedItems);
  const dayMemories = selectedDate < cycleFirstDate ? [] : memories.filter((memory) => memory.day === selectedDay);
  const dayWords = useMemo(
    () => selectedDate < cycleFirstDate ? [] : words.filter((word) => word.learnedAt && Number.isFinite(Date.parse(word.learnedAt)) ? missionDateKey(new Date(word.learnedAt)) === selectedDate : word.firstSeenDay === selectedDay),
    [selectedDay, selectedDate, cycleFirstDate, words],
  );
  const dayStrategies = selectedDate < cycleFirstDate ? [] : strategyRecords.filter((record) => record.consultedDay === selectedDay);
  const dayDivinations = selectedDate < cycleFirstDate ? [] : divinationRecords.filter((record) => record.consultedDay === selectedDay);
  const suuhimochiDiary = (archived?.suuhimochiDiaries ?? suuhimochiDiaries)[selectedDate];
  const previousDate=availableDates.filter(date=>date<selectedDate).at(-1),nextDate=availableDates.find(date=>date>selectedDate);
  const olderDates=availableDates.filter(date=>date<selectedDate).slice(-5);
  const newerDates=isToday?[]:availableDates.filter(date=>date>selectedDate).slice(0,5);
  const openDate = (date: string) => {
    if (!availableDates.includes(date) || date === selectedDate) return;
    setTurnDirection(date < selectedDate ? 'previous' : 'next');
    setSelectedDate(date);
  };

  const renderTab = (date: string) => {
    const day=safeCurrentDay+Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(currentActivityDate+'T12:00:00Z'))/86400000);
    const dayLabel=day>=1&&day<=safeCurrentDay?`DAY ${day}`:date.slice(5).replace('-','/');
    return (
    <button
      type="button"
      key={date}
      className={`journal-tab journal-tab-left ${indexUi.tab}${date===selectedDate?' is-current':''}`}
      onClick={() => openDate(date)}
      aria-current={date===selectedDate?'date':undefined}
      aria-label={`${dayLabel}を開く`}
      data-index-date={date}
      title={formatDate(date)}
    >
      <span>{day>=1&&day<=safeCurrentDay?'DAY':`${Number(date.slice(5,7))}月`}</span>
      <b>{day>=1&&day<=safeCurrentDay?day:`${Number(date.slice(8))}日`}</b>
    </button>
  );};

  return (
    <section className={`journal-overlay ${notebook.notebook}${isToday ? ` ${todayUi.todayNotebook}` : ''}`} aria-label="30日間の日誌">
      <div className="journal-book">
        <button
          className="journal-close"
          type="button"
          onClick={onClose}
          aria-label="日誌を閉じる"
        >
          <X size={21} />
        </button>

        {archiveOpen && <section className="journal-archive-sheet" aria-label="過去の30日記録">
          <header><div><small>SUUHIMOCHI HISTORY</small><h2>過去の30日</h2></div><button type="button" onClick={() => setArchiveOpen(false)} aria-label="過去の30日を閉じる"><X size={19} /></button></header>
          <p className="journal-archive-intro">卒業したすうひもちと歩いた道を、一区切りごとに残しています。</p>
          <div className="journal-archive-list">
            {[...cycleArchives].reverse().map((archive) => <article key={archive.id}>
              <header><div><small>第{archive.cycleNumber}期のすうひもち</small><strong>「{archive.goalText}」</strong></div><time>{archive.startedAt} 〜 {archive.completedAt.slice(0, 10)}</time></header>
              <div className="journal-archive-summary"><span>{archive.footprint.recordedDays}日分の記帳</span><span>{archive.footprint.reviewedItems}件の振り返り</span><span>覚えた言葉 {archive.learnedWords.length}個</span></div>
              <details open><summary>足跡</summary>
                <h3>実際に進んだこと</h3>{archive.footprint.progressed.length > 0 ? <ul>{archive.footprint.progressed.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>記帳された足跡はありません。</p>}
                <h3>続けられたこと</h3>{archive.footprint.continued.length > 0 ? <ul>{archive.footprint.continued.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>繰り返しを確認できる記録はありません。</p>}
                <h3>止まったこと・未実行</h3>{archive.footprint.stopped.length > 0 ? <ul>{archive.footprint.stopped.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>止まったと判断できる記録はありません。</p>}
              </details>
              <details><summary>30日の日誌</summary>
                <h3>{journalOwnerLabel}の日誌</h3>
                {Object.entries(archive.journalNotes).filter(([, items]) => items.length > 0).length > 0
                  ? <div className="journal-archive-notes">{Object.entries(archive.journalNotes).filter(([, items]) => items.length > 0).sort(([left], [right]) => left.localeCompare(right)).map(([date, items]) => <section key={date}><time>{date}</time><ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul></section>)}</div>
                  : <p>この30日には、日誌の本文が残っていません。</p>}
                <h3>すうひもちの日記</h3>
                {Object.keys(archive.suuhimochiDiaries ?? {}).length > 0
                  ? <div className="journal-archive-notes">{Object.entries(archive.suuhimochiDiaries ?? {}).sort(([left], [right]) => left.localeCompare(right)).map(([date, diary]) => <section key={date}><time>{date}</time><p>{diary.text}</p></section>)}</div>
                  : <p>この30日には、すうひもちの日記が残っていません。</p>}
              </details>
              <details><summary>軍師の引き継ぎ忠言</summary>
                <b>{STRATEGIST_PROFILES[archive.handoffAdvice.strategist].displayName}</b>
                {archive.handoffAdvice.assessment && <p>{archive.handoffAdvice.assessment}</p>}
                {archive.handoffAdvice.reachabilityReason && <p>{archive.handoffAdvice.reachabilityReason}</p>}
                <h3>次に変えること</h3><p>{archive.handoffAdvice.changeNext}</p>
                <h3>次の到達点</h3><p>{archive.handoffAdvice.nextDestination}</p>
                {archive.handoffAdvice.suggestedGoal && <><h3>次の30日の目標案</h3><p>「{archive.handoffAdvice.suggestedGoal}」</p></>}
              </details>
              <details><summary>軍師・術師との相談履歴（{archive.strategyRecords.length + archive.divinationRecords.length}件）</summary>
                {archive.strategyRecords.length > 0 && <div className="journal-archive-consults"><h3>軍師相談</h3>{archive.strategyRecords.map((record) => <section key={record.id}><b>{STRATEGIST_PROFILES[record.strategist].displayName}</b><p>{record.counsel}</p></section>)}</div>}
                {archive.divinationRecords.length > 0 && <div className="journal-archive-consults"><h3>ポテノ六占</h3>{archive.divinationRecords.map((record) => <section key={record.id}><b>{DIVINATION_MASTER_PROFILES[record.master]?.name ?? record.master}</b><p>{record.integratedReading}</p></section>)}</div>}
                {archive.strategyRecords.length === 0 && archive.divinationRecords.length === 0 && <p>この30日には、保存した相談履歴がありません。</p>}
              </details>
              {archive.farewellLetter && <details><summary>卒業の手紙</summary><div className="journal-letter">{archive.farewellLetter}</div></details>}
            </article>)}
          </div>
        </section>}

        {olderDates.length>0&&<nav ref={indexRef} className={`${indexUi.index} ${indexUi.older}`} aria-label="前の日誌">{olderDates.map(renderTab)}</nav>}
        {newerDates.length>0&&<nav className={`${indexUi.index} ${indexUi.newer}`} aria-label="後の日誌">{newerDates.map(renderTab)}</nav>}

        <article
          key={selectedDate}
          data-past-view={pastView} className={`journal-page journal-page-${turnDirection}${isToday ? ' journal-page-today' : ' journal-page-past'}`}
          data-date={selectedDate}
        >
          {!isToday && <h1 className="journal-diary-title">すうひもちの日誌</h1>}
          <header className="journal-page-header">
            <div><strong>{isToday?`DAY ${safeCurrentDay}`:selectedDay >= 1 && selectedDay <= 30 ? `DAY ${selectedDay}` : '手帳'}</strong>
              <time className="journal-date" dateTime={selectedDate}>{formatDate(selectedDate)}</time></div>
            {isToday && <h1 className={todayUi.title}>きょうの日誌</h1>}
          </header>
            <button className="journal-goal-entry" type="button" onClick={() => setGoalOpen(true)} aria-label="30日の目標を開く"><Compass size={17} /></button>
          {!isToday && <div className="journal-return-today"><span>{selectedDate === yesterday ? 'きのうの手帳' : 'この日の手帳'}</span><button type="button" onClick={() => openDate(today)}>きょうの手帳へ <ChevronRight size={16} /></button></div>}
          {!isToday && <nav className="journal-past-switch" aria-label="この日の日誌の表示">
            <button type="button" aria-pressed={pastView === 'picture'} onClick={() => setPastView('picture')}>絵日記</button>
            <button type="button" aria-pressed={pastView === 'records'} onClick={() => setPastView('records')}>この日やったこと</button>
          </nav>}
          {!isToday && <div className="journal-picture-pane">
            {pictureDiary?.(selectedDate, pictureDiaryComment(dayWords.map((word) => word.surface), suuhimochiDiary?.text))}
            {suuhimochiDiary && <section className="journal-mochi-diary" aria-label="すうひもちの文章日記"><p>{suuhimochiDiary.text}</p><button className="journal-diary-read" type="button" onClick={() => setTextDiaryOpen(true)}>文章日記を読む ›</button></section>}
          </div>}
          {textDiaryOpen && <JournalSheet title="すうひもちの文章日記" onClose={() => setTextDiaryOpen(false)}><p>{suuhimochiDiary?.text}</p></JournalSheet>}
          {goalOpen && <JournalSheet title="30日の目標" onClose={() => setGoalOpen(false)}>
            <div className="journal-main-goal">
              <small>30日の目標</small>
              <strong>「{goalText || 'まだ決めていません'}」</strong>
              <div className="journal-goal-type-row">
                <span>
                  {goalType
                    ? TWO_DAY_REVIEW_GOAL_TYPE_LABELS[goalType]
                    : '目標タイプ：未設定'}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingGoalType((open) => !open)}
                >
                  変更
                </button>
              </div>
              {editingGoalType && (
                <div
                  className="journal-goal-type-picker"
                  aria-label="30日の目標タイプを変更"
                >
                  {TWO_DAY_REVIEW_GOAL_TYPES.map((type) => (
                    <button
                      type="button"
                      key={type.value}
                      className={goalType === type.value ? 'is-selected' : ''}
                      onClick={() => {
                        onChangeGoalType(type.value);
                        setEditingGoalType(false);
                      }}
                    >
                      <span aria-hidden="true">{type.icon}</span>
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => { setGoalOpen(false); onReviewGoal(); }}>目標・行動方法を振り返る</button>
            {cycleArchives.length > 0 && <button type="button" onClick={() => { setGoalOpen(false); setArchiveOpen(true); }}><ScrollText size={15} /> 過去の30日</button>}
          </JournalSheet>}
          <div className={isToday ? "journal-today-pane" : "journal-record-pane"}>{isToday ? <TodayJournalTasks key={selectedDate} date={selectedDate} plans={taskPlans} notes={lines}
            entryAction={missionEntry?.date === selectedDate ? missionEntry.action : undefined}
            onYesterday={hasYesterday ? () => openDate(yesterday) : undefined} onAddPlan={onAddTaskPlans} onEditPlan={onEditTaskPlan}
            onDeleteItem={onDeleteJournalItem}
            onChangeItem={onChecklistChange} /> : <JournalTasks key={selectedDate} summary={{ ...dailyMissionSummary, date: today }} plans={taskPlans} notes={lines} selectedDate={selectedDate}
            entryAction={missionEntry?.date === selectedDate ? missionEntry.action : undefined}
            onYesterday={hasYesterday ? () => openDate(yesterday) : undefined} onAddPlan={onAddTaskPlans}
            onChangeItem={(date, change) => onChecklistChange(date, { ...change, ...(archived ? { archiveId: archived.id } : {}) })} />}</div>

          {!isToday && <nav className="journal-index" aria-label="手帳の索引">
            {([['talk', '会話', MessageCircle, dayMemories.length], ['words', 'ことば', Tags, dayWords.length], ['strategy', '軍師', Compass, dayStrategies.length], ['divination', '六占', Sparkles, dayDivinations.length]] as const).map(([id, label, Icon, count]) =>
              <button type="button" key={id} onClick={() => setSupportOpen(id)} aria-label={`${label}の記録を開く`}><Icon size={17} /><span>{label}</span><small>{count}</small></button>)}
          </nav>}
          {supportOpen && <JournalSheet title="手帳の索引" onClose={() => setSupportOpen(null)}>
            <section className="journal-support" data-index={supportOpen}>
            <div className="journal-support-grid">
              <details className="journal-section" data-section="strategy" open>
                <summary><Compass size={17} /><span>ポテノ軍師との作戦</span><b>{dayStrategies.length}</b></summary>
                <div className="journal-section-body">
                  {dayStrategies.length > 0 ? <div className="journal-strategy-list">{dayStrategies.map((strategy) => (
                    <article key={strategy.id}>
                      <small>今回の軍師</small><b>{STRATEGIST_PROFILES[strategy.strategist]?.displayName ?? 'ポテノ軍師'}</b>
                      <small>軍師の忠言</small><p>{strategy.counsel}</p>
                      <small>ポテノの要約</small><p>{strategy.potenoSummary}</p>
                      {strategy.nextMoves.length > 0 && <><small>次の一手</small><ul>{strategy.nextMoves.map((action, index) => <li key={`${action}-${index}`}>{action}</li>)}</ul></>}
                      {strategy.checkpoints.length > 0 && <><small>確認すること</small><ul>{strategy.checkpoints.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></>}
                    </article>
                  ))}</div> : <p className="journal-empty">この日に保存した作戦はありません。</p>}
                </div>
              </details>

              <details className="journal-section" data-section="divination" open>
                <summary><Sparkles size={17} /><span>ポテノ六占</span><b>{dayDivinations.length}</b></summary>
                <div className="journal-section-body">
                  {dayDivinations.length > 0 ? <div className="journal-divination-list">{dayDivinations.map((divination) => (
                    <article key={divination.id}>
                      <header><span>今回の術師</span><b>{DIVINATION_MASTER_PROFILES[divination.master]?.name ?? divination.master}</b></header>
                      {divination.consultation && <><small>相談したこと</small><p>{divination.consultation}</p></>}
                      <small>術師の統合解釈</small><p>{divination.integratedReading}</p>
                      <small>ポテノの要約</small><p>{divination.potenoSummary}</p>
                      {divination.focus.length > 0 && <><small>今回意識すること</small><ul>{divination.focus.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></>}
                      <details><summary>六占の元結果</summary><dl>
                        <div><dt>晴明</dt><dd>{divination.sixResults.seimei.calculationVersion === 'seimei-calendar-v1' ? `${divination.sixResults.seimei.direction.trigram}・${divination.sixResults.seimei.direction.label}／${divination.sixResults.seimei.calendar.label}／${divination.sixResults.seimei.direction.conditionLabel}` : `${divination.sixResults.seimei.direction}・${divination.sixResults.seimei.calendarMark}`}</dd></div>
                        <div><dt>太公望</dt><dd>{taikoboJournalSummary(divination.sixResults.taikobo)}</dd></div>
                        <div><dt>玉藻の前</dt><dd>{tamamoJournalSummary(divination.sixResults.tamamo)}</dd></div>
                        <div><dt>伯爵</dt><dd>{divination.sixResults.saintGermain.cards.map((card) => `${card.role}:${card.name}`).join('／')}</dd></div>
                        <div><dt>アステリア</dt><dd>{divination.sixResults.asteria.calculationVersion === 'asteria-lunar-solar-v1' ? `${divination.sixResults.asteria.moonPhase.label}／${divination.sixResults.asteria.moonSign.label}／${divination.sixResults.asteria.personalAspect.label}／${divination.sixResults.asteria.solarCycle.label}` : `${divination.sixResults.asteria.sunSign}・${divination.sixResults.asteria.starMarker}`}</dd></div>
                        <div><dt>ダ・ヴィンチ</dt><dd>{divination.sixResults.davinci.calculationVersion === 'davinci-structure-v1' ? `CORE ${divination.sixResults.davinci.core.number}／STYLE ${divination.sixResults.davinci.style.number}／${divination.sixResults.davinci.relation.label}` : `${divination.sixResults.davinci.lifePathNumber}・${divination.sixResults.davinci.geometry}`}</dd></div>
                      </dl></details>
                    </article>
                  ))}</div> : <p className="journal-empty">この日に保存した六占はありません。</p>}
                </div>
              </details>

              <details className="journal-section" data-section="talk" open>
                <summary><MessageCircle size={17} /><span>この日の会話</span><b>{dayMemories.length}</b></summary>
                <div className="journal-section-body">
                  {dayMemories.length > 0 ? <div className="journal-memory-list">{dayMemories.map((memory, index) => (
                    <div key={`${memory.topic}-${index}`}><b>「{memory.topic}」</b>{memory.quote && <span>{memory.quote}</span>}</div>
                  ))}</div> : <p className="journal-empty">この日の会話記録はまだありません。</p>}
                  {selectedDay === 30 && farewellLetter && <div className="journal-letter">{farewellLetter}</div>}
                </div>
              </details>

              <details className="journal-section" data-section="words" open>
                <summary><Tags size={17} /><span>覚えたことば</span><b>{dayWords.length}</b></summary>
                <div className="journal-section-body">
                  {dayWords.length > 0 ? <div className="journal-word-list">{dayWords.map((word) => <span key={word.id}>{word.surface}</span>)}</div> : <p className="journal-empty">この日に覚えたことばはまだありません。</p>}
                </div>
              </details>
            </div>
            </section>
          </JournalSheet>}

          <footer className="journal-page-navigation">
            <button
              type="button"
              onClick={() => previousDate && openDate(previousDate)}
              disabled={!previousDate}
            >
              <ChevronLeft size={18} />
              前の日
            </button>
            <span>{formatDate(selectedDate)}</span>
            <button
              type="button"
              onClick={() => nextDate && openDate(nextDate)}
              disabled={!nextDate}
            >
              次の日
              <ChevronRight size={18} />
            </button>
          </footer>
        </article>
      </div>


    </section>
  );
}
