'use client';
import { useEffect, useRef, useState } from 'react';
import { HomeAutonomy, type HomeAction } from '@/lib/homeAutonomy';

type Options = {
  individual: string; ready: boolean; busy: boolean; blocked: () => boolean;
  perform: (kind: HomeAction, recent: readonly string[]) => string | null;
};

export function useHomeAutonomy(options: Options) {
  const latest = useRef(options);
  latest.current = options;
  const planner = useRef(new HomeAutonomy());
  const individual = useRef(options.individual);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [revision, reschedule] = useState(0);
  const [hidden, setHidden] = useState(false);
  const clear = () => { if (timer.current !== null) clearTimeout(timer.current); timer.current = null; };

  useEffect(() => {
    const input = (event: Event) => {
      const target = event.target;
      // Advancing/skipping the current performance is its normal completion.
      if (target instanceof Element && target.closest('.face-talk-bubble, .thought-bubble, .startup-story-skip, .face-talk-close, [data-external-source]')) return;
      clear(); planner.current.interrupt(); reschedule((value) => value + 1);
    };
    const visibility = () => {
      clear(); planner.current.interrupt(); setHidden(document.hidden);
      reschedule((value) => value + 1);
    };
    setHidden(document.hidden);
    window.addEventListener('pointerdown', input, true);
    window.addEventListener('keydown', input, true);
    window.addEventListener('wheel', input, { capture: true, passive: true });
    document.addEventListener('visibilitychange', visibility);
    return () => {
      clear(); window.removeEventListener('pointerdown', input, true);
      window.removeEventListener('keydown', input, true); window.removeEventListener('wheel', input, true);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  useEffect(() => {
    clear();
    if (individual.current !== options.individual) {
      individual.current = options.individual;
      planner.current = new HomeAutonomy();
    }
    const delay = planner.current.wait(options.ready, options.busy || hidden, Date.now());
    if (delay !== null) timer.current = setTimeout(() => {
      timer.current = null;
      const current = latest.current;
      if (!current.ready || current.busy || current.blocked() || document.hidden) {
        planner.current.wait(current.ready, true, Date.now());
        reschedule((value) => value + 1);
        return;
      }
      const action = planner.current.fire(Date.now(), current.perform);
      if (!action) reschedule((value) => value + 1);
    }, delay);
    return clear;
  }, [options.ready, options.busy, options.individual, hidden, revision]);
}
