import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NOW, brief, feed } from './fixtures/external-monologues.mjs';
const vite = await createServer({ configFile: false, root: process.cwd(), resolve: { alias: { '@': process.cwd() } }, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
let passed = 0; const check = async (name, fn) => { await fn(); passed++; console.log('PASS', name); };
try {
  const { externalCitation, safeCitationUrl } = await vite.ssrLoadModule('/lib/externalSourceCitation.ts');
  const { ExternalSourceCaption, ExternalSourceBubble } = await vite.ssrLoadModule('/components/ExternalSourceCaption.tsx');
  const html = (citation) => renderToStaticMarkup(createElement(ExternalSourceCaption, { citation }));
  await check('5情報源の情報源名・タイトル・URLを受信データから表示する', () => {
    for (const source of ['google', 'wikipedia', 'youtube', 'shared', 'weather']) {
      const citation = externalCitation(source, '元のタイトル', source === 'google' ? 'https://www.google.com/search?q=topic&tbs=qdr%3Aw&hl=ja' : 'https://example.com/original');
      const markup = html(citation);
      if (source === 'google') { assert.match(markup, /最近の話題をGoogleで検索/); assert.doesNotMatch(markup, /元ネタ/); }
      else { assert.match(markup, /元ネタ：/); assert.ok(markup.includes(citation.sourceName)); }
      assert.match(markup, /元のタイトル/); assert.ok(markup.includes(citation.url.replaceAll('&', '&amp;')));
      assert.match(markup, /target="_blank"/); assert.match(markup, /rel="noopener noreferrer"/); assert.match(markup, /referrerPolicy="no-referrer"/i);
    }
  });
  await check('URLなし・不正URLはリンクを作らず情報源名だけを表示する', () => {
    for (const url of [null, undefined, '', 'javascript:alert(1)', 'data:text/html,attack', 'http://example.com', 'file:///secret', 'https://user:pass@example.com', 'https://example.com/\nsecret', '//example.com']) {
      assert.equal(safeCitationUrl(url), null); const markup = html(externalCitation('youtube', '表示しないタイトル', url));
      assert.doesNotMatch(markup, /<a\b/); assert.match(markup, /YouTube/); assert.doesNotMatch(markup, /表示しないタイトル/);
    }
  });
  await check('旧トレンド一覧・分析URLは話題タイトルによる直近1週間の検索に移行する', () => {
    for (const url of ['https://trends.google.com/trending?geo=JP', 'https://www.google.com/trends/trendingsearches/daily']) {
      const citation = externalCitation('google', '将棋', url), search = new URL(citation.url);
      assert.equal(search.pathname, '/search'); assert.equal(search.searchParams.get('q'), '将棋 話題'); assert.equal(search.searchParams.get('tbs'), 'qdr:w');
      assert.match(html(citation), /最近の話題をGoogleで検索/); assert.doesNotMatch(html(citation), /Googleトレンドで見る|元ネタ/);
    }
  });
  await check('v6.8.29のsourceUrlを優先し、受信したX検索と関連記事だけを分けて表示する', () => {
    const sourceUrl = 'https://www.google.com/search?q=将棋+話題&tbs=qdr%3Ad&hl=ja';
    const xSearchUrl = 'https://www.google.com/search?q=将棋+site%3Ax.com&tbs=qdr%3Aw&hl=ja';
    const citation = externalCitation('google', '将棋', sourceUrl, { googleSearchUrl: 'https://www.google.com/search?q=other', xSearchUrl, articleUrl: 'https://news.example.com/article/123' });
    assert.equal(citation.url, new URL(sourceUrl).href); assert.equal(citation.xSearchUrl, new URL(xSearchUrl).href);
    const markup = html(citation); assert.match(markup, /最近の話題をGoogleで検索/); assert.match(markup, /Xで話題を見る/); assert.match(markup, /関連記事/);
    assert.equal((markup.match(/target="_blank"/g) ?? []).length, 3); assert.doesNotMatch(markup, /元ネタ/);
    const absent = html(externalCitation('google', '将棋', sourceUrl)); assert.doesNotMatch(absent, /Xで話題を見る|関連記事/);
    for (const bad of ['javascript:attack()', 'http://x.com/search?q=test', 'https://x.com/redirect?q=test', 'https://www.google.com/url?q=evil']) {
      const safe = externalCitation('google', '将棋', sourceUrl, { xSearchUrl: bad }); assert.equal(safe.xSearchUrl, null);
    }
    const direct = externalCitation('google', '将棋', sourceUrl, { xSearchUrl: 'https://x.com/search?q=将棋&f=live' }); assert.ok(direct.xSearchUrl);
    assert.equal(externalCitation('google', '将棋', sourceUrl, { articleUrl: 'javascript:attack()' }).articleUrl, null);
    assert.equal(externalCitation('google', '将棋', sourceUrl, { articleUrl: sourceUrl }).articleUrl, null);
  });
  await check('長いタイトルは原文を保持し、HTMLを実行する要素として扱わない', () => {
    const title = '長いタイトル'.repeat(30) + '<img src=x onerror=attack()>';
    const markup = html(externalCitation('wikipedia', title, 'https://ja.wikipedia.org/wiki/Test'));
    assert.ok(markup.includes('長いタイトル'.repeat(30))); assert.match(markup, /&lt;img/); assert.doesNotMatch(markup, /<img\b/);
  });
  await check('既存の吹き出しボタンと元ネタリンクは兄弟にし、通常会話には追加しない', () => {
    const button = createElement('button', { className: 'thought-bubble', type: 'button' }, '話した文章');
    const markup = renderToStaticMarkup(createElement(ExternalSourceBubble, { citation: externalCitation('shared', '将棋', 'https://ja.wikipedia.org/wiki/将棋') }, button));
    assert.match(markup, /<\/button><small/); assert.doesNotMatch(markup, /<button[^>]*>[\s\S]*<a[\s\S]*<\/button>/);
    assert.match(markup, /data-external-presentation="bubble"/); assert.match(markup, /data-external-tail/);
    const ordinary = renderToStaticMarkup(createElement(ExternalSourceBubble, { citation: null }, button));
    assert.equal(ordinary, renderToStaticMarkup(button)); assert.doesNotMatch(ordinary, /元ネタ|data-external-source/);
  });
  await check('取得・正規化・キャッシュ復元・会話候補で検索URLと追加リンクを失わない', async () => {
    const { monologueCandidates } = await vite.ssrLoadModule('/lib/externalMonologues.ts');
    const { parseExternalBriefFeed } = await vite.ssrLoadModule('/lib/externalBriefs.ts');
    const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
    const data = new Map(), storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
    const now = new Date(NOW); let talk = new SuuhimochiConversation({ storage, now: () => now }); talk.setGoal('作品');
    const key = 'suuhimochi_conversation_v6_choices', saved = JSON.parse(storage.getItem(key)); saved.dayOverride = 16; storage.setItem(key, JSON.stringify(saved)); talk = new SuuhimochiConversation({ storage, now: () => now });
    const item = { ...brief('article'), sourceUrl: 'https://www.google.com/search?q=topic&tbs=qdr%3Aw&hl=ja',
      googleSearchUrl: 'https://www.google.com/search?q=alternate', xSearchUrl: 'https://x.com/search?q=topic&f=live', articleUrl: 'https://news.example.com/article/real' };
    const cards = monologueCandidates(talk, storage, parseExternalBriefFeed(feed([item])), [], now);
    assert.equal(cards[0].citation.url, item.sourceUrl); assert.equal(cards[0].citation.articleUrl, item.articleUrl); assert.equal(cards[0].citation.xSearchUrl, item.xSearchUrl);
    const { normalizeHubFeed, readExternalSnapshot, externalExpiry } = await vite.ssrLoadModule('/lib/externalTopics.ts');
    const topics = normalizeHubFeed(feed([{ ...item, url: 'https://trends.google.com/trending?geo=JP' }]), 'safe-trends', now);
    assert.equal(topics[0].url, item.sourceUrl); assert.equal(topics[0].xSearchUrl, item.xSearchUrl);
    const restored = readExternalSnapshot(JSON.parse(JSON.stringify({ topics, fetchedAt: NOW, expiresAt: externalExpiry(now) })), now);
    const fromTopics = monologueCandidates(talk, storage, null, restored.topics, now);
    assert.equal(fromTopics[0].citation.url, item.sourceUrl); assert.equal(fromTopics[0].citation.xSearchUrl, item.xSearchUrl); assert.equal(fromTopics[0].citation.articleUrl, item.articleUrl);
    item.articleUrl = 'javascript:attack()'; const fallback = monologueCandidates(talk, storage, parseExternalBriefFeed(feed([item])), [], now); assert.equal(fallback[0].citation.articleUrl, null); assert.equal(fallback[0].citation.url, item.sourceUrl);
  });
  const { externalBubbleLayout } = await vite.ssrLoadModule('/lib/externalBubbleLayout.ts');
  await check('PC・スマートフォン・左右の端でキャラクターと反対側に置き、画面内に保つ', () => {
    for (const [width, height] of [[1365, 850], [844, 390], [667, 375]]) for (const side of ['left', 'right']) {
      const view = { left: 12, top: 70, width: width - 24, height: height - 112 };
      const character = { left: side === 'left' ? 20 : width - 150, top: height * .48, width: 120, height: 140 };
      const box = externalBubbleLayout(view, character, height < 500 ? 172 : 240);
      assert.equal(box.side, side === 'left' ? 'right' : 'left');
      assert.ok(box.left >= view.left && box.left + box.width <= view.left + view.width);
      assert.ok(box.top >= view.top && box.top + box.height <= view.top + view.height);
      assert.ok(side === 'left' ? box.left >= character.left + character.width : box.left + box.width <= character.left);
      const tip = box.points.split(' ')[1].split(',').map(Number);
      const baseX = box.side === 'right' ? 0 : box.width;
      const upperBaseY = box.points.split(' ')[0].split(',').map(Number)[1];
      const lowerBaseY = box.points.split(' ')[2].split(',').map(Number)[1];
      const baseY = (upperBaseY + lowerBaseY) / 2;
      const faceX = character.left + character.width * (box.side === 'right' ? .62 : .38) - box.left;
      const faceY = character.top + character.height * .4 - box.top;
      assert.ok(Math.hypot(tip[0] - baseX, tip[1] - baseY) <= 26.1, 'speech tail reach stays short');
      assert.equal(lowerBaseY - upperBaseY, 36, 'speech tail base is wider');
      assert.ok((tip[0] - baseX) * (faceX - baseX) + (tip[1] - baseY) * (faceY - baseY) > 0, 'speech tail still points toward the face');
    }
  });
  await check('ヘッダー・スキップ・元ネタの領域を避け、通常のしっぽを顔へ向ける', () => {
    const obstacle = { left: 600, top: 150, width: 380, height: 100 };
    const box = externalBubbleLayout({ left: 12, top: 12, width: 1000, height: 700 }, { left: 150, top: 180, width: 150, height: 170 }, 220, [obstacle]);
    assert.ok(box.top >= obstacle.top + obstacle.height || box.top + box.height <= obstacle.top);
  });
  console.log(`External source citation: ${passed} passed`);
} finally { await vite.close(); }
