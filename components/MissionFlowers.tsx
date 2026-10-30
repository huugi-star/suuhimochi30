import type { CSSProperties } from 'react';
import styles from './MissionFlowers.module.css';
export function MissionFlowers({ count, finale = false }: { count: number; finale?: boolean }) {
  const tier = count <= 2 ? 1 : count <= 4 ? 2 : count === 5 ? 3 : 4;
  const total = [0, 7, 14, 22, 36][tier];
  const angle = (count - 1) * Math.PI / 3;
  const x = finale ? 50 : Math.max(14, Math.min(86, 50 + 40 * Math.sin(angle)));
  const y = finale ? 50 : Math.max(14, Math.min(86, 50 - 40 * Math.cos(angle)));
  return <div className={styles.flowers} data-flower-tier={tier} data-finale={finale} aria-hidden="true">
    {Array.from({ length: total }, (_, i) => {
      const direction = i * 2.39996, radius = finale ? 46 + (i % 6) * 16 : 26 + (i % 6) * (tier + 3);
      const style = { left: `${x}%`, top: `${y}%`, '--dx': `${Math.cos(direction) * radius}px`, '--dy': `${Math.sin(direction) * radius + 26}px`,
        '--turn': `${60 + i * 31}deg`, '--delay': `${(i % 5) * 24}ms`, '--petal': ['#ffd4dd', '#fff2b8', '#f8b9c8', '#fff3e4'][i % 4] } as CSSProperties;
      return <span key={i} className={`${styles.petal}${tier > 1 && i % 3 === 0 ? ` ${styles.flower}` : ''}`} style={style} />;
    })}
  </div>;
}
