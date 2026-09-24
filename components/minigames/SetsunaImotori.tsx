'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import './setsuna-imotori.css';

type GamePhase = 'ready' | 'prepare' | 'waiting' | 'signal' | 'strike' | 'result';
type RoundResult = {
  winner: 'player' | 'cpu';
  playerReaction: number | null;
  cpuReaction: number;
  falseStart: boolean;
};
type Score = { player: number; cpu: number };

const ZOOM = '/assets/suuhimochi/characters/suuhimochi-01/zoom';
const TOTAL_STAGES = 7;
const STAGES = [
  '夕暮れの道場',
  '月影の回廊',
  '竹林の小径',
  '雨の石畳',
  '朱の鳥居',
  '雪の境内',
  '夜明けの決戦',
] as const;
const PREPARE_MS = 650;
const LUNGE_MS = 110;
const HIT_STOP_MS = 150;
const RESULT_MS = 430;
const seconds = (ms: number) => `${(ms / 1000).toFixed(3)}秒`;
const stageNumber = (round: number) => ['一', '二', '三', '四', '五', '六', '七'][round - 1];
const cpuSpeed = (round: number) => Math.round(730 - (round - 1) * 34 + Math.random() * 260);

export function SetsunaImotori({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<GamePhase>('ready');
  const [result, setResult] = useState<RoundResult | null>(null);
  const [blinking, setBlinking] = useState(false);
  const [hasSignal, setHasSignal] = useState(false);
  const [impact, setImpact] = useState(false);
  const [hitStop, setHitStop] = useState(false);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState<Score>({ player: 0, cpu: 0 });
  const stageRef = useRef<HTMLButtonElement>(null);
  const phaseRef = useRef<GamePhase>('ready');
  const resultRef = useRef<RoundResult | null>(null);
  const timers = useRef(new Set<number>());
  const signalAt = useRef(0);
  const cpuReaction = useRef(0);
  const roundRef = useRef(1);
  const audio = useRef<AudioContext | null>(null);

  const transition = useCallback((next: GamePhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const later = useCallback((callback: () => void, delay: number) => {
    // A round has only a handful of timers; release the handles together at
    // the next phase boundary, restart, or unmount.
    timers.current.add(window.setTimeout(callback, delay));
  }, []);

  const cancelTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current.clear();
  }, []);

  // Created/resumed by the start gesture only. Failure leaves a fully silent game.
  const unlockAudio = useCallback(() => {
    try {
      audio.current ??= new AudioContext();
      void audio.current.resume().catch(() => {});
    } catch { /* Audio is optional. */ }
  }, []);

  const playSnap = useCallback(() => {
    const context = audio.current;
    if (!context || context.state !== 'running') return;
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(1600, now);
      oscillator.frequency.exponentialRampToValueAtTime(230, now + .045);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(.13, now + .003);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .065);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(now);
      oscillator.stop(now + .075);
    } catch { /* No dependency on sound availability. */ }
  }, []);

  const strike = useCallback((outcome: RoundResult) => {
    if (!['prepare', 'waiting', 'signal'].includes(phaseRef.current)) return;
    cancelTimers();
    resultRef.current = outcome;
    setResult(outcome);
    setScore((previous) => outcome.winner === 'player'
      ? { ...previous, player: previous.player + 1 }
      : { ...previous, cpu: previous.cpu + 1 });
    setBlinking(false);
    transition('strike');
    // Both contestants move on this beat. The potato follows at contact;
    // their held poses make a short hit stop without blocking input/timers.
    if (!outcome.falseStart) {
      later(() => { setImpact(true); setHitStop(true); }, LUNGE_MS);
      later(() => setHitStop(false), LUNGE_MS + HIT_STOP_MS);
    }
    later(() => transition('result'), RESULT_MS);
  }, [cancelTimers, later, transition]);

  const grab = useCallback(() => {
    const current = phaseRef.current;
    if (current === 'prepare' || current === 'waiting') {
      strike({ winner: 'cpu', playerReaction: null, cpuReaction: cpuReaction.current, falseStart: true });
    } else if (current === 'signal') {
      const elapsed = Math.max(0, performance.now() - signalAt.current);
      strike({ winner: elapsed <= cpuReaction.current ? 'player' : 'cpu', playerReaction: elapsed, cpuReaction: cpuReaction.current, falseStart: false });
    } else if (current === 'strike' || current === 'result') {
      // Record one late response during the reveal delay, without changing the
      // already decided winner. Keeping this path open on the result frame also
      // makes a real mouse click visible even when the CPU beat the player.
      const previous = resultRef.current;
      if (previous && !previous.falseStart && previous.playerReaction === null) {
        const next = { ...previous, playerReaction: Math.max(0, performance.now() - signalAt.current) };
        resultRef.current = next;
        setResult(next);
      }
    }
  }, [strike]);

  const beginRound = useCallback((nextRound: number) => {
    cancelTimers();
    unlockAudio();
    roundRef.current = nextRound;
    setRound(nextRound);
    resultRef.current = null;
    setResult(null);
    setBlinking(false);
    setHasSignal(false);
    setImpact(false);
    setHitStop(false);
    // The opening rounds leave a human-friendly margin. The final round is
    // quicker, but no round is decided by an impossibly fast CPU reaction.
    cpuReaction.current = cpuSpeed(nextRound);
    transition('prepare');
    stageRef.current?.focus({ preventScroll: true });
    later(() => {
      transition('waiting');
      // Independent of the signal delay: one blink cannot count down to "!".
      later(() => { setBlinking(true); later(() => setBlinking(false), 180); }, 350 + Math.random() * 950);
      later(() => { setHasSignal(true); transition('signal'); }, 1800 + Math.random() * 3200);
    }, PREPARE_MS);
  }, [cancelTimers, later, transition, unlockAudio]);

  const startMatch = () => {
    if (phaseRef.current !== 'ready' && phaseRef.current !== 'result') return;
    setScore({ player: 0, cpu: 0 });
    beginRound(1);
  };

  const nextRound = () => {
    if (phaseRef.current !== 'result' || roundRef.current >= TOTAL_STAGES) return;
    beginRound(roundRef.current + 1);
  };

  useLayoutEffect(() => {
    if (phase !== 'signal') return;
    // Start the clock when React commits the visible cue, not when the wait
    // timer requests a render. CPU and player share this monotonic baseline.
    signalAt.current = performance.now();
    playSnap();
    later(() => strike({ winner: 'cpu', playerReaction: null, cpuReaction: cpuReaction.current, falseStart: false }), cpuReaction.current);
  }, [later, phase, playSnap, strike]);

  const reset = useCallback(() => {
    cancelTimers();
    resultRef.current = null;
    setResult(null);
    setBlinking(false);
    setHasSignal(false);
    setImpact(false);
    setHitStop(false);
    roundRef.current = 1;
    setRound(1);
    setScore({ player: 0, cpu: 0 });
    transition('ready');
  }, [cancelTimers, transition]);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if (event.code === 'Escape') { reset(); return; }
      if (event.code !== 'Space' && event.code !== 'Enter') return;
      if (phaseRef.current === 'ready' || phaseRef.current === 'result') return;
      event.preventDefault();
      if (!event.repeat) grab();
    };
    const suspend = () => {
      if (phaseRef.current !== 'ready' && phaseRef.current !== 'result') reset();
    };
    const visibility = () => { if (document.hidden) suspend(); };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('blur', suspend);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('blur', suspend);
      document.removeEventListener('visibilitychange', visibility);
      cancelTimers();
      const context = audio.current;
      audio.current = null;
      if (context && context.state !== 'closed') void context.close().catch(() => {});
    };
  }, [cancelTimers, grab, reset]);

  const dueling = phase !== 'ready' && phase !== 'result';
  const finished = phase === 'result';
  const falseStart = result?.falseStart;
  const finalRound = round === TOTAL_STAGES;
  const eyeEmotion = finished ? (falseStart ? 'angry' : result?.winner === 'cpu' ? 'happy' : 'surprised') : 'neutral';
  const eyeFrame = blinking ? 'closed' : 'open';
  const mouthEmotion = finished && result?.winner === 'player' ? 'surprised' : 'neutral';

  return (
    <div className={`imotori-game stage-${round} phase-${phase}${dueling ? ' is-dueling' : ''}${hasSignal ? ' has-signal' : ''}${impact ? ' has-impact' : ''}${hitStop ? ' hit-stop' : ''}${result ? ` winner-${result.winner}` : ''}${falseStart ? ' false-start' : ''}`}>
      <div className="imotori-chrome">
        <button className="imotori-back" type="button" onClick={onBack} tabIndex={dueling ? -1 : 0}><ArrowLeft size={17} />一覧へ</button>
        <h2>刹那のいも取り</h2>
      </div>

      <button ref={stageRef} type="button" className="imotori-stage" aria-label="焼き芋を取る。合図の後にクリック、タップ、Space、Enter" aria-disabled={!dueling}
        onClick={() => grab()}>
        <span className="imotori-scene" aria-hidden="true">
          <span className="imotori-backdrop" />
          <span className="imotori-vignette" />
          <span className="imotori-tension-lines" />
          <span className="imotori-floor-line" />
          <span className="imotori-shadow shadow-cpu" /><span className="imotori-shadow shadow-player" />
          <span className="imotori-contestant contestant-cpu">
            <span className="imotori-breath">
              <span className="imotori-mochi">
                <img src={`${ZOOM}/body/body-front.png`} alt="" draggable={false} />
                <img src={`${ZOOM}/arms/left/arm-left-down.png`} alt="" draggable={false} />
                <img src={`${ZOOM}/arms/right/arm-right-${finished && result?.winner === 'cpu' ? 'up' : 'open'}.png`} alt="" draggable={false} />
                <span className="imotori-face">
                  <img src={`${ZOOM}/eyes/${eyeEmotion}/eye_${eyeEmotion}_${eyeFrame}.png`} alt="" draggable={false} />
                  <img src={`${ZOOM}/mouth/${mouthEmotion}/mouth_${mouthEmotion}_${finished && (falseStart || result?.winner === 'player') ? 'half' : 'closed'}.png`} alt="" draggable={false} />
                </span>
              </span>
            </span>
          </span>
          <span className="imotori-contestant contestant-player">
            <span className="imotori-breath">
              <span className="imotori-player">
                <i className="imotori-player-body" /><i className="imotori-player-head" />
                <i className="imotori-player-hair" /><i className="imotori-player-eye" />
                <i className="imotori-player-nose" /><i className="imotori-player-hand" />
              </span>
            </span>
          </span>
          <span className="imotori-plate" />
          <span className="imotori-prize"><span className="imotori-potato"><i /><b /></span></span>
          <span className="imotori-steam"><i /><i /><i /></span>
          <span className="imotori-speed speed-cpu" /><span className="imotori-speed speed-player" />
          {hasSignal && <><span className="imotori-signal-cutin"><b>すうひもち</b><i>勝負！</i></span><span className="imotori-signal">！</span><span className="imotori-flash" /></>}
          {phase === 'prepare' && <><span className="imotori-round-cutin"><small>{STAGES[round - 1]}</small><b>第{stageNumber(round)}番</b></span><span className="imotori-prepare">構え……</span></>}
          {falseStart && <span className="imotori-red-flash" />}
          {phase === 'strike' && falseStart && <span className="imotori-early">早い！</span>}
          {finished && <span className="imotori-reaction">{falseStart ? 'まだなの！' : result?.winner === 'cpu' ? 'いただきなの。' : '……え？'}</span>}
        </span>
      </button>

      <div className="imotori-footer">
        {phase === 'ready' && <div className="imotori-ready">
          <span className="imotori-match-label">全七番勝負</span>
          <p>「！」が出たら、焼き芋を取ろう。</p>
          <small>一番から七番まで、舞台が変わる真剣勝負。<br />ステージをクリック・タップ / Space・Enter</small>
          <button className="imotori-primary" type="button" onClick={startMatch}>七番勝負を始める</button>
        </div>}
        {finished && result && <output className="imotori-result">
          <span className="imotori-stage-result">{finalRound ? '全七番・決着' : `第${stageNumber(round)}番 終了`}</span>
          {falseStart ? <strong className="imotori-result-time">おてつき</strong> : <>
            <strong className="imotori-result-time">{result.playerReaction === null ? '間に合わず' : seconds(result.playerReaction)}</strong>
            {result.winner === 'cpu' && <span>すうひもち {seconds(result.cpuReaction)}</span>}
            <b>{result.winner === 'player' ? 'あなたの勝ち' : 'すうひもちの勝ち'}</b>
          </>}
          {falseStart && <span>すうひもち「まだなの！」</span>}
          <span className="imotori-score">あなた {score.player}　―　{score.cpu} すうひもち</span>
          {finalRound
            ? <button className="imotori-primary" type="button" onClick={startMatch}><RotateCcw size={16} />もう一度 七番勝負</button>
            : <button className="imotori-primary" type="button" onClick={nextRound}>第{stageNumber(round + 1)}番へ</button>}
        </output>}
      </div>
      <output className="sr-only">{phase === 'prepare' ? '構え' : phase === 'signal' ? '！' : ''}</output>
    </div>
  );
}
