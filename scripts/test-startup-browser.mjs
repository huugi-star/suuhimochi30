import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'vite';
process.env.TZ = 'Asia/Tokyo';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SUUHIMOCHI_BROWSER_PACKAGE || require.resolve('playwright', { paths: [process.env.SUUHIMOCHI_BROWSER_MODULES || process.cwd()] }));
const baseURL = process.env.SUUHIMOCHI_TEST_URL || 'http://127.0.0.1:4181';
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false }, appType: 'custom' });
const browser = await chromium.launch({ headless: true, ...(process.env.SUUHIMOCHI_BROWSER_EXECUTABLE ? { executablePath: process.env.SUUHIMOCHI_BROWSER_EXECUTABLE } : {}) });
const NOW = '2026-10-18T12:00:00+09:00';
const CONVERSATION_KEY = 'suuhimochi_conversation_v6_choices';
const GAME_KEY = 'suuhimochi-30days-save-v1';
const CACHE_KEY = 'suuhimochi-public-topics-v1';
const errors = [];
try {
  const { EMPTY_SAVE } = await vite.ssrLoadModule('/lib/storage.ts');
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const { normalizeHubFeed, externalExpiry } = await vite.ssrLoadModule('/lib/externalTopics.ts');
  const data = new Map(); const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
  const talk = new SuuhimochiConversation({ storage, now: () => new Date(NOW), random: () => 0 });
  talk.setGoal('自分の作品を作る'); talk.startWordTeaching(); talk.submit('マインクラフト'); talk.chooseCategory('GAME_MEDIA'); talk.chooseSubCategory('GAME_MEDIA_3'); talk.choose('WORD_INTERESTED');
  const conversation = JSON.parse(data.get(CONVERSATION_KEY)); conversation.startDate = '2026-10-17';
  const game = { ...structuredClone(EMPTY_SAVE), birthday: '2000-01-01', introComplete: true, day: 2 };
  const snapshot = (date = NOW, id = 'mgiB_j3gZwM') => ({ schemaVersion: 2, fetchedAt: new Date(date).toISOString(), expiresAt: externalExpiry(new Date(date)),
    topics: normalizeHubFeed({ source: 'youtube', updatedAt: new Date(date).toISOString(), items: [{ videoId: id, title: `マインクラフト ${id}の紹介`, source: 'youtube',
      categoryId: 'GAME_MEDIA', subcategoryId: 'GAME_MEDIA_3', publishedAt: new Date(date).toISOString(), url: `https://www.youtube.com/watch?v=${id}` }] }, 'safe-youtube', new Date(date)) });
  const setup = async (cache = snapshot(), time = NOW) => {
    const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, timezoneId: 'Asia/Tokyo' });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.clock.setFixedTime(new Date(time));
    await page.addInitScript(({ conversation, game, cache, keys }) => {
      if (localStorage.getItem('__startup_test_seeded') === '1') return;
      localStorage.setItem(keys[0], JSON.stringify(conversation)); localStorage.setItem(keys[1], JSON.stringify(game));
      if (cache) localStorage.setItem(keys[2], JSON.stringify(cache));
      localStorage.setItem('suuhimochi-shared-knowledge-consent-v1',JSON.stringify({version:1,enabled:false,decided:true}));
      localStorage.setItem('__startup_test_seeded', '1');
    }, { conversation, game, cache, keys: [CONVERSATION_KEY, GAME_KEY, CACHE_KEY] });
    return { context, page };
  };
  const read = (page, key) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
  const roomReady = (page) => page.locator('.game-status').waitFor({ state: 'visible', timeout: 35000 });

  const { context, page } = await setup();
  await page.goto(baseURL); await page.locator('[data-startup-talk="active"]').waitFor({ timeout: 35000 });
  assert.equal(await page.locator('.daily-progress-overlay').count(), 0);
  assert.equal(await page.locator('.two-day-review-overlay').count(), 0);
  assert.equal((await read(page, CONVERSATION_KEY)).externalTopicHistory[0].startupOutcome, 'SHOWN');
  await page.getByRole('button', { name: '部屋にもどる（スキップ）', exact: true }).click();
  assert.equal(await page.locator('[data-startup-talk="active"]').count(), 0);
  assert.equal(await page.locator('.world-layer-talk').count(), 0);
  assert.equal(await page.locator('.mochi-returning').count(), 0);
  await page.waitForFunction(() => Math.abs(new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.world-layer')).transform).a - 1) < 0.001);
  assert.equal((await read(page, CONVERSATION_KEY)).externalTopicHistory[0].startupOutcome, 'SKIPPED');
  console.log('PASS browser Day2: no forced review, two-page startup, one-tap skip, camera restored');

  await page.getByRole('button', { name: '日誌', exact: true }).click();
  await page.locator('.journal-overlay').waitFor(); assert.equal(await page.locator('.daily-progress-overlay').count(), 0);
  assert.equal(await page.getByRole('button',{name:'昨日を振り返る',exact:true}).count(),0);
  await page.getByRole('button',{name:'完了したことを追加',exact:true}).click();
  await page.getByRole('textbox',{name:'完了したことを入力',exact:true}).fill('作品の下書きをした');
  await page.getByRole('button',{name:'追加する',exact:true}).click();
  const done=page.getByRole('button',{name:'作品の下書きをした：できた',exact:true});
  await done.waitFor();assert.equal(await done.getAttribute('aria-pressed'),'true');
  const saved=await read(page,GAME_KEY);
  assert.equal(saved.dailyProgressRecords.length,0);assert.equal(saved.lastDailyProgressActivityDate,'');
  assert.deepEqual(saved.journalNotes['2026-10-17'],['作品の下書きをした']);assert.equal(saved.experienceFruits.length,3);
  await page.getByRole('button',{name:'作品の下書きをした：途中',exact:true}).click();
  await done.click();
  const twice=await read(page,GAME_KEY);assert.equal(twice.friendship,saved.friendship);assert.deepEqual(twice.experienceFruits,saved.experienceFruits);
  await page.getByRole('button',{name:'日誌を閉じる',exact:true}).click();
  await page.reload();await roomReady(page);
  assert.equal(await page.locator('.daily-progress-overlay').count(),0);
  console.log('PASS browser journal: per-item states, no legacy evaluator, rewards deduplicated and restart');

  const tomorrow = '2026-10-19T12:00:00+09:00'; await page.clock.setFixedTime(new Date(tomorrow));
  await page.evaluate(({ key, cache }) => localStorage.setItem(key, JSON.stringify(cache)), { key: CACHE_KEY, cache: snapshot(tomorrow, 'frFLZXKOvJ0') });
  await page.reload(); await page.locator('[data-startup-talk="active"]').waitFor({ timeout: 35000 });
  assert.equal((await read(page, CONVERSATION_KEY)).externalTopicHistory.length, 2);
  await page.keyboard.press('Escape'); assert.equal(await page.locator('.world-layer-talk').count(), 0);
  await context.close(); console.log('PASS browser next activity day: new topic and Escape restore');

  const empty = await setup({ ...snapshot(), topics: [] }); await empty.page.goto(baseURL); await roomReady(empty.page);
  await empty.page.getByRole('button', { name: '日誌', exact: true }).click(); await empty.page.locator('.journal-overlay').waitFor();
  assert.equal(await empty.page.locator('.daily-progress-overlay').count(), 0);
  assert.equal((await read(empty.page, GAME_KEY)).dailyProgressRecords.length, 0);
  await empty.page.clock.setFixedTime(new Date(tomorrow));
  await empty.page.evaluate(({ key, cache }) => localStorage.setItem(key, JSON.stringify(cache)), { key: CACHE_KEY, cache: snapshot(tomorrow) });
  await empty.page.reload(); await empty.page.locator('[data-startup-talk="active"]').waitFor({ timeout: 35000 });
  assert.equal((await read(empty.page, GAME_KEY)).dailyProgressRecords.length, 0);
  await empty.context.close();
  console.log('PASS browser no topic: room and journal immediately available, no automatic evaluation');

  const slow = await setup(null); let release;
  await slow.page.route('**/api/external-topics*', async (route) => {
    await new Promise((resolve) => { release = resolve; });
    try { await route.fulfill({ json: snapshot() }); } catch { /* A timeout abort is valid. */ }
  });
  await slow.page.goto(baseURL); await roomReady(slow.page);
  await slow.page.getByRole('button', { name: '日誌', exact: true }).click(); await slow.page.locator('.journal-overlay').waitFor();
  release?.(); await slow.page.waitForTimeout(300);
  assert.equal(await slow.page.locator('[data-startup-talk="active"]').count(), 0);
  assert.equal((await read(slow.page, CONVERSATION_KEY)).externalTopicHistory.length, 0); await slow.context.close();
  console.log('PASS browser delayed feed: does not block startup or interrupt journal after response');

  const legacyCache = snapshot(); delete legacyCache.schemaVersion;
  const legacy = await setup(legacyCache); let releaseLegacy;
  await legacy.page.route('**/api/external-topics*', async (route) => {
    await new Promise((resolve) => { releaseLegacy = resolve; });
    try { await route.fulfill({ json: snapshot() }); } catch { /* A timeout abort is valid. */ }
  });
  await legacy.page.goto(baseURL);
  await legacy.page.locator('[data-startup-talk="active"]').waitFor({ timeout: 35000 });
  await legacy.page.keyboard.press('Escape');
  await legacy.page.getByRole('button', { name: '日誌', exact: true }).click();
  releaseLegacy?.(); await legacy.page.waitForTimeout(300);
  assert.equal(await legacy.page.locator('[data-startup-talk="active"]').count(), 0);
  await legacy.page.locator('.journal-overlay').waitFor();
  await legacy.context.close(); console.log('PASS browser legacy cache: migration never blocks room/startup or interrupts journal');

  // The existing scheduled sleep window is 00:00–06:59, not 23:00.
  const sleepingTime = '2026-10-19T01:00:00+09:00';
  const sleeping = await setup(snapshot(sleepingTime), sleepingTime);
  await sleeping.page.goto(baseURL); await roomReady(sleeping.page);
  await sleeping.page.getByRole('button', { name: '日誌', exact: true }).click();
  assert.equal(await sleeping.page.locator('[data-startup-talk="active"]').count(), 0);
  assert.equal((await read(sleeping.page, CONVERSATION_KEY)).externalTopicHistory.length, 0);
  await sleeping.context.close(); console.log('PASS browser sleep: no automatic zoom, journal remains accessible');

  const natural = await setup(); await natural.page.goto(baseURL);
  await natural.page.locator('[data-startup-talk="active"]').waitFor({ timeout: 35000 });
  await natural.page.locator('[data-startup-talk="active"]').waitFor({ state: 'detached', timeout: 35000 });
  assert.equal((await read(natural.page, CONVERSATION_KEY)).externalTopicHistory[0].startupOutcome, 'FINISHED');
  assert.equal(await natural.page.locator('.world-layer-talk').count(), 0); await natural.context.close();
  console.log('PASS browser natural completion: both pages advance automatically and camera returns');
  const twoTopics = snapshot(); twoTopics.topics.push(...snapshot(NOW, 'frFLZXKOvJ0').topics);
  const reboot = await setup(twoTopics); await reboot.page.goto(baseURL);
  await reboot.page.locator('[data-startup-talk="active"]').waitFor({ timeout: 35000 });
  await reboot.page.keyboard.press('Escape');
  await reboot.page.reload(); await reboot.page.locator('[data-startup-talk="active"]').waitFor({ timeout: 35000 });
  const rebootHistory = (await read(reboot.page, CONVERSATION_KEY)).externalTopicHistory;
  assert.equal(rebootHistory.length, 2); assert.notEqual(rebootHistory[0].topic.id, rebootHistory[1].topic.id);
  assert.notEqual(rebootHistory[0].eventId, rebootHistory[1].eventId);
  await reboot.page.keyboard.press('Escape'); await reboot.context.close();
  console.log('PASS browser same-day reload: new boot event and a different topic, no daily gate');

  const updating = await setup(); const updatePage = updating.page; let feed = snapshot(); let requests = 0;
  let hold = false; let releaseUpdate;
  await updatePage.route('**/api/external-topics*', async (route) => {
    requests++;
    if (hold) await new Promise((resolve) => { releaseUpdate = resolve; });
    try { await route.fulfill({ json: feed }); } catch { /* Timeout is allowed. */ }
  });
  await updatePage.goto(baseURL); await updatePage.locator('[data-startup-talk="active"]').waitFor({ timeout: 35000 });
  await updatePage.keyboard.press('Escape');
  const beforeUpdate = await read(updatePage, GAME_KEY); const beforeDictionary = (await read(updatePage, CONVERSATION_KEY)).words;
  const atUpdate = '2026-10-18T13:01:00+09:00'; await updatePage.clock.setFixedTime(new Date(atUpdate));
  feed = snapshot(atUpdate); feed.topics.push({ id: 'wikipedia:aurora', source: 'wikipedia', title: 'オーロラ',
    category: 'NATURE_TIME', subcategory: 'NATURE_TIME_6', url: 'https://ja.wikipedia.org/wiki/オーロラ', updatedAt: new Date(atUpdate).toISOString(), publishedAt: new Date(atUpdate).toISOString() });
  await updatePage.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await updatePage.locator('[data-external-trigger="update"]').waitFor({ timeout: 15000 });
  const updateHistory = (await read(updatePage, CONVERSATION_KEY)).externalTopicHistory;
  assert.equal(updateHistory.length, 2); assert.equal(updateHistory[1].context, 'update'); assert.equal(updateHistory[1].kind, 'general');
  await updatePage.getByRole('button', { name: '部屋にもどる（スキップ）', exact: true }).click();
  assert.equal(await updatePage.locator('.world-layer-talk').count(), 0);
  assert.deepEqual((await read(updatePage, CONVERSATION_KEY)).words, beforeDictionary);
  const afterUpdate = await read(updatePage, GAME_KEY);
  for (const field of ['personaExp', 'friendship', 'experienceFruits', 'dailyProgressRecords', 'journalNotes']) assert.deepEqual(afterUpdate[field], beforeUpdate[field], field);
  console.log('PASS browser live update: visibility refresh, general-interest monologue, one-tap return, no learning/rewards');

  const nextHour = '2026-10-18T14:02:00+09:00'; await updatePage.clock.setFixedTime(new Date(nextHour));
  feed = { ...feed, fetchedAt: new Date(nextHour).toISOString(), topics: feed.topics.map((topic) => ({ ...topic, updatedAt: new Date(nextHour).toISOString() })) };
  await updatePage.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await updatePage.waitForFunction((key) => localStorage.getItem(`${key}-checked`) === '2026-10-18T05:02:00.000Z', CACHE_KEY);
  await updatePage.waitForTimeout(300);
  assert.equal(await updatePage.locator('[data-startup-talk="active"]').count(), 0);
  assert.equal((await read(updatePage, CONVERSATION_KEY)).externalTopicHistory.length, 2);
  console.log('PASS browser timestamp-only refresh: no duplicate monologue');

  const lateHour = '2026-10-18T15:03:00+09:00'; await updatePage.clock.setFixedTime(new Date(lateHour));
  feed = snapshot(lateHour, 'zzzzzzzzzzz'); hold = true;
  const countBeforeLate = requests;
  await updatePage.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await updatePage.waitForFunction(() => true); while (requests === countBeforeLate) await updatePage.waitForTimeout(50);
  await updatePage.getByRole('button', { name: '日誌', exact: true }).click(); await updatePage.locator('.journal-overlay').waitFor();
  releaseUpdate?.(); await updatePage.waitForTimeout(300);
  assert.equal(await updatePage.locator('[data-startup-talk="active"]').count(), 0);
  assert.equal((await read(updatePage, CONVERSATION_KEY)).externalTopicHistory.length, 2);
  await updating.context.close(); console.log('PASS browser update result during input: journal wins, no delayed zoom');
  assert.deepEqual(errors, []); console.log('Startup browser: 12 flows passed, no uncaught browser errors');
} finally { await browser.close(); await vite.close(); }
