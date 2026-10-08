'use client';

import { useState } from 'react';
import { SuuhimochiKeyboard } from '@/components/SuuhimochiKeyboard';

type JournalEntryEditorProps = {
  day: number;
  date: string;
  heading: string;
  initialItems: readonly string[];
  useSuuhimochiKeyboard?: boolean;
  onSave: (items: string[]) => void;
  onCancel: () => void;
};

function formatEntryDate(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  return new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric' }).format(date);
}

export function JournalEntryEditor({
  day,
  date,
  heading,
  initialItems,
  useSuuhimochiKeyboard = false,
  onSave,
  onCancel,
}: JournalEntryEditorProps) {
  const [items, setItems] = useState(() => initialItems.map((item) => item.trim()).filter(Boolean));
  const [draft, setDraft] = useState('');
  const remainingCharacters = Math.max(0, 640 - items.join('\n').length - (items.length > 0 ? 1 : 0));
  const entryFromDraft = () => draft.replace(/\s*\n\s*/g, ' ').trim().slice(0, remainingCharacters);

  const addEntry = () => {
    const entry = entryFromDraft();
    if (!entry) return;
    setItems((current) => [...current, entry]);
    setDraft('');
  };

  const removeEntry = (index: number) => {
    setItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const save = () => {
    const entry = entryFromDraft();
    onSave(entry ? [...items, entry] : items);
  };

  return (
    <section className={`journal-entry-overlay${useSuuhimochiKeyboard ? ' has-suuhimochi-keyboard' : ''}`} aria-label={`${heading}を記入する`}>
      <article className="journal-entry-card">
        <header>
          <p><strong>DAY {day}</strong><span>{formatEntryDate(date)}</span></p>
          <h1>{heading}</h1>
          <small>一つ書いたら「追加する」で、箇条書きにして残せます。</small>
        </header>

        <div className="journal-entry-list" aria-label="追加したやったこと">
          {items.length > 0 ? <ul>{items.map((item, index) => (
            <li key={`${item}-${index}`}>
              <span>{item}</span>
              <button type="button" onClick={() => removeEntry(index)} aria-label={`「${item}」を削除する`}>×</button>
            </li>
          ))}</ul> : <p>まだ書かれていません。まず一つ、追加してみよう。</p>}
        </div>

        <div className="journal-entry-add">
          {useSuuhimochiKeyboard ? (
            <div className={`journal-entry-preview${draft ? '' : ' is-empty'}`} aria-live="polite">
              {draft || 'ここに一つ分の内容が入ります'}
            </div>
          ) : (
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                addEntry();
              }}
              maxLength={Math.max(1, remainingCharacters)}
              placeholder={`${heading}を一つ書く`}
              disabled={remainingCharacters === 0}
            />
          )}
          <button type="button" onClick={addEntry} disabled={!entryFromDraft()}>追加する</button>
        </div>

        {remainingCharacters === 0 && (
          <p className="journal-entry-limit">これ以上は追加できません。不要な行を削除してから書いてください。</p>
        )}

        <footer>
          <button type="button" onClick={onCancel}>キャンセル</button>
          <button type="button" className="is-save" onClick={save}>記録する</button>
        </footer>
      </article>

      {useSuuhimochiKeyboard && <SuuhimochiKeyboard
        value={draft}
        onChange={setDraft}
        onDecide={addEntry}
        maxLength={Math.max(1, remainingCharacters)}
        placeholder={`${heading}を一つ書く`}
        ariaLabel={heading}
      />}

      <style>{`
        .journal-entry-overlay { position: absolute; z-index: 146; inset: 48px 0 68px; display: grid; place-items: center; padding: 18px; background: rgba(43,31,22,.34); backdrop-filter: blur(3px); }
        .journal-entry-card { display: grid; width: min(680px,96%); max-height: 100%; grid-template-rows: auto minmax(90px,1fr) auto auto; gap: 14px; padding: 27px 30px 24px; border: 1px solid #b9926c; border-radius: 24px; color: #4b382c; background: linear-gradient(145deg,#fffaf0,#ffedcf); box-shadow: 0 18px 48px rgba(43,27,17,.34),inset 0 1px rgba(255,255,255,.9); }
        .journal-entry-card header { display: grid; gap: 5px; }
        .journal-entry-card header p { display: flex; align-items: baseline; gap: 10px; margin: 0; color: #8c6d58; }
        .journal-entry-card header p strong { color: #5a4031; font: 900 1.24rem/1 'Yu Mincho',serif; letter-spacing: .08em; }
        .journal-entry-card header p span { font-size: .8rem; font-weight: 800; }
        .journal-entry-card h1 { margin: 5px 0 0; color: #583f31; font: 900 clamp(1.2rem,3vw,1.5rem)/1.35 'Klee One','Hiragino Maru Gothic ProN','Yu Gothic',sans-serif; }
        .journal-entry-card header small { color: #8d7868; font-size: .75rem; font-weight: 700; }
        .journal-entry-list { min-height: 0; overflow-y: auto; border: 1px solid #c7a27b; border-radius: 17px; padding: 10px 12px; background: rgba(255,255,255,.8); box-shadow: inset 0 2px 6px rgba(83,54,35,.07); }
        .journal-entry-list ul { display: grid; gap: 7px; margin: 0; padding: 0; list-style: none; }
        .journal-entry-list li { display: grid; grid-template-columns: minmax(0,1fr) auto; align-items: center; gap: 8px; padding: 8px 9px 8px 12px; border-radius: 11px; color: #47362c; background: rgba(255,248,234,.84); font: .92rem/1.5 'Yu Gothic',sans-serif; }
        .journal-entry-list li span::before { content: '・'; color: #bd7250; font-weight: 900; }
        .journal-entry-list li button { display: grid; width: 26px; height: 26px; place-items: center; border: 1px solid #d0ab8c; border-radius: 50%; color: #9b604b; background: #fffaf0; font-weight: 900; }
        .journal-entry-list > p { margin: 0; padding: 15px 8px; color: #9c8979; font-size: .86rem; line-height: 1.65; }
        .journal-entry-add { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 9px; }
        .journal-entry-add input,.journal-entry-preview { min-width: 0; min-height: 46px; border: 1px solid #c7a27b; border-radius: 13px; padding: 11px 13px; color: #47362c; background: rgba(255,255,255,.86); font: .9rem/1.45 'Yu Gothic',sans-serif; }
        .journal-entry-preview { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .journal-entry-preview.is-empty { color: #9c8979; }
        .journal-entry-add > button { min-height: 46px; padding: 8px 14px; border: 1px solid #a46448; border-radius: 13px; color: #fffaf1; background: #c77451; font-weight: 900; box-shadow: 0 2px 0 #884b34; }
        .journal-entry-add > button:disabled { opacity: .42; box-shadow: none; }
        .journal-entry-limit { margin: -6px 0 0; color: #a3634b; font-size: .72rem; }
        .journal-entry-card footer { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
        .journal-entry-card footer button { min-height: 44px; border: 1px solid #b99a79; border-radius: 14px; color: #67503f; background: #fffaf0; font-weight: 900; }
        .journal-entry-card footer .is-save { color: #fffaf1; border-color: #98583e; background: #c77451; box-shadow: 0 3px 0 #884b34; }
        @media (max-width:1024px) and (orientation:landscape) {
          .mobile-landscape .journal-entry-overlay { inset: 0; place-items: stretch; padding: max(6px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(6px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left)); }
          .mobile-landscape .journal-entry-overlay.has-suuhimochi-keyboard { padding-right: calc(min(32vw,430px) + max(10px,env(safe-area-inset-right))); }
          .mobile-landscape .journal-entry-card { width: 100%; height: 100%; min-height: 0; gap: 8px; padding: 12px 15px; border-radius: 18px; }
          .mobile-landscape .journal-entry-card header { gap: 2px; }
          .mobile-landscape .journal-entry-card header p strong { font-size: .95rem; }
          .mobile-landscape .journal-entry-card header p span { font-size: .68rem; }
          .mobile-landscape .journal-entry-card h1 { margin-top: 2px; font-size: 1rem; }
          .mobile-landscape .journal-entry-card header small { font-size: .62rem; }
          .mobile-landscape .journal-entry-list { padding: 7px 8px; }
          .mobile-landscape .journal-entry-list ul { gap: 4px; }
          .mobile-landscape .journal-entry-list li { gap: 5px; padding: 5px 6px 5px 8px; font-size: .73rem; line-height: 1.35; }
          .mobile-landscape .journal-entry-list li button { width: 21px; height: 21px; font-size: .75rem; }
          .mobile-landscape .journal-entry-list > p { padding: 8px 4px; font-size: .7rem; }
          .mobile-landscape .journal-entry-add { gap: 6px; }
          .mobile-landscape .journal-entry-add input,.mobile-landscape .journal-entry-preview { min-height: 34px; padding: 7px 9px; font-size: .73rem; }
          .mobile-landscape .journal-entry-add > button { min-height: 34px; padding: 5px 9px; font-size: .72rem; }
          .mobile-landscape .journal-entry-limit { margin-top: -4px; font-size: .61rem; }
          .mobile-landscape .journal-entry-card footer { gap: 8px; }
          .mobile-landscape .journal-entry-card footer button { min-height: 34px; font-size: .73rem; }
        }
      `}</style>
    </section>
  );
}
