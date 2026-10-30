'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SuuhimochiConversation, WordEntry } from '@/lib/wordMemory';
import { missionDateKey, shiftMissionDate } from '@/lib/dailyMissions';
import { diaryConversationCount, eligibleDiaryDay, readPictureDiaryConsent, savePictureDiaryConsent, selectDiaryWords, type DiaryDay, type PictureDiaryConsent } from '@/lib/pictureDiary';
import { ensureDefaultDiaryRecords, readPictureDiaryStore, rememberDiaryDays, runPictureDiaryStartup, type PictureDiaryRecord } from '@/lib/pictureDiaryClient';

export function usePictureDiary(options: { ready: boolean; talk: SuuhimochiConversation | null; individual: string; words: WordEntry[]; profileNames: string[] }) {
  const latest = useRef(options);
  useEffect(() => { latest.current = options; });
  const [consent, setConsent] = useState<PictureDiaryConsent>({ enabled: false, since: null });
  const [records, setRecords] = useState<PictureDiaryRecord[]>([]);
  const attempted = useRef(''), running = useRef(false), controller = useRef<AbortController | null>(null);
  const reload = useCallback(() => setRecords(readPictureDiaryStore(localStorage).records), []);
  const capture = useCallback(() => {
    const current = latest.current, preference = readPictureDiaryConsent(localStorage), talk = current.talk;
    if (!current.ready || !talk || document.hidden) return;
    const startDate = talk.getLearningStartDate(); if (!startDate) return;
    const today = missionDateKey(), yesterday = shiftMissionDate(today, -1), finalDay = shiftMissionDate(startDate, 29);
    if (today < startDate) return;
    const through = today < finalDay ? today : finalDay, logs = talk.getConversationLogs();
    const snapshots: DiaryDay[] = [], candidates: string[] = [];
    for (let date = startDate; date <= through; date = shiftMissionDate(date, 1)) {
      const conversationCount = diaryConversationCount(logs, date);
      const learnedWords = preference.enabled
        ? selectDiaryWords(talk.getWordEntries(), talk.getMemoryRelations(), talk.getMemoryEpisodes(), date, current.profileNames, logs)
        : [];
      snapshots.push({ localCompanionId: current.individual, startDate, diaryDate: date, learnedWords, conversationCount });
      if (date === yesterday && preference.enabled && conversationCount > 0 && learnedWords.length >= 2
        && eligibleDiaryDay(snapshots[snapshots.length - 1], preference)) candidates.push(date);
    }
    rememberDiaryDays(localStorage, snapshots);
    ensureDefaultDiaryRecords(localStorage, { localCompanionId: current.individual, startDate, today: through === today ? today : shiftMissionDate(through, 1), attemptedOn: today, awaitingCloudflareDates: candidates });
    reload();
  }, [reload]);
  const check = useCallback(async (explicitLookup = false) => {
    if (!latest.current.ready || document.hidden || running.current || !readPictureDiaryConsent(localStorage).enabled) return;
    const today = missionDateKey(); if (!explicitLookup && attempted.current === today) return;
    attempted.current = today; running.current = true; controller.current = new AbortController();
    try {
      const task = runPictureDiaryStartup(localStorage, readPictureDiaryConsent(localStorage), fetch, new Date(), controller.current.signal);
      setRecords(readPictureDiaryStore(localStorage).records);
      await task; setRecords(readPictureDiaryStore(localStorage).records);
    } finally { running.current = false; }
  }, []);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) { setConsent(readPictureDiaryConsent(localStorage)); reload(); } });
    return () => { active = false; controller.current?.abort(); };
  }, [reload]);
  useEffect(() => {
    if (!options.ready) return;
    let active = true;
    queueMicrotask(() => { if (active) { capture(); void check(); } });
    return () => { active = false; };
  }, [options.ready, consent.enabled, capture, check]);
  useEffect(() => {
    if (options.ready) capture();
  }, [options.ready, options.words, options.individual, capture]);
  useEffect(() => {
    const visible = () => { if (document.hidden) controller.current?.abort(); else { capture(); void check(); } };
    document.addEventListener('visibilitychange', visible);
    return () => document.removeEventListener('visibilitychange', visible);
  }, [capture, check]);
  const choose = (enabled: boolean) => {
    if (!enabled) controller.current?.abort();
    const next = savePictureDiaryConsent(localStorage, enabled); setConsent(next);
    capture(); reload();
  };
  return { consent, choose, records, capture, check: () => check(true) };
}
