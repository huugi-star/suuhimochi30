import { CATEGORY_LABELS, SUBCATEGORY_CHOICES } from './conversationData';
import { missionDateKey, shiftMissionDate } from './dailyMissions';
import { INFO_HUB_ORIGIN } from './externalTopics';
import { createDiaryAuth, DiaryAuthError } from './pictureDiaryAuth';
import { diaryDate, diaryImageUrl, recordedDiaryTime, type DiaryLearnedWord } from './pictureDiary';
import { sharedKnowledgeService } from './sharedKnowledgeServer';
import { safeSharedKeyword } from './sharedKnowledge';
import { COMMON_KNOWLEDGE_ENTRIES } from './commonKnowledgeData';

type Result = { status: string; imageUrl?: string; expiresAt?: string; http?: number };
const headers = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const privateLabels = new Set((SUBCATEGORY_CHOICES.PERSON ?? []).filter((row) => ['PERSON_1', 'PERSON_2', 'PERSON_3', 'PERSON_4'].includes(row.id)).map((row) => row.label));
// Bundled public/common words are already trusted and need not appear in the trend-derived shared catalog.
const commonWords = new Set(COMMON_KNOWLEDGE_ENTRIES.flatMap((entry) => [entry.word, ...(entry.aliases ?? [])]).filter(safeSharedKeyword));
/** Strict allowlist: neither free-form properties nor unknown/private words cross the Worker boundary. */
export function validateDiaryWords(value: unknown): DiaryLearnedWord[] | null {
  if (!Array.isArray(value) || value.length > 24) return null;
  const result: DiaryLearnedWord[] = [], seen = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== 'object' || Object.keys(item).some((key) => !['word', 'majorCategory', 'subCategory', 'firstLearnedAt', 'lastLearnedAt', 'relatedWords'].includes(key))) return null;
    const category = Object.entries(CATEGORY_LABELS).find(([id, label]) => id !== 'UNKNOWN' && label === item.majorCategory)?.[0] as keyof typeof CATEGORY_LABELS | undefined;
    if (!category || !safeSharedKeyword(item.word) || seen.has(item.word)) continue;
    const subCategory = (SUBCATEGORY_CHOICES[category] ?? []).find((row) => row.label === item.subCategory)?.label;
    if (item.subCategory !== undefined && !subCategory || category === 'PERSON' && subCategory && privateLabels.has(subCategory)) continue;
    if (item.firstLearnedAt !== undefined && !recordedDiaryTime(item.firstLearnedAt) || item.lastLearnedAt !== undefined && !recordedDiaryTime(item.lastLearnedAt)) return null;
    if (item.relatedWords !== undefined && (!Array.isArray(item.relatedWords) || item.relatedWords.length > 6 || !item.relatedWords.every(safeSharedKeyword))) return null;
    seen.add(item.word);
    result.push({ word: item.word, majorCategory: CATEGORY_LABELS[category], ...(subCategory ? { subCategory } : {}),
      ...(item.firstLearnedAt ? { firstLearnedAt: recordedDiaryTime(item.firstLearnedAt) } : {}), ...(item.lastLearnedAt ? { lastLearnedAt: recordedDiaryTime(item.lastLearnedAt) } : {}),
      ...(item.relatedWords ? { relatedWords: [...new Set<string>(item.relatedWords)] } : {}) });
  }
  return result;
}
export function createPictureDiaryService(options: { token: () => string | undefined; secret: () => string | undefined; fetcher?: typeof fetch; clock?: () => Date; dictionary?: () => Promise<{ keywords: string[] }> }) {
  const fetcher = options.fetcher ?? fetch, clock = options.clock ?? (() => new Date());
  const inFlight = new Map<string, Promise<Result>>();
  async function upstream(path: string, body?: unknown) {
    const token = options.token(); if (!token || token.length < 32) throw new Error('UNAVAILABLE');
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), path === '/diary/generate' ? 50000 : 8000);
    try {
      const response = await fetcher(`${INFO_HUB_ORIGIN}${path}`, { method: body ? 'POST' : 'GET', signal: controller.signal,
        cache: 'no-store', redirect: 'error', credentials: 'omit', headers: { authorization: `Bearer ${token}`, accept: 'application/json', ...(body ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const text = await response.text(); if (text.length > 100000) throw new Error('UNAVAILABLE');
      return { status: response.status, body: JSON.parse(text) as Record<string, unknown> };
    } finally { clearTimeout(timer); }
  }
  function imageResult(data: Record<string, unknown>, date: string): Result | null {
    const imageUrl = diaryImageUrl(data.imageUrl);
    return data.status === 'OK' && data.generated === true && data.date === date && imageUrl ? { status: 'GENERATED', imageUrl,
      ...(typeof data.expiresAt === 'string' && Number.isFinite(Date.parse(data.expiresAt)) ? { expiresAt: data.expiresAt } : {}) } : null;
  }
  return async function handle(request: Request): Promise<Response> {
    let result: Result;
    try {
      const text = await request.text(); if (text.length > 28000) return Response.json({ status: 'INVALID_REQUEST' }, { status: 400, headers });
      const input = JSON.parse(text);
      if (input?.consent !== true || Object.keys(input).some((key) => !['consent', 'credential', 'diaryDate', 'learnedWords', 'lookupOnly'].includes(key))) return Response.json({ status: 'INVALID_REQUEST' }, { status: 400, headers });
      const identity = createDiaryAuth(options.secret(), clock).verify(request, input.credential);
      const now = clock();
      if (!diaryDate(input.diaryDate) || input.diaryDate !== shiftMissionDate(missionDateKey(now), -1)
        || input.diaryDate < identity.startDate || input.diaryDate >= shiftMissionDate(identity.startDate, 30)) return Response.json({ status: 'ONLY_YESTERDAY_ALLOWED' }, { status: 400, headers });
      const words = validateDiaryWords(input.learnedWords); if (!words || input.lookupOnly !== undefined && typeof input.lookupOnly !== 'boolean') return Response.json({ status: 'INVALID_REQUEST' }, { status: 400, headers });
      if (!options.token() || options.token()!.length < 32) return Response.json({ status: 'UNAVAILABLE' }, { status: 503, headers });
      const date = input.diaryDate, key = `${identity.ownerId}:${identity.companionId}:${date}`;
      let pending = inFlight.get(key);
      if (!pending) {
        pending = (async (): Promise<Result> => {
          const query = new URLSearchParams({ ownerId: identity.ownerId, companionId: identity.companionId, diaryDate: date });
          const lookup = await upstream(`/diary/lookup?${query}`);
          const existing = imageResult(lookup.body, date); if (lookup.status === 200 && existing) return existing;
          if (lookup.status === 202) return { status: lookup.body.status === 'FAILED' ? 'FAILED' : 'GENERATING' };
          if (lookup.status !== 404 || lookup.body.status !== 'NOT_GENERATED') return { status: 'UNAVAILABLE', http: 503 };
          if (input.lookupOnly) return { status: 'FAILED' };
          if (words.length < 2) return { status: 'TWO_LEARNED_KEYWORDS_REQUIRED' };
          const allowed = new Set(commonWords);
          if (words.some((word) => !allowed.has(word.word) || word.relatedWords?.some((related) => !allowed.has(related)))) {
            for (const keyword of (await (options.dictionary ?? (() => sharedKnowledgeService.dictionary()))()).keywords) allowed.add(keyword);
          }
          const learnedWords = words.filter((word) => allowed.has(word.word)).map((word) => ({ ...word,
            ...(word.relatedWords ? { relatedWords: word.relatedWords.filter((related) => allowed.has(related)) } : {}) }));
          if (learnedWords.length < 2) return { status: 'TWO_LEARNED_KEYWORDS_REQUIRED' };
          const payload = { consent: true, ...identity, diaryDate: date, learnedWords };
          const plan = await upstream('/diary/plan', payload);
          if (plan.body.status === 'TWO_LEARNED_KEYWORDS_REQUIRED') return { status: 'TWO_LEARNED_KEYWORDS_REQUIRED' };
          if (plan.status !== 200 || plan.body.status !== 'PLAN_OK' || !Array.isArray(plan.body.selectedKeywords) || plan.body.selectedKeywords.length < 2
            || !plan.body.selectedKeywords.every((word) => learnedWords.some((row) => row.word === word))) return { status: 'UNAVAILABLE', http: 503 };
          const generated = await upstream('/diary/generate', payload);
          if (generated.body.status === 'TWO_LEARNED_KEYWORDS_REQUIRED') return { status: 'TWO_LEARNED_KEYWORDS_REQUIRED' };
          if (generated.status === 202) return { status: 'GENERATING' };
          return generated.status === 200 ? imageResult(generated.body, date) ?? { status: 'UNAVAILABLE', http: 503 } : { status: 'UNAVAILABLE', http: 503 };
        })().catch(() => ({ status: 'UNAVAILABLE', http: 503 }));
        inFlight.set(key, pending); void pending.finally(() => inFlight.delete(key));
      }
      result = await pending;
    } catch (error) {
      if (error instanceof DiaryAuthError) return Response.json({ status: error.code }, { status: error.code === 'AUTH_NOT_CONFIGURED' ? 503 : error.code === 'UNAUTHENTICATED' ? 401 : 403, headers });
      result = { status: 'UNAVAILABLE', http: 503 };
    }
    const { http, ...body } = result; return Response.json(body, { status: http ?? 200, headers });
  };
}
export const pictureDiaryService = createPictureDiaryService({ token: () => process.env.DIARY_API_TOKEN, secret: () => process.env.DIARY_SESSION_SECRET });
