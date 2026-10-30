import type { StorageLike, WordEntry } from './conversationTypes';
import { dialogueToZoomPages } from './externalBriefs';

export const SHARED_PREFERENCE_KEY = 'suuhimochi-shared-knowledge-consent-v1';
export const SHARED_DICTIONARY_KEY = 'suuhimochi-shared-dictionary-v1';
export const SHARED_DIALOGUES_KEY = 'suuhimochi-shared-dialogues-v1';
export const SHARED_REFRESH_MS = 86400000;
export const SHARED_MIN_INTERVAL_MS = 30 * 60000;
export const SHARED_WORD_INTERVAL_MS = 86400000;
export const SHARED_REQUEST_LIMIT = 5;
export const SHARED_EXPLANATION = 'すうひもちが覚えた一般的な言葉をきっかけに、みんなの共有知識を使えるようにするの。人間さんとの日誌や、ふたりだけのお話は送らないの。';
export type SharedPreference = { version: 1; enabled: boolean; decided: boolean };
export type SharedDialogue = { id: string; keyword: string; dialogue: string; style: number; thoughtStyle: string; sourceUrl: string; attribution: string };
export type SharedUse = SharedDialogue & { wordId: string; timestamp: string; day: number; eventId: string; outcome: 'SHOWN' | 'SKIPPED' | 'FINISHED' };
export type SharedTalkPlan = { shared: true; item: SharedDialogue; wordId: string; eventId: string; trigger: 'startup' | 'update' | 'normal'; lines: string[] };
export type SharedDictionary = { fetchedAt: string; keywords: string[] };
export type SharedDialogueCache = { keyword: string; fetchedAt: string; items: SharedDialogue[] };
export const object = (value: unknown): Record<string, unknown> | null => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
export function readSharedPreference(storage: StorageLike): SharedPreference {
  try { const value = JSON.parse(storage.getItem(SHARED_PREFERENCE_KEY) ?? 'null');
    if (value?.version === 1 && value.decided === true && typeof value.enabled === 'boolean') return { version: 1, enabled: value.enabled, decided: true };
  } catch { /* Fail closed. */ }
  return { version: 1, enabled: false, decided: false };
}
export function writeSharedPreference(storage: StorageLike, enabled: boolean): SharedPreference {
  const value: SharedPreference = { version: 1, enabled, decided: true };
  // If the decision cannot be saved, do not enable sharing for this session either.
  try { storage.setItem(SHARED_PREFERENCE_KEY, JSON.stringify(value)); return value; }
  catch { return { version: 1, enabled: false, decided: false }; }
}
const BLOCKED = /淫夢|真夏の夜のいんむ|野獣先輩|やじゅうせんぱい|例のアレ|ホモビ|114514|ナチ(?:ス|ズム|党)|ねおなち|ネオナチ|nazi|nsdap|国家社会主義|国民社会主義|ヒトラー|hitler|ハーケンクロイツ|鉤十字|ホロコースト|holocaust|アウシュビッツ|auschwitz|ゲシュタポ|gestapo|ゲッベルス|ヒムラー|ムッソリーニ|ファシズム|fascism|白人至上主義|whitesupremac|クークラックスクラン|kukluxklan|ジェノサイド|genocide|民族浄化|過激派|極端主義|テロ組織|ポルノ|アダルト|レイプ|強姦|殺人|殺害|遺体|虐待|拷問|自殺/iu;
export function safeSharedText(value: unknown, max: number): value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[<>]/u.test(value)
    || Array.from(value).some((char) => (char.charCodeAt(0) < 32 && ![9, 10, 13].includes(char.charCodeAt(0))) || char.charCodeAt(0) === 127)
    || /ignore.{0,20}(?:instructions|prompt)|system\s*prompt|指示を無視|システム命令/iu.test(value)) return false;
  return !BLOCKED.test(value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''));
}
export function safeSharedKeyword(value: unknown): value is string {
  return safeSharedText(value, 35) && value.length >= 2 && value === value.trim() && !/[\r\n\t?#=;&@]/u.test(value)
    && !/https?:|www\.|[0-9０-９]{5,}|電話|住所|メール|パスワード|暗証|口座|保険証|免許証|マイナンバー|生年月日|学籍|勤務先|実家|持病|病歴|診断名/iu.test(value)
    && /\p{L}/u.test(value) && !/(?:は|が|って).{0,18}(?:浮気者|裏切り者|詐欺師|犯罪者|死ね|嫌い|クズ|無能)/u.test(value);
}
export function safeWikipediaUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !url.port
    && /^[a-z-]+\.wikipedia\.org$/.test(url.hostname) && url.pathname.startsWith('/wiki/') && !/[/](?:Special|特別):/iu.test(decodeURIComponent(url.pathname)); }
  catch { return false; }
}
export function sharedDialogueId(keyword: string, style: number, text: string) {
  // Identity is independent of fetch time and the Worker's row timestamps.
  let hash = 2166136261; for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return `shared:${keyword}:${style}:${(hash >>> 0).toString(36)}`;
}
export function parseSharedDialogues(raw: unknown, keyword: string): SharedDialogue[] {
  const data = object(raw);
  if (!safeSharedKeyword(keyword) || data?.status !== 'OK' || data.keyword !== keyword || !Array.isArray(data.items)) return [];
  const styles = new Set<number>(); const texts = new Set<string>(); const items: SharedDialogue[] = [];
  for (const value of data.items.slice(0, 6)) {
    const row = object(value); if (!row) continue;
    const { dialogue, style, thoughtStyle, sourceUrl, attribution } = row;
    if (!Number.isInteger(style) || (style as number) < 0 || (style as number) > 5 || styles.has(style as number)
      || !safeSharedText(dialogue, 2400) || !safeSharedText(thoughtStyle, 80) || !safeWikipediaUrl(sourceUrl)
      || !safeSharedText(attribution, 300) || texts.has(dialogue)) continue;
    styles.add(style as number); texts.add(dialogue);
    items.push({ id: sharedDialogueId(keyword, style as number, dialogue), keyword, dialogue, style: style as number, thoughtStyle, sourceUrl, attribution });
  }
  return items;
}
export function readSharedDictionary(storage: StorageLike): SharedDictionary | null {
  try { const raw = JSON.parse(storage.getItem(SHARED_DICTIONARY_KEY) ?? 'null');
    if (!Number.isFinite(Date.parse(raw?.fetchedAt)) || !Array.isArray(raw?.keywords) || raw.keywords.length > 50200 || !raw.keywords.every(safeSharedKeyword)) return null;
    return { fetchedAt: raw.fetchedAt, keywords: [...new Set<string>(raw.keywords)] };
  } catch { return null; }
}
export function readSharedDialogueCaches(storage: StorageLike): SharedDialogueCache[] {
  try { const raw: unknown = JSON.parse(storage.getItem(SHARED_DIALOGUES_KEY) ?? '[]'); if (!Array.isArray(raw)) return [];
    return raw.slice(-100).flatMap((value) => {
      const row = object(value); if (!row || !safeSharedKeyword(row.keyword) || typeof row.fetchedAt !== 'string' || !Number.isFinite(Date.parse(row.fetchedAt))) return [];
      return [{ keyword: row.keyword, fetchedAt: row.fetchedAt, items: parseSharedDialogues({ status: 'OK', keyword: row.keyword, items: row.items }, row.keyword) }];
    });
  } catch { return []; }
}
export function sanitizeSharedHistory(raw: unknown): SharedUse[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(-600).flatMap((value) => {
    const row = object(value); if (!row || typeof row.wordId !== 'string' || typeof row.eventId !== 'string' || typeof row.timestamp !== 'string'
      || !Number.isFinite(Date.parse(row.timestamp)) || typeof row.day !== 'number' || row.day < 1 || row.day > 30 || !['SHOWN', 'SKIPPED', 'FINISHED'].includes(String(row.outcome)) || !safeSharedKeyword(row.keyword)) return [];
    const item = parseSharedDialogues({ status: 'OK', keyword: row.keyword, items: [row] }, row.keyword)[0];
    return item ? [{ ...item, wordId: row.wordId, eventId: row.eventId, timestamp: row.timestamp, day: row.day, outcome: row.outcome as SharedUse['outcome'] }] : [];
  });
}
export function selectSharedDialogue(items: readonly SharedDialogue[], words: readonly WordEntry[], history: readonly SharedUse[], now: Date) {
  const last = history.at(-1);
  if (last && now.getTime() - Date.parse(last.timestamp) < SHARED_MIN_INTERVAL_MS) return null;
  const allowedSurfaces = new Set(sharedCandidateSurfaces(words));
  for (const item of items) {
    if (!allowedSurfaces.has(item.keyword)) continue;
    const word = words.find((word) => word.surface === item.keyword);
    if (!word || history.some((use) => use.id === item.id || use.dialogue === item.dialogue
      || (use.keyword === item.keyword && now.getTime() - Date.parse(use.timestamp) < SHARED_WORD_INTERVAL_MS))) continue;
    return { item, wordId: word.id, lines: dialogueToZoomPages(item.dialogue) };
  }
  return null;
}

/** Personal categories are an additional veto, NEVER positive evidence of public eligibility. */
export function sharedCandidateSurfaces(words: readonly WordEntry[], profileNames: readonly string[] = []) {
  const privateNames = new Set([...profileNames.filter(Boolean), ...words.filter((word) => word.category === 'PERSON'
    && ['PERSON_1', 'PERSON_2', 'PERSON_3', 'PERSON_4'].includes(word.subcategory ?? '')).map((word) => word.surface)]);
  return [...new Set(words.filter((word) => !privateNames.has(word.surface)).map((word) => word.surface))];
}
