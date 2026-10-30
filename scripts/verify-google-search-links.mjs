import assert from 'node:assert/strict';
import { createServer } from 'vite';
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { INFO_HUB_ORIGIN, normalizeHubFeed, readExternalSnapshot, externalExpiry } = await vite.ssrLoadModule('/lib/externalTopics.ts');
  const { parseExternalBriefFeed } = await vite.ssrLoadModule('/lib/externalBriefs.ts');
  const { externalCitation } = await vite.ssrLoadModule('/lib/externalSourceCitation.ts');
  const now = new Date();
  const get = async (url) => { const response = await fetch(url, { signal: AbortSignal.timeout(25000) }); assert.equal(response.ok, true, url); return response.json(); };
  const [rawTrends, rawBriefs, appBriefs] = await Promise.all([
    get(`${INFO_HUB_ORIGIN}/safe-trends`), get(`${INFO_HUB_ORIGIN}/safe-briefs`),
    get(`${process.env.SUUHIMOCHI_TEST_URL ?? 'http://localhost:3000'}/api/external-briefs`),
  ]);
  const topics = normalizeHubFeed(rawTrends, 'safe-trends', now);
  const restored = readExternalSnapshot(JSON.parse(JSON.stringify({ topics, fetchedAt: now.toISOString(), expiresAt: externalExpiry(now) })), now);
  const briefSets = [parseExternalBriefFeed(rawBriefs).items, parseExternalBriefFeed(appBriefs).items];
  const counts = [];
  for (const [index, items] of [restored.topics, ...briefSets].entries()) {
    const google = items.filter((item) => ['google', 'google_trending_now'].includes(item.source));
    assert.ok(google.length > 0, 'Public Google data is required for this live verification');
    let xLinks = 0, articleLinks = 0;
    for (const item of google) {
      const sourceUrl = item.sourceUrl ?? item.url;
      const citation = externalCitation('google', item.title, sourceUrl, item);
      assert.equal(citation.url, sourceUrl, 'v6.8.29 sourceUrl is used without rewriting its query');
      assert.equal(new URL(citation.url).pathname, '/search');
      if (item.xSearchUrl) { assert.equal(citation.xSearchUrl, item.xSearchUrl); xLinks++; }
      if (citation.articleUrl) articleLinks++;
    }
    counts.push({ stage: ['public trends → normalized → cache restored', 'public briefs → parsed', 'app /api/external-briefs → parsed'][index], google: google.length, xLinks, articleLinks });
  }
  console.log(JSON.stringify({ checkedAt: now.toISOString(), counts, dataSent: 'Public endpoint GET only; no user storage or words sent' }, null, 2));
} finally { await vite.close(); }
