'use client';

import { PenLine } from 'lucide-react';

type JournalCatchupPromptProps = {
  onWrite: () => void;
  onSkip: () => void;
};

export function JournalCatchupPrompt({ onWrite, onSkip }: JournalCatchupPromptProps) {

  return (
    <section className="journal-catchup-overlay" aria-label="昨日の日誌を書くか選ぶ">
      <div className="journal-catchup-card">
        <span className="journal-catchup-mark" aria-hidden="true"><PenLine size={19} /></span>
        <p>昨日の足あと、まだ残してないみたい。<br />覚えてるうちに、少し書いておく？</p>
        <div className="journal-catchup-actions">
          <button type="button" className="is-primary" onClick={onWrite}>昨日の足あとを残す</button>
          <button type="button" onClick={onSkip}>今は書かない</button>
        </div>
      </div>

      <style>{`
        .journal-catchup-overlay { position: absolute; z-index: 145; inset: 0; display: grid; place-items: center; padding: max(18px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(78px,calc(env(safe-area-inset-bottom) + 68px)) max(18px,env(safe-area-inset-left)); background: rgba(40,29,21,.38); backdrop-filter: blur(3px); }
        .journal-catchup-card { display: grid; width: min(440px,94%); gap: 14px; padding: 24px; border: 1px solid #c39b73; border-radius: 24px; color: #4d392d; background: linear-gradient(145deg,#fffaf0,#ffedcf); box-shadow: 0 16px 42px rgba(46,28,16,.35),inset 0 1px rgba(255,255,255,.9); text-align: center; }
        .journal-catchup-mark { display: grid; width: 42px; height: 42px; margin: 0 auto; place-items: center; border-radius: 50%; color: #fffaf1; background: #c67a55; box-shadow: 0 4px 10px rgba(112,65,39,.2); }
        .journal-catchup-card p { margin: 0; font-weight: 800; line-height: 1.8; }
        .journal-catchup-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
        .journal-catchup-actions button { min-height: 43px; border: 1px solid #b99a79; border-radius: 13px; color: #67503f; background: #fffaf0; font-weight: 900; }
        .journal-catchup-actions button.is-primary { color: #fffaf1; border-color: #9e5d40; background: #c87552; box-shadow: 0 3px 0 #8d4f36; }
        @media (max-width:1024px) and (orientation:landscape) {
          .mobile-landscape .journal-catchup-overlay { padding: max(6px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(6px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left)); }
          .mobile-landscape .journal-catchup-card { width: min(430px,100%); gap: 8px; padding: 13px 16px; border-radius: 18px; }
          .mobile-landscape .journal-catchup-mark { width: 32px; height: 32px; }
          .mobile-landscape .journal-catchup-card p { font-size: .78rem; line-height: 1.55; }
          .mobile-landscape .journal-catchup-actions button { min-height: 34px; font-size: .72rem; }
        }
      `}</style>
    </section>
  );
}
