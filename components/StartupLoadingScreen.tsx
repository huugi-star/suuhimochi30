'use client';

type StartupLoadingScreenProps = {
  progress: number;
};

export function StartupLoadingScreen({ progress }: StartupLoadingScreenProps) {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
  return (
    <main className="startup-loading-screen" aria-live="polite" aria-busy="true" aria-label="起動に必要な画像を読み込んでいます">
      <section className="startup-loading-card">
        <span className="startup-loading-poteno" aria-hidden="true">(ง ˙ω˙)ว&nbsp; ﾎﾟﾃﾎﾟﾃ…</span>
        <h1>お部屋を準備してるの……</h1>
        <p>すうひもちを呼んでいます</p>
        <div className="startup-loading-track" aria-hidden="true"><i style={{ width: `${safeProgress}%` }} /></div>
        <output>{safeProgress}%</output>
      </section>
    </main>
  );
}
