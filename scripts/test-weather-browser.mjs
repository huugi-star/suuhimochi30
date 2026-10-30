import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'vite';
import { prefectures } from './fixtures/weather-prefectures.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.SUUHIMOCHI_BROWSER_MODULES || process.cwd()] }));
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
const browser = await chromium.launch({ headless: true, ...(process.env.SUUHIMOCHI_BROWSER_EXECUTABLE ? { executablePath: process.env.SUUHIMOCHI_BROWSER_EXECUTABLE } : {}) });
const BASE = process.env.SUUHIMOCHI_TEST_URL || 'http://127.0.0.1:4185', NOW = '2026-10-22T13:00:00+09:00';
const C = 'suuhimochi_conversation_v6_choices', G = 'suuhimochi-30days-save-v1', P = 'suuhimochi-shared-knowledge-consent-v1';
const selection = { pref: { code: '130000', name: '東京都' } };
const line = '今日は晴れの予報なんだね。窓の向こうが明るいと、ちょっと遠くまで見たくなるの。';
const rawForecast = () => ({ status: 'OK', prefecture: '東京都', representativeArea: true, office: selection.pref, area: { code: '130010', name: '東京地方' }, reportAt: '2026-10-22T11:00:00+09:00', retrievedAt: NOW,
  freshness: 'fresh', warning: null, source: '気象庁ホームページ', sourceUrl: 'https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json', note: '会話文は予報ではありません。',
  temperatureStation: { code: '44132', name: '東京' }, temperaturePoints: [{ at: '2026-10-22T09:00:00+09:00', valueC: 25 }, { at: '2026-10-23T00:00:00+09:00', valueC: 14 }],
  days: [0, 1].map((offset) => ({ offset, date: `2026-10-${22 + offset}`, weather: offset ? '晴れ　夜　くもり' : '晴れ　夕方　から　くもり', weatherCode: '111', temperatureMinC: null, temperatureMaxC: null,
    precipitationPeriods: [{ from: `2026-10-${22 + offset}T12:00:00+09:00`, to: `2026-10-${22 + offset}T18:00:00+09:00`, probabilityPercent: offset ? 40 : 0 }] })), dialogue: { text: line, isForecast: false } });
const errors = [];
try {
  const { EMPTY_SAVE } = await vite.ssrLoadModule('/lib/storage.ts'), { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const { externalExpiry } = await vite.ssrLoadModule('/lib/externalTopics.ts');
  const data = new Map(), storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
  const talk = new SuuhimochiConversation({ storage, now: () => new Date(NOW) }); talk.setGoal('作品を作る');
  const conversation = JSON.parse(data.get(C)); conversation.startDate = '2026-10-21';
  const game = { ...structuredClone(EMPTY_SAVE), birthday: '2000-01-01', introComplete: true, day: 2, journalNotes: { '2026-10-21': ['送らない日誌'] } };
  const setup = async ({ mobile = false, selected = false, decided = true, slow = false, legacy = false } = {}) => {
    const context = await browser.newContext({ viewport: mobile ? { width: 844, height: 390 } : { width: 1365, height: 900 }, timezoneId: 'Asia/Tokyo', isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage(); page.on('pageerror', (error) => errors.push(error.message)); await page.clock.setFixedTime(new Date(NOW));
    await page.addInitScript(({ C, G, P, conversation, game, selection, selected, decided, NOW, expiry, legacy }) => {
      if (localStorage.getItem('__weather_seeded')) return;
      localStorage.setItem(C, JSON.stringify(conversation)); localStorage.setItem(G, JSON.stringify(game)); localStorage.setItem(P, JSON.stringify({ version: 1, enabled: false, decided }));
      if (selected) localStorage.setItem('suuhimochi-weather-region-v1', JSON.stringify(legacy ? { office: selection.pref, area: { code: '130020', name: '伊豆諸島北部' }, station: { code: '44172', name: '大島' } } : selection));
      localStorage.setItem('suuhimochi-public-topics-v1', JSON.stringify({ schemaVersion: 2, fetchedAt: NOW, expiresAt: expiry, topics: [] }));
      localStorage.setItem('__weather_seeded', '1');
    }, { C, G, P, conversation, game, selection, selected, decided, NOW, expiry: externalExpiry(new Date(NOW)), legacy });
    let current = rawForecast(), offline = false, release; const calls = [];
    await page.route('**/api/external-topics*', (route) => route.fulfill({ json: { schemaVersion: 2, fetchedAt: NOW, expiresAt: externalExpiry(new Date('2026-10-22T15:00:00+09:00')), topics: [] } }));
    await page.route('**/api/weather*', async (route) => {
      const req = route.request(), url = new URL(req.url()); calls.push({ url: url.href, body: req.postData() });
      if (url.searchParams.get('resource') === 'regions') return route.fulfill({ json: { status: 'OK', areaLevel: 'prefectures', count: 47, areas: prefectures } });
      assert.equal(url.searchParams.get('resource'), 'forecast'); assert.equal(url.searchParams.get('pref'), '130000');
      for (const key of ['office', 'area', 'station']) assert.equal(url.searchParams.has(key), false);
      if (slow && !release) await new Promise((resolve) => { release = resolve; });
      if (offline) return route.fulfill({ status: 503, json: { error: 'WEATHER_UNAVAILABLE' } });
      return route.fulfill({ json: current });
    });
    return { context, page, calls, setOffline: () => { offline = true; }, update: () => { current = { ...rawForecast(), reportAt: '2026-10-22T14:00:00+09:00', dialogue: { text: '明日は晴れのあとにくもる予報なの。空の色が途中で変わるのかな。', isForecast: false } }; }, release: () => release?.() };
  };
  const first = await setup(); const { page } = first; await page.goto(BASE); await page.locator('.game-status').waitFor({ timeout: 35000 });
  assert.equal(first.calls.length, 0); await page.getByRole('button', { name: '天気の都道府県を選ぶ', exact: true }).click();
  const before = await page.evaluate(({ G, C }) => ({ game: JSON.parse(localStorage.getItem(G)), conversation: JSON.parse(localStorage.getItem(C)) }), { G, C });
  await page.getByLabel('天気の都道府県', { exact: true }).selectOption('130000');
  const settings = page.getByRole('region', { name: '天気予報の設定', exact: true }); await settings.getByText('気温（東京・時刻別）：09:00 25℃', { exact: true }).waitFor();
  assert.equal(await settings.getByRole('combobox').count(), 1); assert.equal(await settings.locator('select option').count(), 48);
  assert.match(await settings.innerText(), /最高 未提供 ／ 最低 未提供/); assert.match(await settings.innerText(), /12:00〜18:00：0%/); assert.match(await settings.innerText(), /40%/);
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('suuhimochi-weather-region-v1'))), selection);
  await page.waitForTimeout(5100); assert.equal(await page.locator('.thought-bubble').count(), 0); assert.equal(await page.locator('.world-layer-talk').count(), 0);
  await page.getByRole('button', { name: '設定を閉じる', exact: true }).click();
  await page.locator('.thought-bubble').filter({ hasText: '今日は晴れの予報なんだね。' }).waitFor({ timeout: 22000 });
  const spoken = await page.evaluate(() => JSON.parse(localStorage.getItem('suuhimochi-weather-spoken-v1'))); assert.equal(spoken.length, 1); assert.equal(spoken[0].text, line);
  const after = await page.evaluate(({ G, C }) => ({ game: JSON.parse(localStorage.getItem(G)), conversation: JSON.parse(localStorage.getItem(C)) }), { G, C });
  for (const key of ['personaExp', 'friendship', 'experienceFruits', 'journalNotes', 'dailyProgressRecords']) assert.deepEqual(after.game[key], before.game[key], key);
  assert.deepEqual(after.conversation, before.conversation, 'weather monologue must not modify conversation or learning state');
  await page.locator('.thought-bubble').click();
  await page.getByRole('button', { name: '天気予報を開く', exact: true }).click(); const panel = page.getByRole('complementary', { name: '天気予報', exact: true }); await panel.waitFor();
  assert.match(await panel.innerText(), /今日/); assert.match(await panel.innerText(), /明日/); assert.equal(await panel.getByRole('link').getAttribute('target'), '_blank');
  assert.match(await panel.innerText(), /代表区域「東京地方」/); assert.match(await panel.innerText(), /都道府県全域の天気を表すものではありません/);
  assert.equal(await panel.getByRole('link').innerText(), '気象庁'); assert.match(await panel.innerText(), /10\/22 11:00 発表/);
  await page.screenshot({ path: '.output/weather-desktop.png' });
  await page.reload(); await page.getByRole('button', { name: '天気予報を開く', exact: true }).click(); await panel.waitFor();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('suuhimochi-weather-spoken-v1')).length), 1);
  first.update(); await page.clock.setFixedTime(new Date('2026-10-22T14:01:00+09:00'));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('suuhimochi-weather-cache-v1'))?.forecast.reportAt.includes('14:00'));
  assert.equal(await page.locator('.thought-bubble').count(), 0);
  await panel.getByRole('button', { name: '天気予報を閉じる', exact: true }).click();
  await page.locator('.thought-bubble').filter({ hasText: '明日は晴れのあとにくもる予報なの。' }).waitFor({ timeout: 22000 });
  await page.locator('.thought-bubble').click();
  await page.getByRole('button', { name: '天気予報を開く', exact: true }).click(); await panel.waitFor();
  const saved = await page.evaluate(() => localStorage.getItem('suuhimochi-weather-cache-v1')); first.setOffline();
  await panel.getByRole('button', { name: '予報を更新', exact: true }).click(); await panel.getByRole('status').waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('suuhimochi-weather-cache-v1')), saved);
  assert.match(await panel.innerText(), /保存済みの予報/); assert.ok(first.calls.every((call) => call.body === null && !decodeURIComponent(call.url).includes('送らない')));
  await first.context.close(); console.log('PASS browser desktop: region save, original forecast, idle monologue, zero conversation/rewards, restart, update and offline fallback');

  const mobile = await setup({ mobile: true, selected: true, decided: false, legacy: true }); await mobile.page.goto(BASE);
  const notice = mobile.page.getByRole('dialog', { name: '共有知識への参加設定' }); await notice.waitFor({ timeout: 35000 });
  await mobile.page.waitForTimeout(5500); assert.equal(await mobile.page.locator('.thought-bubble').count(), 0);
  await notice.getByRole('button', { name: '今はいいよ', exact: true }).click(); await mobile.page.getByRole('button', { name: '天気予報を開く', exact: true }).click();
  const mobilePanel = mobile.page.getByRole('complementary', { name: '天気予報', exact: true }); await mobilePanel.waitFor();
  assert.deepEqual(await mobile.page.evaluate(() => JSON.parse(localStorage.getItem('suuhimochi-weather-region-v1'))), selection);
  const bounds = await mobilePanel.boundingBox(); assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= 844 && bounds.y + bounds.height <= 390);
  await mobile.page.screenshot({ path: '.output/weather-mobile.png' }); await mobile.context.close();
  console.log('PASS browser mobile: forecast within viewport, shared-choice screen is not interrupted by weather monologue');

  const slow = await setup({ selected: true, slow: true }); await slow.page.goto(BASE); await slow.page.locator('.game-status').waitFor({ timeout: 35000 });
  await slow.page.getByRole('button', { name: '日誌', exact: true }).click(); await slow.page.locator('.journal-overlay').waitFor(); slow.release();
  await slow.page.waitForTimeout(500); assert.equal(await slow.page.locator('.world-layer-talk').count(), 0); assert.equal(await slow.page.locator('.thought-bubble').count(), 0);
  await slow.context.close(); console.log('PASS browser slow connection: room and journal work without waiting, no late interruption');
  assert.deepEqual(errors, []); console.log('Weather browser: 3 flows passed');
} finally { await browser.close(); await vite.close(); }
