export const NOW = '2026-10-22T13:00:00+09:00';
export const script = '人間さん、教えてもらったマインクラフトの動画を見つけたの。\n同じ言葉が、違う場所にもつながっているんだね。';
export function brief(id, source = 'google_trending_now', text = script, title = 'マインクラフト') {
  return { id: `${source === 'google_trending_now' ? 'google' : source === 'wikipedia_pageviews' ? 'wikipedia' : 'youtube'}:${id}`, source,
    kind: source === 'google_trending_now' ? 'search_trend' : source === 'wikipedia_pageviews' ? 'encyclopedia' : 'video',
    factLevel: source === 'google_trending_now' ? 'trend_context' : source === 'wikipedia_pageviews' ? 'encyclopedia_excerpt' : 'uploader_description',
    title, brief: title, detail: null, categoryId: 'GAME_MEDIA', subcategoryId: 'GAME_MEDIA_3', relatedTo: [title],
    observedAt: NOW, publishedAt: NOW, sourceName: source, sourceUrl: source === 'google_trending_now' ? 'https://trends.google.com/trending?geo=JP'
      : source === 'wikipedia_pageviews' ? 'https://ja.wikipedia.org/wiki/マインクラフト' : `https://www.youtube.com/watch?v=${id}`,
    attribution: '出典', aiDialogue: text, aiDialogueVersion: 2, aiUnverified: true, aiModel: '@cf/google/gemma-4-26b-a4b-it', aiGeneratedAt: NOW };
}
export const feed = (items) => ({ schemaVersion: 1, updatedAt: NOW, contentRevision: items.map((item) => item.id).join('|'), items });
