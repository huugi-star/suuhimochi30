import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'vite';
process.env.TZ = 'Asia/Tokyo';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.SUUHIMOCHI_BROWSER_MODULES || process.cwd()] }));
const baseURL = process.env.SUUHIMOCHI_TEST_URL || 'http://localhost:3000';
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false }, appType: 'custom' });
const browser = await chromium.launch({ headless: true, ...(process.env.SUUHIMOCHI_BROWSER_EXECUTABLE ? { executablePath: process.env.SUUHIMOCHI_BROWSER_EXECUTABLE } : {}) });
try {
  const { EMPTY_SAVE } = await vite.ssrLoadModule('/lib/storage.ts');
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const { inspectHubFeed, normalizeHubFeed, externalExpiry } = await vite.ssrLoadModule('/lib/externalTopics.ts');
  const now = new Date('2026-10-18T12:00:00+09:00'); let at = new Date('2026-10-17T12:00:00+09:00');
  const keys = ['suuhimochi_conversation_v6_choices', 'suuhimochi-30days-save-v1', 'suuhimochi-public-topics-v1'];
  const video = (id, title, extra = {}) => ({ source: 'youtube', videoId: id, title, url: `https://www.youtube.com/watch?v=${id}`,
    categoryId: 'GAME_MEDIA', subcategoryId: 'GAME_MEDIA_3', publishedAt: now.toISOString(), ...extra });
  const feeds = { 'safe-trends': { updatedAt: now.toISOString(), items: [
    { id: 'craft', source: 'google', title: 'マインクラフト', categoryId: 'GAME_MEDIA', subcategoryId: 'GAME_MEDIA_3', url: 'https://trends.google.com/trending' },
    { id: 'aurora', source: 'wikipedia', title: 'オーロラ', categoryId: 'NATURE_TIME', subcategoryId: 'NATURE_TIME_6', url: 'https://ja.wikipedia.org/wiki/オーロラ' },
  ] }, 'safe-youtube': { updatedAt: now.toISOString(), items: [video('aaaaaaaaaaa', 'マインクラフトの紹介'), video('bbbbbbbbbbb', '別の作品'),
    video('ccccccccccc', '古い話題', { publishedAt: '2020-01-01T00:00:00Z' })] } };
  const makeSnapshot = (more = false) => {
    const data = structuredClone(feeds); if (more) data['safe-youtube'].items.push(video('ddddddddddd', 'マインクラフトの新しい紹介'));
    const reports = Object.entries(data).map(([endpoint, value]) => inspectHubFeed(value, endpoint, now));
    return { schemaVersion: 2, fetchedAt: now.toISOString(), expiresAt: externalExpiry(now), topics: Object.entries(data).flatMap(([endpoint, value]) => normalizeHubFeed(value, endpoint, now)),
      diagnostics: { feeds: reports.flatMap((report) => report.feeds), items: reports.flatMap((report) => report.items) } };
  };
  const data = new Map(); const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
  const talk = new SuuhimochiConversation({ storage, now: () => at, random: () => 0 });
  talk.setGoal('作品を作る'); talk.startWordTeaching(); talk.submit('マインクラフト'); talk.chooseCategory('GAME_MEDIA'); talk.chooseSubCategory('GAME_MEDIA_3'); talk.choose('WORD_INTERESTED');
  const used = { ...makeSnapshot().topics[0], updatedAt: at.toISOString(), publishedAt: at.toISOString() };
  talk.setExternalTopics({ fetchedAt: at.toISOString(), expiresAt: externalExpiry(at), topics: [used] }); talk.openExternalDiscovery('normal');
  at = now; const conversation = JSON.parse(data.get(keys[0]));
  conversation.startupExternalAttempts = [{ activityDate: '2026-10-18', outcome: 'NO_TOPIC' }];
  const errors = [];
  for (const { name, viewport, mobile } of [{ name: 'desktop', viewport: { width: 1365, height: 900 }, mobile: false }, { name: 'phone', viewport: { width: 844, height: 390 }, mobile: true }]) {
    const context = await browser.newContext({ viewport, timezoneId: 'Asia/Tokyo', isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage(); page.on('pageerror', (error) => errors.push(error.message));
    await page.clock.setFixedTime(now);
    await page.addInitScript(({ keys, conversation, game, snapshot }) => {
      localStorage.setItem(keys[0], JSON.stringify(conversation)); localStorage.setItem(keys[1], JSON.stringify(game)); localStorage.setItem(keys[2], JSON.stringify(snapshot));
    }, { keys, conversation, game: { ...structuredClone(EMPTY_SAVE), introComplete: true, birthday: '2000-01-01', day: 2 }, snapshot: makeSnapshot() });
    let failing = false; let requests = 0;
    await page.route('**/api/external-topics*', (route) => { requests++; return failing ? route.fulfill({ status: 503, body: 'unavailable' }) : route.fulfill({ json: makeSnapshot(true) }); });
    await page.goto(baseURL); await page.locator('.game-status').waitFor({ timeout: 60000 });
    await page.locator('[data-startup-talk="active"]').waitFor({ timeout: 35000 }); await page.keyboard.press('Escape');
    await page.locator('.dev-panel > summary').click(); await page.getByRole('tab', { name: '外部話題', exact: true }).click();
    const monitor = page.getByRole('region', { name: '外部話題モニター', exact: true }); await monitor.waitFor();
    assert.match(await monitor.getByTestId('external-received').innerText(), /5件（Google 1／Wikipedia 1／YouTube 3／情報源不明 0）/);
    assert.equal(await monitor.locator('.external-topic-card').count(), 5);
    await monitor.getByLabel('外部話題の使用状態').selectOption('USED'); assert.equal(await monitor.locator('.external-topic-card').count(), 2);
    assert.match((await monitor.locator('.external-topic-card').allInnerTexts()).join(''), /2026-10-17/);
    await monitor.getByLabel('外部話題の使用状態').selectOption('ALL');
    await monitor.getByLabel('外部話題の情報源').selectOption('youtube'); assert.equal(await monitor.locator('.external-topic-card').count(), 3);
    await monitor.getByLabel('外部話題の採用状態').selectOption('CANDIDATE'); assert.equal(await monitor.locator('.external-topic-card').count(), 1);
    const before = await page.evaluate((keys) => keys.slice(0, 2).map((key) => localStorage.getItem(key)), keys);
    await monitor.getByRole('button', { name: '会話プレビュー', exact: true }).click();
    await monitor.getByRole('region', { name: '外部話題の会話プレビュー', exact: true }).waitFor();
    const after = await page.evaluate((keys) => keys.slice(0, 2).map((key) => localStorage.getItem(key)), keys);
    assert.deepEqual(after, before); assert.equal(await page.locator('.world-layer-talk').count(), 0);
    await monitor.getByRole('button', { name: 'プレビューを閉じる', exact: true }).click();
    await monitor.getByLabel('外部話題の情報源').selectOption('ALL'); await monitor.getByLabel('外部話題の採用状態').selectOption('ALL');
    await monitor.getByRole('button', { name: '今すぐ再取得', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-testid="external-received"]')?.textContent?.startsWith('6件'));
    assert.equal(requests, 1);
    const goodCache = await page.evaluate((key) => localStorage.getItem(key), keys[2]); failing = true;
    await monitor.getByRole('button', { name: '今すぐ再取得', exact: true }).click();
    await monitor.getByText(/取得失敗：HTTP_503/).waitFor();
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), keys[2]), goodCache);
    assert.equal(await monitor.locator('.external-topic-card').count(), 6);
    const afterRefresh = await page.evaluate((keys) => keys.slice(0, 2).map((key) => localStorage.getItem(key)), keys);
    const priorConversation = JSON.parse(before[0]); const nextConversation = JSON.parse(afterRefresh[0]);
    for (const metadata of ['externalCatalog', 'startupExternalAttempts']) { delete priorConversation[metadata]; delete nextConversation[metadata]; }
    assert.deepEqual(nextConversation, priorConversation); assert.equal(afterRefresh[1], before[1]);
    assert.equal(await page.locator('[data-startup-talk="active"]').count(), 0);
    const panel = await page.locator('.dev-panel > div').boundingBox(); assert.ok(panel.x >= 0 && panel.width <= viewport.width);
    await page.screenshot({ path: `.output/external-monitor-${name}.png` });
    await context.close(); console.log(`PASS browser ${name}: tabs, counts, filters, history, isolated preview, refresh and failure-cache preservation`);
  }
  assert.deepEqual(errors, []); console.log('External monitor browser: 2 viewports passed, no uncaught errors');
} finally { await browser.close(); await vite.close(); }
