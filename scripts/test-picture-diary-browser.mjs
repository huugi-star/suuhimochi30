import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'vite';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SUUHIMOCHI_BROWSER_PACKAGE || require.resolve('playwright', { paths: [process.env.SUUHIMOCHI_BROWSER_MODULES || process.cwd()] }));
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
const browser = await chromium.launch({ headless: true, ...(process.env.SUUHIMOCHI_BROWSER_EXECUTABLE ? { executablePath: process.env.SUUHIMOCHI_BROWSER_EXECUTABLE } : {}) });
const BASE = process.env.SUUHIMOCHI_TEST_URL ?? 'http://localhost:3000', G = 'suuhimochi-30days-save-v1', C = 'suuhimochi_conversation_v6_choices';
const SECRET = 'unit-browser-session-key-only-not-production', TOKEN = 'unit-browser-worker-token-only-not-production';
const errors = [];
try {
  const { EMPTY_SAVE } = await vite.ssrLoadModule('/lib/storage.ts');
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const d = await vite.ssrLoadModule('/lib/pictureDiary.ts');
  const { createDiarySessionHandler } = await vite.ssrLoadModule('/lib/pictureDiaryAuth.ts');
  const { createPictureDiaryService } = await vite.ssrLoadModule('/lib/pictureDiaryServer.ts');
  const values = new Map(), storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  const engine = new SuuhimochiConversation({ storage, now: () => new Date('2026-10-25T13:00:00+09:00') }); engine.setGoal('作品を作る');
  for (const word of ['マインクラフト', 'セイバー']) { engine.startWordTeaching(); engine.submit(word); engine.chooseCategory('GAME_MEDIA'); engine.chooseSubCategory(word === 'セイバー' ? 'GAME_MEDIA_4' : 'GAME_MEDIA_3'); engine.choose('WORD_INTERESTED'); }
  const original = JSON.parse(storage.getItem(C)); original.startDate = '2026-10-01'; original.dayOverride = 16;
  const materials = d.selectDiaryWords(engine.getWordEntries(), engine.getMemoryRelations(), engine.getMemoryEpisodes(), '2026-10-25'); assert.equal(materials.length, 2);
  const setup = async ({ mobile = false, off = false, short = false, failed = false, lastDay = false } = {}) => {
    const context = await browser.newContext({ viewport: mobile ? { width: 844, height: 390 } : { width: 1365, height: 900 }, timezoneId: 'Asia/Tokyo', isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage(); page.on('pageerror', (error) => errors.push(error.message));
    let serverNow = new Date(lastDay ? '2026-10-27T13:00:00+09:00' : off ? '2026-10-26T23:55:00+09:00' : '2026-10-26T13:00:00+09:00');
    await page.clock.install({ time: serverNow });
    const conversation = structuredClone(original), game = { ...structuredClone(EMPTY_SAVE), birthday: '2000-01-01', introComplete: true, day: 16, journalNotes: { '2026-10-25': ['送らない日誌本文'] } };
    if (lastDay) { game.currentMochiId = 'suuhimochi-cycle-2'; game.cycleNumber = 2; conversation.words = {}; conversation.startDate = '2026-10-27'; conversation.dayOverride = 1; }
    if (off) conversation.conversations = conversation.conversations.map((log) => ({ ...log, timestamp: '2026-10-26T12:00:00.000+09:00' }));
    const snapshot = { localCompanionId: 'suuhimochi-cycle-1', startDate: lastDay ? '2026-09-27' : '2026-10-01', diaryDate: lastDay ? '2026-10-26' : '2026-10-25', learnedWords: short ? materials.slice(0, 1) : materials, conversationCount: 2 };
    await page.addInitScript(({ G, C, game, conversation, off, snapshot, preferenceKey, dataKey }) => {
      if (localStorage.getItem('__picture_diary_seeded')) return;
      localStorage.setItem(G, JSON.stringify(game)); localStorage.setItem(C, JSON.stringify(conversation));
      localStorage.setItem('suuhimochi-shared-knowledge-consent-v1', JSON.stringify({ version: 1, enabled: false, decided: true }));
      localStorage.setItem(preferenceKey, JSON.stringify({ enabled: !off, since: off ? null : '2026-10-25' }));
      localStorage.setItem(dataKey, JSON.stringify({ days: off ? [] : [snapshot], records: [], credentials: {} })); localStorage.setItem('__picture_diary_seeded', '1');
    }, { G, C, game, conversation, off, snapshot, preferenceKey: d.PICTURE_DIARY_CONSENT_KEY, dataKey: d.PICTURE_DIARY_DATA_KEY });
    const calls = [], appCalls = []; let generated;
    const enroll = createDiarySessionHandler(() => SECRET, () => serverNow);
    const service = createPictureDiaryService({ token: () => TOKEN, secret: () => SECRET, clock: () => serverNow,
      dictionary: async () => ({ keywords: ['マインクラフト', 'セイバー'] }), fetcher: async (url, init) => {
        calls.push({ url, init });
        assert.equal(init.headers.authorization, `Bearer ${TOKEN}`);
        if (url.includes('/lookup?')) return failed ? Response.json({ status: 'DIARY_API_NOT_CONFIGURED' }, { status: 503 }) : generated ? Response.json(generated) : Response.json({ status: 'NOT_GENERATED' }, { status: 404 });
        const body = JSON.parse(init.body); assert.equal(body.learnedWords.length, 2); assert.ok(!init.body.includes('送らない日誌本文'));
        if (url.endsWith('/plan')) return Response.json({ status: 'PLAN_OK', selectedKeywords: body.learnedWords.map((word) => word.word) });
        generated = { status: 'OK', generated: true, date: body.diaryDate, imageUrl: `/diary/image?token=test-image-${body.diaryDate}`, expiresAt: '2026-12-08T15:00:00.000Z' }; return Response.json(generated);
      } });
    await page.route('**/api/picture-diary**', async (route) => {
      const request = route.request(); appCalls.push(request.url()); serverNow = new Date(await page.evaluate(() => Date.now()));
      const nodeRequest = new Request(request.url(), { method: request.method(), headers: await request.allHeaders(), body: request.postData() });
      const response = await (new URL(request.url()).pathname.endsWith('/session') ? enroll(nodeRequest) : service(nodeRequest));
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
    });
    await context.route('https://suuhimochi-info-hub.huugishiki.workers.dev/diary/image?*', (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><rect width="640" height="420" fill="#f8eacb"/><circle cx="320" cy="220" r="100" fill="#fffdf5" stroke="#bbaa88" stroke-width="5"/><text x="320" y="70" text-anchor="middle" font-size="32" fill="#634b38">絵日記（検証用）</text></svg>' }));
    await page.route('**/api/external-topics*', (route) => route.fulfill({ json: { schemaVersion: 2, fetchedAt: serverNow.toISOString(), expiresAt: new Date(serverNow.getTime() + 3600000).toISOString(), topics: [] } }));
    await page.route('**/api/external-briefs*', (route) => route.fulfill({ json: { schemaVersion: 1, updatedAt: serverNow.toISOString(), items: [] } }));
    await page.goto(BASE); await page.locator('.game-status').waitFor({ timeout: 40000 });
    return { page, context, calls, appCalls };
  };
  const openJournal = async (page) => {
    const handle = page.locator('.mobile-room-menu-handle'); if (await handle.isVisible() && !(await page.locator('.room-nav').getAttribute('class')).includes('mobile-nav-open')) await handle.click();
    await page.getByRole('button', { name: '日誌', exact: true }).click();
    await page.getByRole('region', { name: 'ことばの絵日記', exact: true }).waitFor();
    await page.waitForTimeout(400); // Inspect the settled journal page, after its existing page-turn animation.
  };
  const waitStatus = (page, status) => page.waitForFunction(({ key, status }) => JSON.parse(localStorage.getItem(key) ?? '{}').records?.some((row) => row.status === status), { key: d.PICTURE_DIARY_DATA_KEY, status }, { timeout: 35000 });
  const privateState = (page) => page.evaluate(({ G, C }) => { const game = JSON.parse(localStorage.getItem(G)), talk = JSON.parse(localStorage.getItem(C)); return {
    diary: game.journalNotes, missions: game.dailyMissions, tasks: game.taskPlans, coins: game.gachaCoins, friendship: game.friendship, exp: game.personaExp,
    words: talk.words, conversations: talk.conversationCount, seen: talk.seenConversationIds }; }, { G, C });
  for (const mobile of [false, true]) {
    const flow = await setup({ mobile }); const { page, context } = flow; await waitStatus(page, 'GENERATED');
    assert.equal(flow.calls.length, 3); const cookie = (await context.cookies()).find((row) => row.name === '__Host-suuhimochi-diary'); assert.ok(cookie?.httpOnly && cookie.secure && cookie.sameSite === 'Strict');
    await openJournal(page); const card = page.getByRole('region', { name: 'ことばの絵日記', exact: true });
    await card.getByRole('heading').evaluate((node) => node.scrollIntoView({ block: 'start' })); await card.getByRole('img').waitFor();
    await card.getByText('Cloudflare生成画像', { exact: true }).waitFor();
    const box = await card.boundingBox(); assert.ok(box.x >= 0 && box.x + box.width <= page.viewportSize().width + 1, JSON.stringify(box));
    await page.screenshot({ path: `node_modules/.cache/picture-diary-${mobile ? 'mobile' : 'desktop'}.png` });
    const before = await privateState(page);
    const [popup] = await Promise.all([context.waitForEvent('page'), card.getByRole('link').click()]); await popup.waitForLoadState(); assert.equal(await popup.evaluate(() => window.opener), null); await popup.close(); await page.bringToFront();
    assert.deepEqual(await privateState(page), before);
    await page.reload(); await page.locator('.game-status').waitFor({ timeout: 40000 }); await waitStatus(page, 'GENERATED'); await page.waitForTimeout(700);
    assert.equal(flow.calls.length, 3); assert.equal(flow.appCalls.length, 2); assert.deepEqual(await privateState(page), before);
    assert.ok(!await page.evaluate(({ key, secret, token }) => localStorage.getItem(key).includes(secret) || localStorage.getItem(key).includes(token), { key: d.PICTURE_DIARY_DATA_KEY, secret: SECRET, token: TOKEN }));
    await context.close(); console.log(`PASS ${mobile ? 'mobile' : 'PC'}: anonymous Secure/HttpOnly cookie, generated image, popup, restart dedup, no save/reward change`);
  }
  const off = await setup({ off: true }); await off.page.waitForTimeout(800); assert.equal(off.appCalls.length, 0);
  await openJournal(off.page); const fallbackCard = off.page.getByRole('region', { name: 'ことばの絵日記', exact: true });
  const fallbackImage = fallbackCard.locator('[data-image-source=\"DEFAULT\"] img'); await fallbackImage.waitFor();
  assert.match(await fallbackImage.getAttribute('src'), /^\/assets\/picture-diary\//);
  assert.ok((await fallbackCard.innerText()).includes('待って'));
  await fallbackCard.getByText('既定画像', { exact: true }).waitFor();
  await off.page.getByRole('button', { name: '日誌を閉じる' }).click();
  await off.page.getByRole('button', { name: '天気の都道府県を選ぶ', exact: true }).click();
  const checkbox = off.page.getByRole('checkbox', { name: '学習情報を送って絵日記を作ることに同意する' }); await checkbox.check();
  assert.equal(off.appCalls.length, 0); await off.page.getByRole('button', { name: '設定を閉じる', exact: true }).click();
  const untilMidnight = Date.parse('2026-10-27T00:00:01+09:00') - await off.page.evaluate(() => Date.now()); assert.ok(untilMidnight > 0);
  await off.page.clock.fastForward(untilMidnight); assert.equal(off.appCalls.length, 0, '表示したまま0時を越えても無人生成しない');
  await off.page.reload(); await waitStatus(off.page, 'GENERATED'); assert.equal(off.calls.length, 3);
  assert.equal(JSON.parse(off.calls[2].init.body).diaryDate, '2026-10-26'); await off.context.close(); console.log('PASS OFF/consent/JST midnight: no pre-consent data, no midnight timer generation, next startup only');
  const last = await setup({ lastDay: true }); await waitStatus(last.page, 'GENERATED');
  const lastPayload = JSON.parse(last.calls[2].init.body); assert.equal(lastPayload.startDate, '2026-09-27'); assert.equal(lastPayload.diaryDate, '2026-10-26');
  await last.context.close(); console.log('PASS Day30 next startup preserves old companion material after local cycle changes');
  const failedFlow = await setup({ failed: true }); await waitStatus(failedFlow.page, 'UNAVAILABLE'); await openJournal(failedFlow.page);
  const failedDiary = failedFlow.page.getByRole('region', { name: 'ことばの絵日記', exact: true });
  assert.match(await failedDiary.innerText(), /ほかの機能はそのまま/);
  assert.equal(failedFlow.calls.length, 1); await failedFlow.context.close(); console.log('PASS failure: network error stays distinct and does not become a default image');
  assert.deepEqual(errors, []); console.log('Picture diary browser: 6 flows passed');
} finally { await browser.close(); await vite.close(); }
