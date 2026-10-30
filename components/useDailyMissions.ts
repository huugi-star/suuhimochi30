'use client';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { dailyMissionDateKey, missionDateKey, reconcileDailyMissions, shiftMissionDate } from '@/lib/dailyMissions';
import type { GameSave } from '@/lib/storage';
import type { WordEntry } from '@/lib/conversationTypes';

/** Observe saved operations and the 05:00 JST boundary without opening a modal. */
export function useDailyMissions(ready: boolean, save: GameSave, setSave: Dispatch<SetStateAction<GameSave>>, words: readonly WordEntry[]) {
  const [date, setDate] = useState(() => dailyMissionDateKey());
  useEffect(() => {
    if (!ready) return;
    let active = true, timer: ReturnType<typeof setTimeout>;
    const observe = () => {
      if (!active) return;
      const now = new Date(); setDate(dailyMissionDateKey(now));
      if (!document.hidden) setSave((previous) => reconcileDailyMissions(previous, words, now));
    };
    const schedule = () => {
      const now = new Date(), civilToday = missionDateKey(now), todayBoundary = Date.parse(`${civilToday}T05:00:00+09:00`);
      const nextBoundaryDate = now.getTime() < todayBoundary ? civilToday : shiftMissionDate(civilToday, 1);
      timer = setTimeout(() => { observe(); schedule(); }, Math.max(10, Date.parse(`${nextBoundaryDate}T05:00:00+09:00`) - now.getTime() + 10));
    };
    queueMicrotask(observe); schedule();
    const visible = () => { if (!document.hidden) observe(); };
    document.addEventListener('visibilitychange', visible); window.addEventListener('focus', visible);
    return () => { active = false; clearTimeout(timer); document.removeEventListener('visibilitychange', visible); window.removeEventListener('focus', visible); };
  }, [ready, save.taskPlans, setSave, words]);
  return date;
}
