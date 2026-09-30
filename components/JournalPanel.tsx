'use client';

import { useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  MessageCircle,
  PenLine,
  Tags,
  Trash2,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  DailyProgressLevel,
  DailyProgressRecord,
  YesterdayProgressLevel,
} from '@/lib/dailyProgress';
import { getDoneItems, normalizeDoneItems } from '@/lib/dailyProgress';
import { STRATEGIST_PROFILES, type StrategyRecord } from '@/lib/potenoLink';
import { DIVINATION_MASTER_PROFILES, type IChingResult, type LegacyTamamoResult, type SixDivinationRecord, type TaikoboResult, type TamamoResult } from '@/lib/potenoSixDivination';
import type { ConversationMemory, WordEntry } from '@/lib/wordMemory';
import type { ThirtyDayCycleArchive } from '@/lib/graduation';
import {
  TWO_DAY_REVIEW_GOAL_TYPES,
  TWO_DAY_REVIEW_GOAL_TYPE_LABELS,
  type TwoDayReviewGoalType,
} from '@/lib/twoDayReview';

type JournalPanelProps = {
  currentDay: number;
  currentPhase: string;
  currentActivityDate: string;
  goalText: string;
  goalType: TwoDayReviewGoalType | null;
  records: DailyProgressRecord[];
  journalNotes: Record<string, string[]>;
  strategyRecords: StrategyRecord[];
  divinationRecords: SixDivinationRecord[];
  memories: ConversationMemory[];
  words: WordEntry[];
  farewellLetter: string | null;
  cycleArchives: ThirtyDayCycleArchive[];
  onClose: () => void;
  onSaveDoneItems: (date: string, doneItems: string[]) => void;
  onChangeGoalType: (goalType: TwoDayReviewGoalType) => void;
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

const PROGRESS_LABELS: Record<YesterdayProgressLevel, string> = {
  HOP: 'ホップ',
  STEP: 'ステップ',
  JUMP: 'ジャンプ',
  BREATH: 'ひと呼吸',
};

const TARGET_LABELS: Record<DailyProgressLevel, string> = {
  HOP: 'ホップで、小さく一歩',
  STEP: 'ステップで、しっかり前へ',
  JUMP: 'ジャンプで、思いきって進む',
};

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

function wordDateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function JournalPanel({
  currentDay,
  currentPhase,
  currentActivityDate,
  goalText,
  goalType,
  records,
  journalNotes,
  strategyRecords,
  divinationRecords,
  memories,
  words,
  farewellLetter,
  cycleArchives,
  onClose,
  onSaveDoneItems,
  onChangeGoalType,
}: JournalPanelProps) {
  const safeCurrentDay = Math.min(30, Math.max(1, currentDay));
  const [selectedDay, setSelectedDay] = useState(safeCurrentDay);
  const [turnDirection, setTurnDirection] = useState<'previous' | 'next'>(
    'next',
  );
  const [editing, setEditing] = useState(false);
  const [draftItems, setDraftItems] = useState<string[]>(['']);
  const itemInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [editingGoalType, setEditingGoalType] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const selectedDate = moveDate(
    currentActivityDate,
    selectedDay - safeCurrentDay,
  );
  const targetRecord = records.find((record) => record.date === selectedDate);
  const reviewRecord = records.find(
    (record) => record.reviewedDate === selectedDate,
  );
  const savedItems = Object.prototype.hasOwnProperty.call(
    journalNotes,
    selectedDate,
  )
    ? journalNotes[selectedDate]
    : getDoneItems(reviewRecord);
  const lines = normalizeDoneItems(savedItems);
  const dayMemories = memories.filter((memory) => memory.day === selectedDay);
  const dayWords = useMemo(
    () => words.filter((word) => wordDateKey(word.firstSeen) === selectedDate),
    [selectedDate, words],
  );
  const dayStrategies = strategyRecords.filter((record) => record.consultedDay === selectedDay);
  const dayDivinations = divinationRecords.filter((record) => record.consultedDay === selectedDay);

  // The left edge is the stack already turned over: the open page plus its
  // recent past.  The right edge only exists while looking back and leads
  // toward the latest reached day.  Days beyond safeCurrentDay never appear.
  const leftTabs = Array.from(
    { length: Math.min(7, selectedDay) },
    (_, index) => selectedDay - Math.min(7, selectedDay) + index + 1,
  );
  const rightTabs =
    selectedDay < safeCurrentDay
      ? Array.from(
          { length: Math.min(7, safeCurrentDay - selectedDay) },
          (_, index) => selectedDay + index + 1,
        )
      : [];

  const dateForDay = (day: number) =>
    moveDate(currentActivityDate, day - safeCurrentDay);
  const isPending = (day: number) =>
    records.some(
      (record) =>
        record.reviewedDate === dateForDay(day) && record.noteDeferred,
    );

  const openDay = (day: number) => {
    const nextDay = Math.min(30, Math.max(1, day));
    if (nextDay === selectedDay) return;
    setTurnDirection(nextDay < selectedDay ? 'previous' : 'next');
    setSelectedDay(nextDay);
    setEditing(false);
    setDraftItems(['']);
  };

  const beginEditing = () => {
    setDraftItems(lines.length > 0 ? lines : ['']);
    setEditing(true);
  };

  const saveDoneItems = () => {
    onSaveDoneItems(selectedDate, normalizeDoneItems(draftItems));
    setEditing(false);
  };

  const deleteDoneItems = () => {
    onSaveDoneItems(selectedDate, []);
    setDraftItems(['']);
    setEditing(false);
  };

  const updateDraftItem = (index: number, value: string) => {
    setDraftItems((items) => items.map((item, itemIndex) => itemIndex === index ? value : item));
  };

  const insertDraftItem = (index: number) => {
    setDraftItems((items) => [...items.slice(0, index + 1), '', ...items.slice(index + 1)]);
    window.setTimeout(() => itemInputRefs.current[index + 1]?.focus(), 0);
  };

  const removeDraftItem = (index: number) => {
    setDraftItems((items) => {
      const next = items.filter((_, itemIndex) => itemIndex !== index);
      return next.length > 0 ? next : [''];
    });
  };

  const renderTab = (day: number, side: 'left' | 'right') => (
    <button
      type="button"
      key={day}
      className={`journal-tab journal-tab-${side}${day === selectedDay ? ' is-current' : ''}`}
      onClick={() => openDay(day)}
      aria-label={`DAY ${day}を開く${isPending(day) ? '・未記帳' : ''}`}
    >
      <span>DAY</span>
      <b>{day}</b>
      {isPending(day) && <i aria-label="未記帳">●</i>}
    </button>
  );

  return (
    <section className="journal-overlay" aria-label="30日間の日誌">
      <div className="journal-book">
        <button
          className="journal-close"
          type="button"
          onClick={onClose}
          aria-label="日誌を閉じる"
        >
          <X size={21} />
        </button>
        {cycleArchives.length > 0 && <button className="journal-archive-open" type="button" onClick={() => setArchiveOpen(true)}><ScrollText size={16} />過去の30日</button>}

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
                {Object.entries(archive.journalNotes).filter(([, items]) => items.length > 0).length > 0
                  ? <div className="journal-archive-notes">{Object.entries(archive.journalNotes).filter(([, items]) => items.length > 0).sort(([left], [right]) => left.localeCompare(right)).map(([date, items]) => <section key={date}><time>{date}</time><ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul></section>)}</div>
                  : <p>この30日には、日誌の本文が残っていません。</p>}
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

        <aside
          className="journal-tabs journal-tabs-left"
          aria-label="前の日の付箋"
        >
          {leftTabs.map((day) => renderTab(day, 'left'))}
        </aside>
        <aside
          className="journal-tabs journal-tabs-right"
          aria-label="次の日の付箋"
        >
          {rightTabs.map((day) => renderTab(day, 'right'))}
        </aside>

        <article
          key={selectedDay}
          className={`journal-page journal-page-${turnDirection}`}
        >
          <header className="journal-page-header">
            <div>
              <small>SUUHIMOCHI 30 DAYS</small>
              <strong>DAY {selectedDay}</strong>
            </div>
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
            <div className="journal-date">
              <span>{formatDate(selectedDate)}</span>
              {selectedDay === safeCurrentDay && <em>{currentPhase}</em>}
            </div>
          </header>

          <div className="journal-rule" aria-hidden="true" />

          <details className="journal-section journal-plan" open>
            <summary>
              <BookOpen size={17} />
              <span>今日決めていたこと</span>
            </summary>
            <div className="journal-section-body journal-quote">
              「
              {targetRecord?.todayTarget
                ? TARGET_LABELS[targetRecord.todayTarget]
                : selectedDay === 1 && goalText
                  ? goalText
                  : '今日は目標を決めずに進む'}
              」
            </div>
          </details>

          <details className="journal-section" open>
            <summary>
              <span className="journal-summary-mark">✓</span>
              <span>進み具合</span>
            </summary>
            <div className="journal-section-body journal-progress">
              {reviewRecord ? (
                <>
                  <strong data-level={reviewRecord.yesterdayEvaluation}>
                    {PROGRESS_LABELS[reviewRecord.yesterdayEvaluation]}
                  </strong>
                  {reviewRecord.wasHard && <small>大変だった日</small>}
                </>
              ) : (
                <span>
                  {selectedDay >= safeCurrentDay
                    ? '振り返りは、これから'
                    : 'まだ記録がありません'}
                </span>
              )}
            </div>
          </details>

          <details className="journal-section" open>
            <summary>
              <PenLine size={17} />
              <span>やったこと</span>
              {reviewRecord?.noteDeferred && (
                <em className="journal-pending">未記帳</em>
              )}
            </summary>
            <div className="journal-section-body">
              {!editing ? (
                <>
                  {lines.length > 0 ? (
                    <ul className="journal-note-lines">
                      {lines.map((line, index) => (
                        <li key={`${line}-${index}`}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="journal-empty">まだ書かれていません。</p>
                  )}
                  <button
                    className="journal-edit"
                    type="button"
                    onClick={beginEditing}
                  >
                    <PenLine size={15} />
                    記帳・修正
                  </button>
                </>
              ) : (
                <div className="journal-editor">
                  <div className="journal-item-editor-list">
                    {draftItems.map((item, index) => (
                      <label className="journal-item-editor-row" key={index}>
                        <input
                          ref={(element) => { itemInputRefs.current[index] = element; }}
                          value={item}
                          onChange={(event) => updateDraftItem(index, event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              insertDraftItem(index);
                            }
                          }}
                          maxLength={160}
                          placeholder="やったことを書く"
                          autoFocus={index === 0}
                        />
                        <button type="button" onClick={() => removeDraftItem(index)} aria-label={`${index + 1}件目を削除`}>×</button>
                      </label>
                    ))}
                  </div>
                  <button className="journal-add-item" type="button" onClick={() => { setDraftItems((items) => [...items, '']); window.setTimeout(() => itemInputRefs.current[draftItems.length]?.focus(), 0); }}>＋ やったことを追加</button>
                  <div className="journal-editor-actions">
                    <button
                      className="journal-save"
                      type="button"
                      onClick={saveDoneItems}
                    >
                      保存する
                    </button>
                    <button type="button" onClick={() => setEditing(false)}>
                      やめる
                    </button>
                    <button
                      className="journal-delete"
                      type="button"
                      onClick={deleteDoneItems}
                    >
                      <Trash2 size={14} />
                      削除
                    </button>
                  </div>
                </div>
              )}
            </div>
          </details>

          <details className="journal-section">
            <summary>
              <Compass size={17} />
              <span>ポテノ軍師との作戦</span>
              <b>{dayStrategies.length}</b>
            </summary>
            <div className="journal-section-body">
              {dayStrategies.length > 0 ? (
                <div className="journal-strategy-list">
                  {dayStrategies.map((strategy) => (
                    <article key={strategy.id}>
                      <small>今回の軍師</small>
                      <b>{STRATEGIST_PROFILES[strategy.strategist]?.displayName ?? 'ポテノ軍師'}</b>
                      <small>軍師の忠言</small>
                      <p>{strategy.counsel}</p>
                      <small>ポテノの要約</small>
                      <p>{strategy.potenoSummary}</p>
                      {strategy.nextMoves.length > 0 && <><small>次の一手</small><ul>{strategy.nextMoves.map((action, index) => <li key={`${action}-${index}`}>{action}</li>)}</ul></>}
                      {strategy.checkpoints.length > 0 && <><small>確認すること</small><ul>{strategy.checkpoints.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></>}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="journal-empty">この日に保存した作戦はありません。</p>
              )}
            </div>
          </details>

          <details className="journal-section">
            <summary>
              <Sparkles size={17} />
              <span>ポテノ六占</span>
              <b>{dayDivinations.length}</b>
            </summary>
            <div className="journal-section-body">
              {dayDivinations.length > 0 ? (
                <div className="journal-divination-list">
                  {dayDivinations.map((divination) => (
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
                  ))}
                </div>
              ) : <p className="journal-empty">この日に保存した六占はありません。</p>}
            </div>
          </details>

          <details className="journal-section">
            <summary>
              <MessageCircle size={17} />
              <span>この日の会話</span>
              <b>{dayMemories.length}</b>
            </summary>
            <div className="journal-section-body">
              {dayMemories.length > 0 ? (
                <div className="journal-memory-list">
                  {dayMemories.map((memory, index) => (
                    <div key={`${memory.topic}-${index}`}>
                      <b>「{memory.topic}」</b>
                      {memory.quote && <span>{memory.quote}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="journal-empty">
                  この日の会話記録はまだありません。
                </p>
              )}
              {selectedDay === 30 && farewellLetter && (
                <div className="journal-letter">{farewellLetter}</div>
              )}
            </div>
          </details>

          <details className="journal-section">
            <summary>
              <Tags size={17} />
              <span>覚えたことば</span>
              <b>{dayWords.length}</b>
            </summary>
            <div className="journal-section-body">
              {dayWords.length > 0 ? (
                <div className="journal-word-list">
                  {dayWords.map((word) => (
                    <span key={word.id}>{word.surface}</span>
                  ))}
                </div>
              ) : (
                <p className="journal-empty">
                  この日に覚えたことばはまだありません。
                </p>
              )}
            </div>
          </details>

          <footer className="journal-page-navigation">
            <button
              type="button"
              onClick={() => openDay(selectedDay - 1)}
              disabled={selectedDay <= 1}
            >
              <ChevronLeft size={18} />
              前の日
            </button>
            <span>{selectedDay} / 30</span>
            <button
              type="button"
              onClick={() => openDay(selectedDay + 1)}
              disabled={selectedDay >= 30}
            >
              次の日
              <ChevronRight size={18} />
            </button>
          </footer>
        </article>
      </div>

      <style>{`
        .journal-overlay { position: absolute; z-index: 105; inset: 48px 0 68px; display: grid; place-items: center; padding: 16px 52px; background: rgba(44,31,22,.28); backdrop-filter: blur(2px); }
        .journal-book { position: relative; width: min(820px, 100%); max-height: 100%; }
        .journal-page { position: relative; max-height: calc(100vh - 158px); overflow-y: auto; padding: 28px 38px 22px; border: 2px solid #917050; border-radius: 9px 18px 18px 9px; color: #47372c; background: repeating-linear-gradient(to bottom, transparent 0 31px, rgba(106,151,162,.13) 31px 32px), linear-gradient(90deg, #f2dfb8 0 17px, #fffaf0 17px 100%); box-shadow: inset 5px 0 8px rgba(116,80,47,.12), 0 16px 42px rgba(31,19,11,.38); transform-style: preserve-3d; }
        .journal-page-next { animation: journal-turn-next .32s ease-out; transform-origin: left center; }
        .journal-page-previous { animation: journal-turn-previous .32s ease-out; transform-origin: right center; }
        @keyframes journal-turn-next { from { opacity: .65; transform: perspective(900px) rotateY(-8deg) translateX(10px); } to { opacity: 1; transform: none; } }
        @keyframes journal-turn-previous { from { opacity: .65; transform: perspective(900px) rotateY(8deg) translateX(-10px); } to { opacity: 1; transform: none; } }
        .journal-close { position: absolute; z-index: 8; top: 10px; right: 11px; display: grid; width: 38px; height: 38px; place-items: center; border: 1px solid #b79a78; border-radius: 50%; color: #644d3b; background: #fffaf0; box-shadow: 0 3px 8px rgba(57,37,23,.18); }
        .journal-archive-open { position: absolute; z-index: 7; top: 12px; right: 58px; display: inline-flex; min-height: 34px; align-items: center; gap: 5px; padding: 6px 11px; border: 1px solid #a88666; border-radius: 999px; color: #674a38; background: #fff6df; font-size: .7rem; font-weight: 900; box-shadow: 0 2px 5px rgba(57,37,23,.14); }
        .journal-archive-sheet { position: absolute; z-index: 12; inset: 0; max-height: calc(100vh - 158px); overflow-y: auto; padding: 24px 28px; border: 2px solid #917050; border-radius: 12px 18px 18px 12px; color: #49372c; background: linear-gradient(90deg,#ead3aa 0 16px,#fffaf0 16px 100%); box-shadow: 0 18px 50px rgba(31,19,11,.42); }
        .journal-archive-sheet > header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .journal-archive-sheet > header small { color: #a06e4d; font-size: .62rem; font-weight: 900; letter-spacing: .14em; }
        .journal-archive-sheet > header h2 { margin: 2px 0 0; font: 900 1.5rem 'Yu Mincho',serif; }
        .journal-archive-sheet > header button { display: grid; width: 36px; height: 36px; place-items: center; border: 1px solid #b79a78; border-radius: 50%; color: #644d3b; background: #fffaf0; }
        .journal-archive-intro { margin: 10px 0 15px; color: #806b59; font-size: .78rem; font-weight: 700; }
        .journal-archive-list { display: grid; gap: 13px; }
        .journal-archive-list > article { padding: 15px; border: 2px solid #c2a27b; border-radius: 14px; background: rgba(255,250,235,.88); box-shadow: 0 4px 0 rgba(102,68,45,.1); }
        .journal-archive-list > article > header { display: flex; align-items: end; justify-content: space-between; gap: 12px; padding-bottom: 9px; border-bottom: 1px dashed rgba(125,88,59,.32); }
        .journal-archive-list > article > header div { display: grid; gap: 3px; }
        .journal-archive-list > article > header small { color: #a06649; font-weight: 900; }
        .journal-archive-list > article > header strong { font: 900 1rem/1.45 'Yu Mincho',serif; }
        .journal-archive-list time { color: #927763; font-size: .67rem; font-weight: 750; white-space: nowrap; }
        .journal-archive-summary { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0; }
        .journal-archive-summary span { padding: 4px 8px; border-radius: 999px; color: #755744; background: #efe0c6; font-size: .65rem; font-weight: 850; }
        .journal-archive-list details { padding-top: 7px; border-top: 1px solid rgba(127,91,63,.18); }
        .journal-archive-list details + details { margin-top: 7px; }
        .journal-archive-list summary { cursor: pointer; color: #79523d; font-weight: 900; }
        .journal-archive-list h3 { margin: 9px 0 4px; color: #936048; font-size: .72rem; }
        .journal-archive-list ul { display: grid; gap: 3px; margin: 0; padding-left: 20px; color: #5b4639; font-size: .75rem; line-height: 1.55; }
        .journal-archive-list details p { margin: 7px 0 0; color: #5e493d; font-size: .75rem; line-height: 1.6; }
        .journal-archive-notes,.journal-archive-consults { display: grid; gap: 7px; margin-top: 8px; }
        .journal-archive-notes section,.journal-archive-consults section { padding: 8px 10px; border-left: 3px solid #c49a72; background: rgba(255,255,255,.46); }
        .journal-archive-notes time { color: #99694e; font-size: .67rem; font-weight: 900; }
        .journal-archive-notes ul { margin-top: 4px; }
        .journal-archive-consults section b { color: #80543f; font-size: .72rem; }
        .journal-page-header { display: grid; grid-template-columns: auto minmax(150px, 1fr) auto; align-items: end; gap: 18px; padding-right: 45px; }
        .journal-page-header > div:first-child { display: grid; gap: 2px; }
        .journal-page-header small { color: #a06e4d; font-size: .61rem; font-weight: 900; letter-spacing: .14em; }
        .journal-page-header > div:first-child > strong { font: 900 clamp(1.55rem, 5vw, 2.2rem)/1 'Yu Mincho', serif; letter-spacing: .08em; }
        .journal-main-goal { display: grid; min-width: 0; gap: 4px; padding: 8px 13px; border-inline: 1px solid rgba(143,105,70,.25); text-align: center; }
        .journal-main-goal strong { overflow-wrap: anywhere; color: #604338; font: 900 clamp(.92rem, 2.6vw, 1.15rem)/1.5 'Klee One', 'Hiragino Maru Gothic ProN', 'Yu Gothic', sans-serif; letter-spacing: .045em; }
        .journal-goal-type-row { display: flex; align-items: center; justify-content: center; gap: 7px; color: #8b6d58; font-size: .67rem; font-weight: 800; }
        .journal-goal-type-row button { min-height: 25px; border: 1px solid #b89a78; border-radius: 8px; padding: 2px 8px; color: #6a513e; background: #fff8e8; font-size: .66rem; font-weight: 900; }
        .journal-goal-type-picker { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 3px; text-align: left; }
        .journal-goal-type-picker button { min-height: 33px; border: 1px solid #c5a37d; border-radius: 8px; padding: 5px 7px; color: #6b513e; background: #fffdf5; font-size: .64rem; font-weight: 800; }
        .journal-goal-type-picker button.is-selected { color: #fff; border-color: #ae6549; background: #c87755; }
        .journal-date { display: flex; align-items: center; gap: 8px; font-weight: 800; }
        .journal-date em { padding: 3px 7px; border-radius: 9px; color: #756049; background: #eee0bd; font-size: .68rem; font-style: normal; }
        .journal-rule { height: 5px; margin: 14px 0 12px; border-block: 1px solid rgba(143,105,70,.28); }
        .journal-section { position: relative; border-bottom: 1px solid rgba(130,96,67,.2); }
        .journal-section summary { display: flex; min-height: 44px; align-items: center; gap: 8px; cursor: pointer; font-size: .87rem; font-weight: 900; list-style: none; }
        .journal-section summary::-webkit-details-marker { display: none; }
        .journal-section summary::after { content: '＋'; margin-left: auto; color: #a38667; font-size: 1rem; }
        .journal-section[open] summary::after { content: '−'; }
        .journal-section summary > b { display: grid; min-width: 24px; height: 22px; margin-left: 3px; place-items: center; border-radius: 11px; color: #fff; background: #b99a72; font-size: .66rem; }
        .journal-summary-mark { display: grid; width: 17px; height: 17px; place-items: center; border: 1px solid #9e7d5f; border-radius: 4px; color: #a36c4f; font-size: .72rem; }
        .journal-section-body { padding: 1px 4px 15px 25px; line-height: 1.65; }
        .journal-quote { color: #554035; font: 800 1rem/1.7 'Yu Mincho', serif; }
        .journal-progress { display: flex; align-items: center; gap: 9px; }
        .journal-progress strong { padding: 5px 13px; border-radius: 13px; color: #725039; background: #f5dec0; }
        .journal-progress strong[data-level='STEP'] { background: #f3d3a7; }
        .journal-progress strong[data-level='JUMP'] { color: #8a4938; background: #f8c8ad; }
        .journal-progress strong[data-level='BREATH'] { color: #486b62; background: #dceee8; }
        .journal-progress small { color: #9b5f4c; font-weight: 800; }
        .journal-pending { margin-left: 5px; padding: 3px 7px; border-radius: 9px; color: #9b5e3f; background: #ffe0ae; font-size: .66rem; font-style: normal; }
        .journal-note-lines { display: grid; gap: 4px; margin: 0 0 11px; padding: 0; list-style: none; }
        .journal-note-lines li::before { content: '・'; color: #bd7250; font-weight: 900; }
        .journal-empty { margin: 0 0 10px; color: #9b8b7c; font-size: .8rem; }
        .journal-edit { display: inline-flex; min-height: 34px; align-items: center; gap: 5px; padding: 6px 12px; border: 1px solid #ac8a69; border-radius: 10px; color: #654a39; background: #fff7e4; font-weight: 800; box-shadow: 0 2px 0 #d9c2a4; }
        .journal-editor { display: grid; gap: 9px; }
        .journal-item-editor-list { display: grid; gap: 7px; }
        .journal-item-editor-row { display: grid; grid-template-columns: minmax(0, 1fr) 34px; gap: 7px; }
        .journal-item-editor-row input { min-width: 0; border: 2px solid #c7aa83; border-radius: 10px; padding: 9px 10px; color: #46372d; background: rgba(255,255,255,.76); font: .88rem/1.45 'Yu Gothic', sans-serif; }
        .journal-item-editor-row button { border: 1px solid #c49d83; border-radius: 9px; color: #985c4d; background: #fff8ec; font-weight: 900; }
        .journal-add-item { justify-self: start; min-height: 32px; padding: 5px 10px; border: 1px dashed #a17a5e; border-radius: 9px; color: #70513f; background: #fffaf0; font-size: .74rem; font-weight: 850; }
        .journal-editor-actions { display: flex; flex-wrap: wrap; gap: 7px; }
        .journal-editor-actions button { display: inline-flex; min-height: 34px; align-items: center; gap: 4px; padding: 6px 12px; border: 1px solid #b79a78; border-radius: 9px; color: #67513f; background: #fffaf0; font-weight: 800; }
        .journal-editor-actions .journal-save { color: #fff; border-color: #986044; background: #c77653; }
        .journal-editor-actions .journal-delete { margin-left: auto; color: #99594d; }
        .journal-memory-list { display: grid; gap: 7px; }
        .journal-memory-list > div { display: grid; gap: 2px; padding-left: 10px; border-left: 3px solid #dfbd90; }
        .journal-memory-list span { color: #806c5c; font-size: .77rem; }
        .journal-strategy-list { display: grid; gap: 9px; }
        .journal-strategy-list article { display: grid; gap: 5px; padding: 11px 12px; border: 1px solid #d0ad7d; border-radius: 10px; background: rgba(255,247,224,.68); }
        .journal-strategy-list small { color: #a4684b; font-size: .66rem; font-weight: 900; letter-spacing: .05em; }
        .journal-strategy-list p, .journal-strategy-list strong { margin: 0 0 3px; color: #574136; line-height: 1.55; white-space: pre-wrap; }
        .journal-strategy-list ul { margin: 0 0 3px; padding-left: 20px; color: #654d40; line-height: 1.5; }
        .journal-divination-list { display: grid; gap: 10px; }
        .journal-divination-list > article { display: grid; gap: 6px; padding: 12px; border: 2px solid #ac86ad; border-radius: 12px; background: linear-gradient(135deg,rgba(248,237,251,.86),rgba(255,246,223,.82)); }
        .journal-divination-list header { display: flex; align-items: center; justify-content: space-between; gap: 9px; padding-bottom: 5px; border-bottom: 1px dashed rgba(122,86,120,.3); }
        .journal-divination-list header span, .journal-divination-list small { color: #8d6489; font-size: .65rem; font-weight: 900; letter-spacing: .06em; }
        .journal-divination-list p, .journal-divination-list ul { margin: 0 0 4px; color: #59434f; line-height: 1.6; white-space: pre-wrap; }
        .journal-divination-list ul { padding-left: 20px; }
        .journal-divination-list details { border-top: 1px solid rgba(122,86,120,.22); padding-top: 5px; }
        .journal-divination-list details summary { min-height: 30px; color: #72566f; font-size: .72rem; }
        .journal-divination-list dl { display: grid; gap: 4px; margin: 5px 0 0; }
        .journal-divination-list dl div { display: grid; grid-template-columns: 72px 1fr; gap: 7px; }
        .journal-divination-list dt { color: #936b88; font-weight: 900; }
        .journal-divination-list dd { margin: 0; overflow-wrap: anywhere; }
        .journal-letter { margin-top: 10px; padding: 13px; border: 1px solid #d0b28b; background: rgba(255,255,255,.48); white-space: pre-wrap; }
        .journal-word-list { display: flex; flex-wrap: wrap; gap: 6px; }
        .journal-word-list span { padding: 4px 9px; border: 1px solid #b7a07d; border-radius: 12px; background: #fff9e9; font-size: .75rem; }
        .journal-page-navigation { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; margin-top: 16px; }
        .journal-page-navigation button { display: inline-flex; min-height: 39px; align-items: center; justify-content: center; gap: 4px; border: 1px solid #ad8b67; border-radius: 10px; color: #644c3a; background: #fff7e3; font-weight: 850; }
        .journal-page-navigation button:last-child { justify-self: stretch; }
        .journal-page-navigation button:disabled { opacity: .35; }
        .journal-page-navigation > span { color: #8e735b; font-size: .72rem; font-weight: 900; }
        .journal-tabs { position: absolute; z-index: 4; top: 64px; display: grid; gap: 5px; }
        .journal-tabs-left { right: calc(100% - 8px); }
        .journal-tabs-right { left: calc(100% - 8px); }
        .journal-tab { position: relative; display: grid; width: 49px; min-height: 43px; place-items: center; gap: 0; border: 1px solid #9e7659; color: #604839; background: #f3bd78; box-shadow: 0 2px 5px rgba(49,31,18,.2); }
        .journal-tab-left { border-radius: 8px 0 0 8px; }
        .journal-tab-right { border-radius: 0 8px 8px 0; }
        .journal-tab:nth-child(2n) { background: #e9cf81; }
        .journal-tab span { font-size: .48rem; font-weight: 900; letter-spacing: .08em; }
        .journal-tab b { font-size: .78rem; line-height: 1; }
        .journal-tab i { position: absolute; top: 3px; right: 4px; color: #c14f42; font-size: .53rem; font-style: normal; }
        .journal-tab.is-current { color: #fff; background: #b86c50; transform: translateX(2px); }
        @media (max-width: 620px) {
          .journal-overlay { inset: 46px 0 82px; padding: 9px 30px; align-items: start; }
          .journal-book { width: 100%; }
          .journal-page { max-height: calc(100vh - 145px); padding: 22px 17px 18px 27px; border-radius: 7px 13px 13px 7px; }
          .journal-page-header { grid-template-columns: 1fr auto; gap: 8px 10px; padding-right: 34px; }
          .journal-main-goal { grid-column: 1 / -1; grid-row: 2; padding: 8px 5px 4px; border-inline: 0; border-top: 1px solid rgba(143,105,70,.22); text-align: left; }
          .journal-goal-type-row { justify-content: flex-start; }
          .journal-date { grid-column: 2; grid-row: 1; font-size: .79rem; }
          .journal-close { top: 7px; right: 7px; width: 34px; height: 34px; }
          .journal-archive-open { top: 8px; right: 48px; min-height: 32px; padding-inline: 9px; }
          .journal-archive-sheet { max-height: calc(100vh - 145px); padding: 18px 15px 20px 23px; }
          .journal-archive-list > article > header { align-items: start; flex-direction: column; }
          .journal-section-body { padding-left: 8px; }
          .journal-tabs { top: 80px; gap: 4px; }
          .journal-tab { width: 36px; min-height: 39px; }
          .journal-tabs-left { right: calc(100% - 5px); }
          .journal-tabs-right { left: calc(100% - 5px); }
          .journal-page-navigation { gap: 6px; }
          .journal-page-navigation button { min-height: 42px; font-size: .76rem; }
          .journal-editor-actions { display: grid; grid-template-columns: 1fr 1fr; }
          .journal-editor-actions .journal-delete { grid-column: 1 / -1; margin-left: 0; justify-content: center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .journal-page-next, .journal-page-previous { animation: none; }
        }
      `}</style>
    </section>
  );
}
