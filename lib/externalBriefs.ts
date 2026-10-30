/**
 * すうひもち30 v6.5 説明カードの読み取りと安全な短文会話素材。
 * キャラクター会話の表示や履歴保存は既存UI/WordMemoryに委ねる。
 */
import { externalTopicMentions } from './externalWordMatch';
export type BriefSource = 'google_trending_now' | 'wikipedia_pageviews' | 'youtube';
export type BriefKind = 'search_trend' | 'encyclopedia' | 'video';
export type BriefFactLevel =
  | 'trend_only' | 'trend_context' | 'related_headline' | 'title_and_pageviews' | 'encyclopedia_excerpt'
  | 'video_title_only' | 'uploader_description';

export interface ExternalBrief {
  id: string;
  source: BriefSource;
  kind: BriefKind;
  factLevel: BriefFactLevel;
  title: string;
  brief: string;
  detail: string | null;
  /** Cloudflare Workers AI が生成した、改変せず表示する完成セリフ。 */
  aiDialogue?: string | null;
  /** 旧v6.6互換フィールド。完成セリフとは見なさない。 */
  aiSummary?: string | null;
  aiDialogueVersion?: number;
  aiGeneratedAt?: string | null;
  aiUnverified?: boolean;
  aiModel?: string | null;
  detailSource: string | null;
  categoryId: string;
  subcategoryId: string | null;
  categoryLabel?: string | null;
  subcategoryLabel?: string | null;
  relatedTo: string[];
  publishedAt: string | null;
  eventDate: string | null;
  observedAt: string | null;
  dataDate?: string | null;
  sourceName: string;
  sourceUrl: string | null;
  articleUrl?: string | null;
  googleSearchUrl?: string | null;
  xSearchUrl?: string | null;
  attribution: string;
  licenseUrl: string | null;
  cautions: string[];
}

export interface ExternalBriefFeed {
  schemaVersion: 1;
  updatedAt: string | null;
  contentRevision: string;
  count: number;
  sourceCounts: { google: number; wikipedia: number; youtube: number };
  items: ExternalBrief[];
}

function plain(input: unknown, max: number): string {
  return (typeof input === 'string' ? input : '').replace(/<[^>]*>/g, '').replace(/\p{Cc}/gu, ' ')
    .replace(/\s+/g, ' ').trim().slice(0, max);
}
function safeLink(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? parsed.href : null;
  } catch { return null; }
}
const ALLOWED_SOURCES = new Set<BriefSource>(['google_trending_now', 'wikipedia_pageviews', 'youtube']);
const ALLOWED_KINDS = new Set<BriefKind>(['search_trend', 'encyclopedia', 'video']);
const ALLOWED_LEVELS = new Set<BriefFactLevel>(
  ['trend_only', 'trend_context', 'related_headline', 'title_and_pageviews', 'encyclopedia_excerpt', 'video_title_only', 'uploader_description'],
);

/** Completed speech is either accepted intact or rejected; never repair/truncate it into new facts. */
export function completedBriefText(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 && value.length <= 2400
    && !/[<>]/u.test(value) && !Array.from(value).some((char) => {
      const code = char.charCodeAt(0); return code < 32 && ![9, 10, 13].includes(code) || code === 127;
    }) ? value : null;
}

/** Validate untrusted Worker payload; do not silently present unknown kinds as factual news. */
export function parseExternalBriefFeed(raw: unknown): ExternalBriefFeed {
  if (!raw || typeof raw !== 'object') throw new Error('不正な説明カード応答');
  const obj = raw as Record<string, unknown>;
  if (obj.schemaVersion !== 1 || !Array.isArray(obj.items)) throw new Error('非対応の説明カード形式');
  const rows: ExternalBrief[] = [];
  const ids = new Set<string>();
  const counts = new Map<BriefSource, number>();
  const unavailable = obj.stale === true || obj.enabled === false || obj.published === false;
  for (const value of unavailable ? [] : obj.items.slice(0, 5000)) {
    if (!value || typeof value !== 'object') continue;
    const it = value as Record<string, unknown>;
    if (!ALLOWED_SOURCES.has(it.source as BriefSource) ||
        !ALLOWED_KINDS.has(it.kind as BriefKind) ||
        !ALLOWED_LEVELS.has(it.factLevel as BriefFactLevel)) continue;
    const id = plain(it.id, 220), title = plain(it.title, 150);
    const categoryId = plain(it.categoryId, 60);
    const link = safeLink(it.sourceUrl);
    if (!id || !title || !categoryId || !link || ids.has(id) || (counts.get(it.source as BriefSource) ?? 0) >= 500
      || it.blocked === true || it.published === false || it.enabled === false || it.stale === true) continue;
    const related = Array.isArray(it.relatedTo)
      ? it.relatedTo.slice(0, 8).map(x => plain(x, 60)).filter(Boolean) : [];
    const detail = it.detail == null ? null : plain(it.detail, 145);
    const level = it.factLevel as BriefFactLevel;
    ids.add(id);
    counts.set(it.source as BriefSource, (counts.get(it.source as BriefSource) ?? 0) + 1);
    rows.push({
      id, title, categoryId, source: it.source as BriefSource,
      kind: it.kind as BriefKind, factLevel: level,
      brief: plain(it.brief, 230), detail,
      aiDialogue: completedBriefText(it.aiDialogue),
      aiDialogueVersion: it.aiDialogueVersion === 2 ? 2 : undefined,
      aiSummary: typeof it.aiSummary === 'string' ? plain(it.aiSummary, 130) : null,
      aiGeneratedAt: it.aiGeneratedAt == null ? null : plain(it.aiGeneratedAt, 32),
      aiUnverified: it.aiUnverified === true,
      aiModel: it.aiModel == null ? null : plain(it.aiModel, 90),
      detailSource: it.detailSource == null ? null : plain(it.detailSource, 50),
      subcategoryId: it.subcategoryId == null ? null : plain(it.subcategoryId, 60),
      categoryLabel: it.categoryLabel == null ? null : plain(it.categoryLabel, 60),
      subcategoryLabel: it.subcategoryLabel == null ? null : plain(it.subcategoryLabel, 60),
      publishedAt: it.publishedAt == null ? null : plain(it.publishedAt, 32),
      eventDate: it.eventDate == null ? null : plain(it.eventDate, 32),
      observedAt: it.observedAt == null ? null : plain(it.observedAt, 32),
      dataDate: it.dataDate == null ? null : plain(it.dataDate, 32),
      relatedTo: related, sourceName: plain(it.sourceName, 90), sourceUrl: link, articleUrl: safeLink(it.articleUrl),
      googleSearchUrl: safeLink(it.googleSearchUrl), xSearchUrl: safeLink(it.xSearchUrl),
      attribution: plain(it.attribution, 230), licenseUrl: safeLink(it.licenseUrl),
      cautions: Array.isArray(it.cautions)
        ? it.cautions.slice(0, 5).map(x => plain(x, 180)) : [],
    });
  }
  return {schemaVersion: 1,
    updatedAt: unavailable || obj.updatedAt == null ? null : plain(obj.updatedAt, 32),
    contentRevision: plain(obj.contentRevision, 50), count: rows.length,
    sourceCounts: {
      google: rows.filter(x => x.source === 'google_trending_now').length,
      wikipedia: rows.filter(x => x.source === 'wikipedia_pageviews').length,
      youtube: rows.filter(x => x.source === 'youtube').length,
    },
    items: rows,
  };
}

export function pickExternalBrief(
  cards: readonly ExternalBrief[],
  learnedWords: readonly string[],
  seenIds: ReadonlySet<string>,
  lastSource: BriefSource | null = null,
): ExternalBrief | null {
  const eligible = cards.filter(card => !seenIds.has(card.id));
  if (!eligible.length) return null;
  const scored = eligible.map(card => {
    const matches = learnedWords.some((word) => externalTopicMentions({ title: card.title, relatedTerms: card.relatedTo }, word));
    return {card, score: (matches ? 10 : 0) + (card.source === lastSource ? 0 : 2)};
  });
  scored.sort((a,b) => b.score-a.score || a.card.id.localeCompare(b.card.id));
  return scored[0]?.card ?? null;
}

export interface BriefDialogue {
  lines: string[];
  attribution: string;
  sourceUrl: string;
  licenseUrl: string | null;
}
/**
 * 人間さんをアプリに登録された名前に変更する。Cloudflareへ名前を送る必要はない。
 * Reactテキストノードに渡すこと（HTML文字列として挿入しない）。
 */
export function replaceHumanName(dialogue: string, userName?: string | null): string {
  const name = (userName ?? '').trim().slice(0, 40) || '人間さん';
  return dialogue.replaceAll('人間さん', name);
}
/** 長い完成セリフは句読点で2ページに分割。文字列自体は編集しない。 */
export function dialogueToZoomPages(text: string): string[] {
  if (text.length <= 84) return [text];
  const marks = [...text.matchAll(/[。！？]/g)]
    .map(m => (m.index ?? 0) + m[0].length)
    .filter(at => at >= 35 && at <= text.length - 26);
  if (!marks.length) return [text];
  const middle = text.length / 2;
  const splitAt = marks.reduce((a,b) => Math.abs(a-middle) <= Math.abs(b-middle) ? a : b);
  return [text.slice(0,splitAt), text.slice(splitAt)];
}
/** 完成セリフはアプリで言い換え・付け足しをしない。 */
export function makeBriefDialogue(card: ExternalBrief, userName?: string | null): BriefDialogue | null {
  if (!card.sourceUrl) return null;
  const complete = card.aiUnverified === true && card.aiDialogueVersion === 2
    ? completedBriefText(card.aiDialogue) : '';
  if (complete && /[。！？]$/.test(complete)) {
    return {lines: dialogueToZoomPages(replaceHumanName(complete,userName)),
      attribution: card.attribution, sourceUrl: card.sourceUrl,licenseUrl: card.licenseUrl};
  }
  const title = plain(card.title, 44);
  const detail = plain(card.detail, 84);
  // 旧AI要約は完成セリフではないため、従来テンプレート内でのみ使用する。
  const generated = card.aiUnverified === true ? plain(card.aiSummary, 105) : '';
  let lines: string[];
  switch (card.kind) {
    case 'search_trend':
      lines = [`人間さん、今日は「${title}」っていう言葉が検索の話題になっているの。`,
        generated ? `関連する見出しから、${generated}って紹介されていたの。詳しいことはまだわからないの。`
        : detail ? `${detail}って紹介されてたの。でも、詳しいことはまだわからないの。`
               : 'どうして気になる人が多いのか、ぼくにはまだわからないの。'];
      break;
    case 'encyclopedia':
      lines = [`「${title}」っていう記事をWikipediaで見つけたの。`,
        generated ? `記事の説明を読んだら、${generated}っていうことらしいの。`
        : detail ? `記事の冒頭には、こう書いてあったの。「${detail}」` : 'これ、どんなものなんだろう。'];
      break;
    case 'video':
      lines = [`「${title}」っていう動画が日本のチャートに入っているの。`,
        generated ? `投稿した人の説明では、${generated}っていう内容みたいなの。`
        : detail ? `投稿した人の紹介文には、「${detail}」って書いてあるの。` : 'タイトルを見ただけだから、中身はまだわからないの。'];
      break;
  }
  return {lines:lines.map(line=>replaceHumanName(line,userName)),
    attribution: card.attribution, sourceUrl: card.sourceUrl,licenseUrl: card.licenseUrl};
}
