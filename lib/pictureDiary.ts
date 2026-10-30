import { CATEGORY_LABELS, SUBCATEGORY_CHOICES } from './conversationData';
import type { ConversationLog, MemoryEpisode, MemoryRelation, StorageLike, WordEntry } from './conversationTypes';
import { missionDateKey, shiftMissionDate } from './dailyMissions';
import { safeSharedKeyword, sharedCandidateSurfaces } from './sharedKnowledge';
import { INFO_HUB_ORIGIN } from './externalTopics';
import { diaryCycleDayNumber } from './pictureDiaryDefaults';

export const PICTURE_DIARY_CONSENT_KEY = 'suuhimochi-picture-diary-consent-v1';
export const PICTURE_DIARY_DATA_KEY = 'suuhimochi-picture-diary-v1';
export type PictureDiaryConsent = { enabled: boolean; since: string | null };
export type DiaryLearnedWord = { word: string; majorCategory: string; subCategory?: string; firstLearnedAt?: string; lastLearnedAt?: string; relatedWords?: string[] };
export type DiaryDay = { localCompanionId: string; startDate: string; diaryDate: string; learnedWords: DiaryLearnedWord[]; conversationCount?: number };
export function diaryDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`))
    && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}
/** Missing/ambiguous legacy dates stay absent; activity-day numbers are never invented into timestamps. */
export function recordedDiaryTime(value: unknown): string | undefined {
  if (diaryDate(value)) return value;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    || !diaryDate(value.slice(0, 10)) || !Number.isFinite(Date.parse(value))) return undefined;
  return new Date(value).toISOString();
}
const dayOf = (value: string) => diaryDate(value) ? value : missionDateKey(new Date(value));
/** Count actual persisted dialogue entries on a JST civil date; diary prose is never inspected. */
export function diaryConversationCount(logs: readonly ConversationLog[], target: string): number {
  if (!diaryDate(target)) return 0;
  return logs.filter((log) => {
    const time = recordedDiaryTime(log.timestamp);
    return Boolean(time && dayOf(time) === target && (log.speaker === 'USER' || log.speaker === 'SUUHIMOCHI'));
  }).length;
}
export function diaryImageDayNumber(startDate: string, target: string) {
  return diaryCycleDayNumber(startDate, target);
}
export function readPictureDiaryConsent(storage: StorageLike): PictureDiaryConsent {
  try { const row = JSON.parse(storage.getItem(PICTURE_DIARY_CONSENT_KEY) ?? 'null');
    return row?.enabled === true && diaryDate(row.since) ? { enabled: true, since: row.since } : { enabled: false, since: null };
  } catch { return { enabled: false, since: null }; }
}
export function savePictureDiaryConsent(storage: StorageLike, enabled: boolean, now = new Date()) {
  const previous = readPictureDiaryConsent(storage);
  const next: PictureDiaryConsent = { enabled, since: enabled ? previous.since ?? missionDateKey(now) : null };
  try { storage.setItem(PICTURE_DIARY_CONSENT_KEY, JSON.stringify(next)); return next; }
  catch { return readPictureDiaryConsent(storage); }
}
export function selectDiaryWords(words: readonly WordEntry[], relations: readonly MemoryRelation[], episodes: readonly MemoryEpisode[], target: string, profileNames: readonly string[] = [], logs: readonly ConversationLog[] = []): DiaryLearnedWord[] {
  if (!diaryDate(target)) return [];
  const allowed = new Set(sharedCandidateSurfaces(words, profileNames));
  const eligible = words.filter((word) => allowed.has(word.surface) && safeSharedKeyword(word.surface)
    && word.category !== 'UNKNOWN' && Object.hasOwn(CATEGORY_LABELS, word.category));
  const byId = new Map(eligible.map((word) => [word.id, word]));
  const lastSeen = new Map<string, string>();
  for (const episode of episodes) {
    const time = recordedDiaryTime(episode.timestamp); if (!time || dayOf(time) > target) continue;
    for (const id of episode.topicWordIds) if (!lastSeen.has(id) || time > lastSeen.get(id)!) lastSeen.set(id, time);
  }
  const bySurface = new Map(eligible.map((word) => [word.surface, word.id]));
  // A literal user mention is a recorded revisit; never infer words from a sentence or send the log.
  for (const log of logs) {
    const id = log.speaker === 'USER' ? bySurface.get(log.text.trim()) : undefined, time = recordedDiaryTime(log.timestamp);
    if (id && time && dayOf(time) <= target && (!lastSeen.has(id) || time > lastSeen.get(id)!)) lastSeen.set(id, time);
  }
  return eligible.flatMap((word) => {
    const first = recordedDiaryTime(word.learnedAt);
    if (first && dayOf(first) > target) return [];
    const seen = lastSeen.get(word.id), last = seen && (!first || seen >= first) ? seen : first;
    const subCategory = SUBCATEGORY_CHOICES[word.category]?.find((choice) => choice.id === word.subcategory)?.label;
    const item: DiaryLearnedWord = { word: word.surface, majorCategory: CATEGORY_LABELS[word.category],
      ...(subCategory ? { subCategory } : {}), ...(first ? { firstLearnedAt: first } : {}), ...(last ? { lastLearnedAt: last } : {}) };
    const rank = first && dayOf(first) === target ? 0 : last && dayOf(last) === target ? 1 : 2;
    return [{ item, rank, id: word.id, order: word.learnedOrder }];
  }).sort((a, b) => a.rank - b.rank || b.order - a.order).slice(0, 24).map(({ item, id }) => {
    // Resolve edges only for the 24 selected words, even in a large existing dictionary.
    const relatedWords = [...new Set(relations.flatMap((relation) => {
      if (relation.type !== 'RELATED_TO' || relation.status !== 'ACTIVE') return [];
      const other = byId.get(relation.subjectId === id ? relation.objectId : relation.objectId === id ? relation.subjectId : '');
      const learned = recordedDiaryTime(other?.learnedAt);
      return other && other.id !== id && (!learned || dayOf(learned) <= target) ? [other.surface] : [];
    }))].slice(0, 6);
    return { ...item, ...(relatedWords.length ? { relatedWords } : {}) };
  });
}
export function eligibleDiaryDay(day: DiaryDay, consent: PictureDiaryConsent, now = new Date()) {
  const yesterday = shiftMissionDate(missionDateKey(now), -1);
  return consent.enabled && Boolean(consent.since && day.diaryDate >= consent.since) && day.diaryDate === yesterday
    && diaryDate(day.startDate) && day.startDate <= day.diaryDate && day.diaryDate < shiftMissionDate(day.startDate, 30);
}
export function diaryImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try { const url = new URL(value, INFO_HUB_ORIGIN); return url.origin === INFO_HUB_ORIGIN && url.pathname === '/diary/image'
    && Boolean(url.searchParams.get('token')) && !url.username && !url.password && url.href.length <= 4096 ? url.href : null; } catch { return null; }
}
