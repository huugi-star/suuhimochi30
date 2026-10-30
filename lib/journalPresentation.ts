import { shiftMissionDate } from './dailyMissions';

export const JOURNAL_OPEN_DATE_KEY = 'suuhimochi-journal-open-jst-v1';
type Reader = Pick<Storage, 'getItem'>;
export function journalBrowserStorage() { try { return typeof window === 'undefined' ? undefined : window.localStorage; } catch { return undefined; } }
/** Presentation preference only. Never updates a game save or activity-day record. */
export function initialJournalDate(today: string, hasYesterday: boolean, storage?: Reader) {
  try {
    return hasYesterday && storage?.getItem(JOURNAL_OPEN_DATE_KEY) !== today ? shiftMissionDate(today, -1) : today;
  } catch { return hasYesterday ? shiftMissionDate(today, -1) : today; }
}
export function markJournalOpened(today: string, storage?: Pick<Storage, 'setItem'>) {
  try { storage?.setItem(JOURNAL_OPEN_DATE_KEY, today); } catch { /* Reading a journal must remain possible without storage. */ }
}
/** Quote existing text, or name actual learned words. No generated experience or meaning. */
export function pictureDiaryComment(words: readonly string[], diary?: string) {
  const known = [...new Set(words.map((word) => word.trim()).filter(Boolean))];
  const sentence = diary?.split(/\n|(?<=[。！？])/u).find((line) => line.trim() && line.length <= 110 && (!known.length || known.some((word) => line.includes(word))));
  if (sentence) return sentence.trim();
  return known.length ? `この日に覚えたことば：${known.slice(0, 3).map((word) => `「${word}」`).join('、')}。` : '';
}
