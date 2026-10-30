import { diaryDate, diaryImageUrl, eligibleDiaryDay, PICTURE_DIARY_DATA_KEY, type DiaryDay, type PictureDiaryConsent } from './pictureDiary';
import type { StorageLike } from './conversationTypes';
import { missionDateKey } from './dailyMissions';
import { defaultPictureDiaryForDay, diaryCycleDayNumber, isDefaultPictureDiaryUrl } from './pictureDiaryDefaults';

export type PictureDiaryStatus = 'CHECKING' | 'GENERATING' | 'GENERATED' | 'INSUFFICIENT' | 'FAILED' | 'UNAVAILABLE' | 'DEFAULT';
export type PictureDiaryRecord = { localCompanionId: string; diaryDate: string; status: PictureDiaryStatus; source?: 'DEFAULT' | 'CLOUDFLARE'; dayNumber?: number; attemptedOn: string; imageUrl?: string; expiresAt?: string };
type Store = { days: DiaryDay[]; records: PictureDiaryRecord[]; credentials: Record<string, string> };
export const diaryBindingKey = (day: Pick<DiaryDay, 'localCompanionId' | 'startDate'>) => `${day.localCompanionId}:${day.startDate}`;
const empty = (): Store => ({ days: [], records: [], credentials: {} });
export function readPictureDiaryStore(storage: StorageLike): Store {
  try {
    const data = JSON.parse(storage.getItem(PICTURE_DIARY_DATA_KEY) ?? 'null'); if (!data || typeof data !== 'object') return empty();
    const days = Array.isArray(data.days) ? data.days.slice(-64).flatMap((day: DiaryDay) => day && typeof day.localCompanionId === 'string' && diaryDate(day.startDate) && diaryDate(day.diaryDate) && Array.isArray(day.learnedWords) && day.learnedWords.length <= 24 ? [{ ...day, ...(Number.isInteger(day.conversationCount) && (day.conversationCount ?? -1) >= 0 && (day.conversationCount ?? 10001) <= 10000 ? { conversationCount: day.conversationCount } : {}) }] : []) : [];
    const records: PictureDiaryRecord[] = Array.isArray(data.records) ? data.records.slice(-360).flatMap((row: PictureDiaryRecord) => {
      if (!row || typeof row.localCompanionId !== 'string' || !diaryDate(row.diaryDate) || !diaryDate(row.attemptedOn)
        || !['CHECKING', 'GENERATING', 'GENERATED', 'INSUFFICIENT', 'FAILED', 'UNAVAILABLE', 'DEFAULT'].includes(row.status)) return [];
      const imageUrl = row.status === 'DEFAULT' ? isDefaultPictureDiaryUrl(row.imageUrl) ? row.imageUrl : null : diaryImageUrl(row.imageUrl); if (['GENERATED', 'DEFAULT'].includes(row.status) && !imageUrl) return [];
      return [{ localCompanionId: row.localCompanionId, diaryDate: row.diaryDate, attemptedOn: row.attemptedOn, status: row.status, ...(row.status === 'DEFAULT' ? { source: 'DEFAULT' as const, ...(typeof row.dayNumber === 'number' && Number.isInteger(row.dayNumber) && row.dayNumber >= 1 && row.dayNumber <= 30 ? { dayNumber: row.dayNumber } : {}) } : { source: 'CLOUDFLARE' as const }),
        ...(imageUrl ? { imageUrl } : {}), ...(typeof row.expiresAt === 'string' && Number.isFinite(Date.parse(row.expiresAt)) ? { expiresAt: row.expiresAt } : {}) }];
    }) : [];
    const credentials = data.credentials && typeof data.credentials === 'object' ? Object.fromEntries(Object.entries(data.credentials).slice(-64).filter(([, value]) => typeof value === 'string' && value.length < 4096)) as Record<string, string> : {};
    return { days, records, credentials };
  } catch { return empty(); }
}
function write(storage: StorageLike, store: Store) { try { storage.setItem(PICTURE_DIARY_DATA_KEY, JSON.stringify(store)); return true; } catch { return false; } }
export function rememberDiaryDays(storage: StorageLike, days: readonly DiaryDay[]) {
  if (!days.length) return true;
  const store = readPictureDiaryStore(storage), before = JSON.stringify(store.days);
  for (const day of days) {
    if (!diaryDate(day.startDate) || !diaryDate(day.diaryDate) || !Array.isArray(day.learnedWords) || day.learnedWords.length > 24) continue;
    store.days = [...store.days.filter((row) => row.localCompanionId !== day.localCompanionId || row.diaryDate !== day.diaryDate), day];
  }
  store.days = store.days.sort((a, b) => a.diaryDate.localeCompare(b.diaryDate)).slice(-64);
  return JSON.stringify(store.days) === before ? true : write(storage, store);
}
export function rememberDiaryDay(storage: StorageLike, day: DiaryDay) { return rememberDiaryDays(storage, [day]); }

export function saveDefaultDiaryRecord(storage: StorageLike, input: { localCompanionId: string; startDate: string; diaryDate: string; attemptedOn: string }) {
  const dayNumber = diaryCycleDayNumber(input.startDate, input.diaryDate), fallback = dayNumber ? defaultPictureDiaryForDay(dayNumber) : null;
  if (!fallback || !diaryDate(input.attemptedOn)) return null;
  const store = readPictureDiaryStore(storage), old = store.records.find((row) => row.localCompanionId === input.localCompanionId && row.diaryDate === input.diaryDate);
  if (old && ['GENERATED', 'DEFAULT', 'CHECKING', 'GENERATING', 'FAILED', 'UNAVAILABLE'].includes(old.status)) return old;
  const record: PictureDiaryRecord = { localCompanionId: input.localCompanionId, diaryDate: input.diaryDate, attemptedOn: input.attemptedOn, status: 'DEFAULT', source: 'DEFAULT', dayNumber: dayNumber ?? undefined, imageUrl: fallback.imageUrl };
  store.records = [...store.records.filter((row) => row.localCompanionId !== record.localCompanionId || row.diaryDate !== record.diaryDate), record].slice(-360);
  return write(storage, store) ? record : null;
}
function shiftDate(value: string, days = 1) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}
/** Fill past days locally; only explicitly eligible dates may wait for Cloudflare. */
export function ensureDefaultDiaryRecords(storage: StorageLike, input: { localCompanionId: string; startDate: string; today: string; attemptedOn: string; awaitingCloudflareDates?: readonly string[] }) {
  if (!diaryDate(input.startDate) || !diaryDate(input.today) || input.startDate > input.today || !diaryDate(input.attemptedOn)) return [];
  const awaiting = new Set(input.awaitingCloudflareDates ?? []), records: PictureDiaryRecord[] = [];
  const finalDay = shiftDate(input.startDate, 29);
  for (let date = input.startDate; date < input.today && date <= finalDay; date = shiftDate(date)) {
    if (awaiting.has(date)) continue;
    const record = saveDefaultDiaryRecord(storage, { localCompanionId: input.localCompanionId, startDate: input.startDate, diaryDate: date, attemptedOn: input.attemptedOn });
    if (record) records.push(record);
  }
  return records;
}
export function saveDiaryRecord(storage: StorageLike, record: PictureDiaryRecord) {
  const store = readPictureDiaryStore(storage);
  const existing = store.records.find((row) => row.localCompanionId === record.localCompanionId && row.diaryDate === record.diaryDate);
  if (existing?.status === 'GENERATED' && record.status !== 'GENERATED') return true;
  store.records = [...store.records.filter((row) => row.localCompanionId !== record.localCompanionId || row.diaryDate !== record.diaryDate), record].slice(-360);
  return write(storage, store);
}
const pending = new WeakMap<StorageLike, Promise<PictureDiaryRecord | null>>();
/** Call once per actual startup. The server always looks up first; interrupted attempts are lookup-only. */
export function runPictureDiaryStartup(storage: StorageLike, consent: PictureDiaryConsent, fetcher: typeof fetch = fetch, now = new Date(), signal?: AbortSignal): Promise<PictureDiaryRecord | null> {
  if (!consent.enabled) return Promise.resolve(null);
  const active = pending.get(storage); if (active) return active;
  const store = readPictureDiaryStore(storage);
  // A same-day handover can contain the former child's Day30 and the new child's Day1.
  // At most two actual yesterday snapshots; never iterate old days or generate unattended.
  const days = store.days.filter((day) => eligibleDiaryDay(day, consent, now) && (day.conversationCount ?? 0) > 0 && day.learnedWords.length >= 2).sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, 2);
  if (!days.length) return Promise.resolve(null);
  const task = (async () => {
    let result: PictureDiaryRecord | null = null;
    for (const day of days) { if (signal?.aborted) break; result = await runOneDiaryDay(storage, day, fetcher, now, signal); }
    return result;
  })();
  pending.set(storage, task); void task.finally(() => pending.delete(storage)); return task;
}
function runOneDiaryDay(storage: StorageLike, day: DiaryDay, fetcher: typeof fetch, now: Date, signal?: AbortSignal): Promise<PictureDiaryRecord | null> {
  const store = readPictureDiaryStore(storage);
  const previous = store.records.find((row) => row.localCompanionId === day.localCompanionId && row.diaryDate === day.diaryDate);
  if (previous?.status === 'GENERATED' || previous?.status === 'INSUFFICIENT') return Promise.resolve(previous);
  const record: PictureDiaryRecord = { localCompanionId: day.localCompanionId, diaryDate: day.diaryDate, status: 'CHECKING', attemptedOn: missionDateKey(now) };
  // Write before I/O: a reload of an interrupted attempt may look up, but must never create twice.
  if (!saveDiaryRecord(storage, record)) return Promise.resolve({ ...record, status: 'UNAVAILABLE' });
  const task = (async () => {
    const controller = new AbortController(), abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true }); if (signal?.aborted) controller.abort();
    const timer = setTimeout(abort, 90000);
    try {
      const request = async (url: string, body: unknown) => {
        const response = await fetcher(url, { method: 'POST', credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
          headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
        const raw = await response.json(); if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('DIARY_UNAVAILABLE');
        const data = raw as Record<string, unknown>;
        if (!response.ok && !['TWO_LEARNED_KEYWORDS_REQUIRED', 'UNAVAILABLE', 'GENERATING'].includes(String(data.status))) throw new Error('DIARY_UNAVAILABLE'); return data;
      };
      const binding = diaryBindingKey(day);
      // The HttpOnly cookie, not a localStorage credential, decides the current anonymous owner.
      const session = await request('/api/picture-diary/session', { consent: true, localCompanionId: day.localCompanionId, startDate: day.startDate });
      if (typeof session.credential !== 'string') throw new Error('DIARY_UNAVAILABLE');
      const credential = session.credential, latest = readPictureDiaryStore(storage); latest.credentials[binding] = credential; write(storage, latest);
      const result = await request('/api/picture-diary', { consent: true, credential, diaryDate: day.diaryDate, lookupOnly: Boolean(previous && previous.status !== 'DEFAULT'), learnedWords: previous && previous.status !== 'DEFAULT' ? [] : day.learnedWords });
      if (controller.signal.aborted) return null;
      const imageUrl = diaryImageUrl(result.imageUrl);
      if (imageUrl) { record.status = 'GENERATED'; record.source = 'CLOUDFLARE'; record.imageUrl = imageUrl; }
      else if (result.status === 'TWO_LEARNED_KEYWORDS_REQUIRED') {
        return saveDefaultDiaryRecord(storage, { localCompanionId: day.localCompanionId, startDate: day.startDate, diaryDate: day.diaryDate, attemptedOn: record.attemptedOn });
      } else record.status = result.status === 'GENERATING' ? 'GENERATING' : result.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'FAILED';
      if (typeof result.expiresAt === 'string' && Number.isFinite(Date.parse(result.expiresAt))) record.expiresAt = result.expiresAt;
    } catch { if (controller.signal.aborted && signal?.aborted) return null; record.status = 'UNAVAILABLE'; }
    finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
    saveDiaryRecord(storage, record); return record;
  })();
  return task;
}
