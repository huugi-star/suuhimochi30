'use client';
import styles from './RoomGuide.module.css';

export const ROOM_GUIDE_KEY = 'suuhimochi-room-guide-v1';
export const ROOM_GUIDE_TARGETS = ['mission', 'journal', 'items'] as const;
const steps = [
  ['ミッションのポスト', 'ここがデイリーミッション置き場だよ。手紙が見えていたら、まだできることが残っているの！'],
  ['日誌をひらこう', 'メニューから「日誌」を開けるよ。きょうの予定や、できたことを残してみてね。'],
  ['お部屋をととのえよう', 'メニューの「アイテム」で家具の配置を調整できるよ。ミッションのポストも、好きな場所へ動かせるの。'],
];
export function RoomGuide({ step, onNext, onClose }: { step:number; onNext:()=>void; onClose:()=>void }) {
  const [title, text] = steps[step];
  return <aside className={styles.guide} aria-label="お部屋の使い方" aria-live="polite">
    <header><b>{title}</b><small>{step + 1} / {steps.length}</small></header>
    <p>{text}</p>
    <footer><button type="button" onClick={onClose}>案内を閉じる</button><button type="button" onClick={onNext}>{step === steps.length - 1 ? 'わかった！' : 'つぎへ'}</button></footer>
  </aside>;
}
