'use client';

import { useEffect, useState } from 'react';
import { CATEGORY_LABELS, subcategoryLabel } from '@/lib/conversationData';
import { getExternalInfoState, loadExternalTopics, type ExternalInfoState } from '@/lib/externalInfoClient';
import { buildExternalMonitor, EXTERNAL_STATE_LABELS, type MonitorRow } from '@/lib/externalTopicMonitor';
import type { SuuhimochiConversation } from '@/lib/wordMemory';
import { eligibleMonologues, monologueCandidates, readMonologueHistory, readMonologueStatus } from '@/lib/externalMonologues';
import { getBriefInfoState, readBriefCache } from '@/lib/externalBriefClient';
import { readExternalSnapshot } from '@/lib/externalTopics';

const sourceLabels = { google: 'Google', wikipedia: 'Wikipedia', youtube: 'YouTube' };
const methods = { exact: '既知語の明確な一致', derived: 'コンボ派生語の一致', alias: '明示的な別名', domain: '中カテゴリー＋追加根拠', general: 'すうひもち自身の関心（既知語との一致なし）' };
const date = (value: string | null | undefined) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('ja-JP') : '判定情報なし';
const emptyInfo: ExternalInfoState = { snapshot: null, cache: 'NONE', loading: false, attemptedAt: null, error: null };

export function ExternalTopicMonitor({ talk, individual }: { talk: SuuhimochiConversation; individual?: string }) {
  const [info, setInfo] = useState(emptyInfo);
  const [source, setSource] = useState('ALL');
  const [adoption, setAdoption] = useState('ALL');
  const [usage, setUsage] = useState('ALL');
  const [preview, setPreview] = useState<{ title: string; lines: string[] } | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const update = () => setInfo(getExternalInfoState(localStorage));
    update(); const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const model = buildExternalMonitor(info, talk);
  const batch = talk.getExternalUpdateBatch();
  const lastUse = talk.getExternalTopicHistory().at(-1);
  const attempts = talk.getStartupExternalAttempts();
  const autonomous = typeof localStorage === 'undefined' ? null : readMonologueStatus(localStorage);
  const briefInfo = typeof localStorage === 'undefined' ? null : getBriefInfoState(localStorage);
  const candidates = typeof localStorage === 'undefined' ? [] : monologueCandidates(talk, localStorage, readBriefCache(localStorage), readExternalSnapshot(info.snapshot, new Date())?.topics ?? []);
  const eligible = typeof localStorage === 'undefined' ? [] : eligibleMonologues(candidates, readMonologueHistory(localStorage).filter((use) => use.individual === individual));
  const updatedAt = [...model.feeds.map((feed) => feed.updatedAt), ...(info.snapshot?.topics.map((topic) => topic.updatedAt) ?? [])]
    .reduce<string | null>((latest, value) => value && (!latest || value > latest) ? value : latest, null);
  const refresh = async () => {
    setInfo((current) => ({ ...current, loading: true }));
    await loadExternalTopics(localStorage, fetch, new Date(), { force: true });
    const next = getExternalInfoState(localStorage);
    talk.setExternalTopics(next.snapshot);
    setInfo(next);
  };
  const openPreview = (row: MonitorRow) => {
    const result = row.topic ? talk.previewExternalTopic(row.topic) : null;
    if (!result) { setNotice('判定情報なし、または訂正済みの関係のため会話を生成できません。'); return; }
    setNotice(''); setPreview({ title: row.title, lines: result.lines });
  };
  const visible = model.rows.filter((row) => (source === 'ALL' || row.source === source || (source === 'unknown' && row.source === null))
    && (adoption === 'ALL' || (adoption === 'CANDIDATE' ? row.candidate : adoption === 'USED' ? row.uses.length > 0 : !row.candidate && !row.uses.length))
    && (usage === 'ALL' || (usage === 'USED' ? row.uses.length > 0 : !row.uses.length)));
  return <section className="external-topic-monitor" aria-label="外部話題モニター">
    <h2>外部話題</h2>
    <p>読み取り専用の診断。選択候補は採用済みではありません。再取得は端末・アプリAPIのキャッシュを読み飛ばし、最新の公開JSONを取得します。収集Cronは実行しません。</p>
    <dl className="external-topic-summary">
      <dt>最終取得日時</dt><dd>{date(info.snapshot?.fetchedAt)}</dd>
      <dt>最終更新確認日時</dt><dd>{date(info.checkedAt)}</dd>
      <dt>今回新たに増えた話題</dt><dd>{info.newTopicCount ?? 0}件{info.newTopicCount === undefined ? '（この起動ではまだ通信による確認なし）' : ''}</dd>
      <dt>更新の判定</dt><dd>{info.error ? '通信失敗・正常キャッシュを維持' : info.newTopicCount === undefined ? 'この起動ではまだ更新確認なし'
        : info.newTopicCount === 0 ? '内容の追加・変更なし（起動・手動更新では未使用の候補を選択できます）' : '新しい内容を候補へ追加（表示・見送りは発動履歴を参照）'}</dd>
      <dt>最後に内容が変わった更新</dt><dd>{batch ? `${date(batch.at)}／${batch.count}件を候補に追加` : 'なし'}</dd>
      <dt>最後に会話で使用</dt><dd>{lastUse ? `${lastUse.topic.title}／${sourceLabels[lastUse.topic.source]}／${date(lastUse.timestamp)}／${lastUse.context}／${lastUse.startupOutcome ?? '通常会話'}` : '未使用'}</dd>
      <dt>情報の更新日時</dt><dd>{date(updatedAt)}</dd>
      <dt>キャッシュ状態</dt><dd>{({ NONE: '未取得', VALID: '有効', EXPIRED: '期限切れ', INVALID: '不正' })[info.cache]}{info.loading ? '／取得中' : ''}</dd>
      <dt>最終通信試行</dt><dd>{date(info.attemptedAt)}</dd>
      <dt>取得件数</dt><dd data-testid="external-received">{model.received}件（Google {model.sourceCounts.google}／Wikipedia {model.sourceCounts.wikipedia}／YouTube {model.sourceCounts.youtube}／情報源不明 {model.sourceCounts.unknown}）</dd>
      <dt>現在有効</dt><dd>{model.valid}件</dd><dt>会話候補</dt><dd>{model.candidates}件</dd><dt>実使用回数</dt><dd>{model.used}件（個体の履歴）</dd>
    </dl>
    <section aria-label="自発会話の表示診断">
      <h3>自発会話の表示診断</h3>
      <p>会話素材 {candidates.length}件／重複制限後の発話可能 {eligible.length}件／完成セリフ {eligible.filter((card) => card.completed).length}件</p>
      <p>/safe-briefs（完成セリフ）：{briefInfo?.failure ? `${briefInfo.failure.error}${briefInfo.failure.cloudflareCode ? `／Cloudflare ${briefInfo.failure.cloudflareCode}` : ''}${briefInfo.failure.cloudflareCode === 1102 ? '：情報センターWorkerのリソース上限超過。Worker側の修正が必要です。' : ''}／再試行可能 ${date(briefInfo.failure.retryAt)}` : briefInfo?.lastSuccessAt ? `最終成功 ${date(briefInfo.lastSuccessAt)}` : '未取得'}</p>
      {autonomous ? <p>{autonomous.trigger === 'startup' ? '起動・再読み込み' : '情報更新'}／Day{autonomous.day}／{autonomous.state}：{autonomous.reason}
        {autonomous.candidates === undefined ? '' : `／候補${autonomous.candidates}件`}／{date(autonomous.timestamp)}</p> : <p>この端末の発話診断はまだありません。</p>}
    </section>
    <details><summary>起動・更新会話の発動履歴／見送り理由（{attempts.length}件）</summary>
      {[...attempts].reverse().slice(0, 100).map((attempt, index) => <p key={`${attempt.eventId ?? attempt.activityDate}:${index}`}>
        {date(attempt.timestamp) }／{attempt.trigger === 'update' ? '更新' : '起動'}／{attempt.outcome}：{attempt.detail ?? (attempt.useId ? '会話を表示・履歴保存' : '旧保存：判定情報なし')}
      </p>)}
    </details>
    <section className="external-source-stages" aria-label="情報源別の取り込み状況">
      {model.stages.map((stage) => <article key={stage.source} data-testid={`external-stage-${stage.source}`}>
        <h3>{sourceLabels[stage.source]}：{stage.state}</h3>
        <p>公開 {stage.published ?? '判定情報なし'} → 受信 {stage.received ?? '判定情報なし'} → 変換 {stage.converted ?? '判定情報なし'} → 端末保存 {stage.saved} → 会話候補 {stage.candidates}</p>
        <p>最終成功取得：{date(stage.lastSuccessAt)}／最終取得エラー：{stage.lastError ?? 'なし'}</p>
        <p>除外理由：{Object.entries(stage.exclusions).map(([reason, count]) => `${reason} ${count}件`).join('／') || 'なし・判定情報なし'}</p>
      </article>)}
    </section>
    {!model.hasDiagnostics && <p>旧キャッシュには除外項目・取得元エラーの判定情報がありません。次回の正常取得後に表示されます。</p>}
    <output>{info.error ? `取得失敗：${info.error}（正常なキャッシュは維持）` : ''}</output>
    {model.feeds.map((feed) => <p key={feed.endpoint}>{feed.endpoint}：{feed.status}／{feed.received}件／更新 {date(feed.updatedAt)}{feed.error ? `／${feed.error}` : ''}{feed.cloudflareCode ? `／Cloudflare ${feed.cloudflareCode}${feed.cloudflareCode === 1102 ? '（Workerのリソース上限超過）' : ''}` : ''}{feed.rayId ? `／Ray ${feed.rayId}` : ''}{feed.retryAt ? `／再試行可能 ${date(feed.retryAt)}` : ''}</p>)}
    <button type="button" disabled={info.loading} onClick={() => { void refresh(); }}>今すぐ再取得</button>
    <div className="external-topic-filters">
      <label>情報源<select aria-label="外部話題の情報源" value={source} onChange={(event) => setSource(event.target.value)}><option value="ALL">すべて</option>{Object.entries(sourceLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}<option value="unknown">情報源不明</option></select></label>
      <label>採用状態<select aria-label="外部話題の採用状態" value={adoption} onChange={(event) => setAdoption(event.target.value)}><option value="ALL">すべて</option><option value="CANDIDATE">現在の候補</option><option value="USED">採用済み</option><option value="REJECTED">不採用</option></select></label>
      <label>使用済み<select aria-label="外部話題の使用状態" value={usage} onChange={(event) => setUsage(event.target.value)}><option value="ALL">すべて</option><option value="USED">使用済み</option><option value="UNUSED">未使用</option></select></label>
    </div>
    <p>{visible.length}件表示／全{model.rows.length}件（取得一覧＋現在の一覧にない使用履歴）</p>
    <div className="external-topic-list">
      {visible.map((row) => <article key={row.id} className="external-topic-card">
        <h3>{row.title}</h3>
        <p>{row.source ? sourceLabels[row.source] : '判定情報なし'}／{row.category ? CATEGORY_LABELS[row.category] : '判定情報なし'} → {row.category && row.subcategory ? subcategoryLabel(row.category, row.subcategory) : '判定情報なし'}</p>
        <p>取得 {date(row.fetchedAt)}／更新 {date(row.updatedAt)}</p>
        {row.topic?.dataDate && <p>集計対象日：{row.topic.dataDate}（取得・更新日時とは別）</p>}
        {Boolean(row.topic?.relatedTerms?.length) && <p>公開データの関連語：{row.topic!.relatedTerms!.join('、')}</p>}
        <p><b>{EXTERNAL_STATE_LABELS[row.state]}</b>：{row.reason}</p>
        <p>採用：{row.uses.length ? '採用済み' : row.candidate ? '未使用・候補' : '不採用'}／使用日：{row.uses.length ? row.uses.map((use) => `${use.date}（Day${use.day}・${use.context}${use.startupOutcome ? `・${use.startupOutcome}` : ''}）`).join('、') : '未使用'}</p>
        {row.matches.length ? row.matches.map((match) => <p key={`${match.wordId}:${match.kind}`}>一致した{match.kind === 'derived' || match.wordId !== match.rootWordId ? 'コンボ派生語' : '単語'}：{match.word || 'なし（本人の興味とは判断しません）'}{match.wordId !== match.rootWordId ? `（起点：${match.rootWord}）` : ''}／照合方法：{methods[match.kind]}／根拠：{match.evidence}</p>) : <p>一致語・コンボ派生語・照合方法：判定情報なし</p>}
        {row.url && <a href={row.url} target="_blank" rel="noopener noreferrer">情報源を開く</a>}
        <button type="button" onClick={() => openPreview(row)} disabled={!row.topic || (!row.matches.length && !row.uses.length) || row.state === 'REJECTED'}>会話プレビュー</button>
      </article>)}
      {!visible.length && <p>該当する話題はありません。</p>}
    </div>
    {notice && <output>{notice}</output>}
    {preview && <section className="external-topic-preview" aria-label="外部話題の会話プレビュー"><h3>会話プレビュー（保存・報酬なし）</h3><small>{preview.title}</small>{preview.lines.map((line, index) => <p key={index}>ページ{index + 1}：{line}</p>)}<button type="button" onClick={() => setPreview(null)}>プレビューを閉じる</button></section>}
  </section>;
}
