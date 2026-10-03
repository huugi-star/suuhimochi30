'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  findSuuhimochiConversions,
  loadSuuhimochiConversions,
  markSuuhimochiConversionUsed,
  saveSuuhimochiConversion,
  SUUHIMOCHI_KEYBOARD_GUIDE_KEY,
  type SuuhimochiConversion,
} from '@/lib/suuhimochiKeyboard';

type KeyboardMode = 'kana' | 'katakana' | 'abc' | 'number';
type FlickDirection = 'center' | 'left' | 'up' | 'right' | 'down';

interface SuuhimochiKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onDecide: () => void;
  maxLength: number;
  placeholder: string;
  ariaLabel: string;
}

interface FlickKey {
  label: string;
  values?: [string, string, string, string, string];
  modifier?: true;
}

const HIRAGANA_KEYS: FlickKey[] = [
  { label: 'あ', values: ['あ', 'い', 'う', 'え', 'お'] },
  { label: 'か', values: ['か', 'き', 'く', 'け', 'こ'] },
  { label: 'さ', values: ['さ', 'し', 'す', 'せ', 'そ'] },
  { label: 'た', values: ['た', 'ち', 'つ', 'て', 'と'] },
  { label: 'な', values: ['な', 'に', 'ぬ', 'ね', 'の'] },
  { label: 'は', values: ['は', 'ひ', 'ふ', 'へ', 'ほ'] },
  { label: 'ま', values: ['ま', 'み', 'む', 'め', 'も'] },
  { label: 'や', values: ['や', '「', 'ゆ', '」', 'よ'] },
  { label: 'ら', values: ['ら', 'り', 'る', 'れ', 'ろ'] },
  { label: '小゛゜', modifier: true },
  { label: 'わ', values: ['わ', 'を', 'ん', 'ー', '〜'] },
  { label: '記号', values: ['、', '。', '？', '！', '・'] },
];

const KATAKANA_KEYS: FlickKey[] = [
  { label: 'ア', values: ['ア', 'イ', 'ウ', 'エ', 'オ'] },
  { label: 'カ', values: ['カ', 'キ', 'ク', 'ケ', 'コ'] },
  { label: 'サ', values: ['サ', 'シ', 'ス', 'セ', 'ソ'] },
  { label: 'タ', values: ['タ', 'チ', 'ツ', 'テ', 'ト'] },
  { label: 'ナ', values: ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'] },
  { label: 'ハ', values: ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'] },
  { label: 'マ', values: ['マ', 'ミ', 'ム', 'メ', 'モ'] },
  { label: 'ヤ', values: ['ヤ', '「', 'ユ', '」', 'ヨ'] },
  { label: 'ラ', values: ['ラ', 'リ', 'ル', 'レ', 'ロ'] },
  { label: '小゛゜', modifier: true },
  { label: 'ワ', values: ['ワ', 'ヲ', 'ン', 'ー', '〜'] },
  { label: '記号', values: ['、', '。', '？', '！', '・'] },
];

const DAKUTEN: Record<string, string> = {
  か: 'が', き: 'ぎ', く: 'ぐ', け: 'げ', こ: 'ご', さ: 'ざ', し: 'じ', す: 'ず', せ: 'ぜ', そ: 'ぞ', た: 'だ', ち: 'ぢ', つ: 'づ', て: 'で', と: 'ど', は: 'ば', ひ: 'び', ふ: 'ぶ', へ: 'べ', ほ: 'ぼ', う: 'ゔ',
  カ: 'ガ', キ: 'ギ', ク: 'グ', ケ: 'ゲ', コ: 'ゴ', サ: 'ザ', シ: 'ジ', ス: 'ズ', セ: 'ゼ', ソ: 'ゾ', タ: 'ダ', チ: 'ヂ', ツ: 'ヅ', テ: 'デ', ト: 'ド', ハ: 'バ', ヒ: 'ビ', フ: 'ブ', ヘ: 'ベ', ホ: 'ボ', ウ: 'ヴ',
};
const HANDAKUTEN: Record<string, string> = { は: 'ぱ', ひ: 'ぴ', ふ: 'ぷ', へ: 'ぺ', ほ: 'ぽ', ハ: 'パ', ヒ: 'ピ', フ: 'プ', ヘ: 'ペ', ホ: 'ポ' };
const SMALL: Record<string, string> = { あ: 'ぁ', い: 'ぃ', う: 'ぅ', え: 'ぇ', お: 'ぉ', つ: 'っ', や: 'ゃ', ゆ: 'ゅ', よ: 'ょ', わ: 'ゎ', ア: 'ァ', イ: 'ィ', ウ: 'ゥ', エ: 'ェ', オ: 'ォ', ツ: 'ッ', ヤ: 'ャ', ユ: 'ュ', ヨ: 'ョ', ワ: 'ヮ' };
const LARGE = Object.fromEntries(Object.entries(SMALL).map(([large, small]) => [small, large]));
const ABC_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const NUMBER_KEYS = ['1','2','3','4','5','6','7','8','9','0','-','/','：','（','）','@','#','&'];
const DIRECTION_INDEX: Record<FlickDirection, number> = { center: 0, left: 1, up: 2, right: 3, down: 4 };

function getFlickDirection(deltaX: number, deltaY: number): FlickDirection {
  if (Math.hypot(deltaX, deltaY) < 17) return 'center';
  if (Math.abs(deltaX) > Math.abs(deltaY)) return deltaX < 0 ? 'left' : 'right';
  return deltaY < 0 ? 'up' : 'down';
}

export function SuuhimochiKeyboard({ value, onChange, onDecide, maxLength, placeholder, ariaLabel }: SuuhimochiKeyboardProps) {
  const [mode, setMode] = useState<KeyboardMode>('kana');
  const [nativeMode, setNativeMode] = useState(false);
  const [guideOpen, setGuideOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return window.localStorage.getItem(SUUHIMOCHI_KEYBOARD_GUIDE_KEY) !== '1'; } catch { return false; }
  });
  const [showCandidates, setShowCandidates] = useState(false);
  const [conversions, setConversions] = useState<SuuhimochiConversion[]>(() => loadSuuhimochiConversions());
  const [activeFlick, setActiveFlick] = useState<{ key: FlickKey; direction: FlickDirection } | null>(null);
  const [visualViewport, setVisualViewport] = useState<{ top: number; height: number } | null>(null);
  const displayRef = useRef<HTMLTextAreaElement>(null);
  const nativeRef = useRef<HTMLTextAreaElement>(null);
  const cursorRef = useRef(value.length);
  const nativeSourceRef = useRef('');
  const composingRef = useRef(false);
  const flickRef = useRef<{ pointerId: number; x: number; y: number; key: FlickKey; direction: FlickDirection } | null>(null);

  useEffect(() => {
    cursorRef.current = Math.min(cursorRef.current, value.length);
  }, [value]);

  useEffect(() => {
    if (!nativeMode) return;
    const viewport = window.visualViewport;
    const syncViewport = () => setVisualViewport(viewport ? { top: viewport.offsetTop, height: viewport.height } : null);
    syncViewport();
    viewport?.addEventListener('resize', syncViewport);
    viewport?.addEventListener('scroll', syncViewport);
    const frame = window.requestAnimationFrame(() => {
      nativeRef.current?.focus({ preventScroll: true });
      const nativeValueLength = nativeRef.current?.value.length ?? 0;
      nativeRef.current?.setSelectionRange(0, nativeValueLength);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', syncViewport);
      viewport?.removeEventListener('scroll', syncViewport);
    };
  }, [nativeMode]);

  const candidates = useMemo(() => findSuuhimochiConversions(conversions, value), [conversions, value]);
  const flickKeys = mode === 'katakana' ? KATAKANA_KEYS : HIRAGANA_KEYS;

  function replaceSelection(text: string) {
    const input = displayRef.current;
    const start = input?.selectionStart ?? cursorRef.current;
    const end = input?.selectionEnd ?? start;
    const available = Math.max(0, maxLength - (value.length - (end - start)));
    const insertion = text.slice(0, available);
    const next = value.slice(0, start) + insertion + value.slice(end);
    const cursor = start + insertion.length;
    cursorRef.current = cursor;
    onChange(next);
    setShowCandidates(false);
    window.requestAnimationFrame(() => displayRef.current?.setSelectionRange(cursor, cursor));
  }

  function replacePrevious(map: Record<string, string>) {
    const input = displayRef.current;
    const cursor = input?.selectionStart ?? cursorRef.current;
    if (cursor <= 0) return;
    const previous = value[cursor - 1];
    const replacement = map[previous];
    if (!replacement) return;
    const next = value.slice(0, cursor - 1) + replacement + value.slice(cursor);
    onChange(next);
    setShowCandidates(false);
    window.requestAnimationFrame(() => displayRef.current?.setSelectionRange(cursor, cursor));
  }

  function applyModifier(direction: FlickDirection) {
    if (direction === 'left') replacePrevious(DAKUTEN);
    else if (direction === 'up') replacePrevious(HANDAKUTEN);
    else if (direction === 'right') replaceSelection('ー');
    else if (direction === 'down') replaceSelection(mode === 'katakana' ? 'ッ' : 'っ');
    else replacePrevious({ ...SMALL, ...LARGE });
  }

  function deletePrevious() {
    const input = displayRef.current;
    const start = input?.selectionStart ?? cursorRef.current;
    const end = input?.selectionEnd ?? start;
    if (start === 0 && end === 0) return;
    const from = start === end ? start - 1 : start;
    const next = value.slice(0, from) + value.slice(end);
    cursorRef.current = from;
    onChange(next);
    setShowCandidates(false);
    window.requestAnimationFrame(() => displayRef.current?.setSelectionRange(from, from));
  }

  function beginFlick(event: React.PointerEvent<HTMLButtonElement>, key: FlickKey) {
    event.preventDefault();
    flickRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, key, direction: 'center' };
    setActiveFlick({ key, direction: 'center' });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function moveFlick(event: React.PointerEvent<HTMLButtonElement>) {
    const flick = flickRef.current;
    if (!flick || flick.pointerId !== event.pointerId) return;
    const direction = getFlickDirection(event.clientX - flick.x, event.clientY - flick.y);
    flick.direction = direction;
    setActiveFlick({ key: flick.key, direction });
  }

  function endFlick(event: React.PointerEvent<HTMLButtonElement>) {
    const flick = flickRef.current;
    if (!flick || flick.pointerId !== event.pointerId) return;
    if (flick.key.modifier) applyModifier(flick.direction);
    else replaceSelection(flick.key.values?.[DIRECTION_INDEX[flick.direction]] ?? '');
    flickRef.current = null;
    setActiveFlick(null);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  function enterNativeMode() {
    nativeSourceRef.current = value;
    composingRef.current = false;
    setNativeMode(true);
    setShowCandidates(false);
  }

  function finishNativeMode() {
    if (composingRef.current) return;
    const source = nativeSourceRef.current;
    setConversions(saveSuuhimochiConversion(source, value));
    cursorRef.current = value.length;
    setNativeMode(false);
  }

  function chooseConversion(converted: string) {
    const source = value;
    onChange(converted);
    cursorRef.current = converted.length;
    setConversions(markSuuhimochiConversionUsed(source, converted));
    setShowCandidates(false);
  }

  function closeGuide() {
    setGuideOpen(false);
    try { window.localStorage.setItem(SUUHIMOCHI_KEYBOARD_GUIDE_KEY, '1'); } catch { /* Continue without persistence. */ }
  }

  const nativeStyle = visualViewport ? {
    '--suuhimochi-native-top': `${visualViewport.top}px`,
    '--suuhimochi-native-height': `${visualViewport.height}px`,
  } as React.CSSProperties : undefined;

  return (
    <section className={`suuhimochi-keyboard${nativeMode ? ' is-native' : ''}`} style={nativeStyle} aria-label="すうひもちキーボード">
      {guideOpen && <aside className="suuhimochi-keyboard-guide" aria-label="すうひもちキーボードの説明">
        <b>すうひもち</b>
        <p>人間さんの言葉は分かるんだけど、漢字の書き方にはまだ自信がないの。</p>
        <p>知らない漢字は「漢字を伝える」から教えてほしいの。</p>
        <small>一度使った変換は、次から「漢字変換」で使えます。</small>
        <button type="button" onClick={closeGuide}>わかった</button>
      </aside>}

      {nativeMode ? <div className="suuhimochi-native-editor">
        <header><b>漢字を伝える</b><small>入力済みの文をそのまま編集できます</small></header>
        <textarea
          ref={nativeRef}
          value={value}
          maxLength={maxLength}
          aria-label={`${ariaLabel}。標準キーボード入力`}
          onChange={(event) => onChange(event.target.value)}
          onCompositionStart={() => { composingRef.current = true; }}
          onCompositionUpdate={() => { composingRef.current = true; }}
          onCompositionEnd={() => { composingRef.current = false; }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || composingRef.current) return;
            event.preventDefault();
            finishNativeMode();
          }}
        />
        <button className="suuhimochi-native-finish" type="button" onClick={finishNativeMode}>変換を確定</button>
      </div> : <>
        <textarea
          ref={displayRef}
          className="suuhimochi-keyboard-display"
          value={value}
          readOnly
          inputMode="none"
          aria-label={ariaLabel}
          placeholder={placeholder}
          onSelect={(event) => { cursorRef.current = event.currentTarget.selectionStart; }}
        />

        {showCandidates && <div className="suuhimochi-conversion-candidates" aria-label="漢字変換候補">
          {candidates.length > 0
            ? candidates.map((candidate) => <button type="button" key={candidate.converted} onClick={() => chooseConversion(candidate.converted)}>{candidate.converted}</button>)
            : <small>この読みの変換は、まだ覚えていません</small>}
        </div>}

        <div className="suuhimochi-keyboard-modes" aria-label="入力モード">
          {([['kana', 'かな'], ['katakana', 'カナ'], ['abc', 'ABC'], ['number', '123']] as const).map(([id, label]) => (
            <button type="button" className={mode === id ? 'is-active' : ''} key={id} onClick={() => setMode(id)}>{label}</button>
          ))}
        </div>

        {mode === 'kana' || mode === 'katakana' ? <div className="suuhimochi-flick-grid">
          {flickKeys.map((key) => <button
            type="button"
            key={key.label}
            onPointerDown={(event) => beginFlick(event, key)}
            onPointerMove={moveFlick}
            onPointerUp={endFlick}
            onPointerCancel={() => { flickRef.current = null; setActiveFlick(null); }}
          >{key.label}</button>)}
        </div> : <div className={`suuhimochi-direct-grid is-${mode}`}>
          {(mode === 'abc' ? ABC_KEYS : NUMBER_KEYS).map((key) => <button type="button" key={key} onClick={() => replaceSelection(key)}>{key}</button>)}
        </div>}

        {activeFlick && <div className="suuhimochi-flick-guide" aria-hidden="true">
          <span className={activeFlick.direction === 'up' ? 'is-active' : ''}>{activeFlick.key.modifier ? '゜' : activeFlick.key.values?.[2]}</span>
          <span className={activeFlick.direction === 'left' ? 'is-active' : ''}>{activeFlick.key.modifier ? '゛' : activeFlick.key.values?.[1]}</span>
          <span className={activeFlick.direction === 'center' ? 'is-active' : ''}>{activeFlick.key.modifier ? '小' : activeFlick.key.values?.[0]}</span>
          <span className={activeFlick.direction === 'right' ? 'is-active' : ''}>{activeFlick.key.modifier ? 'ー' : activeFlick.key.values?.[3]}</span>
          <span className={activeFlick.direction === 'down' ? 'is-active' : ''}>{activeFlick.key.modifier ? (mode === 'katakana' ? 'ッ' : 'っ') : activeFlick.key.values?.[4]}</span>
        </div>}

        <div className="suuhimochi-keyboard-functions">
          <button type="button" onClick={deletePrevious}>←<small>削除</small></button>
          <button type="button" onClick={() => replaceSelection(' ')}>空白</button>
          <button type="button" className="is-decide" disabled={!value.trim()} onClick={onDecide}>決定</button>
        </div>

        <div className="suuhimochi-kanji-actions">
          <button type="button" onClick={() => setShowCandidates(true)}><b>漢字変換</b><small>知っている漢字に変える</small></button>
          <button type="button" onClick={enterNativeMode}><b>漢字を伝える</b><small>標準キーボードで変換する</small></button>
        </div>
      </>}
    </section>
  );
}
