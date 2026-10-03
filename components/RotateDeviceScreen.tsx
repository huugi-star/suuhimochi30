import { RotateCw } from 'lucide-react';

export function RotateDeviceScreen() {
  return (
    <main className="rotate-device-screen" aria-live="polite" aria-label="スマートフォンを横向きにしてください">
      <section className="rotate-device-card">
        <span className="rotate-device-poteno" aria-hidden="true">(っ˙ω˙)っ</span>
        <RotateCw className="rotate-device-icon" size={48} strokeWidth={1.8} aria-hidden="true" />
        <h1>すうひもちのお部屋は横向きなの</h1>
        <p>スマホを横にしてね</p>
      </section>
    </main>
  );
}
