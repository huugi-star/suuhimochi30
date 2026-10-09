/**
 * すうひもちと人間さんの交友度。
 * 数字は内部だけで使い、画面には現在の呼び名だけを出す。
 */
export const FRIENDSHIP_MAX = 600;
export const FRIENDSHIP_DAILY_MAX = 30;

export const FRIENDSHIP_SOURCES = [
  'basicConversation',
  'wordTeaching',
  'footprint',
  'meal',
  'reply',
] as const;

export type FriendshipSource = (typeof FRIENDSHIP_SOURCES)[number];
export type FriendshipLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type FriendshipDailyRecord = {
  /** その活動日に得た交友度。 */
  gained: number;
  /** 種別ごとの日次回数。 */
  sourceCounts: Record<FriendshipSource, number>;
  /** 同じ完了イベントを二度数えないための内部ID。 */
  eventIds: string[];
};

export type FriendshipDailyRecords = Record<string, FriendshipDailyRecord>;

const LEVELS: ReadonlyArray<{ level: FriendshipLevel; min: number; max: number; title: string }> = [
  { level: 1, min: 0, max: 29, title: 'どうきょにん' },
  { level: 2, min: 30, max: 59, title: 'かおなじみ' },
  { level: 3, min: 60, max: 119, title: 'はなしあいて' },
  { level: 4, min: 120, max: 179, title: 'ともだち' },
  { level: 5, min: 180, max: 300, title: 'なかよし' },
  { level: 6, min: 301, max: 359, title: 'ずっとも' },
  { level: 7, min: 360, max: 419, title: 'マブダチ' },
  { level: 8, min: 420, max: 479, title: 'しんゆう' },
  { level: 9, min: 480, max: 539, title: 'こころのとも' },
  { level: 10, min: 540, max: 600, title: 'ずっとわすれないひと' },
];

const SOURCE_LIMITS: Record<FriendshipSource, number> = {
  basicConversation: 12,
  wordTeaching: 5,
  footprint: 1,
  meal: 3,
  reply: 7,
};

function clampScore(value: unknown) {
  return Math.min(FRIENDSHIP_MAX, Math.max(0, Math.floor(Number(value) || 0)));
}

function emptySourceCounts(): Record<FriendshipSource, number> {
  return {
    basicConversation: 0,
    wordTeaching: 0,
    footprint: 0,
    meal: 0,
    reply: 0,
  };
}

export function createFriendshipDailyRecord(): FriendshipDailyRecord {
  return { gained: 0, sourceCounts: emptySourceCounts(), eventIds: [] };
}

export function getFriendshipLevel(score: number) {
  const safeScore = clampScore(score);
  return LEVELS.find((item) => safeScore >= item.min && safeScore <= item.max) ?? LEVELS[0];
}

export function getFriendshipTitle(score: number) {
  return getFriendshipLevel(score).title;
}

/** All levels already implied by a saved total; used for migration and hooks. */
export function getReachedFriendshipLevels(score: number): FriendshipLevel[] {
  const current = getFriendshipLevel(score).level;
  return LEVELS.filter((item) => item.level <= current).map((item) => item.level);
}

export function sanitizeFriendshipDailyRecords(value: unknown): FriendshipDailyRecords {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const records: FriendshipDailyRecords = {};
  for (const [date, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const candidate = raw as Partial<FriendshipDailyRecord>;
    const rawCounts = candidate.sourceCounts && typeof candidate.sourceCounts === 'object'
      ? candidate.sourceCounts as Partial<Record<FriendshipSource, unknown>>
      : {};
    const sourceCounts = emptySourceCounts();
    for (const source of FRIENDSHIP_SOURCES) {
      sourceCounts[source] = Math.min(SOURCE_LIMITS[source], Math.max(0, Math.floor(Number(rawCounts[source]) || 0)));
    }
    records[date] = {
      gained: Math.min(FRIENDSHIP_DAILY_MAX, Math.max(0, Math.floor(Number(candidate.gained) || 0))),
      sourceCounts,
      eventIds: Array.isArray(candidate.eventIds)
        ? [...new Set(candidate.eventIds.filter((item): item is string => typeof item === 'string'))].slice(-80)
        : [],
    };
  }
  return records;
}

export function sanitizeReachedFriendshipLevels(value: unknown, score: number): FriendshipLevel[] {
  const valid = Array.isArray(value)
    ? value.filter((item): item is FriendshipLevel => Number.isInteger(item) && item >= 1 && item <= 10)
    : [];
  // Existing saves did not have this list. Treat levels implied by their score
  // as already reached, so a future one-shot event is never replayed on load.
  return [...new Set([...getReachedFriendshipLevels(score), ...valid])].sort((a, b) => a - b) as FriendshipLevel[];
}

export type FriendshipAddition = {
  score: number;
  dailyRecords: FriendshipDailyRecords;
  reachedLevels: FriendshipLevel[];
  eventIds: string[];
  added: number;
  newlyReachedLevels: FriendshipLevel[];
};

export function sanitizeFriendshipEventIds(value: unknown) {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === 'string'))].slice(-1200)
    : [];
}

/**
 * The only point-calculation entry point. A stable eventId makes retries and
 * duplicate UI callbacks harmless while source and daily limits remain here.
 */
export function addFriendship(input: {
  score: number;
  dailyRecords: FriendshipDailyRecords | unknown;
  reachedLevels: FriendshipLevel[] | unknown;
  eventIds: string[] | unknown;
  activityDate: string;
  source: FriendshipSource;
  eventId: string;
  amount?: number;
}): FriendshipAddition {
  const score = clampScore(input.score);
  const dailyRecords = sanitizeFriendshipDailyRecords(input.dailyRecords);
  const reachedLevels = sanitizeReachedFriendshipLevels(input.reachedLevels, score);
  const eventIds = sanitizeFriendshipEventIds(input.eventIds);
  const current = dailyRecords[input.activityDate] ?? createFriendshipDailyRecord();

  if (!input.eventId || eventIds.includes(input.eventId) || current.eventIds.includes(input.eventId)) {
    return { score, dailyRecords, reachedLevels, eventIds, added: 0, newlyReachedLevels: [] };
  }

  const wanted = Math.max(0, Math.floor(input.amount ?? 1));
  const allowed = Math.min(
    wanted,
    FRIENDSHIP_MAX - score,
    FRIENDSHIP_DAILY_MAX - current.gained,
    SOURCE_LIMITS[input.source] - current.sourceCounts[input.source],
  );
  if (allowed <= 0) return { score, dailyRecords, reachedLevels, eventIds, added: 0, newlyReachedLevels: [] };

  const nextScore = score + allowed;
  const nextRecord: FriendshipDailyRecord = {
    gained: current.gained + allowed,
    sourceCounts: { ...current.sourceCounts, [input.source]: current.sourceCounts[input.source] + allowed },
    eventIds: [...current.eventIds, input.eventId].slice(-80),
  };
  const nextDailyRecords = { ...dailyRecords, [input.activityDate]: nextRecord };
  const reachedNow = getReachedFriendshipLevels(nextScore);
  const newlyReachedLevels = reachedNow.filter((level) => !reachedLevels.includes(level));

  return {
    score: nextScore,
    dailyRecords: nextDailyRecords,
    reachedLevels: [...new Set([...reachedLevels, ...reachedNow])].sort((a, b) => a - b) as FriendshipLevel[],
    eventIds: [...eventIds, input.eventId].slice(-1200),
    added: allowed,
    newlyReachedLevels,
  };
}

/** Reserved hook data for the future Lv2–Lv5 one-time relationship events. */
export function isFriendshipEventLevel(level: FriendshipLevel) {
  return level >= 2 && level <= 5;
}
