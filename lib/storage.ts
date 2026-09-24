import type { MochiState } from './characterData';
import { splitDoneItems, type DailyProgressRecord } from './dailyProgress';
import type { TwoDayReviewGoalType, TwoDayReviewRecord } from './twoDayReview';

export type GameSave = {
  birthday: string;
  mochiType: number;
  introComplete: boolean;
  day: number;
  state: MochiState;
  userName: string;
  callName: string;
  dailyProgressRecords: DailyProgressRecord[];
  journalNotes: Record<string, string[]>;
  goalType: TwoDayReviewGoalType | null;
  twoDayReviews: TwoDayReviewRecord[];
  lastDailyProgressActivityDate: string;
};
const SAVE_KEY = 'suuhimochi-30days-save-v1';
export const EMPTY_SAVE: GameSave = {
  birthday: '',
  mochiType: 1,
  introComplete: false,
  day: 0,
  state: 'idle',
  userName: '',
  callName: '',
  dailyProgressRecords: [],
  journalNotes: {},
  goalType: null,
  twoDayReviews: [],
  lastDailyProgressActivityDate: '',
};

export function loadSave(): GameSave {
  if (typeof window === 'undefined') return EMPTY_SAVE;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return EMPTY_SAVE;
    const parsed = JSON.parse(raw) as Partial<GameSave> & {
      journalNotes?: Record<string, string | string[]>;
      dailyProgressRecords?: Array<DailyProgressRecord & { doneItems?: string[]; note?: string }>;
    };
    const journalNotes = Object.fromEntries(
      Object.entries(parsed.journalNotes ?? {}).map(([date, value]) => [
        date,
        splitDoneItems(value),
      ]),
    );
    const dailyProgressRecords = Array.isArray(parsed.dailyProgressRecords)
      ? parsed.dailyProgressRecords.map((record) => ({
          ...record,
          doneItems: splitDoneItems(record.doneItems ?? record.note),
        }))
      : [];
    return { ...EMPTY_SAVE, ...parsed, journalNotes, dailyProgressRecords };
  } catch {
    return EMPTY_SAVE;
  }
}

export function storeSave(save: GameSave) {
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}
export function clearSave() {
  window.localStorage.removeItem(SAVE_KEY);
}
