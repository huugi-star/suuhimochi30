import { LEGACY_SUBCATEGORY_LABELS, SUBCATEGORY_CHOICES } from './conversationData';
import type { MemoryRelation, WordCategory, WordEntry } from './conversationTypes';
import { safeCitationUrl } from './externalSourceCitation';
import { externalTopicMentions as topicMentions, hasExternalWord } from './externalWordMatch';
import { sanitizeInfoHubFailure } from './infoHubFailure';

export type ExternalSource = 'google' | 'wikipedia' | 'youtube';
export type ExternalTopic = {
  id: string;
  source: ExternalSource;
  title: string;
  url: string;
  googleSearchUrl?: string | null;
  xSearchUrl?: string | null;
  articleUrl?: string | null;
  category: WordCategory;
  subcategory: string | null;
  updatedAt: string;
  publishedAt: string;
  dataDate?: string;
  relatedTerms?: string[];
};
export type ExternalSnapshot = {
  fetchedAt: string;
  expiresAt: string;
  topics: ExternalTopic[];
  diagnostics?: ExternalFeedDiagnostics;
  schemaVersion?: number;
};
export type ExternalInspection = {
  id: string; topicId?: string; title: string; source: ExternalSource | null; url: string | null;
  category: WordCategory | null; subcategory: string | null; fetchedAt: string; updatedAt: string | null;
  status: 'ACCEPTED' | 'STALE' | 'EXCLUDED' | 'INVALID';
  reason?: ExternalExclusionReason;
};
export type ExternalFeedReport = {
  endpoint: 'safe-trends' | 'safe-youtube'; fetchedAt: string; updatedAt: string | null;
  status: 'OK' | 'ERROR'; error: string | null; received: number;
  published?: Partial<Record<ExternalSource, number>>;
  sourceCounts?: Partial<Record<ExternalSource, number>>;
  stale?: boolean;
  lastSuccessAt?: string | null;
  upstreamStatus?: number; cloudflareCode?: number; rayId?: string; retryAt?: string;
};
export type ExternalExclusionReason = 'ACCEPTED' | 'STALE_FEED' | 'STALE_ITEM' | 'EXCLUDED' | 'INVALID_SOURCE' | 'INVALID_TITLE' | 'INVALID_CATEGORY' | 'INVALID_SUBCATEGORY' | 'INVALID_URL' | 'INVALID_ID' | 'LOW_CONFIDENCE' | 'DUPLICATE' | 'SOURCE_LIMIT';
export type ExternalFeedDiagnostics = { feeds: ExternalFeedReport[]; items: ExternalInspection[] };
export type ExternalMatch = {
  topic: ExternalTopic;
  wordId: string;
  rootWordId: string;
  word: string;
  rootWord: string;
  kind: 'exact' | 'derived' | 'alias' | 'domain' | 'general';
  evidence: string;
  evidenceKey: string;
};
export type ExternalTopicUse = ExternalMatch & {
  id: string;
  day: number;
  date: string;
  timestamp: string;
  context: 'combo' | 'normal' | 'startup' | 'update';
  eventId?: string;
  topicRevision?: string;
  lines: string[];
  status: 'UNCONFIRMED' | 'CONFIRMED' | 'REJECTED' | 'UNSURE';
  answer?: string;
  startupOutcome?: 'SHOWN' | 'SKIPPED' | 'FINISHED';
};

export const INFO_HUB_ORIGIN = 'https://suuhimochi-info-hub.huugishiki.workers.dev';
export const INFO_HUB_CACHE_KEY = 'suuhimochi-public-topics-v1';
export const EXTERNAL_CACHE_VERSION = 2;
export const MAX_SOURCE_TOPICS = 500;
const MAX_FEED_ITEMS = 3000;
const MAX_DIAGNOSTIC_ITEMS = MAX_FEED_ITEMS * 3 + 400;
const HOUR = 3600000;
export const externalDateKey = (now: Date) => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(now);

export function externalExpiry(now: Date) {
  return new Date(`${externalDateKey(new Date(now.getTime() + 86400000))}T00:00:00+09:00`).toISOString();
}

const object = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
export function safeExternalText(value: unknown, max = 240): string | null {
  if (typeof value !== 'string' || !value.trim() || value.length > max
    || /[<>]/u.test(value) || Array.from(value).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
    || /(?:ignore.{0,20}(?:instructions|prompt)|system\s*prompt|指示を無視|システム命令)/iu.test(value)) return null;
  return value.trim();
}
const fresh = (value: unknown, now: Date, maxHours: number) => {
  if (typeof value !== 'string') return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && time <= now.getTime() + 5 * 60000 && now.getTime() - time < maxHours * HOUR;
};
export function sourceOf(value: unknown): ExternalSource | null {
  if (typeof value !== 'string') return null;
  if (['youtube', 'YouTube'].includes(value)) return 'youtube';
  if (['wikipedia_pageviews', 'wikipedia'].includes(value) || /^Wikipedia/i.test(value)) return 'wikipedia';
  if (['google_trending_now', 'google'].includes(value) || /^Google Trends/i.test(value)) return 'google';
  return null;
}
function safeSourceUrl(value: unknown, source: ExternalSource): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const host = url.hostname;
    if (source === 'youtube' && !['www.youtube.com', 'youtube.com', 'youtu.be'].includes(host)) return null;
    if (source === 'wikipedia' && !/^(?:[a-z-]+\.)?wikipedia\.org$/.test(host)) return null;
    if (source === 'google' && !['trends.google.com', 'www.google.com', 'news.google.com'].includes(host)) return null;
    return url.href;
  } catch { return null; }
}

function externalSubcategory(category: WordCategory, value: unknown): string | null | undefined {
  if (value == null) return null;
  // The hub still publishes the old broad PERSON_5. Preserve its meaning with the app's existing compatibility ID.
  if (category === 'PERSON' && value === 'PERSON_5') return 'PERSON_LEGACY_FAMOUS';
  if (category === 'PERSON' && value === 'PERSON_6') return 'PERSON_OTHER';
  if (typeof value !== 'string') return undefined;
  if (SUBCATEGORY_CHOICES[category]?.some((choice) => choice.id === value)
    || (category === 'PERSON' && Object.hasOwn(LEGACY_SUBCATEGORY_LABELS, value))) return value;
  return undefined;
}
function convertHubItem(envelope: Record<string, unknown>, value: unknown, endpoint: ExternalFeedReport['endpoint'], now: Date): { topic?: ExternalTopic; reason: ExternalExclusionReason } {
    const item = object(value);
    const source = sourceOf(item?.source ?? envelope.source);
    if (!item || !source || (endpoint === 'safe-youtube') !== (source === 'youtube')) return { reason: 'INVALID_SOURCE' };
    if (envelope.enabled === false || envelope.published === false || item.blocked === true || item.published === false || item.enabled === false) return { reason: 'EXCLUDED' };
    const updatedAt = source === 'wikipedia' ? envelope.wikipediaUpdatedAt ?? envelope.updatedAt : envelope.updatedAt;
    if (envelope.stale === true || (source === 'google' && envelope.googleStale === true) || !fresh(updatedAt, now, 36)) return { reason: 'STALE_FEED' };
    if (item.stale === true) return { reason: 'STALE_ITEM' };
    const title = safeExternalText(item.title ?? item.keyword);
    const category = item.categoryId as WordCategory;
    if (!title) return { reason: 'INVALID_TITLE' };
    if (typeof category !== 'string' || !Object.hasOwn(SUBCATEGORY_CHOICES, category)) return { reason: 'INVALID_CATEGORY' };
    const subcategory = externalSubcategory(category, item.subcategoryId);
    // Broadly classified public trends are useful for exact-word matching. Do not invent a subcategory.
    if (subcategory === undefined || (subcategory === null && source === 'youtube')) return { reason: 'INVALID_SUBCATEGORY' };
    if (item.classificationConfidence === 'low') return { reason: 'LOW_CONFIDENCE' };
    const publishedAt = item.publishedAt ?? item.date ?? updatedAt;
    if (!fresh(publishedAt, now, source === 'youtube' ? 7 * 24 : 72)) return { reason: 'STALE_ITEM' };
    // v6.4 Google has no item URL. Use the published Google attribution page, not a made-up article.
    const url = safeSourceUrl((source === 'google' ? item.sourceUrl ?? item.url : item.url ?? item.sourceUrl)
      ?? (source === 'google' ? 'https://trends.google.com/trending?geo=JP' : undefined), source);
    const sourceId = safeExternalText(item.videoId ?? item.id ?? item.topicId ?? title, 240);
    if (!url) return { reason: 'INVALID_URL' };
    if (!sourceId || (source === 'youtube' && !/^[A-Za-z0-9_-]{11}$/.test(sourceId))) return { reason: 'INVALID_ID' };
    const related = Array.isArray(item.relatedTo ?? item.relatedTerms) ? (item.relatedTo ?? item.relatedTerms) as unknown[] : [];
    const relatedTerms = [...new Set(related.slice(0, 32).flatMap((term) => safeExternalText(term, 80) ? [safeExternalText(term, 80)!] : []))];
    const dataDate = typeof item.dataDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.dataDate) ? item.dataDate : undefined;
    return { topic: { id: `${source}:${sourceId}`, source, title, url, category, subcategory,
      ...(source === 'google' ? { googleSearchUrl: safeCitationUrl(item.googleSearchUrl), xSearchUrl: safeCitationUrl(item.xSearchUrl), articleUrl: safeCitationUrl(item.articleUrl) } : {}),
      updatedAt: new Date(updatedAt as string).toISOString(), publishedAt: new Date(publishedAt as string).toISOString(),
      ...(dataDate ? { dataDate } : {}), ...(relatedTerms.length ? { relatedTerms } : {}) }, reason: 'ACCEPTED' };
}

/** Bound by source after validation/deduplication, never by the combined feed's front page. */
export function normalizeHubFeed(payload: unknown, endpoint: ExternalFeedReport['endpoint'], now: Date): ExternalTopic[] {
  return convertHubFeed(payload, endpoint, now).topics;
}

export function readExternalSnapshot(value: unknown, now: Date): ExternalSnapshot | null {
  const data = object(value);
  if (!data || !fresh(data.fetchedAt, now, 24) || typeof data.expiresAt !== 'string'
    || Date.parse(data.expiresAt) <= now.getTime() || Date.parse(data.expiresAt) > Date.parse(externalExpiry(new Date(data.fetchedAt as string)))
    || !Array.isArray(data.topics)) return null;
  const counts = { google: 0, wikipedia: 0, youtube: 0 };
  const seen = new Set<string>();
  const topics = data.topics.slice(0, MAX_DIAGNOSTIC_ITEMS).flatMap((value): ExternalTopic[] => {
    const topic = object(value);
    if (!topic || !['google', 'wikipedia', 'youtube'].includes(topic.source as string)) return [];
    const source = topic.source as ExternalSource;
    const checked = normalizeHubFeed({ updatedAt: topic.updatedAt, source, items: [{ ...topic,
      categoryId: topic.category, subcategoryId: topic.subcategory,
      id: typeof topic.id === 'string' ? topic.id.slice(source.length + 1) : '',
      videoId: source === 'youtube' && typeof topic.id === 'string' ? topic.id.slice(8) : undefined,
    }] }, source === 'youtube' ? 'safe-youtube' : 'safe-trends', now);
    return checked.filter((entry) => {
      if (seen.has(entry.id) || counts[source] >= MAX_SOURCE_TOPICS) return false;
      seen.add(entry.id); counts[source]++; return true;
    });
  });
  const diagnostics = sanitizeExternalDiagnostics(data.diagnostics);
  return { fetchedAt: data.fetchedAt as string, expiresAt: data.expiresAt, topics: [...new Map(topics.map((topic) => [topic.id, topic])).values()],
    ...(diagnostics ? { diagnostics } : {}), ...(data.schemaVersion === EXTERNAL_CACHE_VERSION ? { schemaVersion: EXTERNAL_CACHE_VERSION } : {}) };
}

const isoDate = (value: unknown): string | null => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
const FEED_ERRORS = ['TIMEOUT', 'NETWORK', 'INVALID_JSON', 'INVALID_FEED', 'TOO_LARGE'];
/** Only bounded public diagnostic fields, never response bodies, headers or arbitrary error text. */
export function sanitizeExternalDiagnostics(value: unknown): ExternalFeedDiagnostics | undefined {
  const data = object(value);
  if (!data || !Array.isArray(data.feeds) || !Array.isArray(data.items)) return undefined;
  const feeds = data.feeds.slice(0, 2).flatMap((value): ExternalFeedReport[] => {
    const item = object(value);
    if (!item || !['safe-trends', 'safe-youtube'].includes(item.endpoint as string) || !isoDate(item.fetchedAt)
      || !['OK', 'ERROR'].includes(item.status as string)) return [];
    const error = typeof item.error === 'string' && (FEED_ERRORS.includes(item.error) || /^HTTP_\d{3}$/.test(item.error)) ? item.error : null;
    return [{ endpoint: item.endpoint as ExternalFeedReport['endpoint'], fetchedAt: isoDate(item.fetchedAt)!,
      updatedAt: isoDate(item.updatedAt), status: item.status as ExternalFeedReport['status'], error,
      ...sanitizeInfoHubFailure(item), received: boundedCount(item.received) ?? 0,
      published: sanitizeSourceCounts(item.published), sourceCounts: sanitizeSourceCounts(item.sourceCounts), stale: item.stale === true, lastSuccessAt: isoDate(item.lastSuccessAt) }];
  });
  const items = data.items.slice(0, MAX_DIAGNOSTIC_ITEMS).flatMap((value, index): ExternalInspection[] => {
    const item = object(value);
    if (!item || !isoDate(item.fetchedAt) || !['ACCEPTED', 'STALE', 'EXCLUDED', 'INVALID'].includes(item.status as string)) return [];
    const source = ['google', 'wikipedia', 'youtube'].includes(item.source as string) ? item.source as ExternalSource : null;
    const category = typeof item.category === 'string' && Object.hasOwn(SUBCATEGORY_CHOICES, item.category) ? item.category as WordCategory : null;
    const subcategory = category ? externalSubcategory(category, item.subcategory) ?? null : null;
    return [{ id: safeExternalText(item.id, 280) ?? `inspection:${index}`, title: safeExternalText(item.title) ?? '安全に表示できるタイトルなし',
      ...(safeExternalText(item.topicId, 260) ? { topicId: item.topicId as string } : {}), source,
      url: source ? safeSourceUrl(item.url, source) : null, category, subcategory,
      fetchedAt: isoDate(item.fetchedAt)!, updatedAt: isoDate(item.updatedAt), status: item.status as ExternalInspection['status'],
      ...(typeof item.reason === 'string' && Object.hasOwn(EXTERNAL_REASON_LABELS, item.reason) ? { reason: item.reason as ExternalExclusionReason } : {}) }];
  });
  return { feeds, items };
}

/** Inspect only the same public response already fetched for normal conversations. */
export const EXTERNAL_REASON_LABELS: Record<ExternalExclusionReason, string> = {
  ACCEPTED: '変換済み', STALE_FEED: 'フィード更新が古い・stale指定', STALE_ITEM: '話題の日付が古い・stale指定', EXCLUDED: '公開停止・除外指定',
  INVALID_SOURCE: '情報源ID不正', INVALID_TITLE: 'タイトル不正', INVALID_CATEGORY: '大カテゴリー不正', INVALID_SUBCATEGORY: '中カテゴリー不正',
  INVALID_URL: '出典URL不正・不足', INVALID_ID: '話題ID不正', LOW_CONFIDENCE: '分類確度が低い', DUPLICATE: '同じ情報源の重複話題', SOURCE_LIMIT: '情報源別上限',
};
const boundedCount = (value: unknown) => typeof value === 'number' && Number.isInteger(value) && value >= 0 ? Math.min(value, 1000000) : null;
function sanitizeSourceCounts(value: unknown): Partial<Record<ExternalSource, number>> {
  const data = object(value);
  return Object.fromEntries((['google', 'wikipedia', 'youtube'] as const).flatMap((source) => boundedCount(data?.[source]) !== null ? [[source, boundedCount(data?.[source])!]] : []));
}
function convertHubFeed(payload: unknown, endpoint: ExternalFeedReport['endpoint'], now: Date): { topics: ExternalTopic[]; diagnostics: ExternalFeedDiagnostics } {
  const envelope = object(payload);
  const inspected = { google: 0, wikipedia: 0, youtube: 0, unknown: 0 };
  // Even the safety bound is per source, so a long Google prefix cannot hide Wikipedia at the tail.
  const values = Array.isArray(envelope?.items) ? envelope.items.filter((value) => {
    const source = sourceOf(object(value)?.source ?? envelope.source);
    const group = source && ((endpoint === 'safe-youtube') === (source === 'youtube')) ? source : 'unknown';
    return ++inspected[group] <= (group === 'unknown' ? 200 : MAX_FEED_ITEMS);
  }) : [];
  const topics: ExternalTopic[] = [];
  const seen = new Set<string>();
  const sourceCounts = { google: 0, wikipedia: 0, youtube: 0 };
  const kept = { google: 0, wikipedia: 0, youtube: 0 };
  const items = values.map((value, index): ExternalInspection => {
    const item = object(value);
    const source = sourceOf(item?.source ?? envelope?.source);
    if (source) sourceCounts[source]++;
    const result = convertHubItem(envelope ?? {}, value, endpoint, now);
    const topic = result.topic;
    if (topic && seen.has(topic.id)) result.reason = 'DUPLICATE';
    else if (topic && kept[topic.source] >= MAX_SOURCE_TOPICS) result.reason = 'SOURCE_LIMIT';
    const accepted = result.reason === 'ACCEPTED' ? topic : undefined;
    if (accepted) { topics.push(accepted); seen.add(accepted.id); kept[accepted.source]++; }
    const updatedAt = source === 'wikipedia' ? envelope?.wikipediaUpdatedAt ?? envelope?.updatedAt : envelope?.updatedAt;
    const category = typeof item?.categoryId === 'string' && Object.hasOwn(SUBCATEGORY_CHOICES, item.categoryId) ? item.categoryId as WordCategory : null;
    return { id: `${endpoint}:${index}`, ...(accepted ? { topicId: accepted.id } : {}),
      title: safeExternalText(item?.title ?? item?.keyword) ?? '安全に表示できるタイトルなし', source,
      url: accepted?.url ?? (source ? safeSourceUrl(item?.url ?? item?.sourceUrl, source) : null), category,
      subcategory: category ? externalSubcategory(category, item?.subcategoryId) ?? null : null,
      fetchedAt: now.toISOString(), updatedAt: isoDate(updatedAt), status: accepted ? 'ACCEPTED' : result.reason.startsWith('STALE') ? 'STALE' : ['EXCLUDED', 'DUPLICATE', 'SOURCE_LIMIT'].includes(result.reason) ? 'EXCLUDED' : 'INVALID', reason: result.reason };
  });
  const published = sanitizeSourceCounts(envelope?.sourceCounts);
  if (endpoint === 'safe-youtube' && boundedCount(envelope?.count) !== null) published.youtube = boundedCount(envelope?.count)!;
  return { topics, diagnostics: { feeds: [{ endpoint, fetchedAt: now.toISOString(), updatedAt: isoDate(envelope?.updatedAt), received: values.length, published, sourceCounts, stale: envelope?.stale === true,
    status: envelope && Array.isArray(envelope.items) ? 'OK' : 'ERROR', error: envelope && Array.isArray(envelope.items) ? null : 'INVALID_FEED' }], items } };
}
export function inspectHubFeed(payload: unknown, endpoint: ExternalFeedReport['endpoint'], now: Date): ExternalFeedDiagnostics {
  return convertHubFeed(payload, endpoint, now).diagnostics;
}

const normalized = (text: string) => text.normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g,
  (char) => String.fromCharCode(char.charCodeAt(0) - 0x60)).replace(/[\s・･]/g, '');
const ALIASES = [
  ['マインクラフト', 'まいんくらふと', 'Minecraft', 'マイクラ', 'まいくら'],
  ['ポケットモンスター', 'ポケモン', 'ぽけもん', 'Pokémon', 'Pokemon'],
  ['YouTube', 'ユーチューブ', 'ゆーちゅーぶ'],
] as const;
const DOMAINS = [
  { words: ['ゲーム', 'げーむ'], subcategory: 'GAME_MEDIA_3', evidence: ['マインクラフト', 'マイクラ', 'Minecraft', 'ポケモン', 'ロブロックス', 'Roblox', 'League of Legends', 'パズドラ', 'ゲーム実況'] },
  { words: ['音楽', 'おんがく'], subcategory: 'AV_MEDIA_1', evidence: ['Music Video', 'MV', '歌', 'LIVE', 'Dance', '曲', '新曲', '演奏'] },
] as const;
const GENERIC = new Set(['ゲーム', 'げーむ', '音楽', 'おんがく', '本', '動画', '映画', 'ニュース', '自然', '人', '物'].map(normalized));

/** Matching is local: no words, graph edges or personal answers go upstream. */
export type ExternalMatchOptions = {
  topics: readonly ExternalTopic[]; words: readonly WordEntry[]; relations: readonly MemoryRelation[];
  readings?: Record<string, string>; history: readonly ExternalTopicUse[]; now: Date; day: number; parentWordId?: string;
  allowGeneral?: boolean;
};
export type ExternalAssessment = { topic: ExternalTopic; matches: ExternalMatch[]; previewMatch: ExternalMatch | null; candidate: boolean;
  state: 'STALE' | 'USED' | 'REJECTED' | 'NO_MATCH' | 'DAILY_LIMIT' | 'SELECTED' | 'LOWER_PRIORITY' };
export function evaluateExternalTopics(options: ExternalMatchOptions): { selected: ExternalMatch | null; assessments: ExternalAssessment[] } {
  const { words, history, now } = options;
  const parent = words.find((word) => word.id === options.parentWordId);
  const linked = new Set(parent ? [parent.id] : words.map((word) => word.id));
  if (parent) {
    // Follow only actual, non-rejected combo edges, including routes through existing words.
    for (let pass = 0; pass < words.length; pass++) {
      let changed = false;
      for (const relation of options.relations) {
        if (relation.type === 'RELATED_TO' && relation.status === 'ACTIVE' && linked.has(relation.subjectId)
          && words.some((word) => word.id === relation.objectId) && !linked.has(relation.objectId)) {
          linked.add(relation.objectId); changed = true;
        }
      }
      if (!changed) break;
    }
  }
  const used = (topic: ExternalTopic) => history.filter((use) => use.topic.id === topic.id || normalized(use.topic.title) === normalized(topic.title));
  const priority = { exact: 400, derived: 300, alias: 200, domain: 100, general: 0 };
  const recent = history.slice(-6);
  const sourceWeight = (source: ExternalSource) => recent.filter((use) => use.topic.source === source).length
    + (history.at(-1)?.topic.source === source ? 2 : 0);
  const rank = (a: ExternalMatch, b: ExternalMatch) => Number(Boolean(used(a.topic).length)) - Number(Boolean(used(b.topic).length))
    || priority[b.kind] - priority[a.kind] || sourceWeight(a.topic.source) - sourceWeight(b.topic.source)
    || Date.parse(b.topic.updatedAt) - Date.parse(a.topic.updatedAt) || a.topic.id.localeCompare(b.topic.id);
  const candidates: ExternalMatch[] = [];
  const assessments = options.topics.map((topic): ExternalAssessment => {
    const matches: ExternalMatch[] = [];
    const allowed: ExternalMatch[] = [];
    for (const word of words.filter((word) => linked.has(word.id))) {
      const root = parent ?? words.find((entry) => entry.id === word.rootWordId) ?? word;
      // Do not bypass a rejected route by proposing the same named subject via its broader root.
      const rejectedRoute = history.some((use) => use.status === 'REJECTED' && use.rootWordId === root.id && use.topic.source === topic.source
        && (topicMentions(topic, use.word) || ALIASES.some((group) => group.some((term) => normalized(term) === normalized(use.word))
          && group.some((term) => topicMentions(topic, term)))));
      let kind: ExternalMatch['kind'] | undefined;
      let evidence = '';
      const mentions = (term: string) => topicMentions(topic, term);
      if (!GENERIC.has(normalized(word.surface)) && [word.surface, options.readings?.[word.id] ?? ''].some(mentions)) {
        kind = word.firstDerivedFromWordId || (parent && word.id !== parent.id) ? 'derived' : 'exact';
        evidence = normalized(word.surface);
      } else {
        const alias = ALIASES.find((group) => group.some((term) => normalized(term) === normalized(word.surface)));
        if (alias?.some(mentions)) { kind = 'alias'; evidence = normalized(alias[0]); }
        else {
          const domain = DOMAINS.find((domain) => domain.words.some((term) => normalized(term) === normalized(word.surface))
            && word.subcategory === domain.subcategory && topic.subcategory === domain.subcategory
            && domain.evidence.some((term) => hasExternalWord(topic.title, term)));
          if (domain) { kind = 'domain'; evidence = domain.subcategory; }
        }
      }
      if (!kind) continue;
      const evidenceKey = `${word.id}:${topic.source}:${kind === 'domain' ? 'domain' : 'term'}:${evidence}`;
      const match = { topic, wordId: word.id, rootWordId: root.id, word: word.surface, rootWord: root.surface, kind, evidence, evidenceKey };
      matches.push(match);
      if (!rejectedRoute && !history.some((use) => use.status === 'REJECTED' && use.evidenceKey === evidenceKey)) allowed.push(match);
    }
    // Never bypass a correction by introducing the same topic as the companion's own interest.
    const rejected = matches.length > 0 && !allowed.length || used(topic).some((use) => use.status === 'REJECTED');
    if (options.allowGeneral && !matches.length && !rejected) {
      const general: ExternalMatch = { topic, wordId: '', rootWordId: '', word: '', rootWord: '', kind: 'general',
        evidence: '公開済みの安全な話題・すうひもち自身の関心（ユーザーとの一致なし）', evidenceKey: `public:${topic.id}` };
      matches.push(general); allowed.push(general);
    }
    const last = used(topic).at(-1);
    // Prefer a different topic. A lone remaining topic needs a longer, 48-hour quiet interval.
    const recentUse = last && now.getTime() - Date.parse(last.timestamp) < (history.at(-1)?.id === last.id ? 48 : 24) * HOUR;
    const state: ExternalAssessment['state'] = !fresh(topic.updatedAt, now, 36) || !fresh(topic.publishedAt, now, topic.source === 'youtube' ? 168 : 72) ? 'STALE'
      : rejected ? 'REJECTED' : recentUse ? 'USED' : !allowed.length ? 'NO_MATCH' : 'LOWER_PRIORITY';
    const candidate = state === 'LOWER_PRIORITY';
    if (candidate) candidates.push(...allowed);
    return { topic, matches: matches.sort(rank), previewMatch: allowed.sort(rank)[0] ?? null, candidate, state };
  });
  candidates.sort(rank);
  // Keep personal relevance first, but don't let a large feed monopolize every boot forever.
  // After two consecutive uses of one source, take the best eligible alternative once.
  const lastSources = history.slice(-2).map((use) => use.topic.source);
  const saturated = options.allowGeneral && lastSources.length === 2 && lastSources[0] === lastSources[1] ? lastSources[0] : null;
  const selected = (saturated ? candidates.find((match) => match.topic.source !== saturated) : null) ?? candidates[0] ?? null;
  if (selected) assessments.filter((item) => item.topic.id === selected.topic.id).forEach((item) => { item.state = 'SELECTED'; });
  return { selected, assessments };
}

/** Conversation selection and the developer monitor share exactly the same policy. */
export function selectExternalMatch(options: ExternalMatchOptions): ExternalMatch | null {
  return evaluateExternalTopics(options).selected;
}

/** Reactions describe the observed connection, never the video's unverified contents. */
export function externalDiscoveryLines(match: ExternalMatch, variation: number): string[] {
  const medium = { youtube: '動画の話題', google: '検索されている言葉', wikipedia: '読まれている記事' }[match.topic.source];
  if (match.kind === 'domain') return [
    `人間さんに教わった${match.word}の仲間を、外の${medium}でも見つけたの。`,
    '同じ仲間でも、人間さんがこれを好きかどうかは、まだ知らないの。',
    'ぼくも中身はまだ分からないけど、見に行く入口がひとつできたね。',
  ];
  if (match.wordId !== match.rootWordId) return [
    `教わった${match.rootWord}から、${match.word}につながったでしょ。`,
    `その先が、外の${medium}にも続いていたの。`,
    '人間さんに教わった道をたどったら、部屋の外まで来ちゃった。ちょっとびっくりなの。',
  ];
  if (match.kind === 'alias') return [
    `${match.word}に、別の呼び方でつながりそうな${medium}を見つけたの。`,
    '名前の書き方が違うと、ぼくは通り過ぎちゃいそうになるね。',
    'まだ中身までは分からないから、同じ話か、人間さんと確かめてみたいの。',
  ];
  return variation % 2 === 0 ? [
    `あれ。教えてくれた${match.word}が、外の${medium}にもあるの。`,
    'ぼくには、人間さんの声と一緒に覚えた言葉なのに。',
    '外にも入口があったんだね。この部屋が、少し広くなったみたいなの。',
  ] : [
    `外の${medium}を見ていて、${match.word}で目が止まったの。`,
    '教わっていなかったら、そのまま通り過ぎていたかもしれない。',
    '知ってる言葉がひとつあるだけで、見える景色って変わるんだね。',
  ];
}

/** History is not subject to feed expiry: it records what this companion actually said. */
export function sanitizeExternalHistory(value: unknown): ExternalTopicUse[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-600).filter((value): value is ExternalTopicUse => {
    const use = object(value); const topic = object(use?.topic);
    return Boolean(use && topic && typeof use.id === 'string' && typeof use.wordId === 'string'
      && typeof use.rootWordId === 'string' && typeof use.evidenceKey === 'string' && typeof use.evidence === 'string'
      && (use.kind === 'general' ? use.word === '' && use.rootWord === '' && use.wordId === '' && use.rootWordId === '' : safeExternalText(use.word, 30) && safeExternalText(use.rootWord, 30))
      && ['exact', 'derived', 'alias', 'domain', 'general'].includes(use.kind as string)
      && typeof use.day === 'number' && use.day >= 1 && use.day <= 30
      && typeof use.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(use.date)
      && typeof use.timestamp === 'string' && Number.isFinite(Date.parse(use.timestamp))
      && ['combo', 'normal', 'startup', 'update'].includes(use.context as string)
      && (use.eventId === undefined || typeof use.eventId === 'string')
      && (use.topicRevision === undefined || typeof use.topicRevision === 'string')
      && ['UNCONFIRMED', 'CONFIRMED', 'REJECTED', 'UNSURE'].includes(use.status as string)
      && Array.isArray(use.lines) && use.lines.every((line) => typeof line === 'string' && line.length <= 2400
        && line.split(/\r?\n/).every((part) => !part.trim() || safeExternalText(part, 2400)))
      && (use.answer === undefined || typeof use.answer === 'string')
      && (use.startupOutcome === undefined || ['SHOWN', 'SKIPPED', 'FINISHED'].includes(use.startupOutcome as string))
      && typeof topic.id === 'string' && safeExternalText(topic.title)
      && ['google', 'wikipedia', 'youtube'].includes(topic.source as string)
      && safeSourceUrl(topic.url, topic.source as ExternalSource));
  }).map((use) => ({ ...use, topic: { ...use.topic }, lines: [...use.lines] }));
}

/** Short observations, deliberately without a demand for an answer or claims about unseen content. */
export function startupDiscoveryLines(match: ExternalMatch, variation: number): string[] {
  const source = { youtube: '動画の紹介', google: '検索の話題', wikipedia: '記事の名前' }[match.topic.source];
  if (match.kind === 'general') {
    // Preserve a short, literal title excerpt. A shared placeholder made dozens of distinct videos
    // produce the same four scripts and exhaust the duplicate-text filter after only a few uses.
    const title = Array.from(match.topic.title);
    const label = `「${title.slice(0, 18).join('')}${title.length > 18 ? '…' : ''}」`;
    return [
      [`${source}に${label}があって、ぼく、目が止まったの。`, '名前だけでは、どんなものか分からないね。知らないことを、ひとつ見つけちゃった。'],
      [`${label}って、${source}で見かけた名前なの。`, '知ってる言葉と似ているかな、って考えたけど、まだ決められないの。並べて眺めるだけでも面白いね。'],
      [`ぼく、${source}の${label}が少し気になったの。`, '名前を見ただけで、詳しくなった気になりかけちゃった。中身はまだ知らないんだった。えへへ。'],
      [`${source}で${label}に出会ったよ。人間さんに教わった言葉とは、まだ道がつながっていないの。`, 'でも、ぼくが気になるものも、少しずつ増えていくんだね。'],
    ][variation % 4];
  }
  if (match.kind === 'alias') return variation % 2 === 0 ? [
    `${source}で、${match.word}の別の呼び方に目が止まったの。`,
    '最初は知らない名前かと思っちゃった。書き方が変わると、知ってる言葉もかくれんぼするね。',
  ] : [
    `${match.word}と別の書き方の名前を、${source}で見つけたよ。`,
    '見慣れない名前でも、前に教わった言葉へ戻る道があるのかな。ぼく、まだ中身は知らないんだけどね。',
  ];
  if (match.kind === 'domain') return variation % 2 === 0 ? [
    `教わった${match.word}の仲間を、${source}でも見かけたの。`,
    '同じ仲間でも、楽しみ方はいろいろありそう。ぼくはまだ、中身を知らないんだけどね。',
  ] : [
    `${match.word}って、名前を覚えたら、その仲間にも目が行くようになったの。`,
    `${source}にもひとつあったよ。人間さんの好きなものと同じかは、まだ分からないけどね。`,
  ];
  if (match.wordId !== match.rootWordId) return variation % 2 === 0 ? [
    `${match.rootWord}からつないだ${match.word}、${source}にもあったの。`,
    '別々に見えた言葉なのに、教わった道をたどると、ちゃんと途中で会えるんだね。',
  ] : [
    `${source}の${match.word}で、${match.rootWord}から言葉をつないだことを思い出したよ。`,
    'ひとつずつ教わった名前が、頭の中で小さな地図みたいになってきたの。まだ行ってない道もありそうだね。',
  ];
  return [
    [`${source}を眺めていたら、${match.word}にまた会ったの。`,
      '名前を知らない時は、たぶん通り過ぎていたよ。今日はちょっと、目が止まっちゃった。'],
    [`${match.word}、${source}にも名前が出ていたの。`,
      '人間さんと話した時のことを思い出したよ。同じ名前でも、まだ知らないところがあるんだね。'],
    [`${source}に${match.word}があって、ぼく、少し立ち止まったの。`,
      '知ってるつもりになりかけたけど、名前を知ってるのと、詳しいのは別だったね。えへへ。'],
    [`教えてもらった${match.word}を、${source}の中で見つけたよ。`,
      '前に聞いた言葉と、今見ているもの。頭の中で、そっと並べてみたくなったの。'],
  ][variation % 4];
}
