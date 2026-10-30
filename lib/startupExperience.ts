import type { ExternalTopic } from './externalTopics';

/** One short opportunity after the room has painted; a late fetch cannot reopen it. */
export class StartupOpportunity {
  private interacted = false;
  private settled = false;

  interact() { this.interacted = true; }
  take(blocked: boolean): 'READY' | 'BUSY' | null {
    if (this.settled) return null;
    this.settled = true;
    return blocked || this.interacted ? 'BUSY' : 'READY';
  }
}

export type StartupAttempt = {
  activityDate: string;
  outcome: 'NO_TOPIC' | 'BUSY' | 'SHOWN' | 'SKIPPED' | 'FINISHED';
  useId?: string;
  eventId?: string;
  timestamp?: string;
  trigger?: 'startup' | 'update';
  detail?: string;
};

export function sanitizeStartupAttempts(value: unknown): StartupAttempt[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is StartupAttempt => Boolean(item) && typeof item === 'object'
    && typeof item.activityDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.activityDate)
    && ['NO_TOPIC', 'BUSY', 'SHOWN', 'SKIPPED', 'FINISHED'].includes(item.outcome)
    && (item.useId === undefined || typeof item.useId === 'string')
    && (item.eventId === undefined || typeof item.eventId === 'string')
    && (item.timestamp === undefined || Number.isFinite(Date.parse(item.timestamp)))
    && (item.trigger === undefined || ['startup', 'update'].includes(item.trigger))
    && (item.detail === undefined || typeof item.detail === 'string')).slice(-600).map((item) => ({ ...item }));
}

export const EXTERNAL_CHECK_INTERVAL = 60 * 60000;
export const EXTERNAL_UPDATE_COOLDOWN = 15 * 60000;

/** No fetch/update timestamps: refreshing identical public content is not news. */
export function externalTopicRevision(topic: ExternalTopic) {
  const content = JSON.stringify([topic.source, topic.id, topic.title, topic.url, topic.category, topic.subcategory,
    [...(topic.relatedTerms ?? [])].sort()]);
  return `${topic.source}:${topic.id}:${fingerprint(content)}`;
}
function fingerprint(content: string) {
  let a = 2166136261; let b = 5381;
  for (let i = 0; i < content.length; i++) { a = Math.imul(a ^ content.charCodeAt(i), 16777619); b = Math.imul(b, 33) ^ content.charCodeAt(i); }
  return `${(a >>> 0).toString(36)}-${(b >>> 0).toString(36)}`;
}
export type ExternalCatalog = { seen: string[]; initialized: boolean; batch: { id: string; topicIds: string[]; at: string; count: number } | null };
export function sanitizeExternalCatalog(value: unknown): ExternalCatalog {
  const data = value as Partial<ExternalCatalog> | null;
  const seen = Array.isArray(data?.seen) ? data.seen.filter((item): item is string => typeof item === 'string' && item.length < 500).slice(-12000) : [];
  const batch = data?.batch;
  return { seen, initialized: data?.initialized === true, batch: batch && typeof batch.id === 'string' && Array.isArray(batch.topicIds)
    && batch.topicIds.every((id) => typeof id === 'string') && typeof batch.at === 'string' && Number.isFinite(Date.parse(batch.at))
    && typeof batch.count === 'number' ? { ...batch, topicIds: batch.topicIds.slice(0, 1500) } : null };
}
export function observeExternalCatalog(catalog: ExternalCatalog, topics: readonly ExternalTopic[], at: string, baseline = false): ExternalCatalog {
  const known = new Set(catalog.seen);
  const added = topics.filter((topic) => !known.has(externalTopicRevision(topic)));
  const revisions = added.map(externalTopicRevision).sort();
  return { initialized: true, seen: [...new Set([...catalog.seen, ...revisions])].slice(-12000),
    batch: (!baseline || catalog.initialized) && added.length ? { id: fingerprint(revisions.join('|')), topicIds: added.map((topic) => topic.id), at, count: added.length }
      : catalog.batch };
}

/** A delayed result is only usable if no input happened since this request started. */
export class ExternalInteractionGate {
  private generation = 0;
  private lastInput = -Infinity;
  interact(now = Date.now()) { this.generation++; this.lastInput = now; }
  capture() { return this.generation; }
  canOffer(token: number, blocked: boolean, now = Date.now()) {
    return !blocked && token === this.generation && now - this.lastInput >= 30000;
  }
}
