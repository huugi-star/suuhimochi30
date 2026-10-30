'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getWordComboDanceFrames,
  WORD_COMBO_DANCE_CYCLE_MS,
  type WordComboDanceFrame,
  type WordComboDanceExpression,
} from '@/lib/wordComboDance';

type Props = {
  expression?: WordComboDanceExpression;
  /** Alternate arc and squint on every dance pose. */
  alternateExpressions?: boolean;
  /** Initial zero-based pose; later loops always restart at frame 1. */
  startFrameIndex?: number;
  loop?: boolean;
  cycles?: number;
  cycleMs?: number;
  /** Kana-linked frames. When supplied, these replace the legacy six-pose lap. */
  sequence?: readonly WordComboDanceFrame[];
  /** Keep the final input pose visible until a newer run replaces it. */
  holdLastFrame?: boolean;
  motion?: 'legacy' | 'beat' | 'settle' | 'sequence';
  runId: number;
  onReady?: () => void;
  onFinished?: () => void;
  onLoadFailed?: () => void;
};

const preloadCache = new Map<string, Promise<boolean>>();

function preloadDanceFrames(sources: string[]) {
  const cacheKey = sources.join('|');
  const cached = preloadCache.get(cacheKey);
  if (cached) return cached;

  const pending = Promise.allSettled(
    sources.map(
      (src) =>
        new Promise<void>((resolve, reject) => {
          const image = new Image();
          image.onload = async () => {
            if (typeof image.decode === 'function') {
              try {
                await image.decode();
              } catch {
                // onload succeeded; a decode rejection alone must not cancel playback.
              }
            }
            resolve();
          };
          image.onerror = () =>
            reject(new Error(`Failed to load dance frame: ${src}`));
          image.src = src;
        }),
    ),
  ).then((results) => {
    const loaded = results.every((result) => result.status === 'fulfilled');
    if (!loaded) preloadCache.delete(cacheKey);
    return loaded;
  });

  preloadCache.set(cacheKey, pending);
  return pending;
}

export function WordComboDance({
  expression = 'arc',
  alternateExpressions = false,
  startFrameIndex = 0,
  loop = false,
  cycles = 1,
  cycleMs,
  sequence,
  holdLastFrame = false,
  motion = 'legacy',
  runId,
  onReady,
  onFinished,
  onLoadFailed,
}: Props) {
  const framesByExpression = useMemo(
    () => ({
      arc: getWordComboDanceFrames('arc'),
      squint: getWordComboDanceFrames('squint'),
    }),
    [],
  );
  const oppositeExpression: WordComboDanceExpression =
    expression === 'arc' ? 'squint' : 'arc';
  const legacyFrames = useMemo(() => {
    return alternateExpressions
      ? framesByExpression[expression].map((frame, index) =>
          index % 2 === 1
            ? framesByExpression[oppositeExpression][index]
            : frame,
        )
      : framesByExpression[expression];
  }, [alternateExpressions, expression, framesByExpression, oppositeExpression]);
  const frames = sequence?.length ? sequence : legacyFrames;
  const preloadSources = useMemo(
    () => [...new Set(frames.map((frame) => frame.src))],
    [frames],
  );
  const [ready, setReady] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const completedCyclesRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const initialFrame = Math.min(
      Math.max(0, startFrameIndex),
      frames.length - 1,
    );
    completedCyclesRef.current = 0;
    setReady(false);
    setFrameIndex(initialFrame);

    void preloadDanceFrames(preloadSources).then((loaded) => {
      if (cancelled) return;
      if (!loaded) {
        console.warn(`Word combo dance could not load: ${expression}`);
        onLoadFailed?.();
        return;
      }
      setReady(true);
      onReady?.();
    });

    return () => {
      cancelled = true;
    };
  }, [expression, frames, onLoadFailed, onReady, preloadSources, runId, startFrameIndex]);

  useEffect(() => {
    if (!ready) return;
    const isLastFrame = frameIndex === frames.length - 1;
    if (isLastFrame && holdLastFrame) return;
    const speedRatio = !sequence?.length && cycleMs && cycleMs > 0
      ? cycleMs / WORD_COMBO_DANCE_CYCLE_MS
      : 1;
    const timer = window.setTimeout(() => {
      if (!isLastFrame) {
        setFrameIndex((current) => current + 1);
        return;
      }

      completedCyclesRef.current += 1;
      if (loop || completedCyclesRef.current < Math.max(1, cycles)) {
        setFrameIndex(0);
        return;
      }
      onFinished?.();
    }, Math.max(50, Math.round(
      (frames[frameIndex].durationMs + frames[frameIndex].holdMs) * speedRatio,
    )));

    return () => window.clearTimeout(timer);
  }, [cycleMs, cycles, frameIndex, frames, holdLastFrame, loop, onFinished, ready, runId, sequence]);

  if (!ready) return null;
  const frame = frames[frameIndex];

  return (
    <div
      className="word-combo-dance"
      aria-hidden="true"
      data-expression={expression}
      data-frame={frameIndex + 1}
      data-variant={frame.variant ?? 'legacy'}
      data-pose={frame.pose ?? frameIndex + 1}
      data-motion={motion}
    >
      <img
        key={`${runId}-${frameIndex}-${frame.src}`}
        className="word-combo-dance-frame"
        src={frame.src}
        alt=""
        draggable={false}
        style={{
          transform: `translate(${frame.offsetX}%, ${frame.offsetY}%) scale(${frame.scale})`,
        }}
      />
      <style>{`
        .word-combo-dance {
          position: absolute;
          inset: 0;
          isolation: isolate;
          overflow: hidden;
          contain: layout paint;
          transform: translateZ(0);
          transform-origin: 50% 88%;
          filter: drop-shadow(0 12px 8px rgba(49, 27, 14, .35));
          pointer-events: none;
          transition: filter 110ms ease, transform 110ms ease;
        }
        .word-combo-dance-frame {
          position: absolute;
          inset: 0;
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
          image-rendering: auto;
          user-select: none;
          pointer-events: none;
          transform-origin: 50% 88%;
          will-change: transform;
        }
        .word-combo-dance[data-frame="4"] {
          transform: translateZ(0) scale(1.025);
          filter: drop-shadow(0 10px 8px rgba(49,27,14,.3)) drop-shadow(0 0 16px rgba(255,226,118,.72));
        }
        .word-combo-dance[data-variant="normal"] { filter:drop-shadow(0 10px 7px rgba(49,27,14,.3)); }
        .word-combo-dance[data-variant="smile"] { filter:drop-shadow(0 10px 8px rgba(49,27,14,.32)) drop-shadow(0 0 12px rgba(255,226,118,.5)); }
        .word-combo-dance[data-variant="finish"] { filter:drop-shadow(0 9px 8px rgba(49,27,14,.3)) drop-shadow(0 0 20px rgba(255,226,118,.85)); }
        .word-combo-dance[data-motion="beat"] {
          animation:word-combo-input-beat 180ms linear both;
        }
        .word-combo-dance[data-motion="settle"] {
          animation:word-combo-input-settle 360ms cubic-bezier(.2,.8,.3,1) both;
        }
        @keyframes word-combo-input-beat {
          0% { transform:translateY(0) scale(1); }
          44% { transform:translateY(2.1%) scale(.985); }
          82% { transform:translateY(-1.25%) scale(1.018); }
          100% { transform:translateY(0) scale(1); }
        }
        @keyframes word-combo-input-settle {
          0% { transform:translateY(-.8%) scale(1.012); }
          100% { transform:translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .word-combo-dance,
          .word-combo-dance[data-frame="4"] { transform: translateZ(0); transition:none; animation-duration:1ms; }
        }
      `}</style>
    </div>
  );
}
