export type ExternalCitation = { sourceName: string; title: string; url: string | null; googleListing: boolean;
  googleSearch?: boolean; xSearchUrl?: string | null; articleUrl?: string | null };
export type CitationSource = 'google' | 'wikipedia' | 'youtube' | 'shared' | 'weather';
const names: Record<CitationSource, string> = { google: 'Googleトレンド', wikipedia: 'Wikipedia', youtube: 'YouTube', shared: 'Wikipedia共有知識庫', weather: '気象庁' };

/** Navigation only: never synthesize a destination, accept scripts, or forward credentials. */
export function safeCitationUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 4096 || Array.from(value).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
function googleSearchUrl(value: unknown): string | null {
  const safe = safeCitationUrl(value); if (!safe) return null;
  const url = new URL(safe);
  return ['www.google.com', 'google.com'].includes(url.hostname) && url.pathname === '/search' && url.searchParams.get('q')?.trim() ? safe : null;
}
function xSearchUrl(value: unknown): string | null {
  const safe = safeCitationUrl(value); if (!safe) return null;
  const url = new URL(safe), search = googleSearchUrl(safe);
  return search && /(?:^|\s)site:x\.com(?:\s|$)/i.test(url.searchParams.get('q') ?? '')
    || ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(url.hostname) && url.pathname === '/search' && url.searchParams.get('q')?.trim() ? safe : null;
}
export function externalCitation(source: CitationSource, title: string, url?: unknown,
  links: { googleSearchUrl?: unknown; xSearchUrl?: unknown; articleUrl?: unknown } = {}): ExternalCitation {
  const safe = safeCitationUrl(url), link = safe ? new URL(safe) : null;
  if (source === 'google') {
    const legacy = link && ['trends.google.com', 'www.google.com', 'google.com', 'news.google.com'].includes(link.hostname);
    // Older normal caches contain only a Trends URL. Search the public topic title, never the user's words/logs.
    const search = googleSearchUrl(safe) ?? googleSearchUrl(links.googleSearchUrl)
      ?? (legacy ? `https://www.google.com/search?${new URLSearchParams({ q: `${title} 話題`, tbs: 'qdr:w', hl: 'ja' })}` : null);
    const article = safeCitationUrl(links.articleUrl);
    const articleHost = article ? new URL(article).hostname : '';
    return { sourceName: names[source], title, url: search, googleListing: false, googleSearch: true,
      xSearchUrl: xSearchUrl(links.xSearchUrl), articleUrl: article && article !== search && !googleSearchUrl(article)
        && !xSearchUrl(article) && articleHost !== 'trends.google.com' ? article : null };
  }
  return { sourceName: names[source], title, url: safe, googleListing: false };
}
