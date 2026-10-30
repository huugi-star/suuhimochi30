import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'vite';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SUUHIMOCHI_BROWSER_PACKAGE || require.resolve('playwright', { paths: [process.env.SUUHIMOCHI_BROWSER_MODULES || process.cwd()] }));
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
const browser = await chromium.launch({ headless: true, ...(process.env.SUUHIMOCHI_BROWSER_EXECUTABLE ? { executablePath: process.env.SUUHIMOCHI_BROWSER_EXECUTABLE } : {}) });
const BASE = process.env.SUUHIMOCHI_TEST_URL ?? 'http://localhost:3000', G = 'suuhimochi-30days-save-v1', C = 'suuhimochi_conversation_v6_choices';
const errors = [];
try {
  const { EMPTY_SAVE } = await vite.ssrLoadModule('/lib/storage.ts');
  const { addTaskPlans } = await vite.ssrLoadModule('/lib/dailyMissions.ts');
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const values = new Map(), storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  const engine = new SuuhimochiConversation({ storage, now: () => new Date('2026-10-24T12:00:00+09:00') });
  engine.setGoal('作品を作る'); engine.startWordTeaching(); engine.submit('将棋'); engine.chooseCategory('GAME_MEDIA'); engine.chooseSubCategory('GAME_MEDIA_3'); engine.choose('WORD_INTERESTED');
  const conversation = JSON.parse(storage.getItem(C)); conversation.startDate = '2026-10-10'; conversation.dayOverride = 16;
  const fresh = () => ({ ...structuredClone(EMPTY_SAVE), birthday: '2000-01-01', introComplete: true, day: 16, journalNotes: { '2026-10-23': ['足あとであり予定ではない'] } });
  const withPlans = () => {
    let save = addTaskPlans(fresh(), '2026-10-24', ['朝の散歩', '本を読む'], new Date('2026-10-24T18:00:00+09:00'));
    return addTaskPlans(save, '2026-10-25', ['作品の下書き'], new Date('2026-10-24T18:01:00+09:00'));
  };
  const setup = async (mobile = false, save = withPlans(), time = '2026-10-25T13:00:00+09:00', conversationSeed = conversation) => {
    const context = await browser.newContext({ viewport: mobile ? { width: 844, height: 390 } : { width: 1365, height: 900 }, timezoneId: 'Asia/Tokyo', isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage(); page.on('pageerror', (error) => errors.push(error.message)); await page.clock.install({ time: new Date(time) });
    await page.addInitScript(({ G, C, save, conversation }) => {
      if (localStorage.getItem('__missions_seeded')) return;
      localStorage.setItem(G, JSON.stringify(save)); localStorage.setItem(C, JSON.stringify(conversation));
      localStorage.setItem('suuhimochi-shared-knowledge-consent-v1', JSON.stringify({ version: 1, decided: true, enabled: false }));
      localStorage.setItem('__missions_seeded', '1');
    }, { G, C, save, conversation: conversationSeed });
    await page.route('**/api/external-topics*', async (route) => {
      const stamp = await page.evaluate(() => new Date().toISOString());
      return route.fulfill({ json: { schemaVersion: 2, fetchedAt: stamp, expiresAt: new Date(Date.parse(stamp) + 3600000).toISOString(), topics: [] } });
    });
    await page.route('**/api/external-briefs*', async (route) => route.fulfill({ json: { schemaVersion: 1, updatedAt: await page.evaluate(() => new Date().toISOString()), items: [] } }));
    await page.goto(BASE); await page.locator('.game-status').waitFor({ timeout: 40000 });
    await page.waitForFunction((key) => Boolean(JSON.parse(localStorage.getItem(key) ?? '{}').dailyMissions), G);
    return { page, context };
  };
  const read = (page, key = G) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
  const openJournal = async (page) => {
    const button = page.getByRole('button', { name: '日誌', exact: true });
    const handle = page.locator('.mobile-room-menu-handle');
    if (await handle.isVisible() && !(await page.locator('.room-nav').getAttribute('class')).includes('mobile-nav-open')) await handle.click();
    await button.click();
    if (await page.getByRole('button', { name: 'きょうの手帳へ', exact: false }).isVisible()) await page.getByRole('button', { name: 'きょうの手帳へ', exact: false }).click();
    await page.getByRole('region', { name: '日誌と予定', exact: true }).waitFor();
    assert.equal(await page.locator('.journal-page').evaluate((node) => getComputedStyle(node).overflowY), 'auto', '予定が多くても指で日誌内をスクロールできる');
  };
  const reportTask = async (page, name) => {
    await page.getByRole('button', { name: '昨日の手帳を開く', exact: true }).click();
    const view=page.getByRole('button',{name:'この日やったこと',exact:true});if(await view.isVisible())await view.click();
    const [text,result] = name.split('：');
    const target=page.getByRole('button',{name:`${text}：${result==='達成'?'できた':'まだ'}`,exact:true});
    const prev=page.getByRole('button',{name:'前の項目',exact:true}),next=page.getByRole('button',{name:'次の項目',exact:true});
    if(!await target.isVisible()&&await prev.isVisible()){for(let i=0;i<20&&!await prev.isDisabled();i++)await prev.click();for(let i=0;i<20&&!await target.isVisible()&&!await next.isDisabled();i++)await next.click();}
    await target.click();
    await page.getByRole('button', { name: 'きょうの手帳へ', exact: false }).click();
  };
  const waitCount = async (page, value) => page.waitForFunction((value) => document.querySelector('[aria-label="デイリーミッション達成数"]')?.textContent?.includes(value), value);
  const writePlan = async (page, label, text) => {
    assert.equal(label,'明日');
    await page.getByRole('textbox',{name:'明日のもくひょうを入力',exact:true}).fill(text);
    await page.getByRole('button',{name:'あしたの予定を追加',exact:true}).click();
  };
  const rewards = (save) => Object.fromEntries(['friendship', 'personaExp', 'experienceFruits', 'wordFragments', 'gachaCoins', 'gachaHistory', 'journalNotes', 'dailyProgressRecords', 'suuhimochiDiaries'].map((key) => [key, save[key]]));
  const drainSpeech = async (page) => {
    for (let i = 0; i < 25 && await page.locator('.face-talk-bubble').isVisible(); i++) {
      await page.locator('.face-talk-bubble').click(); await page.clock.fastForward(1000);
    }
  };
  const teach = async (page, surface) => {
    await page.getByRole('button', { name: 'はなす', exact: true }).click();
    await page.getByRole('button', { name: /ことばを教える/ }).click(); await drainSpeech(page);
    await page.locator('#talk-text').fill(surface); await page.getByRole('button', { name: '話す', exact: true }).click();
    await drainSpeech(page); await page.getByRole('button', { name: '会話を閉じる', exact: true }).click();
    await page.clock.fastForward(1500);
  };
  for (const mobile of [false, true]) {
    const { page, context } = await setup(mobile); let before = await read(page); await openJournal(page); await waitCount(page, '2/4');
    assert.equal(await page.locator('.daily-progress-overlay').count(), 0);
    await reportTask(page, '朝の散歩：未達成'); await waitCount(page, '2/4');
    await reportTask(page, '本を読む：達成'); await waitCount(page, '3/4');
    before=await read(page);
    await writePlan(page, '明日', mobile ? '買い出し' : '買い物リストを書く', mobile);
    assert.equal((await read(page)).taskPlans['2026-10-26'].length, 1); assert.deepEqual(rewards(await read(page)), rewards(before));
    assert.equal(await page.getByText('デイリーミッション', { exact: true }).count(), 0);
    await page.screenshot({ path: `node_modules/.cache/daily-missions-${mobile ? 'mobile' : 'desktop'}.png` });
    const panel = await page.getByRole('region', { name: '日誌と予定', exact: true }).boundingBox();
    assert.ok(panel.x >= 0 && panel.x + panel.width <= page.viewportSize().width);
    if (!mobile) {
      await page.getByRole('button', { name: '日誌を閉じる', exact: true }).click();
      await teach(page, '将棋'); await openJournal(page); await waitCount(page, '3/4');
      assert.equal((await read(page)).dailyMissions['2026-10-25'].completedAt.teach, undefined);
      await page.getByRole('button', { name: '日誌を閉じる', exact: true }).click();
      await teach(page, 'スペースブロック'); await openJournal(page); await waitCount(page, '4/4');
      const words = Object.values((await read(page, C)).words); assert.equal(words.filter((word) => word.surface === '将棋').length, 1);
      assert.equal(words.find((word) => word.surface === 'スペースブロック').learnedAt.slice(0, 10), '2026-10-25');
      assert.deepEqual(rewards(await read(page)), rewards(before), 'ミッション・未完了の新語登録だけで報酬を増やさない');
    }
    const completed = (await read(page)).dailyMissions; await page.reload(); await page.locator('.game-status').waitFor({ timeout: 40000 });
    await openJournal(page); await waitCount(page, mobile ? '3/4' : '4/4'); assert.deepEqual((await read(page)).dailyMissions, completed);
    await context.close(); console.log(`PASS ${mobile ? 'mobile' : 'PC'}: journal tasks/results, no reward, source plan dates, restart${mobile ? '' : ', new word vs duplicate'}`);
  }
  const priorWords = structuredClone(conversation);
  for (const word of Object.values(priorWords.words)) word.learnedAt = '2026-10-23T03:00:00Z';
  const midnightSave=addTaskPlans(fresh(),'2026-10-24',['本を読む'],new Date('2026-10-24T18:00:00+09:00'));
  const { page, context } = await setup(false, midnightSave, '2026-10-24T23:55:00+09:00', priorWords);
  await openJournal(page); await waitCount(page, '2/3');
  assert.equal((await read(page)).dailyMissions['2026-10-24'].completedAt.report, undefined);
  await writePlan(page, '明日', '朝の散歩', false); await waitCount(page, '2/3');
  const untilMidnight = Date.parse('2026-10-25T00:00:01+09:00') - await page.evaluate(() => Date.now());
  assert.ok(untilMidnight > 0); await page.clock.fastForward(untilMidnight);
  await page.getByRole('button', { name: 'きょうの手帳へ', exact: false }).click(); await waitCount(page, '2/4');
  assert.equal((await read(page)).taskPlans['2026-10-24'][0].result, null);
  await reportTask(page, '本を読む：未達成'); await waitCount(page, '3/4');
  assert.equal((await read(page)).dailyMissions['2026-10-25'].completedAt.login.slice(0, 10), '2026-10-24', 'UTC timestamp/JST day are deliberately different');
  assert.equal((await read(page)).taskPlans['2026-10-25'][0].text, '朝の散歩');
  await context.close(); assert.deepEqual(errors, []);
  console.log('PASS JST midnight rollover before 05:00: prior-day plan applies, report eligibility/denominator switch, no auto failure');
  console.log('Daily missions browser: 3 flows passed');
} finally { await browser.close(); await vite.close(); }

