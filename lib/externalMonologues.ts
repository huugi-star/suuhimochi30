import type { StorageLike } from './conversationTypes';
import type { SuuhimochiConversation } from './wordMemory';
import { normalizeHubFeed, sourceOf, startupDiscoveryLines, type ExternalMatch, type ExternalTopic } from './externalTopics';
import { completedBriefText, type ExternalBriefFeed } from './externalBriefs';
import { freshBriefFeed } from './externalBriefClient';
import { safeSharedText, type SharedTalkPlan } from './sharedKnowledge';
import { readWeatherSelection, readWeatherCache, weatherMonologue, type WeatherSelection } from './weather';
import { externalCitation, safeCitationUrl, type ExternalCitation } from './externalSourceCitation';

export const MONOLOGUE_HISTORY_KEY = 'suuhimochi-external-monologues-v1';
export const MONOLOGUE_EVENT_TTL = 120000;
export const MONOLOGUE_IDLE_MS = 2500;
export const MONOLOGUE_COOLDOWN_MS = 30000;
export const MONOLOGUE_STATUS_KEY = 'suuhimochi-external-monologue-status-v1';
export type MonologueEvent = { id: string; trigger: 'startup' | 'update'; at: number };
export type MonologueStatus = { eventId: string; trigger: 'startup' | 'update'; timestamp: string; day: number;
  state: 'FETCHING' | 'WAITING' | 'NO_CANDIDATE' | 'DISPLAY_RETRY' | 'SHOWN' | 'EXPIRED' | 'ERROR'; reason: string; candidates?: number };
export function readMonologueStatus(storage: StorageLike): MonologueStatus | null {
  try {
    const value = JSON.parse(storage.getItem(MONOLOGUE_STATUS_KEY) ?? 'null');
    return value && typeof value.eventId === 'string' && ['startup', 'update'].includes(value.trigger)
      && Number.isFinite(Date.parse(value.timestamp)) && Number.isInteger(value.day)
      && ['FETCHING', 'WAITING', 'NO_CANDIDATE', 'DISPLAY_RETRY', 'SHOWN', 'EXPIRED', 'ERROR'].includes(value.state)
      && safeSharedText(value.reason, 300) ? value : null;
  } catch { return null; }
}
export function writeMonologueStatus(storage: StorageLike, value: MonologueStatus) {
  const previous = readMonologueStatus(storage);
  if (previous?.eventId === value.eventId && previous.state === value.state && previous.reason === value.reason && previous.candidates === value.candidates) return;
  try { storage.setItem(MONOLOGUE_STATUS_KEY, JSON.stringify(value)); } catch { /* Optional diagnostics, never game state. */ }
}
export type MonologueCandidate = {
  id: string; source: 'google' | 'wikipedia' | 'youtube' | 'shared' | 'weather'; text: string;
  score: number; completed: boolean; match?: ExternalMatch; shared?: SharedTalkPlan; weather?: WeatherSelection;
  citation?: ExternalCitation;
};
export type MonologueUse = { individual: string; eventId: string; trigger: 'startup' | 'update'; id: string;
  source: MonologueCandidate['source']; text: string; timestamp: string };
export function readMonologueHistory(storage: StorageLike): MonologueUse[] {
  try {
    const rows: unknown = JSON.parse(storage.getItem(MONOLOGUE_HISTORY_KEY) ?? '[]');
    return Array.isArray(rows) ? rows.slice(-600).filter((row): row is MonologueUse => row && typeof row.individual === 'string'
      && typeof row.eventId === 'string' && typeof row.id === 'string' && ['startup', 'update'].includes(row.trigger)
      && ['google', 'wikipedia', 'youtube', 'shared', 'weather'].includes(row.source) && safeSharedText(row.text, 2400)
      && Number.isFinite(Date.parse(row.timestamp))) : [];
  } catch { return []; }
}
export function recordMonologue(storage: StorageLike, use: MonologueUse) {
  try { storage.setItem(MONOLOGUE_HISTORY_KEY, JSON.stringify([...readMonologueHistory(storage), use].slice(-600))); } catch { /* Optional history. */ }
}
export function selectMonologue(candidates: MonologueCandidate[], history: MonologueUse[], now = new Date()): MonologueCandidate | null {
  const last = history.at(-1), recent = history.slice(-6);
  const eligible = eligibleMonologues(candidates, history, now);
  const weight = (card: MonologueCandidate) => card.score + (card.completed ? 40 : 0)
    - recent.filter((use) => use.source === card.source).length * 8 - (last?.source === card.source ? 15 : 0);
  eligible.sort((a, b) => weight(b) - weight(a) || a.id.localeCompare(b.id));
  const saturated = history.length >= 2 && history.at(-2)?.source === last?.source ? last?.source : null;
  return (saturated ? eligible.find((card) => card.source !== saturated) : null) ?? eligible[0] ?? null;
}
/** The monitor and the display use the same final duplicate-text/topic policy. */
export function eligibleMonologues(candidates: MonologueCandidate[], history: MonologueUse[], now = new Date()) {
  const last = history.at(-1);
  return candidates.filter((card) => safeSharedText(card.text, 2400) && !history.some((use) =>
    (use.id === card.id || use.text === card.text) && (use === last || now.getTime() - Date.parse(use.timestamp) < 24 * 3600000)));
}

/** Reuse the engine's exact/derived/alias/rejected-route assessments. No new semantic inference. */
export function monologueCandidates(talk: SuuhimochiConversation, storage: StorageLike, feed: ExternalBriefFeed | null,
  topics: ExternalTopic[], now = new Date(), event?: MonologueEvent): MonologueCandidate[] {
  const completed = new Map<string, string>(); const citations = new Map<string, ExternalCitation>();
  const merged = new Map(topics.map((topic) => [topic.id, topic]));
  if (feed && freshBriefFeed(feed, now)) for (const card of feed.items) {
    const source = sourceOf(card.source); if (!source) continue;
    const rawId = card.id.replace(new RegExp(`^${source}:`), '');
    const rows = normalizeHubFeed({ updatedAt: feed.updatedAt, items: [{ ...card, id: rawId,
      ...(source === 'youtube' ? { videoId: rawId } : {}), publishedAt: card.publishedAt ?? card.observedAt ?? feed.updatedAt }] },
      source === 'youtube' ? 'safe-youtube' : 'safe-trends', now);
    const topic = rows[0]; if (!topic) continue;
    merged.set(topic.id, topic);
    citations.set(topic.id, source === 'google' ? externalCitation(source, card.title, card.sourceUrl, card)
      : externalCitation(source, card.title, safeCitationUrl(card.articleUrl) ?? topic.url));
    const script = completedBriefText(card.aiDialogue), age = now.getTime() - Date.parse(card.aiGeneratedAt ?? '');
    const jstDate = (date: Date) => new Date(date.getTime() + 9 * 3600000).toISOString().slice(0, 10);
    const relativeDateValid = !script || !/今日|明日|きょう|あした/.test(script)
      || Number.isFinite(age) && jstDate(new Date(card.aiGeneratedAt!)) === jstDate(now);
    if (script && safeSharedText(script, 2400) && card.aiDialogueVersion === 2 && /gemma/i.test(card.aiModel ?? '')
      && relativeDateValid && age >= -300000 && age < 36 * 3600000) completed.set(topic.id, script);
  }
  const ranks = { exact: 400, derived: 300, alias: 200, domain: 100, general: 0 };
  const rows: MonologueCandidate[] = talk.inspectExternalTopics([...merged.values()]).assessments.flatMap((row) => {
    if (!row.candidate || !row.previewMatch || !safeSharedText(row.topic.title, 240)) return [];
    const script = completed.get(row.topic.id);
    return [{ id: row.topic.id, source: row.topic.source, text: script ?? startupDiscoveryLines(row.previewMatch, talk.getExternalTopicHistory().length).join('\n'),
      score: ranks[row.previewMatch.kind], completed: Boolean(script), match: row.previewMatch,
      citation: citations.get(row.topic.id) ?? externalCitation(row.topic.source, row.topic.title, row.topic.url, row.topic) }];
  });
  // Autonomous plans require a stable event ID; a millisecond-based normal plan can change before commit.
  const shared = event ? talk.prepareSharedKnowledgeTalk(event.trigger, event.trigger === 'update' ? event.id : undefined) : talk.prepareSharedKnowledgeTalk();
  if (shared) rows.push({ id: `shared:${shared.item.id}`, source: 'shared', text: shared.item.dialogue, score: 450, completed: true, shared,
    citation: externalCitation('shared', shared.item.keyword, shared.item.sourceUrl) });
  const selection = readWeatherSelection(storage), forecast = selection ? readWeatherCache(storage, selection, now).forecast : null;
  const weather = selection && forecast ? weatherMonologue(storage, selection, forecast, now) : null;
  if (weather && selection) rows.push({ id: `weather:${selection.pref.code}:${weather}`, source: 'weather', text: weather,
    score: 20, completed: true, weather: selection,
    citation: externalCitation('weather', `${forecast!.prefecture}（${forecast!.area.name}）の天気予報`, forecast!.sourceUrl) });
  return rows;
}

/** One outstanding opportunity per fetch event. Timers/re-renders can take it only once. */
export class MonologueOpportunity {
  private seen = new Set<string>();
  private pending: MonologueEvent | null = null;
  private lastShown = -Infinity;
  offer(id: string, trigger: 'startup' | 'update', now: number) {
    if (this.seen.has(id)) return false;
    this.seen.add(id); this.pending = { id, trigger, at: now }; return true;
  }
  take(blocked: boolean, lastInput: number, now: number) {
    if (!this.pending) return null;
    // User-owned screens and input pause the opportunity, instead of silently consuming a reload's only chance.
    if (blocked || now - lastInput < MONOLOGUE_IDLE_MS) { this.pending.at = now; return null; }
    if (now - this.pending.at > MONOLOGUE_EVENT_TTL) { this.pending = null; return null; }
    if (now - this.lastShown < MONOLOGUE_COOLDOWN_MS) return null;
    const event = this.pending; this.pending = null; return event;
  }
  peek() { return this.pending ? { ...this.pending } : null; }
  /** Managed home actions consume the latest acquisition once; they never build a queue. */
  consume() { const event = this.pending; this.pending = null; return event; }
  defer(event: MonologueEvent) {
    if (!this.pending) this.pending = event;
  }
  shown(now: number) { this.lastShown = now; }
}
