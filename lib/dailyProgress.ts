export type DailyProgressLevel = 'HOP' | 'STEP' | 'JUMP';
export type YesterdayProgressLevel = DailyProgressLevel | 'BREATH';

export type DailyProgressRecord = {
  /** The activity day on which this check-in was shown. */
  date: string;
  /** The activity day being reviewed. */
  reviewedDate: string;
  yesterdayEvaluation: YesterdayProgressLevel;
  /** Individual things the user did. Empty entries are never persisted. */
  doneItems: string[];
  /** Legacy text saved before doneItems was introduced. */
  note?: string;
  /** The user chose to fill in yesterday's note later from the journal. */
  noteDeferred?: boolean;
  wasHard: boolean;
  todayTarget: DailyProgressLevel;
  recordedAt: string;
};

export function normalizeDoneItems(items: readonly string[]) {
  return items.map((item) => item.trim()).filter(Boolean);
}

/** Converts old bullet-text records into the current individual-item format. */
export function splitDoneItems(value: string | readonly string[] | null | undefined) {
  if (typeof value !== 'string') return normalizeDoneItems(value ?? []);
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[・•*-]\s*/, '').trim())
    .filter(Boolean);
}

export function getDoneItems(record: DailyProgressRecord | undefined) {
  return record ? splitDoneItems(record.doneItems ?? record.note) : [];
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Suuhimochi's activity day changes at 07:00 local time.  Shifting the clock
 * seven hours back lets midnight through 06:59 remain part of yesterday.
 */
export function getActivityDateKey(date = new Date()) {
  const shifted = new Date(date);
  shifted.setHours(shifted.getHours() - 7);
  return localDateKey(shifted);
}

export function getPreviousActivityDateKey(activityDate: string) {
  const previous = new Date(`${activityDate}T12:00:00`);
  previous.setDate(previous.getDate() - 1);
  return localDateKey(previous);
}

export function isAfterActivityDayStart(date = new Date()) {
  return date.getHours() >= 7;
}
