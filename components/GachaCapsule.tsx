import type { GachaRarity } from '@/lib/gacha';
import styles from './GachaCapsule.module.css';

type Props = {
  phase: 'hidden' | 'drop' | 'hold' | 'charge' | 'freeze' | 'open';
  rarity: GachaRarity;
};

/** Presentation only. Its coordinate space is the camera, not the recoiling machine. */
export function GachaCapsule({ phase, rarity }: Props) {
  return (
    <div className={styles.stage} data-phase={phase} data-rarity={rarity} aria-hidden="true">
      <div className={styles.shadow} />
      <div className={styles.capsule}>
        <div className={styles.aura} />
        <div className={styles.body}>
          <div className={styles.shell}>
            <div className={styles.upper} />
            <div className={styles.lower} />
            <div className={styles.reflection} />
            <div className={styles.innerLight} />
          </div>
        </div>
        <div className={styles.release}>✦</div>
      </div>
    </div>
  );
}
