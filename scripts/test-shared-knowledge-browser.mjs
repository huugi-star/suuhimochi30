import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'vite';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.SUUHIMOCHI_BROWSER_MODULES || process.cwd()] }));
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
const browser = await chromium.launch({ headless: true, ...(process.env.SUUHIMOCHI_BROWSER_EXECUTABLE ? { executablePath: process.env.SUUHIMOCHI_BROWSER_EXECUTABLE } : {}) });
const NOW = '2026-10-21T12:00:00+09:00';
const BASE = process.env.SUUHIMOCHI_TEST_URL || 'http://127.0.0.1:4185';
const C = 'suuhimochi_conversation_v6_choices', G = 'suuhimochi-30days-save-v1', P = 'suuhimochi-shared-knowledge-consent-v1';
const errors = [];
try {
  const { EMPTY_SAVE } = await vite.ssrLoadModule('/lib/storage.ts');
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const { externalExpiry } = await vite.ssrLoadModule('/lib/externalTopics.ts');
  const values = new Map(); const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  const talk = new SuuhimochiConversation({ storage, now: () => new Date(NOW), random: () => 0 }); talk.setGoal('新しい景色を見る');
  talk.startWordTeaching(); talk.submit('宇宙'); talk.chooseCategory('NATURE_TIME'); talk.chooseSubCategory('NATURE_TIME_7'); talk.choose('WORD_INTERESTED');
  talk.startWordTeaching(); talk.submit('秘密の一般人'); talk.chooseCategory('PERSON'); talk.chooseSubCategory('PERSON_2'); talk.choose('WORD_NEUTRAL');
  const conversation = JSON.parse(values.get(C)); conversation.startDate = '2026-10-20';
  const game = { ...structuredClone(EMPTY_SAVE), birthday: '2000-01-01', introComplete: true, day: 2, userName: '秘密の名前', callName: 'ひみつちゃん', journalNotes: { '2026-10-20': ['絶対に送らない日誌の本文'] } };
  const dialogue = '人間さん、宇宙ってどこまで続くのかな。ぼくの部屋と、どのへんからつながっているんだろう。';
  const setup = async (mobile = false) => {
    const context = await browser.newContext({ viewport: mobile ? { width: 844, height: 390 } : { width: 1365, height: 900 }, timezoneId: 'Asia/Tokyo', isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage(); page.on('pageerror', (error) => errors.push(error.message)); await page.clock.setFixedTime(new Date(NOW));
    await page.addInitScript(({ conversation, game, C, G, NOW, expiry }) => {
      if (localStorage.getItem('__shared_seeded')) return;
      localStorage.setItem(C, JSON.stringify(conversation)); localStorage.setItem(G, JSON.stringify(game));
      localStorage.setItem('suuhimochi-public-topics-v1', JSON.stringify({ schemaVersion: 2, fetchedAt: new Date(NOW).toISOString(), expiresAt: expiry, topics: [] }));
      localStorage.setItem('__shared_seeded', '1');
    }, { conversation, game, C, G, NOW, expiry: externalExpiry(new Date(NOW)) });
    const requests = [];
    await page.route('**/api/shared-knowledge/**', async (route) => {
      const request = route.request(); requests.push({ url: request.url(), body: request.postData(), method: request.method() });
      const url = new URL(request.url());
      if (url.pathname.endsWith('/dictionary')) await route.fulfill({ json: url.searchParams.get('offset') === '0'
        ? { status: 'OK', keywords: ['将棋'], nextOffset: 200 } : { status: 'OK', keywords: ['宇宙', 'ナチス'], nextOffset: null } });
      else {
        assert.equal(url.searchParams.get('keyword'), '宇宙');
        await route.fulfill({ json: { status: 'OK', keyword: '宇宙', items: [{ style: 0, thoughtStyle: '文字どおり受け取る', dialogue,
          sourceUrl: 'https://ja.wikipedia.org/wiki/宇宙', attribution: 'Wikipedia（CC BY-SA 4.0）' }] } });
      }
    });
    await context.route('https://ja.wikipedia.org/**', (route) => route.fulfill({ contentType: 'text/html', body: '<h1>Wikipedia test source</h1>' }));
    return { context, page, requests };
  };
  const { context, page, requests } = await setup(); await page.goto(BASE); await page.locator('.game-status').waitFor({ timeout: 35000 });
  const notice = page.getByRole('complementary', { name: '共有知識への参加設定' }); await notice.waitFor(); assert.equal(requests.length, 0);
  await notice.getByRole('button', { name: '利用しない', exact: true }).click();
  assert.equal(await page.evaluate((P) => JSON.parse(localStorage.getItem(P)).enabled, P), false);
  await page.reload(); await page.locator('.game-status').waitFor(); await page.waitForTimeout(1600);
  assert.equal(await notice.count(), 0); assert.equal(requests.length, 0); console.log('PASS browser consent: default OFF, decline persists, no shared requests');

  await page.getByRole('button', { name: '設定', exact: true }).click();
  await page.getByRole('checkbox', { name: '共有知識を利用する', exact: true }).check();
  await page.getByRole('region', { name: '共有知識の設定', exact: true }).getByText(/取得済みセリフ 1件/).waitFor();
  assert.equal(requests.length, 3); assert.ok(requests.every((request) => request.method === 'GET' && request.body === null));
  assert.equal(/秘密|一般人|日誌|ひみつちゃん/.test(decodeURIComponent(JSON.stringify(requests))), false);
  assert.equal(await page.locator('[data-startup-talk="active"]').count(), 0);
  await page.getByRole('button', { name: '設定を閉じる', exact: true }).click();
  console.log('PASS browser settings: opt-in, pagination, exact approved keyword only, no private data, no interruption');

  const beforeGame = await page.evaluate((G) => JSON.parse(localStorage.getItem(G)), G);
  await page.reload(); await page.locator('[data-startup-talk="active"]').waitFor({ timeout: 35000 });
  const citation = page.getByRole('complementary', { name: '共有知識の出典' }); await citation.waitFor();
  assert.match(await citation.innerText(), /Wikipedia（CC BY-SA 4.0）/);
  const history = await page.evaluate((C) => JSON.parse(localStorage.getItem(C)).sharedKnowledgeHistory, C);
  assert.equal(history.length, 1); assert.equal(history[0].dialogue, dialogue);
  await page.waitForFunction(() => document.querySelector('.face-talk-line')?.textContent?.includes('ひみつちゃん'));
  const [popup] = await Promise.all([context.waitForEvent('page'), citation.getByRole('link', { name: 'Wikipediaの記事を開く' }).click()]);
  await popup.waitForURL(/ja\.wikipedia\.org/);
  assert.match(decodeURIComponent(popup.url()), /ja\.wikipedia\.org\/wiki\/宇宙/); assert.equal(await popup.evaluate(() => window.opener === null), true); await popup.close();
  await page.getByRole('button', { name: '部屋にもどる（スキップ）', exact: true }).click();
  assert.equal(await page.locator('.world-layer-talk').count(), 0);
  assert.equal(await page.evaluate((C) => JSON.parse(localStorage.getItem(C)).sharedKnowledgeHistory[0].outcome, C), 'SKIPPED');
  const afterGame = await page.evaluate((G) => JSON.parse(localStorage.getItem(G)), G);
  for (const key of ['friendship', 'personaExp', 'experienceFruits', 'dailyProgressRecords', 'journalNotes']) assert.deepEqual(afterGame[key], beforeGame[key], key);
  console.log('PASS browser knowledge: cached startup, original speech, local name substitution, safe source popup, skip and zero rewards');

  await page.reload(); await page.locator('.game-status').waitFor(); await page.waitForTimeout(300);
  assert.equal(await page.locator('[data-startup-talk="active"]').count(), 0);
  assert.equal(await page.evaluate((C) => JSON.parse(localStorage.getItem(C)).sharedKnowledgeHistory.length, C), 1);
  await page.getByRole('button', { name: '設定', exact: true }).click(); await page.getByRole('checkbox', { name: '共有知識を利用する', exact: true }).uncheck();
  await page.evaluate(() => { localStorage.removeItem('suuhimochi-shared-dictionary-v1'); localStorage.removeItem('suuhimochi-shared-dialogues-v1'); });
  await page.reload(); await page.locator('.game-status').waitFor(); assert.equal(requests.length, 3);
  await context.close(); console.log('PASS browser restart/off: no duplicate speech, revoke stops traffic even without caches');

  const mobile = await setup(true); await mobile.page.goto(BASE); const mobileNotice = mobile.page.getByRole('complementary', { name: '共有知識への参加設定' }); await mobileNotice.waitFor({ timeout: 35000 });
  const bounds = await mobileNotice.boundingBox(); assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= 844 && bounds.y + bounds.height <= 390);
  await mobileNotice.getByRole('button', { name: '利用しない', exact: true }).click(); assert.equal(mobile.requests.length, 0); await mobile.context.close();
  console.log('PASS browser mobile: consent visible within viewport and optional, OFF sends nothing');
  assert.deepEqual(errors, []); console.log('Shared knowledge browser: 5 flows passed, no uncaught errors');
} finally { await browser.close(); await vite.close(); }
