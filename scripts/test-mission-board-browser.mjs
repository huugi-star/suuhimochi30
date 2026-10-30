import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { createServer } from 'vite';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SUUHIMOCHI_BROWSER_PACKAGE || require.resolve('playwright'));
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
const browser = await chromium.launch({ headless: true, ...(process.env.SUUHIMOCHI_BROWSER_EXECUTABLE ? { executablePath: process.env.SUUHIMOCHI_BROWSER_EXECUTABLE } : {}) });
const errors = [], G = 'suuhimochi-30days-save-v1', C = 'suuhimochi_conversation_v6_choices';
try {
  const { EMPTY_SAVE } = await vite.ssrLoadModule('/lib/storage.ts');
  const { addTaskPlans } = await vite.ssrLoadModule('/lib/dailyMissions.ts');
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const data = new Map(), storage = { getItem:k => data.get(k) ?? null, setItem:(k,v) => data.set(k,v), removeItem:k => data.delete(k) };
  const talk = new SuuhimochiConversation({ storage, now:() => new Date('2026-10-25T12:00:00+09:00') }); talk.setGoal('作品を作る');
  const conversation = JSON.parse(storage.getItem(C)); conversation.startDate = '2026-10-10'; conversation.dayOverride = 16;
  let save = { ...structuredClone(EMPTY_SAVE), birthday:'2000-01-01', introComplete:true, day:16 };
  save = addTaskPlans(save, '2026-10-25', ['本を読む'], new Date('2026-10-25T12:00:00+09:00'));
  save = addTaskPlans(save, '2026-10-26', ['下書きをする'], new Date('2026-10-25T12:00:00+09:00'));
  for (const [width,height,mobile] of [[360,640,true],[360,740,true],[390,844,true],[844,390,true],[1365,900,false]]) {
    const context = await browser.newContext({ viewport:{width,height}, isMobile:mobile, hasTouch:mobile, timezoneId:'Asia/Tokyo' });
    const page = await context.newPage(); page.on('pageerror',e=>errors.push(e.message)); await page.clock.install({time:new Date('2026-10-26T13:00:00+09:00')});
    await page.addInitScript(({G,C,save,conversation}) => { localStorage.setItem(G,JSON.stringify(save));localStorage.setItem(C,JSON.stringify(conversation));localStorage.setItem('suuhimochi-shared-knowledge-consent-v1',JSON.stringify({version:1,decided:true,enabled:false})); },{G,C,save,conversation});
    await page.route('**/api/external-topics*',route=>route.fulfill({json:{schemaVersion:2,fetchedAt:'2026-10-26T04:00:00Z',expiresAt:'2026-10-26T05:00:00Z',topics:[]}}));
    await page.route('**/api/external-briefs*',route=>route.fulfill({json:{schemaVersion:1,updatedAt:'2026-10-26T04:00:00Z',items:[]}}));
    await page.goto(process.env.SUUHIMOCHI_TEST_URL || 'http://localhost:3000');
    const board = page.locator('[data-mission-post]'); await board.waitFor({timeout:40000});
    await page.waitForFunction(()=>document.querySelector('[aria-label="デイリーミッション達成数"]')?.textContent.includes('2 / 4'));
    await page.waitForTimeout(400);
    const box = await board.boundingBox(); assert.ok(box.x >= 0 && box.y >= 0 && box.x+box.width <= width && box.y+box.height <= height,JSON.stringify(box));
    assert.ok(box.width >= 44 && box.width <= 70 && box.height <= 80, 'closed post stays small and tappable');
    assert.equal(await board.locator('[data-status]').count(),0,'no mission list on the closed post');
    assert.equal(await board.getByText('ミッション',{exact:true}).count(),1);
    await page.screenshot({path:resolve(`../mission-post-closed-${width}x${height}.png`)});
    const before = await page.evaluate(key=>localStorage.getItem(key),G);
    await page.getByRole('button',{name:'ミッションポストを開く',exact:true}).click();
    const detail = page.getByRole('dialog',{name:'きょうのミッション'}); await detail.waitFor();
    assert.equal(await detail.getByRole('listitem').count(),4);
    assert.equal(await detail.locator('svg').count(),2);
    await page.waitForTimeout(350);
    assert.equal(await board.getAttribute('data-open'),'true');
    const paperBox=await detail.boundingBox(); assert.ok(paperBox.x>=0 && paperBox.y>=0 && paperBox.x+paperBox.width<=width && paperBox.y+paperBox.height<=height);
    await page.screenshot({path:resolve(`../mission-post-open-${width}x${height}.png`)});
    await page.keyboard.press('Escape'); assert.equal(await detail.isVisible(),false);
    await page.waitForFunction(()=>document.querySelector('[data-mission-post]')?.dataset.open==='false');
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),G),before,'viewing missions must not change save or rewards');
    await page.getByRole('button',{name:'ミッションポストを開く',exact:true}).click(); await detail.waitFor();
    await page.waitForTimeout(350); await page.mouse.click(3,3); assert.equal(await detail.isVisible(),false,'outside tap closes the letter');
    await page.getByRole('button',{name:'ミッションポストを開く',exact:true}).click(); await detail.waitFor();
    await detail.getByRole('button',{name:'ミッションの詳細を閉じる'}).click(); assert.equal(await detail.isVisible(),false);
    await page.getByRole('button',{name:'ミッションポストを開く',exact:true}).focus();
    await page.keyboard.press('Enter'); await detail.waitFor();
    await detail.getByRole('button',{name:/日誌で予定・結果を見る/}).click();
    await page.getByRole('button',{name:'日誌を閉じる',exact:true}).waitFor();
    assert.equal(await board.isVisible(),false,'mission board does not appear inside journal');
    if (width > height) {
      await page.getByRole('button',{name:'日誌を閉じる',exact:true}).click();
      const handle = page.locator('.mobile-room-menu-handle');
      if (await handle.isVisible() && !(await page.locator('.room-nav').getAttribute('class')).includes('mobile-nav-open')) await handle.click();
      await page.getByRole('button',{name:'はなす',exact:true}).click();
      assert.equal(await board.isVisible(),false,'mission board does not cover conversation or keyboard');
    }
    await context.close(); console.log(`PASS ${width}x${height}: small post, door, letter, three close methods, keyboard, journal, unchanged save`);
  }
  assert.deepEqual(errors,[]); console.log('Mission post: 5 viewport flows passed');
} finally { await browser.close(); await vite.close(); }
