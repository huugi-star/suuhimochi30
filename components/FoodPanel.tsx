'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Cherry, Clock3, Sparkles, X } from 'lucide-react';
import { getExperienceMealStatus, getFruitImage, isFruitSpoiled, type ExperienceFruitRecord, type ExperienceMealState, type PersonaStage } from '@/lib/food';

type FoodPanelProps = {
  fruits: ExperienceFruitRecord[];
  personaStage: PersonaStage;
  mealState: ExperienceMealState;
  onEat: (fruitId: string) => string | null;
  onClose: () => void;
};

type EatingState = {
  fruit: ExperienceFruitRecord;
  phase: 'moving' | 'chewing' | 'reaction';
  reaction: string;
};

const STAGE_LABELS = ['まだ白い', '少し色づいた', '色が育っている', '自分らしい色'] as const;

function formatRemainingTime(remainingMs: number) {
  const totalMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `あと${hours}時間${minutes}分` : `あと${minutes}分`;
}

export function FoodPanel({ fruits, personaStage, mealState, onEat, onClose }: FoodPanelProps) {
  const [now, setNow] = useState(() => new Date());
  const [eating, setEating] = useState<EatingState | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);

  const uneaten = useMemo(
    () => fruits.filter((fruit) => !fruit.eatenAt).sort((left, right) => left.generatedAt.localeCompare(right.generatedAt)),
    [fruits],
  );
  const fresh = uneaten.filter((fruit) => !isFruitSpoiled(fruit, now));
  const spoiled = uneaten.filter((fruit) => isFruitSpoiled(fruit, now));
  const mealStatus = getExperienceMealStatus(mealState, now);
  const canEat = mealStatus.state === 'hungry';

  const eat = (fruit: ExperienceFruitRecord) => {
    if (eating || !canEat || isFruitSpoiled(fruit, new Date())) return;
    setEating({ fruit, phase: 'moving', reaction: '' });
    timers.current.push(window.setTimeout(() => {
      const reaction = onEat(fruit.id);
      if (!reaction) {
        setEating(null);
        return;
      }
      setEating({ fruit, phase: 'chewing', reaction });
      timers.current.push(window.setTimeout(() => {
        setEating({ fruit, phase: 'reaction', reaction });
        timers.current.push(window.setTimeout(() => setEating(null), 1800));
      }, 720));
    }, 620));
  };

  return (
    <section className="food-panel" aria-label="食事">
      <button className="food-panel-close" type="button" aria-label="食事を閉じる" onClick={onClose}><X size={18} /></button>
      <header className="food-panel-heading">
        <span aria-hidden="true">🍽️</span>
        <div><strong>食事</strong><small>人間さんの経験を、味わう時間なの。</small></div>
      </header>

      <div className="persona-color-progress" aria-label={`ぺるそなの色づき：${STAGE_LABELS[personaStage]}`}>
        <div><Sparkles size={15} /><strong>ぺるそなの色づき</strong><span>{STAGE_LABELS[personaStage]}</span></div>
        <div className="persona-color-dots" aria-hidden="true">
          {[0, 1, 2, 3].map((stage) => <i key={stage} className={stage <= personaStage ? 'is-filled' : ''} />)}
        </div>
      </div>

      <div className={`food-meal-status food-meal-status-${mealStatus.state}`} aria-live="polite">
        <strong>
          {mealStatus.state === 'hungry'
            ? 'おなかすいたの。'
            : mealStatus.state === 'full'
              ? 'いまはおなかいっぱいなの。'
              : '今日はごちそうさまなの。'}
        </strong>
        <span>
          {mealStatus.state === 'hungry'
            ? `いまは${mealStatus.nextMealNumber}食目を食べられるの。`
            : mealStatus.state === 'full'
              ? `次の${mealStatus.nextMealNumber}食目まで ${formatRemainingTime(mealStatus.remainingMs)}`
              : '3食たべ終わったの。次は06:00からなの。'}
        </span>
      </div>

      <section className="food-shelf food-shelf-main">
        <div className="food-shelf-title"><div><b>主食</b><strong>経験の実</strong></div><span>{canEat ? `食べられる実　${fresh.length}こ` : '次の食事まで待つの'}</span></div>
        {fresh.length > 0 ? (
          <div className="fruit-grid">
            {fresh.map((fruit) => (
              <button key={fruit.id} type="button" className="fruit-card" disabled={Boolean(eating) || !canEat} onClick={() => eat(fruit)}>
                <img src={getFruitImage(fruit)} alt="経験の実" draggable={false} />
                <span>DAYの経験</span>
                <small>{fruit.sourceDate}</small>
              </button>
            ))}
          </div>
        ) : <p className="food-empty">いま食べられる経験の実はないの。<br />日誌に「やったこと」を書くと、実が3つできるよ。</p>}

        {spoiled.length > 0 && (
          <details className="spoiled-fruits">
            <summary><Clock3 size={14} /> 食べそこねた実　{spoiled.length}こ</summary>
            <div className="spoiled-fruit-list">
              {spoiled.map((fruit) => <div key={fruit.id}><img src={getFruitImage(fruit, true)} alt="傷んだ経験の実" /><span>{fruit.sourceDate}</span></div>)}
            </div>
            <p>昨日の実、食べそこねちゃったの。まあ、今日の実を待つの。</p>
          </details>
        )}
      </section>

      <section className="food-shelf food-shelf-snack" aria-label="おやつ">
        <div className="food-shelf-title"><div><b>おやつ</b><strong>ことばの実</strong></div><span className="food-coming-soon">準備中</span></div>
        <div className="word-fruit-placeholder"><Cherry size={26} /><p>覚えたことばからできる、サクランボのおやつ。<br /><small>もう少し待っててなの。</small></p></div>
      </section>

      {eating && (
        <div className={`food-eating food-eating-${eating.phase}`} aria-live="polite">
          <img src={getFruitImage(eating.fruit)} alt="" />
          <img className="food-eating-mochi" src="/assets/suuhimochi-type-1.png" alt="" aria-hidden="true" />
          <strong>{eating.phase === 'moving' ? 'いただきますなの。' : eating.phase === 'chewing' ? 'もぐもぐ……' : eating.reaction}</strong>
        </div>
      )}
    </section>
  );
}
