'use client';

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { createPortal } from 'react-dom';
import { SuuhimochiKeyboard } from '@/components/SuuhimochiKeyboard';
import {
  PERSON_COMBO_SECONDS,
  sanitizeWordComboKanaInput,
  type PersonComboQuestion,
} from '@/lib/personWordCombo';
import { getNewlyCommittedKana } from '@/lib/wordComboDance';
import type { SuuhimochiConversation } from '@/lib/wordMemory';

type Props = {
  conversation: SuuhimochiConversation;
  parentWordId: string;
  mobile: boolean;
  fragments: number;
  coins: number;
  onWordCreated: (wordId: string) => void;
  onAnswerSaved: (
    parentWordId: string,
    questionId: string,
    perfect: boolean,
  ) => void;
  onMemoryChanged: () => void;
  onComboChange?: (combo: number) => void;
  onKanaCommitted?: (kana: string) => void;
  onComboSuccess?: (combo: number, perfect: boolean, word: string) => void;
  onComboEnd?: (reason: FinishState['reason']) => void;
  onClose: () => void;
};

type FinishState = {
  reason: 'perfect' | 'timeout' | 'complete';
  combo: number;
};

export function PersonWordCombo({
  conversation,
  parentWordId,
  mobile,
  fragments,
  coins,
  onWordCreated,
  onAnswerSaved,
  onMemoryChanged,
  onComboChange,
  onKanaCommitted,
  onComboSuccess,
  onComboEnd,
  onClose,
}: Props) {
  const [question, setQuestion] = useState<PersonComboQuestion | null>(() =>
    conversation.getNextPersonComboQuestion(parentWordId),
  );
  const [draft, setDraft] = useState('');
  const [combo, setCombo] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [remainingMs, setRemainingMs] = useState(PERSON_COMBO_SECONDS * 1000);
  const [finish, setFinish] = useState<FinishState | null>(() =>
    question ? null : { reason: 'complete', combo: 0 },
  );
  const [error, setError] = useState('');
  const [inputPulse, setInputPulse] = useState(false);
  const [acceptedWord, setAcceptedWord] = useState<{
    serial: number;
    word: string;
    combo: number;
  } | null>(null);
  // Render the keyboard as a direct child of the game shell. A fixed-position
  // keyboard inside a backdrop-filter/transform panel is anchored to that
  // panel instead of the viewport, causing severe overlap and clipping.
  const [keyboardHost, setKeyboardHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setKeyboardHost(document.querySelector<HTMLElement>('.game-shell.person-word-combo-open'));
  }, []);
  const deadlineRef = useRef(0);
  const settledRef = useRef(false);
  const inputPulseTimerRef = useRef<number | null>(null);
  const acceptedWordTimerRef = useRef<number | null>(null);
  const presentedQuestionIdsRef = useRef(new Set<string>());

  useEffect(() => {
    onComboChange?.(combo);
  }, [combo, onComboChange]);

  useEffect(() => {
    if (!question || presentedQuestionIdsRef.current.has(question.id)) return;
    presentedQuestionIdsRef.current.add(question.id);
    conversation.markPersonComboQuestionPresented(parentWordId, question.id);
  }, [conversation, parentWordId, question]);

  useEffect(
    () => () => {
      if (inputPulseTimerRef.current !== null)
        window.clearTimeout(inputPulseTimerRef.current);
      if (acceptedWordTimerRef.current !== null)
        window.clearTimeout(acceptedWordTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!question || finish) return;
    settledRef.current = false;
    // 質問がDOMへ反映されたあとから15秒を数える。
    const deadline = Date.now() + PERSON_COMBO_SECONDS * 1000;
    deadlineRef.current = deadline;
    const tick = window.setInterval(() => {
      const next = Math.max(0, deadline - Date.now());
      setRemainingMs(next);
      if (next > 0 || settledRef.current) return;
      settledRef.current = true;
      setDraft('');
      setFinish({ reason: 'timeout', combo });
      onComboEnd?.('timeout');
    }, 100);
    return () => window.clearInterval(tick);
  }, [question, finish, combo, onComboEnd]);

  function startQuestion(next: PersonComboQuestion) {
    setRemainingMs(PERSON_COMBO_SECONDS * 1000);
    setQuestion(next);
  }

  function changeDraft(value: string) {
    const maxLength = question?.maxLength ?? 30;
    const nextDraft = sanitizeWordComboKanaInput(value, maxLength);
    const committedKana = getNewlyCommittedKana(draft, nextDraft);
    setDraft(nextDraft);
    if (committedKana) onKanaCommitted?.(committedKana);
    setError('');
    setInputPulse(true);
    if (inputPulseTimerRef.current !== null)
      window.clearTimeout(inputPulseTimerRef.current);
    inputPulseTimerRef.current = window.setTimeout(() => {
      setInputPulse(false);
      inputPulseTimerRef.current = null;
    }, 130);
  }

  function answer() {
    const value = draft.trim();
    if (!value || !question || settledRef.current) return;
    if (Date.now() > deadlineRef.current) {
      settledRef.current = true;
      setDraft('');
      setFinish({ reason: 'timeout', combo });
      onComboEnd?.('timeout');
      return;
    }
    settledRef.current = true;
    const result = conversation.submitPersonComboAnswer(
      parentWordId,
      question.id,
      value,
    );
    if (!result?.ok) {
      settledRef.current = false;
      setError(`かなで${question.maxLength}文字以内にしてほしいの。`);
      return;
    }

    const nextCombo = combo + 1;
    const nextResolvedCount = resolvedCount + 1;
    const perfect = nextCombo === 6 && nextResolvedCount === 6;
    if (!result.preview) {
      onAnswerSaved(parentWordId, question.id, perfect);
      if (result.createdWordId) onWordCreated(result.createdWordId);
      onMemoryChanged();
    }
    setCombo(nextCombo);
    setResolvedCount(nextResolvedCount);
    setAcceptedWord((current) => ({
      serial: (current?.serial ?? 0) + 1,
      word: value,
      combo: nextCombo,
    }));
    if (acceptedWordTimerRef.current !== null)
      window.clearTimeout(acceptedWordTimerRef.current);
    acceptedWordTimerRef.current = window.setTimeout(() => {
      setAcceptedWord(null);
      acceptedWordTimerRef.current = null;
    }, 2200);
    onComboSuccess?.(nextCombo, perfect, value);
    setDraft('');
    setError('');
    if (perfect) {
      setFinish({ reason: 'perfect', combo: nextCombo });
      onComboEnd?.('perfect');
      return;
    }
    if (nextResolvedCount >= 6) {
      setFinish({ reason: 'complete', combo: nextCombo });
      onComboEnd?.('complete');
      return;
    }
    const next = conversation.getNextPersonComboQuestion(parentWordId);
    if (next) startQuestion(next);
    else {
      setFinish({ reason: 'complete', combo: nextCombo });
      onComboEnd?.('complete');
    }
  }

  function skipQuestion() {
    if (!question || settledRef.current) return;
    settledRef.current = true;
    if (!conversation.skipPersonComboQuestion(parentWordId, question.id)) {
      settledRef.current = false;
      return;
    }
    const nextResolvedCount = resolvedCount + 1;
    setResolvedCount(nextResolvedCount);
    setDraft('');
    setError('');
    onMemoryChanged();
    if (nextResolvedCount >= 6) {
      setFinish({ reason: 'complete', combo });
      onComboEnd?.('complete');
      return;
    }
    const next = conversation.getNextPersonComboQuestion(parentWordId);
    if (next) startQuestion(next);
    else {
      setFinish({ reason: 'complete', combo });
      onComboEnd?.('complete');
    }
  }

  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    answer();
  }

  return (
    <section
      className={`person-combo${mobile ? ' is-mobile-source' : ''}${combo >= 3 ? ' person-combo-hot' : ''}${combo >= 5 ? ' person-combo-final' : ''}${finish ? ' is-finished' : ''}`}
    >
      {!finish && (
        <header className="person-combo-status">
          <span className={`person-combo-count person-combo-count-${Math.min(3, combo)}`}>
            <strong>{combo}</strong> COMBO
          </span>
          <b aria-label={`残り${Math.ceil(remainingMs / 1000)}秒`}>
            {(remainingMs / 1000).toFixed(1)}
          </b>
        </header>
      )}

      {finish ? (
        <div className="person-combo-result" aria-live="polite">
          {finish.reason === 'perfect' ? (
            <>
              <strong className="person-combo-perfect">6 COMBO</strong>
              <div
                className="person-combo-shards"
                aria-label="6つのことばの欠片"
              >
                ✦ ✦ ✦ ✦ ✦ ✦
              </div>
              <b>COIN GET</b>
              <b>PERFECT BONUS　COIN +1</b>
              <p>いっぱい教えてもらったの！</p>
            </>
          ) : (
            <>
              <strong>
                {finish.reason === 'timeout'
                  ? 'COMBO BREAK'
                  : `${finish.combo} COMBO`}
              </strong>
              <p>
                {finish.combo > 0
                  ? 'ぼくの頭、さっきすごい速さで動いてたの。'
                  : 'またコトバが入りそうな時にお願いするの。'}
              </p>
            </>
          )}
          <small>
            ことばの欠片 {fragments}/6　・　ガチャコイン {coins}枚
          </small>
          <button type="button" onClick={onClose}>
            おしまい
          </button>
        </div>
      ) : (
        question && (
          <>
            {acceptedWord && (
              <output
                className={`person-combo-accepted${acceptedWord.combo >= 3 ? ' is-high-combo' : ''}`}
                key={acceptedWord.serial}
                aria-live="polite"
              >
                <small>ことばがつながった！</small>
                <strong>{acceptedWord.word}</strong>
              </output>
            )}
            <div className="person-combo-question" aria-live="polite">
              <small>「{question.parentSurface}」から思い出すコトバ</small>
              {question.lines.map((line, index) => (
                <p key={`${question.id}-${index}`}>{line}</p>
              ))}
              {combo === 5 && <strong>あとひとつなの！！</strong>}
            </div>
            <button className="person-combo-skip" type="button" onClick={skipQuestion}>
              思いつかない（スキップ）
            </button>
            {error && <p className="person-combo-error">{error}</p>}
            {keyboardHost && createPortal(
              <form
                onSubmit={submit}
                className={`person-combo-input person-combo-keyboard-portal${inputPulse ? ' is-typing' : ''}`}
                aria-label="ことばコンボ入力"
              >
                <SuuhimochiKeyboard
                  value={draft}
                  onChange={changeDraft}
                  onDecide={answer}
                  maxLength={question.maxLength}
                  placeholder="かなでこたえて…"
                  ariaLabel="ことばコンボの答え"
                  kanaOnly
                  comboContained
                />
              </form>,
              keyboardHost,
            )}
          </>
        )
      )}

      <style>{`
        .person-combo { position:relative; width:min(650px,100%); max-height:min(88dvh,720px); overflow:visible; padding:18px; border:1px solid rgba(108,225,255,.45); border-radius:22px; background:linear-gradient(145deg,rgba(5,13,35,.97),rgba(9,15,39,.96)); color:#effeff; box-shadow:0 18px 50px rgba(0,0,0,.5),0 0 22px rgba(76,245,255,.14),inset 0 0 28px rgba(71,131,194,.08); backdrop-filter:none; }
        .person-combo-status { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; font-weight:900; letter-spacing:.08em; }
        .person-combo-status span { color:#bffcff; font-size:clamp(17px,2.4vw,25px); text-shadow:0 0 8px rgba(76,245,255,.72); }
        .person-combo-status span strong { display:inline-block; min-width:1.15em; color:#d8fbff; font-size:1.55em; line-height:.75; text-align:right; font-variant-numeric:tabular-nums; }
        .person-combo-status b { min-width:64px; padding:6px 10px; border:1px solid rgba(255,79,216,.48); border-radius:999px; background:rgba(7,5,24,.86); color:#fff; box-shadow:0 0 14px rgba(255,79,216,.28); text-align:center; font-variant-numeric:tabular-nums; }
        .person-combo-hot { border-color:rgba(255,212,104,.48); box-shadow:0 18px 50px rgba(0,0,0,.5),0 0 28px rgba(76,245,255,.22),0 0 32px rgba(255,204,77,.12),inset 0 0 30px rgba(132,93,255,.1); }
        .person-combo-final { border-color:rgba(255,231,145,.74); }
        .person-combo-question { min-height:176px; max-height:min(42dvh,300px); overflow-y:auto; overscroll-behavior:contain; padding:18px 20px; border:1px solid rgba(105,220,255,.32); border-radius:17px; background:linear-gradient(150deg,rgba(4,12,34,.98),rgba(10,17,43,.96)); box-shadow:inset 0 0 22px rgba(76,245,255,.055),0 8px 24px rgba(0,0,0,.2); scrollbar-width:thin; scrollbar-color:rgba(76,245,255,.55) transparent; }
        .person-combo-question small { display:block; margin-bottom:10px; color:#ffafea; font-size:13px; font-weight:850; letter-spacing:.045em; }
        .person-combo-question p { margin:0 0 8px; color:#f7fdff; font-size:16px; line-height:1.72; font-weight:680; text-shadow:0 1px 9px rgba(76,245,255,.2),0 2px 4px rgba(0,0,0,.55); }
        .person-combo-question strong { display:block; margin-top:8px; color:#fff099; font-size:20px; text-align:center; text-shadow:0 0 8px #ff8b45,0 0 18px #ff4fd8; }
        .person-combo-error { margin:8px 0 0; color:#ffb5d5; font-weight:700; }
        .person-combo-skip { display:block; margin:7px 0 0 auto; padding:5px 10px; border:1px solid rgba(182,214,235,.34); border-radius:999px; color:#d9e7f2; background:rgba(6,12,30,.72); font:inherit; font-size:12px; cursor:pointer; }
        .person-combo-skip:active { transform:scale(.96); }
        .person-combo-input { display:block; margin:0; padding:0; }
        .person-combo-input > input { flex:1; min-width:0; min-height:48px; padding:0 14px; border:1px solid rgba(76,245,255,.58); border-radius:14px; color:#fff; background:rgba(4,6,20,.9); box-shadow:0 0 18px rgba(76,245,255,.16),inset 0 0 12px rgba(132,93,255,.12); font:inherit; font-size:16px; }
        .person-combo-input > button,.person-combo-result button { min-height:46px; padding:0 20px; border:1px solid rgba(76,245,255,.66); border-radius:14px; background:linear-gradient(135deg,#2257a4,#8b2b99); color:white; box-shadow:0 0 16px rgba(76,245,255,.26),0 0 22px rgba(255,79,216,.18); font:inherit; font-weight:800; cursor:pointer; }
        .person-combo-input > button:disabled { opacity:.45; }
        .person-combo-result { display:grid; justify-items:center; gap:12px; padding:22px 12px; text-align:center; }
        .person-combo-result > strong { color:#fff; font-size:clamp(28px,7vw,54px); line-height:1; text-shadow:0 0 8px #fff,0 0 22px #4cf5ff,0 0 38px #ff4fd8; }
        .person-combo-result > b { color:#fff099; font-size:clamp(17px,3vw,24px); text-shadow:0 0 12px #ff4fd8; }
        .person-combo-result p { margin:4px 0; font-size:17px; font-weight:700; }
        .person-combo-result small { color:#c8d9ef; }
        .person-combo-accepted { position:fixed; z-index:268; left:42%; bottom:24%; display:grid; justify-items:center; gap:2px; width:max-content; max-width:38vw; padding:8px 18px; border:1px solid rgba(255,235,145,.62); border-radius:999px; color:#fff; background:rgba(5,10,30,.86); box-shadow:0 0 18px rgba(76,245,255,.36),0 0 30px rgba(255,204,77,.2); pointer-events:none; animation:person-combo-accepted 2.2s ease-out both; }
        .person-combo-accepted small { color:#bffcff; font-size:11px; font-weight:900; letter-spacing:.08em; }
        .person-combo-accepted strong { max-width:34vw; overflow:hidden; color:#fff6ae; font-size:clamp(18px,3vw,31px); line-height:1.1; text-overflow:ellipsis; text-shadow:0 0 8px #ffcc4d,0 0 18px rgba(76,245,255,.6); white-space:nowrap; }
        .person-combo-accepted.is-high-combo { border-color:#ffe27b; box-shadow:0 0 24px rgba(255,204,77,.5),0 0 42px rgba(255,79,216,.26); }
        .person-combo-perfect { animation:person-combo-pop .55s cubic-bezier(.2,1.7,.4,1); }
        .person-combo-shards { color:#fff099; font-size:clamp(20px,5vw,34px); letter-spacing:.18em; text-shadow:0 0 7px #fff,0 0 16px #ffcc4d,0 0 26px #ff4fd8; animation:person-combo-shards-in .72s cubic-bezier(.2,1.5,.3,1) both; }
        @keyframes person-combo-pulse { to { box-shadow:0 18px 56px rgba(0,0,0,.52),0 0 48px rgba(76,245,255,.52),0 0 68px rgba(255,79,216,.42),inset 0 0 42px rgba(132,93,255,.25); } }
        @keyframes person-combo-pop { 0% { transform:scale(.72); opacity:.2; } 75% { transform:scale(1.12); } 100% { transform:scale(1); opacity:1; } }
        @keyframes person-combo-shards-in { 0% { opacity:0; transform:scale(1.9); letter-spacing:1.1em; } 100% { opacity:1; transform:scale(1); letter-spacing:.18em; } }
        @keyframes person-combo-accepted { 0% { opacity:0; transform:translateY(10px) scale(.88); } 8%,68% { opacity:1; transform:translateY(0) scale(1); } 100% { opacity:0; transform:translateY(-8px) scale(.98); } }
        @media (max-width:900px) and (orientation:landscape) {
          .person-combo { width:100%; max-height:calc(var(--app-visible-height,100dvh) - 16px); padding:11px; border-radius:16px; overflow:visible; }
          .person-combo-status { margin-bottom:7px; }
          .person-combo-status span { font-size:19px; }
          .person-combo-status b { min-width:58px; padding:4px 8px; }
          .person-combo-question { min-height:clamp(116px,36dvh,174px); max-height:clamp(132px,43dvh,196px); overflow-y:auto; padding:11px 13px; border-radius:13px; }
          .person-combo-question small { margin-bottom:5px; font-size:11px; }
          .person-combo-question p { margin-bottom:4px; font-size:clamp(13px,1.75vw,15px); line-height:1.52; }
          .person-combo-question strong { margin-top:4px; font-size:17px; }
          .person-combo-accepted { left:39%; bottom:22%; }
          .person-combo-result { gap:7px; padding:10px 5px; }
        }
        @media (prefers-reduced-motion:reduce) {
          .person-combo-accepted,.person-combo-perfect,.person-combo-shards { animation-duration:1ms !important; }
        }
      `}</style>
    </section>
  );
}
