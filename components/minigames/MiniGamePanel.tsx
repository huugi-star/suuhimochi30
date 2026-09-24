'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { SetsunaImotori } from './SetsunaImotori';

type MiniGameId = 'setsuna-imotori';

type MiniGamePanelProps = {
  onClose: () => void;
};

export function MiniGamePanel({ onClose }: MiniGamePanelProps) {
  const [activeGame, setActiveGame] = useState<MiniGameId | null>(null);

  return (
    <dialog open className={`minigame-overlay${activeGame ? ' minigame-playing' : ''}`} aria-modal="true" aria-label={activeGame ? '刹那のいも取り' : 'ミニゲーム'}>
      <section className="minigame-panel">
        <button className="minigame-close" type="button" aria-label="ミニゲームを閉じる" onClick={onClose}><X size={21} /></button>
        {activeGame === 'setsuna-imotori' ? (
          <SetsunaImotori onBack={() => setActiveGame(null)} />
        ) : (
          <>
            <header className="minigame-menu-heading">
              <span>ちょっとひと休み</span>
              <h2>ミニゲーム</h2>
              <p>短い時間で、すうひもちと遊べます。</p>
            </header>
            <button className="minigame-card" type="button" onClick={() => setActiveGame('setsuna-imotori')}>
              <span className="minigame-card-art" aria-hidden="true"><i>🍠</i><b>！</b></span>
              <span className="minigame-card-copy">
                <small>反射神経ゲーム</small>
                <strong>刹那のいも取り</strong>
                <em>すうひもちより先に、焼き芋を取ろう</em>
              </span>
              <span className="minigame-card-play">あそぶ</span>
            </button>
          </>
        )}
      </section>

      <style>{`
        .minigame-overlay { position: absolute; z-index: 40; inset: 0 0 11%; display: grid; place-items: center; width: auto; max-width: none; height: auto; max-height: none; margin: 0; padding: clamp(10px, 3vw, 28px); border: 0; color: inherit; background: rgba(42, 28, 19, .58); backdrop-filter: blur(5px); animation: minigame-fade-in .2s ease both; }
        .minigame-panel { position: relative; width: min(94%, 760px); max-height: 96%; padding: clamp(17px, 3vw, 28px); overflow: auto; border: 3px solid #7a5135; border-radius: 25px; color: #523823; background: linear-gradient(160deg, #fff7df, #f3dfb8); box-shadow: inset 0 0 0 4px rgba(255,255,255,.48), 0 18px 50px rgba(35,20,12,.45); }
        .minigame-panel::before { content: ""; position: absolute; inset: 8px; border: 1px dashed rgba(139,94,54,.26); border-radius: 17px; pointer-events: none; }
        .minigame-close { position: absolute; z-index: 8; top: 12px; right: 12px; display: grid; place-items: center; width: 40px; height: 40px; border: 2px solid #806047; border-radius: 50%; color: #684a34; background: #fff9e8; box-shadow: 0 3px 0 rgba(80,48,29,.22); }
        .minigame-menu-heading { position: relative; text-align: center; }
        .minigame-menu-heading > span { color: #b56943; font-size: .72rem; font-weight: 800; letter-spacing: .17em; }
        .minigame-menu-heading h2 { margin: 4px 0 5px; font-family: "Yu Mincho", serif; font-size: clamp(1.5rem, 4vw, 2.25rem); letter-spacing: .12em; }
        .minigame-menu-heading p { margin: 0 0 20px; color: #816c58; font-size: .9rem; }
        .minigame-card { position: relative; display: grid; grid-template-columns: 126px minmax(0,1fr) auto; align-items: center; gap: 18px; width: min(100%, 620px); min-height: 142px; margin: 0 auto; padding: 15px 18px; border: 3px solid #71482f; border-radius: 19px; color: #573722; background: #fff9e7; box-shadow: 0 7px 0 #744a31, 0 11px 20px rgba(73,40,22,.2), inset 0 0 0 3px #efd4a2; text-align: left; transition: transform .12s, box-shadow .12s; }
        .minigame-card:hover { transform: translateY(-2px); box-shadow: 0 9px 0 #744a31, 0 14px 22px rgba(73,40,22,.22), inset 0 0 0 3px #efd4a2; }
        .minigame-card:active { transform: translateY(5px); box-shadow: 0 2px 0 #744a31, 0 6px 12px rgba(73,40,22,.18), inset 0 0 0 3px #efd4a2; }
        .minigame-card-art { position: relative; display: grid; place-items: center; width: 126px; height: 102px; overflow: hidden; border: 3px solid #8b5b38; border-radius: 15px; background: linear-gradient(#f4d496 0 64%, #a9683e 64%); box-shadow: inset 0 0 0 3px rgba(255,255,255,.34); }
        .minigame-card-art i { font-style: normal; font-size: 55px; transform: rotate(-8deg); filter: drop-shadow(0 5px 0 rgba(75,38,25,.2)); }
        .minigame-card-art b { position: absolute; top: 6px; right: 10px; display: grid; place-items: center; width: 35px; height: 35px; border-radius: 50%; color: #fff8db; background: #df6240; font-size: 1.45rem; }
        .minigame-card-copy { display: grid; gap: 4px; min-width: 0; }
        .minigame-card-copy small { color: #b36740; font-size: .68rem; font-weight: 800; letter-spacing: .12em; }
        .minigame-card-copy strong { font-family: "Yu Mincho", serif; font-size: clamp(1.1rem, 3vw, 1.55rem); letter-spacing: .06em; }
        .minigame-card-copy em { color: #806a55; font-size: .78rem; font-style: normal; line-height: 1.45; }
        .minigame-card-play { min-width: 66px; padding: 9px 12px; border: 2px solid #875137; border-radius: 999px; color: #fff7df; background: #d56d46; text-align: center; font-size: .78rem; font-weight: 900; }
        @keyframes minigame-fade-in { from { opacity: 0; } }
        @media (max-width: 600px) {
          .minigame-overlay { bottom: 10%; padding: 8px; }
          .minigame-panel { width: 98%; max-height: 97%; padding: 14px 11px 16px; border-radius: 18px; }
          .minigame-close { top: 8px; right: 8px; width: 36px; height: 36px; }
          .minigame-menu-heading p { margin-bottom: 12px; }
          .minigame-card { grid-template-columns: 88px minmax(0,1fr); gap: 10px; min-height: 112px; padding: 10px; }
          .minigame-card-art { width: 88px; height: 82px; }
          .minigame-card-art i { font-size: 43px; }
          .minigame-card-art b { top: 4px; right: 5px; width: 28px; height: 28px; font-size: 1.1rem; }
          .minigame-card-play { display: none; }
        }
        .minigame-playing { position: fixed; z-index: 200; inset: 0; background: #443b30f5; padding: 12px; }
        .minigame-playing .minigame-panel { width: min(100%, 900px); padding: 15px 24px 18px; transition: background 450ms, border-color 450ms; }
        .minigame-playing .minigame-close { top: 18px; right: 20px; }
        .minigame-playing:has(.is-dueling) { background: #171b20; }
        .minigame-playing .minigame-panel:has(.is-dueling) { background: #171b20; border-color: transparent; box-shadow: none; }
        .minigame-playing .minigame-panel:has(.is-dueling)::before { opacity: 0; }
        .minigame-playing:has(.is-dueling) .minigame-close { visibility: hidden; pointer-events: none; }
        @media (max-width: 600px) {
          .minigame-playing .minigame-panel { padding: 10px 10px 16px; }
          .minigame-playing .minigame-close { top: 15px; right: 12px; width: 30px; height: 30px; }
        }
      `}</style>
    </dialog>
  );
}
