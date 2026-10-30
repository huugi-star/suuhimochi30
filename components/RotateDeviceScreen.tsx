import type { ReactNode } from 'react';
import { RotateCw } from 'lucide-react';

export function RotateDeviceScreen({ onOpenJournal, homeNotice, homeBackground }: { onOpenJournal?: () => void; homeNotice?: ReactNode; homeBackground?: string }) {
  return (
    <main className={`rotate-device-screen${homeNotice ? ' rotate-device-home' : ''}`} style={homeNotice && homeBackground ? { backgroundImage: `linear-gradient(#2517084d,#25170899), url('${homeBackground}')` } : undefined} aria-live="polite" aria-label="スマートフォンを横向きにしてください">
      {homeNotice}
      <section className="rotate-device-card">
        <span className="rotate-device-poteno" aria-hidden="true">(っ˙ω˙)っ</span>
        <RotateCw className="rotate-device-icon" size={48} strokeWidth={1.8} aria-hidden="true" />
        <h1>すうひもちのお部屋は横向きなの</h1>
        <p>スマホを横にしてね</p>
        {onOpenJournal && <button type="button" className="primary-button" onClick={onOpenJournal}>縦画面で日誌を開く</button>}
      </section>
    </main>
  );
}
