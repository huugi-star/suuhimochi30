'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import type { GachaReward } from '@/lib/gacha';
import { GachaCapsule } from '@/components/GachaCapsule';
import { preloadImage } from '@/lib/imagePreload';

type Phase = 'overview' | 'coin' | 'coin-hold' | 'crank' | 'tumble' | 'jam' | 'glimmer' | 'color' | 'ready' | 'drop' | 'hold' | 'upgrade' | 'anticipate' | 'freeze' | 'open' | 'result';
type GachaBackgroundTime = 'morning' | 'day' | 'night';
type Props = {
  reward: GachaReward;
  coins: number;
  backgroundTime?: GachaBackgroundTime;
  preview?: boolean;
  instant?: boolean;
  testProgress?: string;
  onAgain: () => void;
  onClose: () => void;
  onRevealed?: () => void;
};

const CAPSULES = ['peach', 'mint', 'blue', 'lemon', 'lavender', 'peach', 'mint', 'lemon', 'blue', 'lavender', 'lemon', 'mint', 'peach', 'blue'];
const COIN_IMAGES = ['/assets/gatya/suuhimochi_coin_front.png', '/assets/gatya/suuhimochi_coin_edge.png'];
const COIN_ZOOM_MS = 520;
const COIN_MOTION_MS = 1500;
const COIN_STYLE = { '--gacha-coin-delay': `${COIN_ZOOM_MS}ms`, '--gacha-coin-duration': `${COIN_MOTION_MS}ms` } as CSSProperties;

export function GachaScreen({ reward, coins, backgroundTime = 'day', preview = false, instant = false, testProgress, onAgain, onClose, onRevealed }: Props) {
  const [phase, setPhase] = useState<Phase>(instant ? 'result' : 'overview');
  const [coinAssets, setCoinAssets] = useState<'pending' | 'ready' | 'fallback'>('pending');
  // Visual suspense only: the reward was already drawn and saved by the caller.
  // Developer rarity previews always exercise the post-ejection upgrade.
  const [lateUpgrade] = useState(() => reward.rarity !== 'N' && (preview || Math.random() < 0.55));
  const onRevealedRef = useRef(onRevealed);
  useEffect(() => { onRevealedRef.current = onRevealed; }, [onRevealed]);

  useEffect(() => {
    if (instant) return;
    let cancelled = false;
    void Promise.allSettled(COIN_IMAGES.map((src) => preloadImage(src, { timeoutMs: 12000 }))).then((results) => {
      if (cancelled) return;
      const failed = results.some((result) => result.status === 'rejected');
      if (failed) console.warn('Gacha coin images could not be loaded; using the coin fallback.');
      setCoinAssets(failed ? 'fallback' : 'ready');
    });
    return () => { cancelled = true; };
  }, [instant]);

  useEffect(() => {
    if (instant) { onRevealedRef.current?.(); return; }
    if (coinAssets === 'pending') return;
    const timers: number[] = [];
    const after = (ms: number, next: Phase) => timers.push(window.setTimeout(() => setPhase(next), ms));
    after(650, 'coin');
    const coinEnd = 650 + COIN_ZOOM_MS + COIN_MOTION_MS;
    const coinExtension = coinEnd - 1450;
    after(coinEnd, 'coin-hold');
    after(2050 + coinExtension, 'crank');
    after(3400 + coinExtension, 'tumble');
    const earlyRainbow = reward.rarity === 'SR' && !lateUpgrade;
    if (earlyRainbow) {
      after(4450 + coinExtension, 'jam');
      after(5150 + coinExtension, 'glimmer');
      after(5600 + coinExtension, 'color');
    } else if (reward.rarity === 'R' && !lateUpgrade) {
      after(4650 + coinExtension, 'color');
    }
    const dropAt = (earlyRainbow ? 6500 : 5400) + coinExtension;
    after(dropAt - 350, 'ready');
    after(dropAt, 'drop');
    after(dropAt + 1100, 'hold');
    const chargeAt = dropAt + 1400; // A still, 300 ms landing pause.
    if (lateUpgrade) after(chargeAt, 'upgrade');
    const anticipateAt = chargeAt + (lateUpgrade ? 460 : 0);
    after(anticipateAt, 'anticipate');
    const freezeAt = anticipateAt + (reward.rarity === 'SR' ? 600 : 360);
    if (reward.rarity === 'SR') after(freezeAt, 'freeze');
    const openAt = freezeAt + (reward.rarity === 'SR' ? 220 : 0);
    after(openAt, 'open');
    timers.push(window.setTimeout(() => {
      setPhase('result');
      onRevealedRef.current?.();
    }, openAt + (reward.rarity === 'SR' ? 900 : 760)));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [reward.id, reward.rarity, instant, lateUpgrade, coinAssets]);

  const ejected = ['drop', 'hold', 'upgrade', 'anticipate', 'freeze', 'open', 'result'].includes(phase);
  const capsuleRarity = !lateUpgrade || ['anticipate', 'freeze', 'open', 'result'].includes(phase)
    ? reward.rarity : phase === 'upgrade' ? 'R' : 'N';
  const capsulePhase = phase === 'drop' ? 'drop' : phase === 'hold' ? 'hold'
    : phase === 'upgrade' || phase === 'anticipate' ? 'charge'
    : phase === 'freeze' ? 'freeze' : phase === 'open' ? 'open' : 'hidden';
  return (
    <dialog open style={COIN_STYLE} className={`gacha-screen gacha-time-${backgroundTime} gacha-phase-${phase} gacha-rarity-${reward.rarity.toLowerCase()}${ejected ? ' gacha-ejected' : ''}${lateUpgrade ? ' gacha-late-upgrade' : ''}`} aria-modal="true" aria-label="すうひもちガチャ">
      <div className="gacha-haze" aria-hidden="true" />
      <header className="gacha-topbar">
        <div><small>SUUHIMOCHI CAPSULE</small><strong>すうひもちガチャ</strong></div>
        <div className="gacha-topbar-actions"><span>◉ {preview ? '演出テスト' : `${coins} コイン`}</span><button type="button" onClick={onClose} aria-label="ガチャを閉じる"><X size={20} /></button></div>
      </header>
      {testProgress && <span className="gacha-test-progress">{testProgress}</span>}

      <div className="gacha-camera">
        <div className="gacha-machine" aria-hidden="true">
          <div className="gacha-machine-shadow" />
          <div className="gacha-tank">
            <div className="gacha-tank-capsules">
              {CAPSULES.map((tone, index) => <span key={index} className={`gacha-capsule gacha-capsule-${tone} gacha-capsule-position-${index + 1}`}><i /><b /></span>)}
            </div>
            <div className="gacha-tank-shine" />
            <div className="gacha-upgrade-streak" />
          </div>
          <div className="gacha-tank-rim" />
          <div className="gacha-machine-body">
            <div className="gacha-machine-label"><span>✦</span> すうひもち <span>✦</span></div>
            <div className="gacha-coin-slot">
              <span />
            </div>
            <div className="gacha-crank"><div className="gacha-crank-wheel"><span /></div></div>
            <div className="gacha-chute"><div className="gacha-chute-flap" /></div>
          </div>
          <div className="gacha-coin" aria-hidden="true">
            {coinAssets === 'fallback' ? <b className="gacha-coin-fallback">◉</b> : <>
              <img className="gacha-coin-front" src={COIN_IMAGES[0]} alt="" draggable={false} />
              <img className="gacha-coin-edge" src={COIN_IMAGES[1]} alt="" draggable={false} />
            </>}
          </div>
          <div className="gacha-machine-foot gacha-machine-foot-left" />
          <div className="gacha-machine-foot gacha-machine-foot-right" />
        </div>
        <GachaCapsule phase={capsulePhase} rarity={capsuleRarity} />
      </div>

      {(phase === 'open' || phase === 'result') && (
        <div className={`gacha-result${instant ? '' : ' gacha-result-from-capsule'}${phase === 'open' ? ' gacha-result-opening' : ''}`} aria-live="polite">
          <article className={`gacha-reward-card gacha-reward-${reward.rarity.toLowerCase()}`}>
            <span className="gacha-rarity">{reward.rarity}</span>
            <div className="gacha-reward-art">{reward.image ? <img src={reward.image} alt="" /> : <span>{reward.icon}</span>}</div>
            <small>{reward.kind === 'furniture' ? '家具' : reward.kind === 'snack' ? 'お菓子' : '経験'}</small>
            <strong>{reward.name}</strong>
            <b>{preview ? 'PREVIEW' : 'GET'}{reward.amount > 1 ? ` ×${reward.amount}` : ''}</b>
          </article>
          <div className="gacha-result-actions">
            <button type="button" onClick={onAgain} disabled={phase !== 'result' || (!preview && coins < 1) || Boolean(testProgress && testProgress !== 'テスト 10 / 10')}>もう一回</button>
            <button type="button" onClick={onClose} disabled={phase !== 'result'}>閉じる</button>
          </div>
          {!preview && coins < 1 && <small className="gacha-no-coins">コインがなくなったの。また遊んでね。</small>}
        </div>
      )}
    </dialog>
  );
}
