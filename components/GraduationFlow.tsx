'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Check, Clipboard, ExternalLink, Footprints, ScrollText, Sparkles } from 'lucide-react';
import type { DailyProgressRecord } from '@/lib/dailyProgress';
import {
  buildGraduationFootprint,
  buildGraduationHandoffRequest,
  createGraduationHandoffLink,
  parseGraduationHandoffResponse,
  type GraduationFootprint,
  type GraduationHandoffAdvice,
  type NextGoalChoice,
} from '@/lib/graduation';
import { STRATEGIST_PROFILES, type StrategyRecord } from '@/lib/potenoLink';
import {
  TWO_DAY_REVIEW_GOAL_TYPES,
  type TwoDayReviewGoalType,
  type TwoDayReviewRecord,
} from '@/lib/twoDayReview';

type GraduationFlowProps = {
  preview?: boolean;
  callName: string;
  cycleNumber: number;
  previousGoal: string;
  previousGoalType: TwoDayReviewGoalType | null;
  dailyProgressRecords: DailyProgressRecord[];
  journalNotes: Record<string, string[]>;
  twoDayReviews: TwoDayReviewRecord[];
  strategyRecords: StrategyRecord[];
  onClose?: () => void;
  onComplete: (result: {
    choice: NextGoalChoice;
    goalText: string;
    goalType: TwoDayReviewGoalType;
    footprint: GraduationFootprint;
    handoffAdvice: GraduationHandoffAdvice;
  }) => void;
};

type GraduationStage = 'farewell' | 'arrival' | 'footprint' | 'advice' | 'goal';

const STRATEGIST_ART = {
  komei: '/assets/strategists/koumei/koumei_advice.png',
  sunzi: '/assets/strategists/sunzi/sunzi_advice.png',
  hanbei: '/assets/strategists/hanbei/hanbei_advice.png',
} as const;

function FootprintList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <section>
      <h3>{title}</h3>
      {items.length > 0 ? <ul>{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p>{empty}</p>}
    </section>
  );
}

export function GraduationFlow({
  preview = false,
  callName,
  cycleNumber,
  previousGoal,
  previousGoalType,
  dailyProgressRecords,
  journalNotes,
  twoDayReviews,
  strategyRecords,
  onClose,
  onComplete,
}: GraduationFlowProps) {
  const [stage, setStage] = useState<GraduationStage>('farewell');
  const [choice, setChoice] = useState<NextGoalChoice | null>(null);
  const [goalText, setGoalText] = useState(previousGoal);
  const [goalType, setGoalType] = useState<TwoDayReviewGoalType | null>(previousGoalType);
  const [handoffAdvice, setHandoffAdvice] = useState<GraduationHandoffAdvice | null>(null);
  const [returnText, setReturnText] = useState('');
  const [returnError, setReturnError] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const footprint = useMemo(() => buildGraduationFootprint({
    goalText: previousGoal,
    journalNotes,
    dailyProgressRecords,
    twoDayReviews,
    strategyRecords,
  }), [dailyProgressRecords, journalNotes, previousGoal, strategyRecords, twoDayReviews]);
  const handoffRequest = useMemo(() => buildGraduationHandoffRequest({
    cycleNumber,
    goalText: previousGoal,
    goalType: previousGoalType,
    footprint,
    dailyProgressRecords,
    journalNotes,
    twoDayReviews,
    strategyRecords,
  }), [cycleNumber, dailyProgressRecords, footprint, journalNotes, previousGoal, previousGoalType, strategyRecords, twoDayReviews]);
  const handoffLink = useMemo(() => createGraduationHandoffLink(handoffRequest), [handoffRequest]);
  const handoffStrategist = handoffRequest.strategist.id;

  const copyHandoffLink = async () => {
    try {
      await navigator.clipboard.writeText(handoffLink);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  const receiveHandoffAdvice = () => {
    try {
      const advice = parseGraduationHandoffResponse(returnText, handoffStrategist);
      setHandoffAdvice(advice);
      setReturnError('');
    } catch (error) {
      setHandoffAdvice(null);
      setReturnError(error instanceof Error ? error.message : '軍師の引き継ぎ忠言を読み込めませんでした。');
    }
  };

  const selectGoalChoice = (nextChoice: NextGoalChoice) => {
    setChoice(nextChoice);
    setGoalText(nextChoice === 'new'
      ? ''
      : nextChoice === 'revise' && handoffAdvice?.suggestedGoal
        ? handoffAdvice.suggestedGoal
        : previousGoal);
    if (nextChoice === 'new') setGoalType(null);
    else setGoalType(previousGoalType);
  };

  const canStart = Boolean(handoffAdvice && choice && goalText.trim() && goalType);

  const reachabilityLabel = handoffAdvice ? ({
    REACHABLE: '次の30日で到達を目指せる',
    MILESTONE_RECOMMENDED: '中継地点を作るのがおすすめ',
    GOAL_CHANGE_RECOMMENDED: '目標の組み直しがおすすめ',
    INSUFFICIENT_DATA: '判断材料を増やす必要がある',
  } as const)[handoffAdvice.reachability] : '';

  return (
    <div className="graduation-overlay" role="dialog" aria-modal="true" aria-label="30日目の卒業と引き継ぎ">
      <main className={`graduation-book graduation-stage-${stage}`}>
        {preview && <div className="graduation-preview-banner">
          <span>開発プレビュー：保存データは変更されません</span>
          {onClose && <button type="button" onClick={onClose}>プレビューを終了</button>}
        </div>}
        <header className="graduation-heading">
          <small>SUUHIMOCHI 30 DAYS</small>
          <strong>{stage === 'farewell' ? `第${cycleNumber}期・卒業の日` : stage === 'arrival' ? '新しいすうひもち' : stage === 'footprint' ? '前の30日の足跡' : stage === 'advice' ? '軍師の引き継ぎ忠言' : '次に見る景色'}</strong>
        </header>

        {stage === 'farewell' && <section className="graduation-scene">
          <div className="graduation-mochi is-graduating"><img src="/assets/mochi-type-1-new/rotations/south.png" alt="30日を一緒に過ごしたすうひもち" /></div>
          <div className="graduation-dialogue">
            <b>すうひもち</b>
            <p>30日目まで、一緒に来てくれてありがとうなの。<br />うまく進んだ日も、止まった日も、ぜんぶここまでの景色なの。</p>
            <p>ぼくは今日で卒業するけど、足跡は次の子へ渡していくの。</p>
          </div>
          <button className="graduation-primary" type="button" onClick={() => setStage('arrival')}>見送る <ArrowRight size={18} /></button>
        </section>}

        {stage === 'arrival' && <section className="graduation-scene">
          <div className="graduation-arrival-light" aria-hidden="true"><Sparkles /></div>
          <div className="graduation-mochi is-new"><img src="/assets/mochi-type-1-new/rotations/south.png" alt="新しく来たすうひもち" /></div>
          <div className="graduation-dialogue">
            <b>新しいすうひもち</b>
            <p>前の子、ここまで{callName}と一緒に走ってたんだね。<br />じゃあ、ぼくはここから一緒に行くの。</p>
            <p>まずは、残してくれた足跡を見せてほしいの。</p>
          </div>
          <button className="graduation-primary" type="button" onClick={() => setStage('footprint')}>足跡を渡す <Footprints size={18} /></button>
        </section>}

        {stage === 'footprint' && <section className="graduation-footprint">
          <div className="graduation-goal"><small>前回の目標</small><strong>「{footprint.previousGoal}」</strong></div>
          <div className="graduation-footprint-stats"><span><b>{footprint.recordedDays}</b>日分の記帳</span><span><b>{footprint.reviewedItems}</b>件の振り返り</span></div>
          <div className="graduation-footprint-grid">
            <FootprintList title="実際に進んだこと" items={footprint.progressed} empty="記帳から確認できる足跡は、まだ少なめです。" />
            <FootprintList title="続けられたこと" items={footprint.continued} empty="繰り返せたことは、次の30日で見つけていけます。" />
            <FootprintList title="止まったこと・未実行" items={footprint.stopped} empty="止まったと判断できる記録はありません。" />
            <FootprintList title="途中で変えた方法・作戦" items={footprint.strategyChanges} empty="途中で保存した作戦変更はありません。" />
          </div>
          {footprint.importantCounsel.length > 0 && <div className="graduation-counsel-notes"><h3>残しておく軍師の忠言</h3>{footprint.importantCounsel.map((item, index) => <p key={index}>{item}</p>)}</div>}
          <button className="graduation-primary" type="button" onClick={() => setStage('advice')}>軍師の査定を見る <ScrollText size={18} /></button>
        </section>}

        {stage === 'advice' && <section className="graduation-advice">
          <div className="graduation-strategist">
            <img src={STRATEGIST_ART[handoffStrategist]} alt="" />
            <div><small>引き継ぎを査定する軍師</small><strong>{STRATEGIST_PROFILES[handoffStrategist].displayName}</strong></div>
          </div>
          {!handoffAdvice ? <>
            <div className="graduation-handoff-intro">
              <strong>前の30日の記録を、軍師へ引き継ぎます</strong>
              <p>目標・日誌・2日後の振り返り・これまでの作戦をまとめ、Base64の通信文にしました。軍師は、次の30日で目標まで届きそうか、中継地点を作るべきかまで査定します。</p>
            </div>
            <div className="graduation-link-preview" aria-label="引き継ぎ通信文">
              <b>📡 POTENO-LINK v1</b>
              <span>TYPE: GRADUATION_HANDOFF_REQUEST</span>
              <small>DATAにはUTF-8 JSONをBase64化して収めています。</small>
            </div>
            <div className="graduation-link-actions">
              <button type="button" onClick={() => void copyHandoffLink()}><Clipboard size={16} />全文をコピー</button>
              <button type="button" onClick={() => window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer')}><ExternalLink size={16} />ChatGPTを開く</button>
            </div>
            {copyState === 'copied' && <p className="graduation-link-status is-success">引き継ぎ通信文をコピーしました。</p>}
            {copyState === 'failed' && <p className="graduation-link-status is-error">コピーできませんでした。ブラウザのクリップボード権限を確認してください。</p>}
            <ol className="graduation-link-guide">
              <li>「全文をコピー」を押します。</li>
              <li>ChatGPTを開き、貼り付けて送信します。</li>
              <li>返ってきたPOTENO-RETURN全文を下へ貼り付けます。</li>
            </ol>
            <label className="graduation-return-input">
              <span>軍師から返ってきた通信文</span>
              <textarea value={returnText} onChange={(event) => { setReturnText(event.target.value); setReturnError(''); }} placeholder={'POTENO-RETURN v1\nTYPE: GRADUATION_HANDOFF_RESPONSE\nDATA[ ... ]'} />
            </label>
            {returnError && <p className="graduation-link-status is-error">{returnError}<br />POTENO-RETURNを最初から最後までコピーしてください。</p>}
            <button className="graduation-primary" type="button" disabled={!returnText.trim()} onClick={receiveHandoffAdvice}>軍師の忠言を受け取る <ScrollText size={18} /></button>
          </> : <>
            <div className={`graduation-reachability is-${handoffAdvice.reachability.toLowerCase()}`}>
              <small>次の30日の見立て</small>
              <strong>{reachabilityLabel}</strong>
              <p>{handoffAdvice.reachabilityReason}</p>
            </div>
            <section className="graduation-assessment"><h3>軍師の査定</h3><p>{handoffAdvice.assessment}</p></section>
            <div className="graduation-advice-grid">
              <FootprintList title="前回、機能したもの" items={handoffAdvice.worked} empty="まだ判断材料がありません。" />
              <FootprintList title="機能しなかったもの" items={handoffAdvice.didNotWork} empty="まだ判断材料がありません。" />
              <section><h3>次に変えること</h3><p>{handoffAdvice.changeNext}</p></section>
              <section><h3>現在地からの次の到達点</h3><p>{handoffAdvice.nextDestination}</p></section>
            </div>
            <div className="graduation-suggested-goal"><small>軍師が示した次の30日の目標案</small><strong>「{handoffAdvice.suggestedGoal}」</strong></div>
            <p className="graduation-advice-note">同じ目標を続ける場合も、前の作戦をそのまま繰り返さず、この査定から組み直します。</p>
            <button className="graduation-primary" type="button" onClick={() => setStage('goal')}>次の目標を決める <ArrowRight size={18} /></button>
          </>}
        </section>}

        {stage === 'goal' && <section className="graduation-next-goal">
          <p className="graduation-next-intro">足跡と忠言を受け取ったの。<br />次の30日は、どの景色へ向かう？</p>
          <div className="graduation-goal-choices">
            <button type="button" className={choice === 'continue' ? 'is-selected' : ''} onClick={() => selectGoalChoice('continue')}><strong>この目標を続ける</strong><small>目標はそのまま、戦略を組み直す</small></button>
            <button type="button" className={choice === 'revise' ? 'is-selected' : ''} onClick={() => selectGoalChoice('revise')}><strong>目標を修正する</strong><small>前回の目標をもとに書き直す</small></button>
            <button type="button" className={choice === 'new' ? 'is-selected' : ''} onClick={() => selectGoalChoice('new')}><strong>新しい目標を決める</strong><small>新しい景色へ向かう</small></button>
          </div>
          {choice && <div className="graduation-goal-form">
            <label><span>次の30日の目標</span><textarea value={goalText} readOnly={choice === 'continue'} onChange={(event) => setGoalText(event.target.value)} maxLength={100} placeholder="30日後に見たい景色を書く" /></label>
            <div className="graduation-goal-types" aria-label="目標タイプ">
              {TWO_DAY_REVIEW_GOAL_TYPES.map((type) => <button type="button" key={type.value} className={goalType === type.value ? 'is-selected' : ''} onClick={() => setGoalType(type.value)}><span>{type.icon}</span>{type.label}</button>)}
            </div>
          </div>}
          <button className="graduation-primary" type="button" disabled={!canStart} onClick={() => {
            if (!handoffAdvice || !choice || !goalType || !goalText.trim()) return;
            onComplete({ choice, goalText: goalText.trim(), goalType, footprint, handoffAdvice });
          }}><Check size={18} /> 新しい30日を始める</button>
        </section>}
      </main>

      <style>{`
        .graduation-overlay { position: fixed; z-index: 2000; inset: 0; display: grid; place-items: center; padding: 20px; overflow-y: auto; color: #4c392d; background: rgba(36,25,22,.72); backdrop-filter: blur(7px); }
        .graduation-book { width: min(960px, 96vw); max-height: calc(100dvh - 32px); overflow-y: auto; padding: 24px 28px 28px; border: 3px solid #74523c; border-radius: 24px 18px 25px 19px; background: radial-gradient(circle at 50% 0, rgba(255,248,204,.9), transparent 36%), linear-gradient(145deg,#fffaf0,#eadbc1); box-shadow: 0 28px 80px rgba(20,12,8,.45), inset 0 0 0 2px rgba(255,255,255,.55); }
        .graduation-preview-banner { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: -8px 0 15px; padding: 9px 12px; border: 1px solid #7a6d9e; border-radius: 10px; color: #43395d; background: #eee9ff; font-size: .72rem; font-weight: 850; }
        .graduation-preview-banner button { flex: 0 0 auto; padding: 6px 10px; border: 1px solid #75669b; border-radius: 999px; color: #fff; background: #75669b; font-size: .68rem; font-weight: 850; }
        .graduation-heading { display: grid; justify-items: center; gap: 3px; margin-bottom: 18px; text-align: center; }
        .graduation-heading small { color: #a16949; font-size: .7rem; font-weight: 900; letter-spacing: .18em; }
        .graduation-heading strong { color: #563824; font: 900 clamp(1.3rem,3vw,1.85rem)/1.35 'Yu Mincho',serif; letter-spacing: .06em; }
        .graduation-scene { display: grid; grid-template-columns: minmax(180px,280px) minmax(280px,1fr); align-items: center; gap: 22px; }
        .graduation-mochi { position: relative; display: grid; place-items: end center; min-height: 300px; }
        .graduation-mochi img { width: min(270px,100%); max-height: 300px; object-fit: contain; image-rendering: pixelated; filter: drop-shadow(0 12px 8px rgba(64,40,28,.25)); }
        .graduation-mochi.is-graduating { opacity: .94; }
        .graduation-mochi.is-new { animation: graduation-arrive .8s cubic-bezier(.2,.85,.25,1) both; }
        .graduation-arrival-light { position: absolute; color: #ffe9a0; filter: drop-shadow(0 0 18px #fff1a8); animation: graduation-glow 1.3s ease-in-out infinite alternate; }
        .graduation-dialogue { position: relative; padding: 22px 24px; border: 2px solid rgba(105,74,51,.48); border-radius: 22px; background: rgba(255,253,245,.91); box-shadow: 0 7px 0 rgba(91,60,42,.13); }
        .graduation-dialogue b { color: #a35f40; font-size: .76rem; letter-spacing: .1em; }
        .graduation-dialogue p { margin: 10px 0 0; font: 800 clamp(.95rem,2vw,1.12rem)/1.85 'Yu Mincho',serif; }
        .graduation-scene > .graduation-primary { grid-column: 1 / -1; justify-self: center; }
        .graduation-primary { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 45px; margin: 18px auto 0; padding: 9px 21px; border: 2px solid #4f7a6e; border-radius: 999px; color: #fff; background: linear-gradient(#719d90,#527f72); box-shadow: 0 4px 0 #355d52; font-weight: 900; }
        .graduation-primary:disabled { cursor: default; filter: grayscale(.65); opacity: .45; box-shadow: none; }
        .graduation-goal { display: grid; justify-items: center; gap: 5px; padding: 14px; border: 1px solid rgba(128,87,58,.34); border-radius: 14px; background: rgba(255,251,235,.78); text-align: center; }
        .graduation-goal small { color: #9a7053; font-weight: 850; }
        .graduation-goal strong { color: #553828; font: 900 1.05rem/1.55 'Yu Mincho',serif; }
        .graduation-footprint-stats { display: flex; justify-content: center; gap: 12px; margin: 12px 0; }
        .graduation-footprint-stats span { padding: 7px 11px; border-radius: 999px; color: #6b5141; background: #f0e3ca; font-size: .75rem; font-weight: 800; }
        .graduation-footprint-stats b { color: #a45d3f; font-size: 1rem; }
        .graduation-footprint-grid,.graduation-advice-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .graduation-footprint-grid section,.graduation-advice-grid section,.graduation-counsel-notes { padding: 14px 16px; border: 1px solid rgba(119,81,55,.3); border-radius: 14px; background: rgba(255,253,244,.8); }
        .graduation-footprint h3,.graduation-advice h3 { margin: 0 0 7px; color: #8a553b; font-size: .8rem; letter-spacing: .04em; }
        .graduation-footprint ul,.graduation-advice ul { display: grid; gap: 5px; margin: 0; padding-left: 20px; }
        .graduation-footprint li,.graduation-advice li,.graduation-footprint p,.graduation-advice p { color: #594438; font-size: .76rem; font-weight: 700; line-height: 1.6; }
        .graduation-counsel-notes { margin-top: 12px; }
        .graduation-counsel-notes p { margin: 6px 0 0; padding-left: 10px; border-left: 3px solid #a784b9; }
        .graduation-footprint > .graduation-primary,.graduation-advice > .graduation-primary,.graduation-next-goal > .graduation-primary { display: flex; }
        .graduation-strategist { display: flex; align-items: center; gap: 15px; width: min(520px,100%); margin: 0 auto 14px; padding: 10px 16px 10px 10px; border: 2px solid #9a765c; border-radius: 15px; background: rgba(255,249,235,.88); }
        .graduation-strategist img { width: 95px; height: 112px; object-fit: cover; object-position: center 18%; border-radius: 10px; background: #e8dbc7; }
        .graduation-strategist div { display: grid; gap: 4px; }
        .graduation-strategist small { color: #91715b; font-weight: 850; }
        .graduation-strategist strong { color: #573b2d; font: 900 1.15rem 'Yu Mincho',serif; }
        .graduation-handoff-intro { margin: 0 auto 12px; padding: 14px 16px; border-left: 4px solid #7e6997; border-radius: 5px 13px 13px 5px; background: rgba(242,235,250,.76); }
        .graduation-handoff-intro strong { color: #5d466d; font-family: 'Yu Mincho',serif; }
        .graduation-handoff-intro p { margin: 7px 0 0; color: #5d4c60; font-size: .76rem; font-weight: 720; line-height: 1.65; }
        .graduation-link-preview { display: grid; justify-items: center; gap: 4px; padding: 14px; border: 2px dashed #9a826d; border-radius: 13px; color: #654a39; background: rgba(255,252,241,.85); text-align: center; }
        .graduation-link-preview b { color: #6d4a35; font-size: .9rem; }
        .graduation-link-preview span { color: #84644e; font-size: .68rem; font-weight: 900; letter-spacing: .04em; }
        .graduation-link-preview small { color: #9b7d68; font-size: .63rem; font-weight: 700; }
        .graduation-link-actions { display: flex; justify-content: center; gap: 9px; margin-top: 11px; }
        .graduation-link-actions button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 40px; padding: 8px 15px; border: 2px solid #597c72; border-radius: 999px; color: #fff; background: #638d81; font-size: .75rem; font-weight: 900; box-shadow: 0 3px 0 #41675d; }
        .graduation-link-guide { display: grid; gap: 4px; margin: 12px 0; padding: 12px 14px 12px 35px; border-radius: 12px; color: #655143; background: rgba(239,229,210,.72); font-size: .7rem; font-weight: 750; line-height: 1.5; }
        .graduation-return-input { display: grid; gap: 6px; color: #644b3b; font-size: .76rem; font-weight: 900; }
        .graduation-return-input textarea { min-height: 118px; resize: vertical; padding: 10px 12px; border: 2px solid #aa8a6f; border-radius: 11px; color: #49372d; background: rgba(255,255,255,.92); font: .72rem/1.55 ui-monospace,monospace; }
        .graduation-return-input textarea:focus { outline: 3px solid rgba(103,139,128,.2); border-color: #648b7f; }
        .graduation-link-status { margin: 9px 0 0; padding: 8px 10px; border-radius: 9px; font-size: .7rem; font-weight: 800; text-align: center; white-space: pre-line; }
        .graduation-link-status.is-success { color: #426c5e; background: #e3f3ea; }
        .graduation-link-status.is-error { color: #914537; background: #f9e6df; }
        .graduation-reachability { display: grid; justify-items: center; gap: 5px; margin-bottom: 12px; padding: 14px 16px; border: 2px solid #7d9687; border-radius: 15px; background: #edf6ef; text-align: center; }
        .graduation-reachability small { color: #6e8176; font-size: .66rem; font-weight: 900; letter-spacing: .08em; }
        .graduation-reachability strong { color: #3f6759; font: 900 1.05rem/1.4 'Yu Mincho',serif; }
        .graduation-reachability p { margin: 0; color: #53675d; font-size: .74rem; font-weight: 750; line-height: 1.6; }
        .graduation-reachability.is-milestone_recommended { border-color: #b08a55; background: #fff5df; }
        .graduation-reachability.is-milestone_recommended strong { color: #896131; }
        .graduation-reachability.is-goal_change_recommended { border-color: #a06a62; background: #faece8; }
        .graduation-reachability.is-goal_change_recommended strong { color: #8d4e43; }
        .graduation-reachability.is-insufficient_data { border-color: #858093; background: #f1eff6; }
        .graduation-reachability.is-insufficient_data strong { color: #655e76; }
        .graduation-assessment { margin-bottom: 12px; padding: 14px 16px; border: 1px solid rgba(119,81,55,.3); border-radius: 14px; background: rgba(255,253,244,.88); }
        .graduation-assessment h3 { margin: 0 0 7px; color: #76513d; font-size: .8rem; }
        .graduation-assessment p { margin: 0; color: #503d32; font: 760 .8rem/1.72 'Yu Mincho',serif; }
        .graduation-suggested-goal { display: grid; justify-items: center; gap: 5px; margin-top: 12px; padding: 13px 15px; border: 2px solid rgba(99,143,130,.52); border-radius: 14px; background: rgba(232,246,239,.8); text-align: center; }
        .graduation-suggested-goal small { color: #68867d; font-size: .66rem; font-weight: 900; }
        .graduation-suggested-goal strong { color: #456c60; font: 900 .88rem/1.55 'Yu Mincho',serif; }
        .graduation-advice-note { margin: 12px 0 0; padding: 10px 12px; border-left: 4px solid #698e83; background: rgba(230,244,237,.78); }
        .graduation-next-intro { text-align: center; font: 850 1rem/1.75 'Yu Mincho',serif; }
        .graduation-goal-choices { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
        .graduation-goal-choices button { display: grid; gap: 5px; min-height: 82px; padding: 12px; border: 2px solid #b69b83; border-radius: 14px; color: #604838; background: rgba(255,252,242,.85); text-align: left; }
        .graduation-goal-choices button.is-selected { border-color: #638f82; background: #eaf6f0; box-shadow: 0 0 0 3px rgba(99,143,130,.16); }
        .graduation-goal-choices strong { font-size: .82rem; }
        .graduation-goal-choices small { color: #8a705e; font-size: .65rem; font-weight: 700; line-height: 1.4; }
        .graduation-goal-form { display: grid; gap: 12px; margin-top: 14px; padding: 14px; border: 1px solid rgba(122,85,58,.32); border-radius: 14px; background: rgba(255,253,244,.78); }
        .graduation-goal-form label { display: grid; gap: 6px; color: #654a39; font-weight: 850; }
        .graduation-goal-form textarea { min-height: 76px; resize: vertical; padding: 10px 12px; border: 2px solid #c0a17c; border-radius: 10px; color: #47362c; background: #fff; font: .86rem/1.55 inherit; }
        .graduation-goal-form textarea:read-only { color: #67584d; background: #f2ede3; }
        .graduation-goal-types { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        .graduation-goal-types button { padding: 8px; border: 1px solid #b49a85; border-radius: 10px; color: #654b3b; background: #fffaf0; font-size: .72rem; font-weight: 800; }
        .graduation-goal-types button.is-selected { border-color: #688f84; color: #456e62; background: #eaf6f0; }
        .graduation-goal-types span { margin-right: 5px; }
        @keyframes graduation-arrive { from { opacity: 0; transform: translateY(35px) scale(.75); } 65% { transform: translateY(-5px) scale(1.04); } to { opacity: 1; transform: none; } }
        @keyframes graduation-glow { from { opacity: .35; transform: scale(.9); } to { opacity: .9; transform: scale(1.2); } }
        @media (max-width:700px) {
          .graduation-overlay { align-items: start; padding: 8px; }
          .graduation-book { width: 100%; max-height: calc(100dvh - 16px); padding: 19px 14px 22px; }
          .graduation-scene { grid-template-columns: 1fr; gap: 10px; }
          .graduation-mochi { min-height: 185px; }
          .graduation-mochi img { max-height: 195px; }
          .graduation-dialogue { padding: 16px; }
          .graduation-footprint-grid,.graduation-advice-grid,.graduation-goal-choices,.graduation-goal-types { grid-template-columns: 1fr; }
          .graduation-strategist img { width: 78px; height: 96px; }
          .graduation-footprint-stats { flex-wrap: wrap; }
          .graduation-link-actions { display: grid; grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
