'use client';

import { useRef, useState } from 'react';
import { Coffee, Footprints, Sparkles, TrendingUp } from 'lucide-react';
import type {
  DailyProgressLevel,
  DailyProgressRecord,
  YesterdayProgressLevel,
} from '@/lib/dailyProgress';
import { normalizeDoneItems } from '@/lib/dailyProgress';

type DailyProgressCheckProps = {
  activityDate: string;
  reviewedDate: string;
  onComplete: (record: DailyProgressRecord) => void;
};

const YESTERDAY_CHOICES = [
  {
    value: 'HOP',
    label: 'ホップ',
    description: '少し進めた',
    tone: 'hop',
    Icon: Footprints,
  },
  {
    value: 'STEP',
    label: 'ステップ',
    description: 'しっかり進めた',
    tone: 'step',
    Icon: TrendingUp,
  },
  {
    value: 'JUMP',
    label: 'ジャンプ',
    description: '大きく進めた',
    tone: 'jump',
    Icon: Sparkles,
  },
  {
    value: 'BREATH',
    label: 'ひと呼吸',
    description: '昨日は進めなかった',
    tone: 'breath',
    Icon: Coffee,
  },
] as const satisfies readonly {
  value: YesterdayProgressLevel;
  label: string;
  description: string;
  tone: string;
  Icon: typeof Footprints;
}[];

const TODAY_CHOICES: readonly {
  value: DailyProgressLevel;
  label: string;
  note: string;
}[] = [
  { value: 'HOP', label: 'ホップ', note: '小さく一歩' },
  { value: 'STEP', label: 'ステップ', note: 'しっかり前へ' },
  { value: 'JUMP', label: 'ジャンプ', note: '思いきって進む' },
];

export function DailyProgressCheck({
  activityDate,
  reviewedDate,
  onComplete,
}: DailyProgressCheckProps) {
  const [stage, setStage] = useState<'yesterday' | 'details' | 'today'>(
    'yesterday',
  );
  const [evaluation, setEvaluation] = useState<YesterdayProgressLevel | null>(
    null,
  );
  const [doneItems, setDoneItems] = useState<string[]>(['']);
  const [wasHard, setWasHard] = useState(false);
  const [noteDeferred, setNoteDeferred] = useState(false);
  const doneItemRefs = useRef<Array<HTMLInputElement | null>>([]);

  const chooseYesterday = (value: YesterdayProgressLevel) => {
    if (evaluation) return;
    setEvaluation(value);
    setDoneItems(['']);
    setWasHard(false);
    setNoteDeferred(false);
    window.setTimeout(() => setStage('details'), 220);
  };

  const continueToToday = (hard: boolean, keepNote: boolean) => {
    setWasHard(hard);
    setNoteDeferred(false);
    if (!keepNote) setDoneItems(['']);
    setStage('today');
  };

  const deferNote = () => {
    setDoneItems(['']);
    setWasHard(false);
    setNoteDeferred(true);
    setStage('today');
  };

  const finish = (todayTarget: DailyProgressLevel) => {
    if (!evaluation) return;
    onComplete({
      date: activityDate,
      reviewedDate,
      yesterdayEvaluation: evaluation,
      doneItems: normalizeDoneItems(doneItems),
      noteDeferred,
      wasHard,
      todayTarget,
      recordedAt: new Date().toISOString(),
    });
  };

  const updateDoneItem = (index: number, value: string) => {
    setDoneItems((items) => items.map((item, itemIndex) => itemIndex === index ? value : item));
  };

  const insertDoneItemAfter = (index: number) => {
    setDoneItems((items) => [...items.slice(0, index + 1), '', ...items.slice(index + 1)]);
    window.setTimeout(() => doneItemRefs.current[index + 1]?.focus(), 0);
  };

  const removeDoneItem = (index: number) => {
    setDoneItems((items) => {
      const next = items.filter((_, itemIndex) => itemIndex !== index);
      return next.length > 0 ? next : [''];
    });
  };

  return (
    <section
      className="daily-progress-overlay"
      aria-label="今日の進み方を決める"
    >
      <div className="daily-progress-card">
        {stage === 'yesterday' && (
          <>
            <header className="daily-progress-heading">
              <strong>昨日の足あと</strong>
            </header>
            <p className="daily-progress-question">
              昨日は目標に向けて、
              <br />
              どれくらい進めた？
            </p>
            <div
              className="daily-progress-choices yesterday"
              aria-label="昨日の自己評価"
            >
              {YESTERDAY_CHOICES.map(({ Icon, ...choice }) => (
                <button
                  type="button"
                  key={choice.value}
                  className={`daily-progress-option daily-progress-option-${choice.tone}${evaluation === choice.value ? ' is-selected' : ''}`}
                  aria-pressed={evaluation === choice.value}
                  onClick={() => chooseYesterday(choice.value)}
                >
                  <span
                    className="daily-progress-option-icon"
                    aria-hidden="true"
                  >
                    <Icon size={25} strokeWidth={2.3} />
                  </span>
                  <span className="daily-progress-option-copy">
                    <b>{choice.label}</b>
                    <small>{choice.description}</small>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {stage === 'details' && evaluation && (
          <>
            <header className="daily-progress-heading">
              <strong>
                {evaluation === 'BREATH'
                  ? 'ひと呼吸した日'
                  : `${YESTERDAY_CHOICES.find((choice) => choice.value === evaluation)?.label}できた日`}
              </strong>
            </header>
            <div className="daily-progress-note">
              <span>
                {evaluation === 'BREATH'
                  ? 'どんなことがあったの？（任意）'
                  : 'どんなことをしたの？（任意）'}
              </span>
              <div className="daily-progress-item-list">
                {doneItems.map((item, index) => (
                  <label key={index} className="daily-progress-item">
                    <input
                      ref={(element) => { doneItemRefs.current[index] = element; }}
                      value={item}
                      onChange={(event) => updateDoneItem(index, event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          insertDoneItemAfter(index);
                        }
                      }}
                      maxLength={160}
                      placeholder={evaluation === 'BREATH' ? 'あったことを書く' : 'やったことを書く'}
                      autoFocus={index === 0}
                    />
                    <button type="button" onClick={() => removeDoneItem(index)} aria-label={`${index + 1}件目を削除`}>×</button>
                  </label>
                ))}
              </div>
              <button className="daily-progress-add-item" type="button" onClick={() => { const nextIndex = doneItems.length; setDoneItems((items) => [...items, '']); window.setTimeout(() => doneItemRefs.current[nextIndex]?.focus(), 0); }}>＋ やったことを追加</button>
            </div>
            <div
              className={`daily-progress-actions${evaluation !== 'BREATH' ? ' has-defer' : ''}`}
            >
              {evaluation === 'BREATH' ? (
                <button
                  className="daily-progress-primary"
                  type="button"
                  onClick={() => continueToToday(true, true)}
                >
                  大変だった
                </button>
              ) : (
                <button
                  className="daily-progress-primary"
                  type="button"
                  onClick={() => continueToToday(false, true)}
                >
                  記録する
                </button>
              )}
              <button
                className="daily-progress-skip"
                type="button"
                onClick={() => continueToToday(false, false)}
              >
                スキップ
              </button>
              {evaluation !== 'BREATH' && (
                <button
                  className="daily-progress-defer"
                  type="button"
                  onClick={deferNote}
                >
                  後で記帳する
                </button>
              )}
            </div>
          </>
        )}

        {stage === 'today' && (
          <>
            <header className="daily-progress-heading">
              <strong>今日の一歩</strong>
            </header>
            <p className="daily-progress-question">
              今日は、
              <br />
              目標までどれぐらい進んでみる？
            </p>
            <div
              className="daily-progress-choices today"
              aria-label="今日の進み方"
            >
              {TODAY_CHOICES.map((choice) => (
                <button
                  type="button"
                  key={choice.value}
                  onClick={() => finish(choice.value)}
                >
                  <b>{choice.label}</b>
                  <small>{choice.note}</small>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        .daily-progress-overlay { position: absolute; z-index: 140; inset: 0; display: grid; place-items: center; padding: max(18px, env(safe-area-inset-top)) 14px max(82px, calc(env(safe-area-inset-bottom) + 72px)); background: rgba(27, 22, 19, .38); backdrop-filter: blur(2px); }
        .daily-progress-card { position: relative; width: min(92%, 520px); max-height: 100%; overflow-y: auto; padding: 28px; border: 2px solid #9a7558; border-radius: 22px; color: #4a382c; background: #fff9e9; box-shadow: inset 0 0 0 3px rgba(255,255,255,.58), 0 13px 38px rgba(33,20,12,.42); }
        .daily-progress-heading { position: relative; z-index: 1; text-align: center; }
        .daily-progress-heading strong { display: block; font-family: 'Yu Mincho', serif; font-size: clamp(1.28rem, 4vw, 1.62rem); letter-spacing: .08em; }
        .daily-progress-question { position: relative; z-index: 1; margin: 18px 4px 23px; text-align: center; font-family: 'Yu Mincho', serif; font-size: clamp(1.05rem, 3.5vw, 1.28rem); font-weight: 750; line-height: 1.75; }
        .daily-progress-choices { position: relative; z-index: 1; display: grid; gap: 10px; }
        .daily-progress-choices.yesterday { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .daily-progress-choices button { min-height: 58px; border: 2px solid rgba(125,83,54,.48); border-radius: 14px 12px 15px 11px; color: #513a2c; background: rgba(255,253,243,.92); box-shadow: 0 4px 0 rgba(105,65,44,.22); transition: transform .12s, background .12s, box-shadow .12s; }
        .daily-progress-choices button:hover { background: #fffdf3; transform: translateY(-1px); }
        .daily-progress-choices button:active { transform: translateY(3px); box-shadow: 0 1px 0 rgba(105,65,44,.2); }
        .daily-progress-choices.yesterday button { --option-accent: #d17b50; --option-bg: #fff4e5; display: grid; grid-template-columns: 45px minmax(0, 1fr); align-items: center; min-height: 98px; padding: 13px 12px; border-color: color-mix(in srgb, var(--option-accent) 55%, #bca68f); background: var(--option-bg); text-align: left; }
        .daily-progress-choices.yesterday .daily-progress-option-step { --option-accent: #bf8047; --option-bg: #fff0d4; }
        .daily-progress-choices.yesterday .daily-progress-option-jump { --option-accent: #d35f47; --option-bg: #ffeadb; }
        .daily-progress-choices.yesterday .daily-progress-option-breath { --option-accent: #67998d; --option-bg: #eef8f2; }
        .daily-progress-option-icon { display: grid; width: 39px; height: 39px; place-items: center; border-radius: 50%; color: #fff; background: var(--option-accent); box-shadow: inset 0 1px 0 rgba(255,255,255,.5); }
        .daily-progress-option-copy { display: grid; gap: 5px; min-width: 0; }
        .daily-progress-option-copy small { color: #796354; font-size: .73rem; font-weight: 750; line-height: 1.45; }
        .daily-progress-option.is-selected { border-color: var(--option-accent); background: #fff; box-shadow: 0 0 0 4px color-mix(in srgb, var(--option-accent) 22%, transparent), 0 2px 0 var(--option-accent); transform: translateY(2px) scale(.985); }
        .daily-progress-choices button b { font-size: .98rem; letter-spacing: .06em; }
        .daily-progress-choices.today { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .daily-progress-choices.today button { display: grid; place-items: center; align-content: center; gap: 4px; padding: 10px 5px; }
        .daily-progress-choices.today small { color: #92725b; font-size: .65rem; font-weight: 700; }
        .daily-progress-note { position: relative; z-index: 1; display: grid; gap: 10px; margin: 20px 2px 15px; }
        .daily-progress-note > span { font-family: 'Yu Mincho', serif; font-size: 1.03rem; font-weight: 800; }
        .daily-progress-item-list { display: grid; gap: 7px; }
        .daily-progress-item { display: grid; grid-template-columns: minmax(0, 1fr) 36px; gap: 7px; }
        .daily-progress-item input { min-width: 0; border: 2px solid #cfb18b; border-radius: 11px; padding: 10px 11px; color: #49372c; background: rgba(255,254,247,.9); box-shadow: inset 0 2px 5px rgba(75,48,29,.08); font: .91rem/1.45 'Yu Gothic', sans-serif; }
        .daily-progress-item button { border: 1px solid #c79b81; border-radius: 10px; color: #9b5c4c; background: #fff6e9; font-size: 1.1rem; font-weight: 900; }
        .daily-progress-add-item { justify-self: start; min-height: 33px; padding: 5px 10px; border: 1px dashed #9d765c; border-radius: 9px; color: #765340; background: #fffaf0; font-size: .75rem; font-weight: 850; }
        .daily-progress-actions { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
        .daily-progress-actions button { min-height: 46px; border-radius: 12px; font-weight: 900; letter-spacing: .07em; }
        .daily-progress-primary { border: 2px solid #a85d3e; color: #fffaf0; background: #ce7652; box-shadow: 0 3px 0 #84472f; }
        .daily-progress-skip { border: 2px solid rgba(123,92,67,.38); color: #705744; background: rgba(255,255,255,.68); box-shadow: 0 3px 0 rgba(105,65,44,.15); }
        .daily-progress-actions.has-defer { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .daily-progress-defer { border: 2px solid #789b91; color: #486b62; background: #edf7f2; box-shadow: 0 3px 0 #b9d4cb; }
        .daily-progress-actions button:active { transform: translateY(2px); box-shadow: none; }
        @media (max-width: 520px) {
          .daily-progress-overlay { align-items: start; padding-top: max(66px, calc(env(safe-area-inset-top) + 54px)); }
          .daily-progress-card { width: 100%; padding: 24px 17px 21px; }
          .daily-progress-choices.yesterday { gap: 9px; }
          .daily-progress-choices.yesterday button { grid-template-columns: 1fr; justify-items: center; min-height: 112px; padding: 12px 7px; text-align: center; }
          .daily-progress-option-copy { gap: 3px; }
          .daily-progress-choices.today { grid-template-columns: 1fr; }
          .daily-progress-choices.today button { min-height: 52px; grid-template-columns: 1fr auto; justify-content: stretch; padding-inline: 17px; text-align: left; }
          .daily-progress-actions.has-defer { grid-template-columns: 1fr; }
          .daily-progress-question { margin-block: 16px; }
        }
      `}</style>
    </section>
  );
}
