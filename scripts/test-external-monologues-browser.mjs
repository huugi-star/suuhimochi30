import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'vite';
import { NOW, brief, feed, script } from './fixtures/external-monologues.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.SUUHIMOCHI_BROWSER_MODULES || process.cwd()] }));
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
const browser = await chromium.launch({ headless: true, ...(process.env.SUUHIMOCHI_BROWSER_EXECUTABLE ? { executablePath: process.env.SUUHIMOCHI_BROWSER_EXECUTABLE } : {}) });
const BASE = process.env.SUUHIMOCHI_TEST_URL || 'http://localhost:3000';
const C = 'suuhimochi_conversation_v6_choices', G = 'suuhimochi-30days-save-v1', P = 'suuhimochi-shared-knowledge-consent-v1', H = 'suuhimochi-external-monologues-v1';
const errors = [];
try {
  const { EMPTY_SAVE } = await vite.ssrLoadModule('/lib/storage.ts');
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const { externalExpiry, normalizeHubFeed } = await vite.ssrLoadModule('/lib/externalTopics.ts');
  const data = new Map(), storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
  const talk = new SuuhimochiConversation({ storage, now: () => new Date(NOW) }); talk.setGoal('作品を作る');
  talk.startWordTeaching(); talk.submit('マインクラフト'); talk.chooseCategory('GAME_MEDIA'); talk.chooseSubCategory('GAME_MEDIA_3'); talk.choose('WORD_INTERESTED');
  const conversation = JSON.parse(data.get(C)); conversation.startDate = '2026-10-07'; conversation.dayOverride = 16;
  const game = { ...structuredClone(EMPTY_SAVE), birthday: '2000-01-01', introComplete: true, day: 16, journalNotes: { '2026-10-21': ['送らない日誌'] } };
  const setup = async ({ decided = true, slow = false, weather = false, empty = false, shared = false, live = false, mobile = false, article = false, youtube = false, long = false, unrelated = false, degraded = false } = {}) => {
    const context = await browser.newContext({ viewport: mobile ? { width: 844, height: 390 } : { width: 1365, height: 900 }, timezoneId: 'Asia/Tokyo', isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage(); page.on('pageerror', (error) => errors.push(error.message)); await page.clock.install({ time: live ? new Date() : new Date(NOW) });
    const sharedItem = { id: 'shared-minecraft-1', keyword: 'マインクラフト', dialogue: 'マインクラフトの積み木みたいな世界って、どこまで続いているのかな。', style: 0, thoughtStyle: '発見', sourceUrl: 'https://ja.wikipedia.org/wiki/マインクラフト', attribution: 'Wikipedia CC BY-SA' };
    let seeded = conversation;
    const legacyUses = [];
    if (degraded) {
      const values = new Map([[C, JSON.stringify(conversation)]]), isolated = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
      const legacyTalk = new SuuhimochiConversation({ storage: isolated, now: () => new Date(NOW) });
      for (let i = 0; i < 4; i++) {
        const topic = normalizeHubFeed({ updatedAt: NOW, items: [{ source: 'youtube', videoId: `previous00${i}`, url: `https://www.youtube.com/watch?v=previous00${i}`, title: `以前の話題${i}を紹介していた長い名前の動画`, categoryId: 'GAME_MEDIA', subcategoryId: 'GAME_MEDIA_3', publishedAt: NOW }] }, 'safe-youtube', new Date(NOW))[0];
        const text = i === 0 ? '動画の紹介にまだ知らない名前があって、ぼく、目が止まったの。\n名前だけでは、どんなものか分からないね。知らないことを、ひとつ見つけちゃった。' : `以前の動画のお話${i}なの。`;
        assert.ok(legacyTalk.recordExternalMonologue(legacyTalk.inspectExternalTopics([topic]).selected, text, `legacy:${i}`, 'startup'));
        legacyUses.push({ individual: game.currentMochiId, eventId: `legacy:${i}`, trigger: 'startup', id: topic.id, source: 'youtube', text, timestamp: NOW });
      }
      seeded = JSON.parse(values.get(C));
    }
    if (unrelated) {
      const values = new Map(), isolated = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
      const learned = new SuuhimochiConversation({ storage: isolated, now: () => new Date(NOW) }); learned.setGoal('作品を作る');
      learned.startWordTeaching(); learned.submit('まり'); learned.chooseCategory('TOOL'); learned.chooseSubCategory('TOOL_8'); learned.choose('WORD_INTERESTED');
      seeded = JSON.parse(values.get(C)); seeded.startDate = '2026-10-07'; seeded.dayOverride = 16;
    }
    await page.addInitScript(({ C, G, P, H, conversation, game, decided, weather, shared, sharedItem, NOW, legacyUses }) => {
      if (localStorage.getItem('__monologue_seeded')) return;
      localStorage.setItem(C, JSON.stringify(conversation)); localStorage.setItem(G, JSON.stringify(game)); localStorage.setItem(P, JSON.stringify({ version: 1, enabled: shared, decided }));
      if (legacyUses.length) localStorage.setItem(H, JSON.stringify(legacyUses));
      if (weather) localStorage.setItem('suuhimochi-weather-region-v1', JSON.stringify({ pref: { code: '130000', name: '東京都' } }));
      if (shared) { localStorage.setItem('suuhimochi-shared-dictionary-v1', JSON.stringify({ fetchedAt: NOW, keywords: ['マインクラフト'] })); localStorage.setItem('suuhimochi-shared-dialogues-v1', JSON.stringify([{ keyword: 'マインクラフト', fetchedAt: NOW, items: [sharedItem] }])); }
      localStorage.setItem('__monologue_seeded', '1');
    }, { C, G, P, H, conversation: seeded, game, decided, weather, shared, sharedItem, NOW, legacyUses });
    let items = empty ? [] : [brief('google1'), { ...brief('wiki1', 'wikipedia_pageviews', 'マインクラフトの記事で、名前のつながりに気づいたの。', 'マインクラフトの世界'), relatedTo: ['マインクラフト'] },
      { ...brief('abcdefghijk', 'youtube', 'マインクラフトを動画で紹介する人もいるんだね。', 'マインクラフトの動画'), relatedTo: ['マインクラフト'] }];
    if (article) Object.assign(items[0], { articleUrl: 'https://news.example.com/story/original',
      sourceUrl: 'https://www.google.com/search?q=マインクラフト+話題&tbs=qdr%3Aw&hl=ja',
      googleSearchUrl: 'https://www.google.com/search?q=別の候補',
      xSearchUrl: 'https://www.google.com/search?q=マインクラフト+site%3Ax.com&tbs=qdr%3Aw&hl=ja' });
    if (long) items[0].aiDialogue = `${script}\n教えてもらった名前を思い出したけれど、まだ知らないこともいっぱいなの。\nひとつずつ確かめながら、ゆっくり読んでみたいな。`;
    if (youtube) items = items.filter((item) => item.source === 'youtube');
    if (unrelated) items = [{ ...brief('abcdefghijk', 'youtube', 'いろんな人が集まった動画なの。どんなお話になるのか、ぼくもちょっと気になるな。', '濃いメンツで集まりました'), relatedTo: ['濃いメンツで集まりました'] }];
    let offline = false, released = !slow, resolve; const calls = [];
    const pause = slow ? new Promise((r) => { resolve = r; }) : Promise.resolve();
    if (!live) {
      const topics = degraded ? normalizeHubFeed({ updatedAt: NOW, items: Array.from({ length: 50 }, (_, i) => ({ source: 'youtube', videoId: `degraded${String(i).padStart(3, '0')}`, url: `https://www.youtube.com/watch?v=degraded${String(i).padStart(3, '0')}`, title: `話題${i}・長い動画のタイトルからも違う名前を見つける`, categoryId: 'GAME_MEDIA', subcategoryId: 'GAME_MEDIA_3', publishedAt: NOW })) }, 'safe-youtube', new Date(NOW)) : [];
      await page.route('**/api/external-topics*', (route) => route.fulfill({ json: { schemaVersion: 2, fetchedAt: NOW, expiresAt: externalExpiry(new Date(NOW)), topics,
        ...(degraded ? { diagnostics: { feeds: [{ endpoint: 'safe-trends', fetchedAt: NOW, updatedAt: null, received: 0, status: 'ERROR', error: 'HTTP_503', cloudflareCode: 1102, retryAt: new Date(Date.parse(NOW) + 3600000).toISOString() }, { endpoint: 'safe-youtube', fetchedAt: NOW, updatedAt: NOW, received: 50, status: 'OK', error: null }], items: [] } } : {}) } }));
      await page.route('**/api/external-briefs*', async (route) => { calls.push(route.request().url()); if (!released) await pause; if (degraded) return route.fulfill({ status: 503, json: { error: 'BRIEFS_UNAVAILABLE', diagnostic: { error: 'HTTP_503', upstreamStatus: 503, cloudflareCode: 1102 } } }); if (offline) return route.fulfill({ status: 503, json: { error: 'BRIEFS_UNAVAILABLE' } }); return route.fulfill({ json: feed(items) }); });
    }
    await page.route('**/api/shared-knowledge/**', (route) => { calls.push(route.request().url()); return route.fulfill({ json: { status: 'OK', keyword: 'マインクラフト', keywords: ['マインクラフト'], nextOffset: null, items: [sharedItem] } }); });
    await page.route('**/api/weather*', (route) => route.fulfill({ json: { status: 'OK', prefecture: '東京都', representativeArea: true, office: { code: '130000', name: '東京都' }, area: { code: '130010', name: '東京地方' }, reportAt: NOW, retrievedAt: NOW,
      freshness: 'fresh', warning: null, source: '気象庁ホームページ', sourceUrl: 'https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json', note: '会話文は予報ではありません。', temperatureStation: null, temperaturePoints: [],
      days: [0, 1].map((offset) => ({ offset, date: `2026-10-${22 + offset}`, weather: '晴れ', weatherCode: '100', temperatureMinC: null, temperatureMaxC: null, precipitationPeriods: [] })),
      dialogue: { text: '今日は晴れの予報なの。明日の空もちょっと気になるね。', isForecast: false } } }));
    return { context, page, calls, release: () => { released = true; resolve?.(); }, offline: () => { offline = true; }, update: () => { items = [{ ...brief('new1', 'google_trending_now', '新しい言葉にもマインクラフトのつながりを見つけたの。', 'マインクラフトの新しい名前と関連する話題の長いタイトル'.repeat(8)), relatedTo: ['マインクラフト'] }]; } };
  };
  const history = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '[]'), H);
  const waitHistory = async (page, count) => {
    try { await page.waitForFunction(({ H, count }) => JSON.parse(localStorage.getItem(H) ?? '[]').length === count, { H, count }, { timeout: 35000 }); }
    catch (error) { console.log('DISPLAY DIAGNOSTIC', await page.evaluate(() => localStorage.getItem('suuhimochi-external-monologue-status-v1'))); throw error; }
  };
  const stoppedClocks = new WeakSet();
  const resumeClock = async (page) => { if (stoppedClocks.delete(page)) await page.clock.resume(); };
  const skipZoom = async (page) => {
    await page.locator('[data-startup-talk="active"]').waitFor();
    assert.equal(await page.locator('.world-layer-talk').count(), 1); assert.equal(await page.locator('.face-talk').count(), 1);
    await page.getByRole('button', { name: '部屋にもどる（スキップ）', exact: true }).click();
    await page.locator('[data-startup-talk="active"]').waitFor({ state: 'detached' });
    assert.equal(await page.locator('.world-layer-talk').count(), 0); assert.equal(await page.locator('.face-talk').count(), 0);
    await resumeClock(page);
  };
  const read = (page) => page.evaluate(({ G, C }) => ({ game: JSON.parse(localStorage.getItem(G)), talk: JSON.parse(localStorage.getItem(C)) }), { G, C });
  const invariant = (before, after) => {
    for (const key of ['personaExp', 'friendship', 'experienceFruits', 'journalNotes', 'dailyProgressRecords']) assert.deepEqual(after.game[key], before.game[key], key);
    for (const key of ['words', 'memories', 'relations', 'memoryRelations', 'memoryEpisodes', 'conversationCount', 'seenConversationIds', 'goalChecks']) assert.deepEqual(after.talk[key], before.talk[key], key);
  };
  const checkSource = async (page, label, hrefPattern, { truncate = false, screenshot } = {}) => {
    const caption = page.locator('[data-external-source]'); await caption.waitFor();
    await checkPlacement(page);
    const link = caption.getByRole('link', { name: label }); assert.match((await link.innerText()).replace(/\s+/g, ' '), label);
    const href = await link.getAttribute('href'); assert.match(href, hrefPattern);
    assert.equal(await link.getAttribute('target'), '_blank'); assert.match(await link.getAttribute('rel'), /noopener/);
    assert.match(await link.getAttribute('rel'), /noreferrer/); assert.equal(await link.getAttribute('referrerpolicy'), 'no-referrer');
    assert.equal(await link.locator('xpath=ancestor::button').count(), 0);
    const bounds = await caption.boundingBox(), viewport = page.viewportSize();
    assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y + bounds.height <= viewport.height + 1, JSON.stringify(bounds));
    if (truncate) assert.equal(await link.locator('span').last().evaluate((element) => element.scrollWidth > element.clientWidth && getComputedStyle(element).textOverflow === 'ellipsis'), true);
    await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 5000));
    stoppedClocks.add(page);
    if (screenshot) await page.screenshot({ path: `node_modules/.cache/${screenshot}` });
    const beforeLink = await read(page), count = (await history(page)).length;
    const beforePage = await page.locator('[data-external-bubble] > button').innerText();
    const zoom = await page.locator('[data-startup-talk="active"]').count();
    await page.context().route(href, (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><meta charset="utf-8"><title>確認用の元ネタ</title><p>リンク先</p>' }));
    const [popup] = await Promise.all([page.context().waitForEvent('page'), link.click()]); await popup.waitForLoadState('domcontentloaded');
    assert.equal(await popup.title(), '確認用の元ネタ'); assert.equal(await popup.evaluate(() => window.opener), null);
    assert.deepEqual(await read(page), beforeLink, 'source link must not mutate game or conversation state');
    assert.equal(await page.locator('[data-external-bubble] > button').innerText(), beforePage, 'source link must not advance the current page');
    assert.equal((await history(page)).length, count); assert.equal(await page.locator('[data-startup-talk="active"]').count(), zoom);
    assert.equal(await caption.count(), 1); await popup.close(); await page.bringToFront();
  };
  const checkPlacement = async (page, screenshot) => {
    await page.waitForFunction(() => document.querySelector('[data-external-bubble]')?.getAttribute('data-positioned') === 'true');
    const geometry = await page.evaluate(() => {
      const bubble = document.querySelector('[data-external-bubble]'), character = document.querySelector('.mochi');
      const box = bubble.getBoundingClientRect(), actor = character.getBoundingClientRect();
      const appearance = getComputedStyle(bubble);
      const obstacles = [...document.querySelectorAll('.game-status, .room-nav, .startup-story-skip, [data-shared-source]')].map((e) => e.getBoundingClientRect());
      const overlaps = (a, b) => Math.min(a.right, b.right) > Math.max(a.left, b.left) && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
      return { side: bubble.dataset.externalSide, expected: actor.left + actor.width / 2 < innerWidth / 2 ? 'right' : 'left',
        inView: box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom + 30 <= innerHeight,
        overlaps: overlaps(box, actor), uiOverlap: obstacles.some((o) => o.width && o.height && overlaps(box, o)),
        framed: bubble.dataset.externalPresentation === 'bubble'
          && (appearance.backgroundColor !== 'rgba(0, 0, 0, 0)' || appearance.backgroundImage !== 'none')
          && parseFloat(appearance.borderTopWidth) > 0 && appearance.borderTopStyle !== 'none'
          && parseFloat(appearance.borderTopLeftRadius) > 0 && appearance.boxShadow !== 'none'
          && getComputedStyle(bubble.querySelector('button')).textShadow === 'none',
        tail: Boolean(bubble.querySelector('[data-external-tail]')?.getAttribute('points')),
        textInside: [...bubble.querySelectorAll('.face-talk-line, .thought-bubble-text, .face-talk-page, .thought-bubble-page, .face-talk-continue, .thought-bubble-next')].every((node) => {
          const r = node.getBoundingClientRect(); return r.left >= box.left && r.top >= box.top && r.right <= box.right && r.bottom <= box.bottom;
        }) };
    });
    assert.equal(geometry.side, geometry.expected); assert.equal(geometry.inView, true, JSON.stringify(geometry));
    assert.equal(geometry.overlaps, false, JSON.stringify(geometry)); assert.equal(geometry.uiOverlap, false, JSON.stringify(geometry));
    assert.equal(geometry.framed, true, JSON.stringify(geometry)); assert.equal(geometry.tail, true);
    assert.equal(geometry.textInside, true, JSON.stringify(geometry));
    if (screenshot) await page.screenshot({ path: `node_modules/.cache/${screenshot}.png` });
  };
  const checkClickFlow = async (mobile) => {
    const flow = await setup({ mobile, long: true }), page = flow.page;
    await page.goto(BASE); await waitHistory(page, 1);
    const bubble = page.locator('[data-external-bubble]'), action = bubble.locator(':scope > button');
    await action.click(); await page.clock.fastForward(400); // Finish the existing typewriter first, without changing pages.
    const firstPage = await action.innerText(); assert.match(firstPage, /1\//); assert.match(firstPage, /▼ クリックして進む/);
    await page.clock.fastForward(30000); assert.equal(await action.innerText(), firstPage, 'external zoom must not advance or disappear automatically');
    await checkPlacement(page, `external-click-${mobile ? 'mobile' : 'desktop'}`);
    const saved = await read(page);
    await action.dblclick(); await page.clock.fastForward(400); await action.click(); await page.clock.fastForward(400);
    assert.match(await action.innerText(), /2\//, 'double click advances one page only');
    // Repainting and newly arriving information cannot replace the current page.
    flow.update(); await page.locator('.dev-panel > summary').click();
    await page.getByRole('tab', { name: '外部話題', exact: true }).click();
    await page.getByRole('region', { name: '外部話題モニター', exact: true }).getByRole('button', { name: '今すぐ再取得', exact: true }).click();
    await page.waitForTimeout(1000); await page.locator('.dev-panel > summary').click();
    await page.clock.fastForward(30000); assert.match(await action.innerText(), /2\//); assert.equal((await history(page)).length, 1);
    const originalStyle = await page.locator('.mochi').getAttribute('style');
    for (const x of [5, 70]) {
      await page.locator('.mochi').evaluate((element, x) => {
        const current = element.getBoundingClientRect(), world = element.closest('.world-layer').getBoundingClientRect();
        const target = x === 5 ? 20 : innerWidth - current.width - 20;
        element.style.transition = 'none'; element.style.left = `${parseFloat(element.style.left) + (target - current.left) / world.width * 100}%`;
      }, x);
      await page.waitForTimeout(150);
      await checkPlacement(page, `external-click-${mobile ? 'mobile' : 'desktop'}-${x}`);
    }
    await page.locator('.mochi').evaluate((element, value) => element.setAttribute('style', value), originalStyle);
    await page.waitForTimeout(150);
    await checkSource(page, /最近の話題をGoogleで検索/, /^https:\/\/www\.google\.com\/search\?/);
    await resumeClock(page);
    for (let clicks = 0; clicks < 12 && await bubble.count(); clicks++) {
      if (await bubble.locator('.speech-caret').count()) { await action.click(); await page.clock.fastForward(400); }
      await action.click(); await page.clock.fastForward(400);
    }
    await page.locator('[data-startup-talk="active"]').waitFor({ state: 'detached' });
    assert.equal(await page.locator('.world-layer-talk').count(), 0);
    invariant(saved, await read(page));
    // A pending refresh is allowed only after the preceding conversation has ended.
    await waitHistory(page, 2); assert.equal((await history(page))[1].id, 'google:new1');
    await checkPlacement(page);
    const roomAction = page.locator('[data-external-bubble] > button'), roomFirst = await roomAction.innerText();
    await page.clock.fastForward(30000); assert.equal(await roomAction.innerText(), roomFirst, 'room monologue also waits for a click');
    await roomAction.dblclick(); assert.equal(await page.locator('[data-external-bubble]').count(), 0, 'one-page room monologue ends on click');
    await flow.context.close(); console.log(`PASS click/position ${mobile ? 'mobile' : 'desktop'}: hold, pages, double click, update deferral, both sides, source link, final close`);
  };
  const first = await setup(); const { page } = first; await page.goto(BASE); await page.locator('.game-status').waitFor({ timeout: 35000 });
  const before = await read(page); await waitHistory(page, 1); let spoken = await history(page);
  assert.equal(spoken[0].text, script); assert.equal(spoken[0].trigger, 'startup'); assert.equal(await page.locator('[data-startup-talk="active"]').count(), 1);
  assert.equal((await read(page)).talk.externalTopicHistory.at(-1).lines[0], script); invariant(before, await read(page));
  await checkSource(page, /最近の話題をGoogleで検索/, /^https:\/\/www\.google\.com\/search\?/, { screenshot: 'external-source-desktop.png' });
  assert.equal(await page.locator('.thought-bubble').count(), 0); await skipZoom(page);
  assert.equal(await page.locator('[data-external-source]').count(), 0);
  assert.equal((await read(page)).talk.externalTopicHistory.at(-1).startupOutcome, 'SKIPPED');
  await page.clock.fastForward(14000); assert.equal((await history(page)).length, 1);
  await page.reload(); await page.locator('.game-status').waitFor({ timeout: 35000 }); await waitHistory(page, 2); spoken = await history(page);
  assert.notEqual(spoken[0].id, spoken[1].id); assert.notEqual(spoken[0].source, spoken[1].source);
  await checkSource(page, /Wikipedia/, /^https:\/\/ja\.wikipedia\.org\//);
  await skipZoom(page);
  await page.clock.fastForward(35000); await page.locator('.dev-panel > summary').click(); await page.getByRole('tab', { name: '外部話題', exact: true }).click();
  const monitor = page.getByRole('region', { name: '外部話題モニター', exact: true }); await monitor.waitFor(); first.update();
  await monitor.getByRole('button', { name: '今すぐ再取得', exact: true }).click(); await page.waitForTimeout(1200);
  assert.equal((await history(page)).length, 2); assert.equal(await page.locator('.world-layer-talk').count(), 0);
  await page.locator('.dev-panel > summary').click(); await waitHistory(page, 3); spoken = await history(page);
  assert.equal(spoken[2].trigger, 'update'); assert.equal(spoken[2].id, 'google:new1'); invariant(before, await read(page));
  await checkSource(page, /最近の話題をGoogleで検索/, /^https:\/\/www\.google\.com\/search\?/, { truncate: true });
  await resumeClock(page);
  await page.clock.fastForward(15000); assert.equal((await history(page)).length, 3);
  assert.ok(first.calls.every((url) => !decodeURIComponent(url).includes('送らない'))); await first.context.close();
  console.log('PASS browser Day16: reload zoom, one-tap skip/camera restoration, raw Gemma, no rewards/12 slots, restart rotation, manual refresh one event');

  const slow = await setup({ slow: true }); await slow.page.goto(BASE); await slow.page.locator('.game-status').waitFor({ timeout: 35000 });
  await slow.page.getByRole('button', { name: '天気の都道府県を選ぶ', exact: true }).click(); slow.release(); await slow.page.waitForTimeout(1500);
  assert.equal((await history(slow.page)).length, 0); assert.equal(await slow.page.locator('.world-layer-talk').count(), 0);
  await slow.page.clock.fastForward(125000); assert.equal((await history(slow.page)).length, 0);
  await slow.page.getByRole('button', { name: '設定を閉じる', exact: true }).click(); await waitHistory(slow.page, 1); await skipZoom(slow.page); await slow.context.close();
  console.log('PASS browser: slow network never blocks room/settings; speech waits for idle');

  const weather = await setup({ empty: true, weather: true, decided: false }); await weather.page.goto(BASE);
  const notice = weather.page.getByRole('dialog', { name: '共有知識への参加設定' }); await notice.waitFor({ timeout: 35000 }); await weather.page.waitForTimeout(3500);
  assert.equal((await history(weather.page)).length, 0); assert.equal(await weather.page.locator('.thought-bubble').count(), 0);
  await notice.getByRole('button', { name: '今はいいよ', exact: true }).click(); await waitHistory(weather.page, 1);
  assert.equal((await history(weather.page))[0].source, 'weather'); assert.equal((await history(weather.page))[0].text, '今日は晴れの予報なの。明日の空もちょっと気になるね。');
  await checkSource(weather.page, /気象庁.*東京都.*東京地方/, /^https:\/\/www\.jma\.go\.jp\//);
  await skipZoom(weather.page);
  assert.ok(!weather.calls.some((url) => url.includes('shared-knowledge'))); await weather.context.close();
  console.log('PASS browser: no interruption before consent, OFF sends no learned words, weather original uses no normal conversation');

  const shared = await setup({ shared: true }); await shared.page.goto(BASE); await shared.page.locator('.game-status').waitFor({ timeout: 35000 }); await waitHistory(shared.page, 1);
  assert.equal((await history(shared.page))[0].source, 'shared');
  const citation = shared.page.getByRole('complementary', { name: '共有知識の出典', exact: true }); await citation.waitFor();
  assert.equal(await citation.getByRole('link').getAttribute('target'), '_blank'); assert.match(await citation.getByRole('link').getAttribute('href'), /^https:\/\/ja\.wikipedia\.org\//);
  assert.ok(shared.calls.filter((url) => url.includes('/dialogues?')).every((url) => new URL(url).searchParams.get('keyword') === 'マインクラフト'));
  assert.equal((await read(shared.page)).talk.sharedKnowledgeHistory.length, 1);
  await checkSource(shared.page, /Wikipedia共有知識庫.*マインクラフト/, /^https:\/\/ja\.wikipedia\.org\//);
  await skipZoom(shared.page); assert.equal(await citation.count(), 0);
  assert.equal((await read(shared.page)).talk.sharedKnowledgeHistory[0].outcome, 'SKIPPED');
  await shared.context.close();
  console.log('PASS browser: opt-in exact-match shared knowledge is a monologue candidate');

  const empty = await setup({ empty: true }); await empty.page.goto(BASE); await empty.page.locator('.game-status').waitFor({ timeout: 35000 }); await empty.page.waitForTimeout(1800);
  assert.equal((await history(empty.page)).length, 0); assert.equal(await empty.page.locator('.world-layer-talk').count(), 0);
  await empty.page.clock.pauseAt(new Date(await empty.page.evaluate(() => Date.now()) + 5000));
  await empty.page.getByRole('button', { name: 'はなす', exact: true }).click(); await empty.page.getByRole('button', { name: /お話する/ }).click();
  await empty.page.locator('.face-talk-bubble, .person-combo-invite').waitFor();
  if (await empty.page.locator('.person-combo-invite').isVisible()) await empty.page.getByRole('button', { name: /今日はやめとく/ }).click();
  await empty.page.locator('.face-talk-bubble').waitFor(); assert.equal(await empty.page.locator('[data-external-source]').count(), 0);
  assert.notEqual(await empty.page.locator('.face-talk-bubble').evaluate((element) => getComputedStyle(element).borderTopWidth), '0px', 'ordinary conversations retain their bubble');
  await empty.context.close();
  console.log('PASS browser: zero topics still opens an interactive room');
  const mobile = await setup({ mobile: true }); await mobile.page.goto(BASE); await waitHistory(mobile.page, 1);
  await checkSource(mobile.page, /最近の話題をGoogleで検索/, /^https:\/\/www\.google\.com\/search\?/, { screenshot: 'external-source-mobile.png' }); await skipZoom(mobile.page);
  await mobile.context.close(); console.log('PASS browser Day16 mobile: startup zoom and immediate room return');
  if (!process.env.SUUHIMOCHI_SKIP_LIVE_EXTERNAL) {
  const live = await setup({ live: true }); await live.page.goto(BASE); await live.page.locator('.game-status').waitFor({ timeout: 35000 });
  const liveHour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tokyo', hour: '2-digit', hourCycle: 'h23' }).format(new Date()));
  if (liveHour < 7) {
    await live.page.waitForFunction(() => JSON.parse(localStorage.getItem('suuhimochi-external-monologue-status-v1') ?? 'null')?.reason === '睡眠中です', undefined, { timeout: 35000 });
    assert.equal((await history(live.page)).length, 0); assert.equal(await live.page.locator('.world-layer-talk').count(), 0);
    console.log('PASS browser live public API: nighttime does not interrupt sleep');
  } else {
    await waitHistory(live.page, 1); await skipZoom(live.page);
    console.log('PASS browser Day16 live public API:', JSON.stringify((await history(live.page)).map(({ source, trigger }) => ({ source, trigger }))));
  }
  await live.context.close();
  }
  for (const mobile of [false, true]) {
    const article = await setup({ article: true, mobile }); await article.page.goto(BASE); await waitHistory(article.page, 1);
    await checkSource(article.page, /最近の話題をGoogleで検索/, /^https:\/\/www\.google\.com\/search\?/);
    const search = new URL(await article.page.getByRole('link', { name: /最近の話題をGoogleで検索/ }).getAttribute('href'));
    assert.equal(search.searchParams.get('q'), 'マインクラフト 話題'); assert.equal(search.searchParams.get('tbs'), 'qdr:w');
    await checkSource(article.page, /Xで話題を見る/, /^https:\/\/www\.google\.com\/search\?/);
    await checkSource(article.page, /関連記事/, /^https:\/\/news\.example\.com\/story\/original$/, { screenshot: `google-search-links-${mobile ? 'mobile' : 'desktop'}.png` });
    assert.doesNotMatch(await article.page.locator('[data-external-source]').innerText(), /Googleトレンドで見る|元ネタ/);
    await skipZoom(article.page); await article.context.close();
  }
  const video = await setup({ youtube: true }); await video.page.goto(BASE); await waitHistory(video.page, 1);
  await checkSource(video.page, /YouTube/, /^https:\/\/www\.youtube\.com\/watch\?v=abcdefghijk$/); await skipZoom(video.page); await video.context.close();
  await checkClickFlow(false); await checkClickFlow(true);
  for (const mobile of [false, true]) {
    const degraded = await setup({ mobile, degraded: true }); const page = degraded.page;
    await page.goto(BASE); await waitHistory(page, 5);
    const before = await read(page), selected = (await history(page)).at(-1);
    assert.equal(selected.source, 'youtube'); assert.match(selected.text, /「話題/); assert.doesNotMatch(selected.text, /まだ知らない名前/);
    await checkSource(page, /YouTube/, /^https:\/\/www\.youtube\.com\/watch\?v=degraded/, { screenshot: `external-degraded-${mobile ? 'mobile' : 'desktop'}.png` });
    await skipZoom(page); await page.reload(); await waitHistory(page, 6);
    assert.notEqual((await history(page)).at(-1).id, selected.id);
    assert.equal(degraded.calls.filter((url) => url.includes('external-briefs')).length, 1, '再読み込みでも1102を連続取得しない');
    await checkPlacement(page); invariant(before, await read(page));
    await skipZoom(page); await degraded.context.close();
    console.log(`PASS degraded ${mobile ? 'mobile' : 'PC'}: trends/briefs 503 + 50 videos + old repeated scripts still show framed new speech; reload/backoff/no reward`);
  }
  const unrelated = await setup({ unrelated: true }); await unrelated.page.goto(BASE); await waitHistory(unrelated.page, 1);
  const use = (await read(unrelated.page)).talk.externalTopicHistory.at(-1);
  assert.equal(use.kind, 'general'); assert.equal(use.wordId, ''); assert.equal(use.word, '');
  assert.equal((await history(unrelated.page))[0].text, 'いろんな人が集まった動画なの。どんなお話になるのか、ぼくもちょっと気になるな。');
  await unrelated.page.getByRole('button', { name: '外部情報をクリックして進む', exact: true }).click();
  assert.doesNotMatch(await unrelated.page.locator('[data-external-bubble] > button').innerText(), /教えてもらったまり/);
  await skipZoom(unrelated.page); await unrelated.context.close();
  console.log('PASS learned まり does not match 集まりました; original Gemma dialogue remains a general topic');
  assert.deepEqual(errors, []); console.log('External monologues browser: passed (degraded sources/backoff, word-boundary regression, Google search/X/article links, all five sources, click-only pages, no replacement, positioning, popup state preservation, ellipsis, normal talk exclusion)');
} finally { await browser.close(); await vite.close(); }
