'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, ListTree, RotateCcw } from 'lucide-react';
import type { DailyProgressRecord } from '@/lib/dailyProgress';
import { getDoneItems } from '@/lib/dailyProgress';
import {
  type TwoDayReviewAnswer,
  type TwoDayReviewGoalType,
  type TwoDayReviewMode,
  type TwoDayReviewRecord,
} from '@/lib/twoDayReview';

type PotenoStrategyReviewProps = {
  currentDay: number;
  activityDate: string;
  goalType: TwoDayReviewGoalType | null;
  records: DailyProgressRecord[];
  journalNotes: Record<string, string[]>;
  existingReviews: TwoDayReviewRecord[];
  onSave: (record: TwoDayReviewRecord) => void;
};

type ReviewCopy = {
  question: (item: string) => string;
  choices: readonly string[];
};

const REVIEW_COPY: Record<TwoDayReviewGoalType, ReviewCopy> = {
  LEARN: {
    question: (item) =>
      `2日前に「${item}」って書いてたね。\n今、その内容を見返したら、どれくらい僕に説明できる？`,
    choices: ['かなりできる', '一部できる', 'あまりできない', '厳しい'],
  },
  MAKE: {
    question: (item) =>
      `2日前に「${item}」って書いてたね。\n今、見直すとどんな感じ？`,
    choices: ['完璧', '良いかも', '微妙', '作り直したい'],
  },
  REACH: {
    question: (item) =>
      `2日前に「${item}」って書いてたね。\nその後、何か反応や結果は返ってきた？`,
    choices: ['良い感じ', '反応があった', '鈍い反応', '無反応'],
  },
  HABIT: {
    question: (item) =>
      `2日前に「${item}」って書いてたね。\nその後、状況はどう？`,
    choices: ['改善してる', '継続中', '何とも言えない', '元に戻った'],
  },
};

function moveDate(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function daysBetween(later: string, earlier: string) {
  const laterTime = new Date(`${later}T12:00:00`).getTime();
  const earlierTime = new Date(`${earlier}T12:00:00`).getTime();
  return Math.max(0, Math.round((laterTime - earlierTime) / 86_400_000));
}

function reviewId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID();
  return `two-day-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function PotenoStrategyReviewStyles() {
  return (
    <style>{`
    .poteno-strategy-review { display: grid; gap: 11px; padding: 7px 1px 3px; }
    .poteno-review-kicker { display: inline-flex; align-items: center; gap: 6px; color: #b86545; font-size: .69rem; font-weight: 900; letter-spacing: .08em; }
    .poteno-review-question { margin: 0; white-space: pre-line; font-family: 'Yu Mincho', serif; font-size: .91rem; font-weight: 800; line-height: 1.65; }
    .poteno-review-choices { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
    .poteno-review-choices button { min-height: 45px; border: 2px solid rgba(126, 85, 59, .42); border-radius: 12px 10px 13px 10px; color: #5a3e2e; background: #fffdf4; box-shadow: 0 3px 0 rgba(105,65,44,.16); font-size: .78rem; font-weight: 900; transition: transform .12s, background .12s; }
    .poteno-review-choices button:hover { background: #fff5dc; transform: translateY(-1px); }
    .poteno-review-choices button:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(105,65,44,.16); }
    .poteno-review-individual { justify-self: start; display: inline-flex; align-items: center; gap: 5px; min-height: 35px; padding: 6px 11px; border: 1px solid #98aea2; border-radius: 10px; color: #4f756b; background: #edf7f1; font-size: .74rem; font-weight: 850; }
    .poteno-strategy-empty, .poteno-strategy-complete { place-items: center; min-height: 155px; padding: 16px; border: 2px dashed rgba(126,85,59,.35); border-radius: 14px; color: #866b57; background: rgba(255,251,235,.5); text-align: center; }
    .poteno-strategy-empty svg, .poteno-strategy-complete svg { color: #c57b56; }
    .poteno-strategy-empty p, .poteno-strategy-complete p { margin: 2px 0 0; font-family: 'Yu Mincho', serif; font-size: .86rem; font-weight: 750; line-height: 1.6; }
    .poteno-strategy-complete small { color: #947360; font-size: .7rem; font-weight: 700; line-height: 1.45; }
    @media (max-width: 700px) { .poteno-review-question { font-size: .82rem; } .poteno-review-choices button { min-height: 41px; font-size: .72rem; } }
  `}</style>
  );
}

export function PotenoStrategyReview({
  currentDay,
  activityDate,
  goalType,
  records,
  journalNotes,
  existingReviews,
  onSave,
}: PotenoStrategyReviewProps) {
  const pendingCandidates = useMemo(() => {
    const cutoffDate = moveDate(activityDate, -2);
    const recordsByDate = new Map(records.map((record) => [record.reviewedDate, record]));
    const dates = new Set([...Object.keys(journalNotes), ...recordsByDate.keys()]);
    const reviewedDates = new Set(existingReviews.map((record) => record.targetDate));
    return [...dates]
      .filter((date) => date <= cutoffDate && !reviewedDates.has(date))
      .map((date) => ({
        date,
        items: Object.prototype.hasOwnProperty.call(journalNotes, date)
          ? journalNotes[date]
          : getDoneItems(recordsByDate.get(date)),
      }))
      .filter((candidate) => candidate.items.length > 0)
      // Begin with the newest due review, then naturally catch up on any
      // older journal entries added later.
      .sort((left, right) => right.date.localeCompare(left.date));
  }, [activityDate, existingReviews, journalNotes, records]);
  const candidate = pendingCandidates[0];
  const targetDate = candidate?.date ?? moveDate(activityDate, -2);
  const elapsedDays = daysBetween(activityDate, targetDate);
  const targetDay = Math.max(1, currentDay - elapsedDays);
  const items = candidate?.items ?? [];
  const reviewCopy = goalType ? REVIEW_COPY[goalType] : null;
  const reviewQuestion = (item: string) => reviewCopy
    ? reviewCopy.question(item).replace('2日前に', elapsedDays === 2 ? '2日前に' : '前に')
    : '';
  const [mode, setMode] = useState<TwoDayReviewMode>(
    items.length >= 3 ? 'SUMMARY' : 'INDIVIDUAL',
  );
  const [itemIndex, setItemIndex] = useState(0);
  const [answers, setAnswers] = useState<TwoDayReviewAnswer[]>([]);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    setMode(items.length >= 3 ? 'SUMMARY' : 'INDIVIDUAL');
    setItemIndex(0);
    setAnswers([]);
    setComplete(false);
  }, [targetDate, items.length]);

  const save = (
    nextMode: TwoDayReviewMode,
    nextAnswers: TwoDayReviewAnswer[],
  ) => {
    onSave({
      id: reviewId(),
      targetDay,
      targetDate,
      items,
      goalType: goalType!,
      mode: nextMode,
      answers: nextAnswers,
      completedAt: new Date().toISOString(),
    });
    setAnswers(nextAnswers);
    setComplete(true);
  };

  const answerIndividual = (answer: string) => {
    const nextAnswers = [...answers, { item: items[itemIndex], answer }];
    if (itemIndex >= items.length - 1) {
      save('INDIVIDUAL', nextAnswers);
      return;
    }
    setAnswers(nextAnswers);
    setItemIndex((current) => current + 1);
  };

  const beginIndividual = () => {
    setMode('INDIVIDUAL');
    setItemIndex(0);
    setAnswers([]);
    setComplete(false);
  };

  if (currentDay < 3) {
    return (
      <>
        <div className="poteno-strategy-review poteno-strategy-empty">
          <BookOpenCheck size={28} />
          <p>2日前の日誌がそろったら、ここでいっしょに見直せるよ。</p>
        </div>
        <PotenoStrategyReviewStyles />
      </>
    );
  }

  if (!candidate) {
    return (
      <>
        <div className="poteno-strategy-review poteno-strategy-empty">
          <BookOpenCheck size={28} />
          <p>
            二日以前の「やったこと」が、まだ記帳されてないみたい。
            <br />
            日誌から書き足せるよ。
          </p>
        </div>
        <PotenoStrategyReviewStyles />
      </>
    );
  }

  if (!goalType || !reviewCopy) {
    return (
      <>
        <div className="poteno-strategy-review poteno-strategy-empty">
          <BookOpenCheck size={28} />
          <p>
            日誌で30日の目標タイプを選ぶと、ここでぴったりの振り返りができるよ。
          </p>
        </div>
        <PotenoStrategyReviewStyles />
      </>
    );
  }

  if (complete) {
    return (
      <>
        <div className="poteno-strategy-review poteno-strategy-complete">
          <BookOpenCheck size={29} />
          <p>2日前の足あと、見直せたね。</p>
          <small>この記録は、これからの作戦を考えるときに使うの。</small>
        </div>
        <PotenoStrategyReviewStyles />
      </>
    );
  }

  if (mode === 'SUMMARY') {
    const combined = items.join('、');
    return (
      <>
        <div className="poteno-strategy-review">
          <div className="poteno-review-kicker">
            <ListTree size={16} />
            DAY {targetDay} の全体確認
          </div>
          <p className="poteno-review-question">
            {reviewQuestion(combined)}
          </p>
          <div className="poteno-review-choices">
            {reviewCopy.choices.map((choice) => (
              <button
                type="button"
                key={choice}
                onClick={() =>
                  save('SUMMARY', [{ item: '全体', answer: choice }])
                }
              >
                {choice}
              </button>
            ))}
          </div>
          <button
            className="poteno-review-individual"
            type="button"
            onClick={beginIndividual}
          >
            <RotateCcw size={15} />
            ひとつずつ確認する
          </button>
        </div>
        <PotenoStrategyReviewStyles />
      </>
    );
  }

  const item = items[itemIndex];
  return (
    <>
      <div className="poteno-strategy-review">
        <div className="poteno-review-kicker">
          <BookOpenCheck size={16} />
          DAY {targetDay} ・ {itemIndex + 1}/{items.length}
        </div>
        <p className="poteno-review-question">{reviewQuestion(item)}</p>
        <div className="poteno-review-choices">
          {reviewCopy.choices.map((choice) => (
            <button
              type="button"
              key={choice}
              onClick={() => answerIndividual(choice)}
            >
              {choice}
            </button>
          ))}
        </div>
      </div>
      <PotenoStrategyReviewStyles />
    </>
  );
}
