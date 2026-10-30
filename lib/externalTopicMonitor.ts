import type { SuuhimochiConversation } from './wordMemory';
import { EXTERNAL_CACHE_VERSION, EXTERNAL_REASON_LABELS, readExternalSnapshot, type ExternalAssessment, type ExternalInspection, type ExternalSource, type ExternalTopic, type ExternalTopicUse } from './externalTopics';
import type { ExternalInfoState } from './externalInfoClient';

export const EXTERNAL_STATE_LABELS = {
  STALE: '情報が古い', USED: '使用間隔・直前の重複により保留', REJECTED: 'ユーザーが否定・訂正した関係', NO_MATCH: '関連する言葉がない',
  DAILY_LIMIT: '本活動日の外部会話を使用済み', SELECTED: '現在の優先候補（まだ未使用）', LOWER_PRIORITY: '候補・ほかの話題を優先',
  EXCLUDED: '公開データの除外・停止指定', INVALID: '分類・URLなどの検証不合格', UNKNOWN: '判定情報なし',
} as const;
export type MonitorRow = Omit<ExternalInspection, 'reason'> & {
  state: keyof typeof EXTERNAL_STATE_LABELS; reason: string; candidate: boolean;
  matches: ExternalAssessment['matches']; uses: ExternalTopicUse[]; topic?: ExternalTopic;
};
const sameTitle = (a: string, b: string) => a.normalize('NFKC').toLowerCase().replace(/[\s・･]/g, '') === b.normalize('NFKC').toLowerCase().replace(/[\s・･]/g, '');

/** A projection only: no session, dictionary, relationship or save mutation. */
export function buildExternalMonitor(info: ExternalInfoState, talk: SuuhimochiConversation, now = new Date()) {
  const snapshot = info.snapshot;
  const history = talk.getExternalTopicHistory();
  const topics = snapshot?.topics ?? [];
  const assessments = talk.inspectExternalTopics(topics).assessments;
  const freshSnapshot = readExternalSnapshot(snapshot, now);
  const inspections: ExternalInspection[] = snapshot?.diagnostics?.items ?? topics.map((topic) => ({
    id: topic.id, topicId: topic.id, title: topic.title, source: topic.source, category: topic.category, subcategory: topic.subcategory,
    url: topic.url, fetchedAt: snapshot!.fetchedAt, updatedAt: topic.updatedAt, status: 'ACCEPTED',
  }));
  const rows: MonitorRow[] = inspections.map((item) => {
    const assessment = assessments.find((entry) => entry.topic.id === item.topicId);
    const uses = history.filter((entry) => entry.topic.id === item.topicId || sameTitle(entry.topic.title, item.title));
    const state = item.status !== 'ACCEPTED' ? item.status : !freshSnapshot ? 'STALE' : assessment?.state ?? 'UNKNOWN';
    return { ...item, state, reason: !freshSnapshot && item.status === 'ACCEPTED' ? 'キャッシュ有効期限切れ（会話には使いません）'
      : item.status !== 'ACCEPTED' && item.reason ? EXTERNAL_REASON_LABELS[item.reason] : EXTERNAL_STATE_LABELS[state],
      matches: assessment?.matches ?? [], candidate: Boolean(freshSnapshot && assessment?.candidate), uses, topic: assessment?.topic };
  });
  // Keep previously spoken topics visible even after they disappear from today's feed.
  for (const use of history) {
    if (rows.some((row) => row.uses.some((entry) => entry.id === use.id))) continue;
    rows.push({ id: `history:${use.topic.id}`, topicId: use.topic.id, title: use.topic.title, source: use.topic.source,
      category: use.topic.category, subcategory: use.topic.subcategory, url: use.topic.url, fetchedAt: '', updatedAt: use.topic.updatedAt,
      status: 'ACCEPTED', state: 'USED', reason: '以前使用済み（現在の取得一覧にはありません）', matches: [use], candidate: false,
      uses: history.filter((entry) => entry.topic.id === use.topic.id), topic: use.topic });
  }
  const stages = (['google', 'wikipedia', 'youtube'] as ExternalSource[]).map((source) => {
    const endpoint = source === 'youtube' ? 'safe-youtube' : 'safe-trends';
    const savedFeed = snapshot?.diagnostics?.feeds.find((feed) => feed.endpoint === endpoint);
    const attempt = (info.attemptDiagnostics ?? snapshot?.diagnostics)?.feeds.find((feed) => feed.endpoint === endpoint);
    const sourceItems = (info.attemptDiagnostics ?? snapshot?.diagnostics)?.items.filter((item) => item.source === source) ?? [];
    const failed = attempt?.status === 'ERROR' || Boolean(info.error);
    const exclusions: Record<string, number> = {};
    for (const item of sourceItems) {
      if (item.status === 'ACCEPTED') continue;
      const label = item.reason ? EXTERNAL_REASON_LABELS[item.reason] : EXTERNAL_STATE_LABELS[item.status];
      exclusions[label] = (exclusions[label] ?? 0) + 1;
    }
    const published = attempt?.published?.[source] ?? null;
    return { source, published,
      received: attempt?.sourceCounts?.[source] ?? (failed ? null : snapshot?.diagnostics ? sourceItems.length : null),
      converted: failed ? null : snapshot?.diagnostics ? new Set(sourceItems.filter((item) => item.status === 'ACCEPTED').map((item) => item.topicId)).size : null,
      saved: topics.filter((topic) => topic.source === source).length,
      candidates: new Set(rows.filter((row) => row.candidate && row.source === source).map((row) => row.topicId)).size,
      lastSuccessAt: attempt?.lastSuccessAt ?? savedFeed?.lastSuccessAt ?? (savedFeed?.status === 'OK' ? savedFeed.fetchedAt : null),
      lastError: attempt?.error ?? info.error ?? null, exclusions,
      state: failed ? '通信失敗（正常キャッシュを維持）' : snapshot?.schemaVersion !== EXTERNAL_CACHE_VERSION ? '旧形式キャッシュ（再取得が必要）'
        : !freshSnapshot ? 'キャッシュが古い' : published === 0 ? '情報センターの公開0件'
        : sourceItems.length && !sourceItems.some((item) => item.status === 'ACCEPTED') ? '変換で全件除外' : '取得・変換済み' };
  });
  return { rows, stages, sourceCounts: {
    google: inspections.filter((item) => item.source === 'google').length,
    wikipedia: inspections.filter((item) => item.source === 'wikipedia').length,
    youtube: inspections.filter((item) => item.source === 'youtube').length,
    unknown: inspections.filter((item) => item.source === null).length,
  }, received: inspections.length, valid: freshSnapshot?.topics.length ?? 0,
  candidates: new Set(rows.filter((row) => row.candidate).map((row) => row.topicId)).size,
  used: history.length, hasDiagnostics: Boolean(snapshot?.diagnostics), feeds: snapshot?.diagnostics?.feeds ?? [] };
}
