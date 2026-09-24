'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ScrollText, X } from 'lucide-react';
import { PotenoStrategyReview } from '@/components/PotenoStrategyReview';
import type { DailyProgressRecord } from '@/lib/dailyProgress';
import type {
  TwoDayReviewGoalType,
  TwoDayReviewRecord,
} from '@/lib/twoDayReview';

export type PotenoMode =
  | 'menu'
  | 'strategy'
  | 'six-divination'
  | 'recent'
  | 'consult'
  | 'trivia';

type PotenoPanelProps = {
  onClose: () => void;
  worldTarget?: HTMLElement | null;
  currentDay: number;
  activityDate: string;
  goalType: TwoDayReviewGoalType | null;
  dailyProgressRecords: DailyProgressRecord[];
  journalNotes: Record<string, string[]>;
  twoDayReviews: TwoDayReviewRecord[];
  onSaveTwoDayReview: (record: TwoDayReviewRecord) => void;
};

type PotenoMenuItem = {
  mode: Exclude<PotenoMode, 'menu'>;
  label: string;
  icon: string;
  description: string;
};

type PotenoDirection =
  | 'east'
  | 'north'
  | 'north-east'
  | 'north-west'
  | 'south'
  | 'south-east'
  | 'south-west'
  | 'west';
type PotenoMotion = 'summoning' | 'idle' | 'departing';
type StrategyView = 'menu' | 'pending' | 'history' | 'meeting';

const POTENO_SPRITE_ROOT = '/assets/poteno/Idle/rotations';
const POTENO_IDLE_ROOT = '/assets/poteno/animations/Breathing_Idle/south';

function PotenoSprite({
  direction,
  idle,
}: {
  direction: PotenoDirection;
  idle: boolean;
}) {
  return (
    <span className="poteno-avatar" aria-hidden="true">
      {idle && direction === 'south' ? (
        [0, 1, 2, 3].map((frame) => (
          <img
            className={`poteno-sprite poteno-idle-frame poteno-idle-frame-${frame}`}
            key={frame}
            src={`${POTENO_IDLE_ROOT}/frame_00${frame}.png`}
            alt=""
            draggable={false}
          />
        ))
      ) : (
        <img
          className="poteno-sprite"
          src={`${POTENO_SPRITE_ROOT}/${direction}.png`}
          alt=""
          draggable={false}
        />
      )}
    </span>
  );
}

const POTENO_MENU_ITEMS: readonly PotenoMenuItem[] = [
  {
    mode: 'strategy',
    icon: '🧭',
    label: '戦略を見直す',
    description: '30日間の歩き方を、いっしょに見直す。',
  },
  {
    mode: 'six-divination',
    icon: '🔮',
    label: 'ポテノ六占',
    description: '今日の六占をのぞいてみる。',
  },
  {
    mode: 'recent',
    icon: '📖',
    label: '最近のぼくたちを見る',
    description: 'ふたりの最近を、そっと振り返る。',
  },
  {
    mode: 'consult',
    icon: '💬',
    label: 'なんでも相談する',
    description: '気になることを、ポテノに話す。',
  },
  {
    mode: 'trivia',
    icon: '？',
    label: 'どうでもいいことを聞く',
    description: '役に立つかは、たぶん気分しだい。',
  },
];

const POTENO_PAGE_COPY: Record<
  Exclude<PotenoMode, 'menu'>,
  { title: string; line: string }
> = {
  strategy: {
    title: '戦略を見直す',
    line: '2日前の足あと、いっしょに見てみよう。',
  },
  'six-divination': {
    title: 'ポテノ六占',
    line: '六占の部屋は、まだ扉だけ用意してあるの。',
  },
  recent: {
    title: '最近のぼくたちを見る',
    line: 'ふたりの最近を集めるページは、これから作るの。',
  },
  consult: {
    title: 'なんでも相談する',
    line: '相談の場所は、いま静かに準備してるの。',
  },
  trivia: {
    title: 'どうでもいいことを聞く',
    line: 'どうでもいいことほど、聞く準備がいるの。',
  },
};

export function PotenoPanel({
  onClose,
  worldTarget,
  currentDay,
  activityDate,
  goalType,
  dailyProgressRecords,
  journalNotes,
  twoDayReviews,
  onSaveTwoDayReview,
}: PotenoPanelProps) {
  const [isSummoning, setIsSummoning] = useState(true);
  const [mode, setMode] = useState<PotenoMode>('menu');
  const [strategyView, setStrategyView] = useState<StrategyView>('menu');
  const [motion, setMotion] = useState<PotenoMotion>('summoning');
  const [direction, setDirection] = useState<PotenoDirection>('north');
  const [isClosing, setIsClosing] = useState(false);
  const summonSide = useState<'right' | 'left'>(() =>
    Math.random() < 0.5 ? 'right' : 'left',
  )[0];
  const motionTimerRef = useRef<number | null>(null);
  const motionRunRef = useRef(0);
  const closingRef = useRef(false);

  const playSequence = useCallback(
    (
      directions: PotenoDirection[],
      interval: number,
      onComplete?: () => void,
    ) => {
      const run = ++motionRunRef.current;
      if (motionTimerRef.current !== null)
        window.clearTimeout(motionTimerRef.current);
      let index = 0;
      setDirection(directions[0] ?? 'south');
      const tick = () => {
        if (motionRunRef.current !== run) return;
        if (index >= directions.length - 1) {
          motionTimerRef.current = null;
          onComplete?.();
          return;
        }
        index += 1;
        setDirection(directions[index]);
        motionTimerRef.current = window.setTimeout(tick, interval);
      };
      motionTimerRef.current = window.setTimeout(tick, interval);
    },
    [],
  );

  useEffect(() => {
    const summonPath: PotenoDirection[] =
      summonSide === 'right'
        ? ['north', 'north-east', 'east', 'south-east', 'south']
        : ['north', 'north-west', 'west', 'south-west', 'south'];
    playSequence(summonPath, 118, () => {
      setIsSummoning(false);
      setMotion('idle');
      setDirection('south');
    });
    return () => {
      motionRunRef.current += 1;
      if (motionTimerRef.current !== null)
        window.clearTimeout(motionTimerRef.current);
    };
  }, [playSequence, summonSide]);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setIsClosing(true);
    setMotion('departing');
    setDirection('south');
    if (motionTimerRef.current !== null)
      window.clearTimeout(motionTimerRef.current);
    motionTimerRef.current = window.setTimeout(onClose, 520);
  }, [onClose]);

  const currentPage = mode === 'menu' ? null : POTENO_PAGE_COPY[mode];
  const currentPageTitle = mode === 'strategy'
    ? ({
        menu: '戦略を見直す',
        pending: '未確認の足あとを見る',
        history: '足あとを見返す',
        meeting: 'ポテノ軍師と作戦会議',
      } satisfies Record<StrategyView, string>)[strategyView]
    : currentPage?.title;
  const arrival = (
    <div
      className={`poteno-arrival poteno-arrival-${motion}${isClosing ? ' poteno-arrival-departing' : ''}`}
    >
      {isSummoning && (
        <span className="poteno-summon-stars" aria-hidden="true">
          ✦ ✧ ✦
        </span>
      )}
      {!isSummoning && (
        <div className="poteno-speech" aria-live="polite">
          {currentPage ? (
            <p>{currentPage.line}</p>
          ) : (
            <>
              <p>呼んだ？</p>
              <p>今日は何する？</p>
            </>
          )}
        </div>
      )}
      <PotenoSprite direction={direction} idle={motion === 'idle'} />
    </div>
  );

  return (
    <section
      className={`poteno-visit${isClosing ? ' poteno-visit-departing' : ''}`}
      aria-label="ポテノが来ている"
    >
      {worldTarget ? createPortal(arrival, worldTarget) : arrival}

      {!isSummoning && (
        <aside className="poteno-actions" aria-label="ポテノのメニュー">
          {currentPage ? (
            <div className="poteno-page">
              <header>
                <small>ポテノのメニュー</small>
                <h2>{currentPageTitle}</h2>
              </header>
              {mode === 'strategy' ? (
                strategyView === 'menu' ? (
                  <div className="poteno-strategy-menu">
                    <button type="button" onClick={() => setStrategyView('pending')}>
                      <span aria-hidden="true">📝</span>
                      <span><strong>未確認の足あとを見る</strong><small>漏れている2日後の振り返りを確認する</small></span>
                      <i aria-hidden="true">›</i>
                    </button>
                    <button type="button" onClick={() => setStrategyView('history')}>
                      <span aria-hidden="true">📖</span>
                      <span><strong>足あとを見返す</strong><small>これまで振り返った内容を確認する</small></span>
                      <i aria-hidden="true">›</i>
                    </button>
                    <button type="button" onClick={() => setStrategyView('meeting')}>
                      <span aria-hidden="true">🧭</span>
                      <span><strong>ポテノ軍師と作戦会議</strong><small>これまでの記録をもとに、これからの進め方を相談する</small></span>
                      <i aria-hidden="true">›</i>
                    </button>
                  </div>
                ) : strategyView === 'pending' ? (
                  <div className="poteno-strategy-section">
                    <PotenoStrategyReview
                      currentDay={currentDay}
                      activityDate={activityDate}
                      goalType={goalType}
                      records={dailyProgressRecords}
                      journalNotes={journalNotes}
                      existingReviews={twoDayReviews}
                      onSave={onSaveTwoDayReview}
                    />
                    <button className="poteno-strategy-section-back" type="button" onClick={() => setStrategyView('menu')}>戦略メニューへ戻る</button>
                  </div>
                ) : strategyView === 'history' ? (
                  <div className="poteno-strategy-section">
                    {twoDayReviews.length === 0 ? (
                      <div className="poteno-placeholder"><ScrollText size={27} aria-hidden="true" /><p>まだ見返した足あとがないの。まずは、2日前のことを聞かせて。</p></div>
                    ) : (
                      <div className="poteno-review-history" aria-label="振り返った足あと">
                        {[...twoDayReviews].sort((left, right) => right.completedAt.localeCompare(left.completedAt)).map((review) => (
                          <article key={review.id}>
                            <header><strong>DAY {review.targetDay}</strong><small>{review.targetDate}</small></header>
                            {review.answers.map((answer, index) => <p key={`${answer.item}-${index}`}><span>{answer.item}</span><b>{answer.answer}</b></p>)}
                          </article>
                        ))}
                      </div>
                    )}
                    <button className="poteno-strategy-section-back" type="button" onClick={() => setStrategyView('menu')}>戦略メニューへ戻る</button>
                  </div>
                ) : (
                  <div className="poteno-strategy-section">
                    <div className="poteno-placeholder"><ScrollText size={27} aria-hidden="true" /><p>記録をもとに作戦を練る会議は、いま準備中なの。</p></div>
                    <button className="poteno-strategy-section-back" type="button" onClick={() => setStrategyView('menu')}>戦略メニューへ戻る</button>
                  </div>
                )
              ) : (
                <div className="poteno-placeholder">
                  <ScrollText size={27} aria-hidden="true" />
                  <p>この場所は、まだ準備中なの。</p>
                </div>
              )}
              <button
                className="poteno-back"
                type="button"
                onClick={() => { setMode('menu'); setStrategyView('menu'); }}
              >
                <ArrowLeft size={17} />
                メニューへ戻る
              </button>
            </div>
          ) : (
            <div>
              <div className="poteno-menu-list">
                {POTENO_MENU_ITEMS.map((item) => (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => { setMode(item.mode); setStrategyView('menu'); }}
                  >
                    <span className="poteno-menu-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                    <span className="poteno-menu-arrow" aria-hidden="true">
                      ›
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="poteno-room-back"
                type="button"
                onClick={requestClose}
              >
                部屋にもどる
              </button>
            </div>
          )}
        </aside>
      )}
      <button
        className="poteno-close"
        type="button"
        onClick={requestClose}
        aria-label="ポテノを見送る"
      >
        <X size={20} />
      </button>

      <style>{`
        .poteno-visit { position: fixed; z-index: 120; inset: 0; pointer-events: none; color: #503b2d; animation: poteno-fade-in .2s ease both; }
        .poteno-arrival { position: absolute; z-index: 8; top: 90%; left: 50%; display: grid; justify-items: center; width: 148px; pointer-events: auto; transform: translate(-50%, -100%); }
        .poteno-avatar { position: relative; display: block; width: 132px; height: 148px; filter: drop-shadow(0 8px 3px rgba(47, 30, 29, .28)); }
        .poteno-sprite { display: block; width: 100%; height: auto; image-rendering: pixelated; }
        .poteno-idle-frame { position: absolute; inset: 0; height: 100%; object-fit: contain; opacity: 0; animation: poteno-idle-cycle 2.4s steps(1, end) infinite; }
        .poteno-idle-frame-0 { animation-delay: 0s; }
        .poteno-idle-frame-1 { animation-delay: .6s; }
        .poteno-idle-frame-2 { animation-delay: 1.2s; }
        .poteno-idle-frame-3 { animation-delay: 1.8s; }
        .poteno-arrival-summoning .poteno-avatar { animation: poteno-arrive .72s cubic-bezier(.2,.9,.25,1) both; }
        .poteno-arrival-departing .poteno-avatar { animation: poteno-depart .52s ease-in both; }
        .poteno-arrival-departing .poteno-speech, .poteno-visit-departing .poteno-actions, .poteno-visit-departing .poteno-close { opacity: 0; transition: opacity .18s ease; }
        .poteno-summon-stars { position: absolute; z-index: 1; bottom: 86px; color: #fff6b8; font-size: 1.2rem; letter-spacing: .38em; text-shadow: 0 2px 0 #a76544; animation: poteno-stars .7s ease both; }
        .poteno-speech { position: absolute; bottom: calc(100% + 15px); left: 50%; width: min(258px, 72vw); padding: 14px 17px; border: 3px solid #72503c; border-radius: 19px 22px 20px 17px; background: rgba(255, 253, 244, .96); box-shadow: 0 4px 0 rgba(89, 53, 35, .17); transform: translateX(-32%); font-family: 'Yu Mincho', serif; font-size: clamp(.88rem, 2.2vw, 1rem); font-weight: 800; line-height: 1.55; }
        .poteno-speech::after { content: ''; position: absolute; bottom: -14px; left: 35%; width: 24px; height: 16px; background: #72503c; clip-path: polygon(0 0, 100% 0, 12% 100%); }
        .poteno-speech::before { content: ''; position: absolute; z-index: 1; bottom: -9px; left: calc(35% + 3px); width: 17px; height: 12px; background: #fffdf4; clip-path: polygon(0 0, 100% 0, 12% 100%); }
        .poteno-speech p { margin: 0; }
        .poteno-actions { position: absolute; z-index: 2; top: auto; right: clamp(16px, 5vw, 84px); bottom: clamp(144px, 21vh, 226px); width: min(358px, 42vw); max-height: min(430px, calc(100dvh - 168px)); overflow: auto; padding: 10px; border: 3px solid rgba(110, 76, 55, .88); border-radius: 20px 16px 22px 18px; background: rgba(255, 247, 226, .92); box-shadow: inset 0 0 0 3px rgba(255,255,255,.52), 0 10px 25px rgba(33, 22, 23, .24); pointer-events: auto; }
        .poteno-close { position: absolute; z-index: 3; top: 16px; right: 17px; display: grid; place-items: center; width: 38px; height: 38px; border: 2px solid #806047; border-radius: 50%; color: #684a34; background: rgba(255, 249, 232, .92); box-shadow: 0 3px 0 rgba(80,48,29,.22); pointer-events: auto; }
        .poteno-close:active, .poteno-back:active, .poteno-menu-list button:active { transform: translateY(2px); }
        .poteno-menu-list { display: grid; gap: 8px; }
        .poteno-menu-list button { display: grid; grid-template-columns: 38px minmax(0,1fr) 20px; align-items: center; gap: 10px; width: 100%; min-height: 59px; padding: 9px 13px; border: 2px solid rgba(119,78,54,.52); border-radius: 15px 13px 16px 12px; color: #553b2c; background: rgba(255,253,243,.93); box-shadow: 0 3px 0 rgba(105,65,44,.2); text-align: left; transition: transform .12s, background .12s; }
        .poteno-menu-list button:hover { background: #fffdf3; transform: translateY(-1px); }
        .poteno-menu-icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 11px; background: #f1d7a7; font-size: 1.12rem; }
        .poteno-menu-list strong, .poteno-menu-list small { display: block; }
        .poteno-menu-list strong { font-size: .94rem; letter-spacing: .03em; }
        .poteno-menu-list small { margin-top: 2px; color: #927564; font-size: .67rem; font-weight: 700; line-height: 1.3; }
        .poteno-menu-arrow { color: #c0744f; font-size: 1.8rem; line-height: 1; }
        .poteno-room-back { display: block; width: 100%; min-height: 43px; margin-top: 10px; border: 2px solid rgba(119,78,54,.48); border-radius: 13px; color: #725743; background: rgba(255,255,255,.68); font-size: .86rem; font-weight: 900; letter-spacing: .08em; box-shadow: 0 3px 0 rgba(105,65,44,.16); }
        .poteno-room-back:active { transform: translateY(2px); }
        .poteno-page { padding: 10px 7px 6px; }
        .poteno-page header small { display: block; color: #bd704d; font-size: .67rem; font-weight: 900; letter-spacing: .12em; }
        .poteno-page h2 { margin: 2px 0 12px; font-family: 'Yu Mincho', serif; font-size: clamp(1.1rem, 2.5vw, 1.35rem); letter-spacing: .07em; }
        .poteno-strategy-menu { display: grid; gap: 9px; }
        .poteno-strategy-menu button { display: grid; grid-template-columns: 37px minmax(0, 1fr) 16px; align-items: center; gap: 9px; width: 100%; min-height: 66px; padding: 9px 10px; border: 2px solid rgba(119,78,54,.48); border-radius: 15px 12px 16px 13px; color: #553b2c; background: rgba(255,253,243,.92); box-shadow: 0 3px 0 rgba(105,65,44,.18); text-align: left; }
        .poteno-strategy-menu button:hover { background: #fff7df; transform: translateY(-1px); }
        .poteno-strategy-menu button:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(105,65,44,.18); }
        .poteno-strategy-menu button > span:first-child { display: grid; place-items: center; width: 33px; height: 33px; border-radius: 10px; background: #f0d7a8; font-size: 1.03rem; }
        .poteno-strategy-menu strong, .poteno-strategy-menu small { display: block; }
        .poteno-strategy-menu strong { font-size: .86rem; letter-spacing: .02em; }
        .poteno-strategy-menu small { margin-top: 3px; color: #8f705c; font-size: .67rem; font-weight: 700; line-height: 1.35; }
        .poteno-strategy-menu i { color: #bf7753; font-size: 1.5rem; font-style: normal; }
        .poteno-strategy-section { display: grid; gap: 9px; }
        .poteno-strategy-section-back { justify-self: start; min-height: 35px; padding: 6px 11px; border: 1px solid #9c806b; border-radius: 999px; color: #725743; background: rgba(255,255,255,.7); font-size: .74rem; font-weight: 850; }
        .poteno-review-history { display: grid; gap: 8px; max-height: 260px; overflow-y: auto; padding-right: 2px; }
        .poteno-review-history article { padding: 9px 10px; border: 1px solid rgba(126,85,59,.32); border-radius: 12px; background: rgba(255,253,243,.78); }
        .poteno-review-history header { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding-bottom: 5px; border-bottom: 1px dashed rgba(126,85,59,.28); }
        .poteno-review-history header strong { color: #a66046; font-size: .75rem; letter-spacing: .08em; }
        .poteno-review-history header small { color: #927563; font-size: .65rem; font-weight: 700; }
        .poteno-review-history p { display: flex; justify-content: space-between; gap: 10px; margin: 6px 0 0; color: #715646; font-size: .72rem; font-weight: 700; }
        .poteno-review-history p span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .poteno-review-history p b { flex: none; color: #a45f45; }
        .poteno-placeholder { display: grid; place-items: center; min-height: 112px; padding: 17px; border: 2px dashed rgba(126,85,59,.38); border-radius: 14px; color: #896d58; background: rgba(255,251,235,.5); text-align: center; }
        .poteno-placeholder svg { color: #c57b56; }
        .poteno-placeholder p { max-width: 235px; margin: 8px 0 0; font-family: 'Yu Mincho', serif; font-size: .86rem; font-weight: 700; line-height: 1.6; }
        .poteno-back { display: inline-flex; align-items: center; gap: 5px; min-height: 38px; margin-top: 10px; padding: 7px 12px; border: 0; border-radius: 999px; color: #725743; background: rgba(255,255,255,.67); font-size: .78rem; font-weight: 800; }
        @keyframes poteno-fade-in { from { opacity: 0; } }
        @keyframes poteno-arrive { 0% { opacity: 0; transform: translateY(54px) scale(.35); } 70% { transform: translateY(-7px) scale(1.08); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes poteno-depart { 0% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(24px) scale(.82); } }
        @keyframes poteno-idle-cycle { 0%, 24.99% { opacity: 1; } 25%, 100% { opacity: 0; } }
        @keyframes poteno-stars { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: scale(1.1); } }
        @media (max-width: 700px) {
          .poteno-speech { bottom: calc(100% + 8px); left: 44%; width: min(236px, 70vw); padding: 11px 13px; border-width: 2px; transform: translateX(-20%); font-size: .82rem; }
          .poteno-actions { top: auto; right: 10px; bottom: 208px; width: min(278px, 67vw); max-height: min(420px, calc(100dvh - 230px)); }
          .poteno-menu-list button { min-height: 51px; padding: 7px 8px; }
          .poteno-menu-list small { display: none; }
          .poteno-strategy-menu button { min-height: 56px; padding: 7px 8px; }
          .poteno-strategy-menu small { display: none; }
          .poteno-close { top: 10px; right: 10px; width: 34px; height: 34px; }
        }
      `}</style>
    </section>
  );
}
