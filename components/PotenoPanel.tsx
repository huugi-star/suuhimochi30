'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Check, Clipboard, ExternalLink, Radio, ScrollText, X } from 'lucide-react';
import { PotenoStrategyReview } from '@/components/PotenoStrategyReview';
import { PotenoSixDivination } from '@/components/PotenoSixDivination';
import type { DailyProgressRecord } from '@/lib/dailyProgress';
import {
  buildStrategyRequestData,
  createStrategyRequestLink,
  createStrategyRecord,
  parseStrategyResponse,
  STRATEGIST_PROFILES,
  type StrategistId,
  type StrategyAdvice,
  type StrategyRecord,
} from '@/lib/potenoLink';
import type { SixDivinationRecord } from '@/lib/potenoSixDivination';
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
  birthDate: string;
  goalText: string;
  goalType: TwoDayReviewGoalType | null;
  dailyProgressRecords: DailyProgressRecord[];
  journalNotes: Record<string, string[]>;
  twoDayReviews: TwoDayReviewRecord[];
  strategyRecords: StrategyRecord[];
  divinationRecords: SixDivinationRecord[];
  onSaveTwoDayReview: (record: TwoDayReviewRecord) => void;
  onSaveStrategy: (record: StrategyRecord) => void;
  onSaveDivination: (record: SixDivinationRecord) => void;
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
type StrategyView =
  | 'menu'
  | 'pending'
  | 'history'
  | 'meeting'
  | 'meeting-request'
  | 'meeting-response';

const POTENO_SPRITE_ROOT = '/assets/poteno/Idle/rotations';
const POTENO_IDLE_ROOT = '/assets/poteno/animations/Breathing_Idle/south';

const STRATEGIST_ASIDES: Record<StrategistId, readonly string[]> = {
  komei: [
    'ほう……30日という限られた時の中で、どこに手を置くか。\nまず全体を眺めてみましょうか。',
    '目の前の一手だけでは足りませんね。\nその一手が十日後にどこへつながるか、見てみましょう。',
    '急ぐところと、まだ急がなくてよいところ。\nその順序から整えてみましょう。',
    'なるほど。\nでは今あるものを、どこへ配置すれば最も生きるのか考えてみますか。',
    '目標までの道は一本とは限りません。\nまず残された時間と手札を確認しましょう。',
  ],
  sunzi: [
    'まず問うべきは努力の量ではない。\nその努力を向ける場所が正しいかどうかだ。',
    '勝ちにくい場所で力を増やしても消耗するだけだ。\nまず地形を見よう。',
    '何をするかより、何をしないか。\nその選択で勝敗は大きく変わる。',
    '感触ではなく、得たものと失ったものを並べよう。\nそこから次の一手を決めればいい。',
    '力を足す前に、勝てる条件がそろっているか確認しよう。\n戦うのはその後でも遅くない。',
  ],
  hanbei: [
    'あれあれ、相談されちゃったみたいだね。\nじゃあ、ちょっと面白い一手を考えてみようかな。',
    '全部やる必要なんてないよ。\n一番効くところを一つ見つければ、それで動くこともあるからね。',
    'ふむふむ。たくさん動いてるね。\nさて、この中で本当に効いてるのはどれだろう。',
    '複雑な作戦は続かないからね。\nまず一つ、邪魔しているものをどけてみようか。',
    '全部ひっくり返す必要はないよ。\n少し触るだけで流れが変わる場所を探してみよう。',
  ],
};

const lastAsideIndex: Partial<Record<StrategistId, number>> = {};

function pickNonRepeatingAside(strategist: StrategistId) {
  const lines = STRATEGIST_ASIDES[strategist];
  const previous = lastAsideIndex[strategist];
  let index = Math.floor(Math.random() * lines.length);
  if (lines.length > 1 && index === previous) index = (index + 1 + Math.floor(Math.random() * (lines.length - 1))) % lines.length;
  lastAsideIndex[strategist] = index;
  return lines[index];
}

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

function AdviceList({
  number,
  title,
  items,
  tone,
}: {
  number: number;
  title: string;
  items: string[];
  tone: 'moves' | 'checks';
}) {
  return (
    <section className={`poteno-advice-block is-${tone}`}>
      <header><b>{number}</b><strong>{title}</strong></header>
      {items.length > 0 ? (
        <ul>{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
      ) : (
        <p>記載なし</p>
      )}
    </section>
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
    line: '六つのしるしを、ひとつずつ集めるの。',
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
  birthDate,
  goalText,
  goalType,
  dailyProgressRecords,
  journalNotes,
  twoDayReviews,
  strategyRecords,
  divinationRecords,
  onSaveTwoDayReview,
  onSaveStrategy,
  onSaveDivination,
}: PotenoPanelProps) {
  const [isSummoning, setIsSummoning] = useState(true);
  const [mode, setMode] = useState<PotenoMode>('menu');
  const [strategyView, setStrategyView] = useState<StrategyView>('menu');
  const [motion, setMotion] = useState<PotenoMotion>('summoning');
  const [direction, setDirection] = useState<PotenoDirection>('north');
  const [isClosing, setIsClosing] = useState(false);
  const [consultation, setConsultation] = useState('');
  const [responseLink, setResponseLink] = useState('');
  const [responseAdvice, setResponseAdvice] = useState<StrategyAdvice | null>(null);
  const [responseError, setResponseError] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [strategySaved, setStrategySaved] = useState(false);
  const [selectedStrategist, setSelectedStrategist] = useState<StrategistId | null>(null);
  const [strategistAside, setStrategistAside] = useState('');
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
  const strategyRequestData = useMemo(() => selectedStrategist ? buildStrategyRequestData({
    strategist: selectedStrategist,
    goalText,
    goalType,
    currentDay,
    activityDate,
    dailyProgressRecords,
    journalNotes,
    twoDayReviews,
    strategyRecords,
    consultation,
  }) : null, [activityDate, consultation, currentDay, dailyProgressRecords, goalText, goalType, journalNotes, selectedStrategist, strategyRecords, twoDayReviews]);
  const strategyRequestLink = useMemo(
    () => strategyRequestData && strategistAside
      ? createStrategyRequestLink(strategyRequestData, strategistAside)
      : '',
    [strategistAside, strategyRequestData],
  );

  const chooseStrategist = useCallback((choice: StrategistId | 'random') => {
    const strategist: StrategistId = choice === 'random'
      ? (['komei', 'sunzi', 'hanbei'] as const)[Math.floor(Math.random() * 3)]
      : choice;
    setSelectedStrategist(strategist);
    setStrategistAside(pickNonRepeatingAside(strategist));
    setCopyState('idle');
  }, []);

  const copyText = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    window.setTimeout(() => setCopyState('idle'), 1800);
  }, []);

  const readStrategyResponse = useCallback(() => {
    try {
      setResponseAdvice(parseStrategyResponse(responseLink, selectedStrategist));
      setResponseError('');
      setStrategySaved(false);
    } catch (error) {
      setResponseAdvice(null);
      setResponseError(error instanceof Error ? error.message : 'POTENO-RETURNを読み取れませんでした。');
    }
  }, [responseLink, selectedStrategist]);

  const saveStrategyAdvice = useCallback(() => {
    if (!responseAdvice || strategySaved) return;
    onSaveStrategy(createStrategyRecord(responseAdvice, currentDay));
    setStrategySaved(true);
  }, [currentDay, onSaveStrategy, responseAdvice, strategySaved]);

  const currentPageTitle = mode === 'strategy'
    ? ({
        menu: '戦略を見直す',
        pending: '未確認の足あとを見る',
        history: '足あとを見返す',
        meeting: 'ポテノ軍師と作戦会議',
        'meeting-request': '軍師にアドバイスを求める',
        'meeting-response': '軍師のアドバイスを受け取る',
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
              {mode === 'six-divination' ? (
                <PotenoSixDivination
                  birthDate={birthDate}
                  currentDay={currentDay}
                  activityDate={activityDate}
                  goalText={goalText}
                  dailyProgressRecords={dailyProgressRecords}
                  journalNotes={journalNotes}
                  twoDayReviews={twoDayReviews}
                  onSave={onSaveDivination}
                />
              ) : mode === 'strategy' ? (
                strategyView === 'menu' ? (
                  <div className="poteno-strategy-menu">
                    <button className="poteno-strategy-meeting" type="button" onClick={() => setStrategyView('meeting')}>
                      <span aria-hidden="true">🧭</span>
                      <span><strong>ポテノ軍師と作戦会議</strong><small>これまでの記録をもとに、これからの進め方を相談する</small></span>
                      <i aria-hidden="true">›</i>
                    </button>
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
                ) : strategyView === 'meeting' ? (
                  <div className="poteno-strategy-section">
                    <div className="poteno-meeting-menu">
                      <button type="button" onClick={() => setStrategyView('meeting-request')}>
                        <Radio size={22} aria-hidden="true" />
                        <span><strong>軍師にアドバイスを求める</strong><small>日誌をPOTENO-LINKにしてChatGPTへ渡す</small></span>
                      </button>
                      <button type="button" onClick={() => { setResponseAdvice(null); setResponseError(''); setStrategySaved(false); setStrategyView('meeting-response'); }}>
                        <ScrollText size={22} aria-hidden="true" />
                        <span><strong>軍師のアドバイスを受け取る</strong><small>返ってきたPOTENO-RETURNを読み込む</small></span>
                      </button>
                    </div>
                    <button className="poteno-strategy-section-back" type="button" onClick={() => setStrategyView('menu')}>戦略メニューへ戻る</button>
                  </div>
                ) : strategyView === 'meeting-request' ? (
                  <div className="poteno-strategy-section poteno-link-panel">
                    <div className="poteno-strategist-picker">
                      <p>今日は、だれに相談する？</p>
                      <button className={selectedStrategist === 'komei' ? 'is-selected' : ''} type="button" aria-pressed={selectedStrategist === 'komei'} onClick={() => chooseStrategist('komei')}><strong>孔明さん</strong><small>30日全体と、先の道筋を見る</small></button>
                      <button className={selectedStrategist === 'sunzi' ? 'is-selected' : ''} type="button" aria-pressed={selectedStrategist === 'sunzi'} onClick={() => chooseStrategist('sunzi')}><strong>孫子さん</strong><small>戦う場所と、現実的な勝ち方を見る</small></button>
                      <button className={selectedStrategist === 'hanbei' ? 'is-selected' : ''} type="button" aria-pressed={selectedStrategist === 'hanbei'} onClick={() => chooseStrategist('hanbei')}><strong>竹中半兵衛さん</strong><small>無駄を減らして、一番効く手を見る</small></button>
                      <button type="button" className="is-random" onClick={() => chooseStrategist('random')}><strong>ポテノに任せる</strong><small>3人の中からポテノが決める</small></button>
                    </div>
                    {selectedStrategist ? (
                      <>
                        <div className="poteno-selected-strategist"><span>今回の軍師</span><strong>{STRATEGIST_PROFILES[selectedStrategist].displayName}</strong></div>
                        <label className="poteno-consultation">
                          <span>今回相談したいこと <small>任意</small></span>
                          <textarea value={consultation} onChange={(event) => setConsultation(event.target.value)} maxLength={800} placeholder="例：今の進め方を続けていいか知りたい" />
                        </label>
                        <div className="poteno-link-preview" aria-label="POTENO-LINK通信準備中">
                          <p>📡 POTENO-LINK v1&nbsp; ( •̀ω•́ )✧</p>
                          <p>🍠 ﾎﾟﾃﾎﾟﾃ……軍師のところへ通信準備中……</p>
                          <p>(ง ˙ω˙)ว ～📶～</p>
                        </div>
                        <div className="poteno-link-actions">
                          <button type="button" onClick={() => void copyText(strategyRequestLink)}><Clipboard size={16} />全文をコピー</button>
                          <button type="button" onClick={() => window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer')}><ExternalLink size={16} />ChatGPTを開く</button>
                        </div>
                        {copyState === 'copied' && <p className="poteno-link-status is-success">通信文を全文コピーしました。</p>}
                        {copyState === 'failed' && <p className="poteno-link-status is-error">コピーできませんでした。枠内を選択してコピーしてください。</p>}
                      </>
                    ) : (
                      <p className="poteno-strategist-await">軍師を選ぶと、この下に通信文が出るよ。</p>
                    )}
                    {selectedStrategist && (
                      <div className="poteno-link-guide">
                        <strong>使い方</strong>
                        <ol>
                          <li>「全文をコピー」を押してね。</li>
                          <li>「ChatGPTを開く」を押して、コピーした内容を貼り付けて、送信ボタンかEnterで送ってね。</li>
                          <li>返ってきた通信文は一つ前の画面にある「軍師のアドバイスを受け取る」に貼り付けてね。</li>
                        </ol>
                      </div>
                    )}
                    <button className="poteno-strategy-section-back" type="button" onClick={() => setStrategyView('meeting')}>作戦会議へ戻る</button>
                  </div>
                ) : (
                  <div className="poteno-strategy-section poteno-link-panel">
                    {!responseAdvice ? (
                      <>
                        <label className="poteno-response-input">
                          <span>ChatGPTから返ってきた通信文を貼り付けてね</span>
                          <textarea value={responseLink} onChange={(event) => { setResponseLink(event.target.value); setResponseError(''); }} placeholder={'📡 POTENO-RETURN v1\n(｀・ω・´)ゞ ｸﾞﾝｼﾉﾃﾞﾝｺﾞﾝ ｼﾞｭｼﾝ……\n\nDATA[ ... ]'} />
                        </label>
                        {responseError && <p className="poteno-link-status is-error">{responseError}</p>}
                        <button className="poteno-link-read" type="button" onClick={readStrategyResponse} disabled={!responseLink.trim()}>受信する</button>
                      </>
                    ) : (
                      <div className="poteno-advice" aria-label="軍師のアドバイス">
                        <div className="poteno-return-heading"><small>今回の軍師</small><strong>{STRATEGIST_PROFILES[responseAdvice.strategist].displayName}</strong></div>
                        <section className="poteno-advice-block is-counsel">
                          <header><b>1</b><strong>軍師の忠言</strong></header>
                          <p>{responseAdvice.counsel}</p>
                        </section>
                        <section className="poteno-advice-block is-poteno-summary">
                          <header><b>2</b><strong>ポテノの要約</strong></header>
                          <p>{responseAdvice.potenoSummary}</p>
                        </section>
                        <AdviceList number={3} title="次の一手" items={responseAdvice.nextMoves} tone="moves" />
                        <AdviceList number={4} title="確認すること" items={responseAdvice.checkpoints} tone="checks" />
                        <div className="poteno-link-actions poteno-advice-actions">
                          <button type="button" className="is-primary" onClick={saveStrategyAdvice} disabled={strategySaved}>{strategySaved ? <><Check size={16} />保存しました</> : 'この作戦を保存'}</button>
                          <button type="button" onClick={() => void copyText(responseLink)}><Clipboard size={16} />全文をコピー</button>
                          <button type="button" onClick={() => { setResponseAdvice(null); setResponseLink(''); setResponseError(''); setStrategySaved(false); setStrategyView('meeting'); }}>閉じる</button>
                        </div>
                      </div>
                    )}
                    {!responseAdvice && <button className="poteno-strategy-section-back" type="button" onClick={() => setStrategyView('meeting')}>作戦会議へ戻る</button>}
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
        .poteno-strategy-menu .poteno-strategy-meeting { grid-template-columns: 43px minmax(0, 1fr) 20px; min-height: 82px; padding: 11px 12px; border: 3px solid #8c68b8; border-radius: 17px 13px 18px 14px; color: #503c69; background: linear-gradient(128deg, #fff1c8 0%, #ffe3dc 47%, #e7e5ff 100%); box-shadow: 0 4px 0 #c6b0dc, inset 0 0 0 2px rgba(255,255,255,.48); }
        .poteno-strategy-menu .poteno-strategy-meeting:hover { border-color: #7451a4; background: linear-gradient(128deg, #ffe7a8 0%, #ffd3cd 47%, #d9d6ff 100%); transform: translateY(-2px); }
        .poteno-strategy-menu .poteno-strategy-meeting:active { transform: translateY(3px); box-shadow: 0 1px 0 #c6b0dc, inset 0 0 0 2px rgba(255,255,255,.48); }
        .poteno-strategy-menu .poteno-strategy-meeting > span:first-child { width: 39px; height: 39px; border: 2px solid rgba(113,79,159,.48); border-radius: 13px; background: linear-gradient(145deg, #9a72c5, #e18181); box-shadow: 0 2px 0 rgba(92,63,130,.28); font-size: 1.25rem; }
        .poteno-strategy-menu .poteno-strategy-meeting strong { color: #563c75; font-size: .96rem; letter-spacing: .04em; }
        .poteno-strategy-menu .poteno-strategy-meeting small { color: #725b7d; font-size: .7rem; }
        .poteno-strategy-menu .poteno-strategy-meeting i { color: #7651a7; font-size: 1.9rem; }
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
        .poteno-meeting-menu { display: grid; gap: 9px; }
        .poteno-meeting-menu > button { display: grid; grid-template-columns: 32px minmax(0,1fr); align-items: center; gap: 10px; min-height: 72px; padding: 10px 12px; border: 2px solid rgba(119,78,54,.46); border-radius: 14px; color: #5b4030; background: rgba(255,253,243,.94); box-shadow: 0 3px 0 rgba(105,65,44,.17); text-align: left; }
        .poteno-meeting-menu > button:hover { background: #fff5da; transform: translateY(-1px); }
        .poteno-meeting-menu svg { color: #b76949; }
        .poteno-meeting-menu strong, .poteno-meeting-menu small { display: block; }
        .poteno-meeting-menu strong { font-size: .83rem; }
        .poteno-meeting-menu small { margin-top: 3px; color: #90715e; font-size: .65rem; font-weight: 700; line-height: 1.35; }
        .poteno-link-panel { font-size: .75rem; }
        .poteno-strategist-picker { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .poteno-strategist-picker > p { grid-column: 1 / -1; margin: 0 0 2px; color: #5a4031; font-family: 'Yu Mincho', serif; font-size: .92rem; font-weight: 900; text-align: center; }
        .poteno-strategist-picker button { display: grid; gap: 4px; min-height: 68px; padding: 9px 10px; border: 2px solid rgba(111,79,56,.45); border-radius: 13px; color: #584031; background: rgba(255,253,243,.95); box-shadow: 0 3px 0 rgba(101,64,42,.17); text-align: left; }
        .poteno-strategist-picker button:hover { border-color: #b66b4d; background: #fff4d8; transform: translateY(-1px); }
        .poteno-strategist-picker button:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(101,64,42,.17); }
        .poteno-strategist-picker button.is-selected { border-color: #5f9486; background: #e9f6ef; box-shadow: 0 3px 0 rgba(66,111,98,.24), inset 0 0 0 1px rgba(95,148,134,.22); }
        .poteno-strategist-picker button.is-selected strong::after { content: ' 選択中'; color: #4f8375; font-size: .58rem; }
        .poteno-strategist-picker button.is-random { border-color: #c28750; background: #fff0cf; }
        .poteno-strategist-picker strong, .poteno-strategist-picker small { display: block; }
        .poteno-strategist-picker strong { font-size: .82rem; }
        .poteno-strategist-picker small { color: #8b705e; font-size: .63rem; font-weight: 750; line-height: 1.35; }
        .poteno-selected-strategist, .poteno-return-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 11px; border: 1px solid rgba(93,126,117,.45); border-radius: 11px; color: #46665e; background: #eaf5ef; }
        .poteno-selected-strategist span, .poteno-return-heading small { margin: 0; color: #68847c; font-size: .62rem; font-weight: 900; letter-spacing: .07em; }
        .poteno-selected-strategist strong, .poteno-return-heading strong { color: #365a50; font-size: .86rem; }
        .poteno-strategist-await { margin: 0; padding: 12px; border: 2px dashed rgba(104,132,124,.38); border-radius: 11px; color: #6d817b; background: rgba(240,248,244,.68); font-weight: 800; text-align: center; }
        .poteno-consultation, .poteno-response-input { display: grid; gap: 5px; color: #604637; font-weight: 850; }
        .poteno-consultation > span, .poteno-response-input > span { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
        .poteno-consultation small { color: #a18775; font-size: .62rem; }
        .poteno-consultation textarea, .poteno-response-input textarea, .poteno-link-output { width: 100%; resize: vertical; border: 2px solid #c6a681; border-radius: 10px; padding: 9px 10px; color: #4d3a2f; background: rgba(255,255,255,.88); font: .73rem/1.5 'Yu Gothic', sans-serif; }
        .poteno-consultation textarea { min-height: 68px; }
        .poteno-response-input textarea { min-height: 170px; font-family: ui-monospace, 'Cascadia Mono', monospace; }
        .poteno-link-output { min-height: 145px; font-family: ui-monospace, 'Cascadia Mono', monospace; font-size: .63rem; word-break: break-all; }
        .poteno-link-output-request { border-color: #719d91; background: #f0faf6; box-shadow: inset 0 0 0 2px rgba(113,157,145,.08); }
        .poteno-link-preview { display: grid; gap: 5px; padding: 13px 14px; border: 2px solid #719d91; border-radius: 11px; color: #456d62; background: #f0faf6; box-shadow: inset 0 0 0 2px rgba(113,157,145,.08); font: .76rem/1.45 ui-monospace, 'Cascadia Mono', monospace; pointer-events: none; user-select: none; -webkit-user-select: none; }
        .poteno-link-preview p { margin: 0; white-space: nowrap; }
        .poteno-response-input textarea { border-color: #b77b58; background: #fff8e9; box-shadow: inset 0 0 0 2px rgba(183,123,88,.08); }
        .poteno-link-guide { padding: 9px 11px; border: 1px solid rgba(107,143,133,.38); border-radius: 11px; color: #506c64; background: #eef8f3; }
        .poteno-link-guide > strong { display: block; margin-bottom: 4px; color: #3f685d; font-size: .71rem; }
        .poteno-link-guide ol { display: grid; gap: 3px; margin: 0; padding-left: 21px; font-size: .66rem; font-weight: 750; line-height: 1.45; }
        .poteno-link-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        .poteno-link-actions button, .poteno-link-read { display: inline-flex; min-height: 40px; align-items: center; justify-content: center; gap: 5px; border: 1px solid #9e745a; border-radius: 10px; color: #664838; background: #fff8e7; font-size: .71rem; font-weight: 900; box-shadow: 0 2px 0 rgba(97,60,40,.15); }
        .poteno-link-actions button:hover, .poteno-link-read:hover { background: #ffefd0; }
        .poteno-link-actions button:disabled, .poteno-link-read:disabled { cursor: default; opacity: .5; }
        .poteno-link-actions .is-primary, .poteno-link-read { color: #fff; border-color: #9b6047; background: #bf7051; }
        .poteno-link-read { width: 100%; }
        .poteno-link-status { margin: 0; padding: 7px 9px; border-radius: 8px; font-weight: 800; line-height: 1.4; }
        .poteno-link-status.is-success { color: #3f6f5b; background: #e1f1e8; }
        .poteno-link-status.is-error { color: #974f46; background: #ffe3d9; }
        .poteno-advice { display: grid; gap: 8px; }
        .poteno-return-heading { border-color: rgba(183,123,88,.48); color: #74513c; background: #fff2dc; }
        .poteno-return-heading small { color: #9b7158; }
        .poteno-return-heading strong { color: #80513a; }
        .poteno-advice-block { padding: 11px 12px; border: 2px solid rgba(126,85,59,.28); border-radius: 12px; background: rgba(255,253,244,.86); }
        .poteno-advice-block header { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
        .poteno-advice-block header b { display: grid; place-items: center; flex: none; width: 23px; height: 23px; border-radius: 50%; color: #fff; background: #9c6d59; font-size: .69rem; }
        .poteno-advice-block header strong { color: #65483b; font-size: .79rem; letter-spacing: .05em; }
        .poteno-advice-block p { margin: 0; color: #59443a; font-weight: 700; line-height: 1.65; white-space: pre-wrap; }
        .poteno-advice-block ul { display: grid; gap: 5px; margin: 0; padding-left: 19px; color: #59483d; font-weight: 700; line-height: 1.55; }
        .poteno-advice-block.is-counsel { border-color: #9371b6; background: #f4edfc; box-shadow: inset 4px 0 0 #9371b6; }
        .poteno-advice-block.is-counsel header b { background: #8060a4; }
        .poteno-advice-block.is-poteno-summary { border-color: #d79a68; background: #fff4df; box-shadow: inset 4px 0 0 #d79a68; }
        .poteno-advice-block.is-poteno-summary header b { background: #c77f4e; }
        .poteno-advice-block.is-moves { border-color: #6ca391; background: #eaf7f1; box-shadow: inset 4px 0 0 #6ca391; }
        .poteno-advice-block.is-moves header b { background: #578c7b; }
        .poteno-advice-block.is-checks { border-color: #7296bd; background: #edf5fc; box-shadow: inset 4px 0 0 #7296bd; }
        .poteno-advice-block.is-checks header b { background: #5d82aa; }
        .poteno-advice-actions { grid-template-columns: 1.4fr 1fr .8fr; }
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
          .poteno-strategy-menu .poteno-strategy-meeting { min-height: 74px; padding: 9px 10px; }
          .poteno-strategy-menu .poteno-strategy-meeting small { display: block; }
          .poteno-meeting-menu small { display: block; }
          .poteno-strategist-picker { grid-template-columns: 1fr; }
          .poteno-strategist-picker > p { grid-column: auto; }
          .poteno-advice-actions { grid-template-columns: 1fr; }
          .poteno-close { top: 10px; right: 10px; width: 34px; height: 34px; }
        }
      `}</style>
    </section>
  );
}
