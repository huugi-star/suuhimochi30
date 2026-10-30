'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { DailyMissionId, DailyMissionSummary } from '@/lib/dailyMissions';
import styles from './DailyMissionCoin.module.css';
import { MissionFlowers } from './MissionFlowers';

const hints: Record<DailyMissionId, string> = {
  login: 'お部屋を開く', plan: '日誌に予定を1件', report: '昨日の予定すべてに結果を記録。昨日の予定がなければ今日の予定でOK',
  teach: '新しいことばを1語', tomorrow: '日誌に明日の予定を1件', actual: '日誌の「＋追加」で実績を1件',
};
const point = (index: number) => ({ x: 200 + 178 * Math.sin(index * Math.PI / 3), y: 200 - 178 * Math.cos(index * Math.PI / 3) });
const arc = (index: number) => { const a = point(index), b = point(index + 1); return `M${a.x},${a.y} A178,178 0 0 1 ${b.x},${b.y}`; };
type Phase = 'ring' | 'flash' | 'dissolve' | 'mint' | 'coin';

export function DailyMissionCoin({ summary, onPresented, onMission, onCelebrated, disabledMissions = {} }: {
  summary: DailyMissionSummary; onPresented?: () => void; onMission?: (id: DailyMissionId) => void;
  onCelebrated?: (ids: DailyMissionId[]) => void; disabledMissions?: Partial<Record<DailyMissionId, string>>;
}) {
  const [phase, setPhase] = useState<Phase>(summary.coinPresentedAt ? 'coin' : 'ring');
  const [review, setReview] = useState(false);
  const completedIds = summary.missions.filter(m => m.status === 'completed').map(m => m.id);
  const seen = useRef(new Set(summary.coinPresentedAt ? completedIds : summary.celebratedMissionIds));
  const [lightCount, setLightCount] = useState(seen.current.size);
  const [burst, setBurst] = useState<{ id: DailyMissionId; count: number } | null>(null);
  const callback = useRef({ onPresented, onCelebrated });
  callback.current = { onPresented, onCelebrated };
  const signature = summary.missions.map(m => `${m.id}:${m.completedAt ?? ''}`).join('|');
  useEffect(() => {
    const pending = summary.missions.filter(m => m.completedAt && !seen.current.has(m.id)).sort((a,b) => Date.parse(a.completedAt!) - Date.parse(b.completedAt!));
    if (!pending.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      pending.forEach(m => seen.current.add(m.id)); setLightCount(seen.current.size);
      callback.current.onCelebrated?.(pending.map(m => m.id)); return;
    }
    const timers = pending.flatMap((mission, i) => [window.setTimeout(() => {
      seen.current.add(mission.id); const count = seen.current.size;
      setLightCount(count); setBurst({ id: mission.id, count }); callback.current.onCelebrated?.([mission.id]);
    }, i * 850), window.setTimeout(() => setBurst(null), i * 850 + 830)]);
    return () => timers.forEach(window.clearTimeout);
  }, [signature]);
  const full = summary.completed === 6;
  useEffect(() => {
    if (!full || lightCount !== 6 || summary.coinPresentedAt) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('coin'); callback.current.onPresented?.(); return;
    }
    const steps: [number, Phase][] = [[600, 'flash'], [1300, 'dissolve'], [2050, 'mint'], [3250, 'coin']];
    const timers = steps.map(([delay, step]) => window.setTimeout(() => {
      setPhase(step); if (step === 'coin') callback.current.onPresented?.();
    }, delay));
    return () => timers.forEach(window.clearTimeout);
  }, [full, lightCount, summary.coinPresentedAt]);
  const coinVisible = phase === 'mint' || phase === 'coin';
  const showMissions = !coinVisible || review;
  const companionLine = coinVisible ? review ? '6つぜんぶ、できたの！' : 'できたの！ コイン完成なの！'
    : full ? '6つの光が、つながったの！'
    : summary.completed === 0 ? 'きょうは、どれからやってみる？'
    : summary.completed <= 2 ? `あと${6 - summary.completed}個なの！`
    : summary.completed <= 4 ? 'だんだん光ってきたの！' : 'あとひとつで、できあがりなの！';
  return <div className={styles.experience} data-coin-phase={phase} data-completed={summary.completed} data-reward={coinVisible && !review}>
    <div className={styles.ambient} aria-hidden="true">{Array.from({length:8},(_,i)=><i key={i} style={{'--i':i,'--row':i%4} as CSSProperties} />)}</div>
    <div className={styles.ring} data-review={review}>
      {(!coinVisible || review) && <p className={styles.count} aria-live="polite">{summary.completed}<span> / 6</span></p>}
      <svg className={styles.orbit} viewBox="0 0 400 400" aria-hidden="true">
        <circle className={styles.trackShadow} cx="200" cy="200" r="178" />
        <circle className={styles.track} cx="200" cy="200" r="178" />
        {Array.from({ length: 6 }, (_, i) => <path key={i} data-arc-index={i} data-lit={i < lightCount - 1 || lightCount === 6} className={`${styles.arc} ${i < lightCount - 1 || lightCount === 6 ? styles.litArc : ''}`} d={arc(i)} pathLength="1" />)}
        {Array.from({ length: 6 }, (_, i) => { const p = point(i); return <g key={i} data-orb-index={i} data-lit={i < lightCount} className={i < lightCount ? styles.litOrb : styles.darkOrb}>
          <circle className={styles.halo} cx={p.x} cy={p.y} r="17" /><circle className={styles.orb} cx={p.x} cy={p.y} r="9" />
          <circle className={styles.glint} cx={p.x - 2} cy={p.y - 3} r="2.5" />
        </g>; })}
      </svg>
      {showMissions && <div className={styles.missions} aria-label="6つのデイリーミッション">
        {summary.missions.map(mission => <button type="button" key={mission.id} className={styles.mission} data-mission-id={mission.id} data-complete={mission.status === 'completed'} data-celebrating={burst?.id === mission.id} title={disabledMissions[mission.id] ?? hints[mission.id]} disabled={Boolean(disabledMissions[mission.id])} onClick={() => onMission?.(mission.id)}>
          <span>{mission.label}</span>
          <small>{disabledMissions[mission.id] ? disabledMissions[mission.id]!.includes('就寝') ? '朝6時から' : '設定を選択してね' : mission.id === 'login' ? '部屋へ ›' : mission.id === 'teach' ? 'ことば学習へ ›' : '日誌へ ›'}</small>
          <i className={styles.go} aria-hidden="true">›</i>
          {mission.status === 'completed' && <b className={styles.stamp} aria-hidden="true">COMPLETE</b>}
        </button>)}
      </div>}
      {(phase === 'flash' || phase === 'dissolve') && <strong className={styles.complete}>COMPLETE!</strong>}
      {coinVisible && !review && <button type="button" className={styles.coin} onClick={() => setReview(true)} aria-label="完成したすうひもちコイン。達成済みミッションを見る">
        <span className={styles.coinRim}><span className={styles.coinFace}>
          <span className={styles.coinTitle}>SUUHIMOCHI</span>
          <img src="/assets/mochi-zoom/south.png" alt="すうひもち" />
          <span className={styles.coinStars}>✦ DAILY ✦</span>
        </span></span>
      </button>}
      {burst && <MissionFlowers key={`${burst.id}:${burst.count}`} count={burst.count} />}
      {phase === 'mint' && <MissionFlowers count={6} finale />}
    </div>
    <div className={styles.companion} data-mission-companion data-mood={summary.completed <= 2 ? 'waiting' : summary.completed <= 4 ? 'happy' : summary.completed === 5 ? 'excited' : 'celebrating'}>
      <span className={styles.hostReaction} key={`${summary.completed}:${companionLine}`}>
        <img className={styles.host} src="/assets/mochi-zoom/south.png" alt="そばで見守るすうひもち" draggable={false} />
      </span>
      <div className={styles.voice} aria-live="polite">
        {coinVisible && !review && <strong className={styles.rewardTitle}>すうひもちコイン完成！</strong>}
        <p data-mission-comment>{companionLine}</p>
        {coinVisible && <button type="button" onClick={() => setReview(value => !value)}>{review ? 'コインにもどる' : 'タップで達成したミッションを見る'}</button>}
      </div>
    </div>
  </div>;
}
