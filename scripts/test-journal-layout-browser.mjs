import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'vite';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SUUHIMOCHI_BROWSER_PACKAGE || require.resolve('playwright', { paths: [process.env.SUUHIMOCHI_BROWSER_MODULES || process.cwd()] }));
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
const browser = await chromium.launch({ headless: true, ...(process.env.SUUHIMOCHI_BROWSER_EXECUTABLE ? { executablePath: process.env.SUUHIMOCHI_BROWSER_EXECUTABLE } : {}) });
const BASE = process.env.SUUHIMOCHI_TEST_URL ?? 'http://localhost:3000', G = 'suuhimochi-30days-save-v1', C = 'suuhimochi_conversation_v6_choices';
const errors = [], measurements = [];
mkdirSync('outputs/journal-ui', { recursive: true });
try {
  const { EMPTY_SAVE } = await vite.ssrLoadModule('/lib/storage.ts');
  const m = await vite.ssrLoadModule('/lib/dailyMissions.ts');
  const d = await vite.ssrLoadModule('/lib/pictureDiary.ts');
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const local = new Map(), storage = { getItem: key => local.get(key) ?? null, setItem: (key, value) => local.set(key, value), removeItem: key => local.delete(key) };
  const talk = new SuuhimochiConversation({ storage, now: () => new Date('2026-10-25T12:00:00+09:00') });
  talk.setGoal('作品を作る'); talk.startWordTeaching(); talk.submit('将棋'); talk.chooseCategory('GAME_MEDIA'); talk.chooseSubCategory('GAME_MEDIA_3'); talk.choose('WORD_INTERESTED');
  const original = JSON.parse(local.get(C)); original.startDate = '2026-10-11'; original.dayOverride = 16;
  const read = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), G);
  const open = async page => {
    if (await page.getByRole('button', { name: '縦画面で日誌を開く', exact: true }).isVisible()) await page.getByRole('button', { name: '縦画面で日誌を開く', exact: true }).click();
    else {
      const handle = page.locator('.mobile-room-menu-handle');
      if (await handle.isVisible() && !(await page.locator('.room-nav').getAttribute('class')).includes('mobile-nav-open')) await handle.click();
      await page.getByRole('button', { name: '日誌', exact: true }).click();
    }
    await page.locator('.journal-page').waitFor(); await page.waitForTimeout(400);
  };
  const recordsView = async page => { const button = page.getByRole('button',{name:'この日やったこと',exact:true}); if (await button.isVisible()) await button.click(); };
  const pictureView = async page => { const button = page.getByRole('button',{name:'絵日記',exact:true}); if (await button.isVisible()) await button.click(); };
  const showTask = async (page, name) => {
    const target = page.getByRole('button',{name,exact:true}); if(await target.isVisible())return;
    const prev = page.getByRole('button',{name:'前の項目',exact:true}), next=page.getByRole('button',{name:'次の項目',exact:true});
    if(!await prev.isVisible())return;
    for(let i=0;i<20&&!await prev.isDisabled();i++)await prev.click();
    for(let i=0;i<20&&!await target.isVisible()&&!await next.isDisabled();i++)await next.click();
  };
  const today = async page => { await page.getByRole('button', { name: 'きょうの手帳へ', exact: false }).click(); await page.locator('.journal-page-today').waitFor(); await page.waitForTimeout(350); };
  const setup = async ({ mode = 'PC', first = false, graduate = false, pending = false } = {}) => {
    const portrait = mode === 'portrait' || /^\d+x\d+$/.test(mode), mobile = mode !== 'PC';
    const [width, height] = /^\d+x\d+$/.test(mode) ? mode.split('x').map(Number) : [390,844];
    const context = await browser.newContext({ viewport: portrait ? { width, height } : mobile ? { width: 844, height: 390 } : { width: 1365, height: 900 }, timezoneId: 'Asia/Tokyo', isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage(); page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message)); await page.clock.install({ time: new Date('2026-10-26T13:00:00+09:00') });
    const conversation = structuredClone(original); if (first || graduate) { conversation.startDate = '2026-10-26'; conversation.dayOverride = 1; conversation.words = {}; }
    let game = { ...structuredClone(EMPTY_SAVE), introComplete: true, birthday: '2000-01-01', day: first || graduate ? 1 : 16,
      journalNotes: first || graduate ? {} : { '2026-10-25': ['下書きを進めた'] },
      suuhimochiDiaries: first || graduate ? {} : { '2026-10-25': { date: '2026-10-25', day: 15, text: '将棋という言葉を覚えたの。\n人間さんは下書きを進めたの。', createdAt: '2026-10-26T07:01:00+09:00' } } };
    if (!first && !graduate) {
      game = m.addTaskPlans(game, '2026-10-25', ['散歩'], new Date('2026-10-25T09:00:00+09:00'));
      game = m.addTaskPlans(game, '2026-10-26', ['前日に決めた下書き', '資料を読む'], new Date('2026-10-25T19:00:00+09:00'));
    }
    if (graduate) game.currentMochiId = 'suuhimochi-cycle-2';
    const records = first ? [] : ['2026-10-24', '2026-10-25'].map(date => ({ localCompanionId: graduate ? 'suuhimochi-cycle-1' : game.currentMochiId,
      diaryDate: date, status: pending ? 'GENERATING' : 'GENERATED', attemptedOn: '2026-10-26', ...(pending ? {} : { imageUrl: `https://suuhimochi-info-hub.huugishiki.workers.dev/diary/image?token=layout-${date}` }) }));
    await page.addInitScript(({ G, C, game, conversation, records, dataKey, consentKey }) => {
      if (localStorage.getItem('__journal_seeded')) return;
      localStorage.setItem(G, JSON.stringify(game)); localStorage.setItem(C, JSON.stringify(conversation));
      localStorage.setItem(dataKey, JSON.stringify({ days: [], credentials: {}, records })); localStorage.setItem(consentKey, JSON.stringify({ enabled: false, since: null }));
      localStorage.setItem('suuhimochi-shared-knowledge-consent-v1', JSON.stringify({ version: 1, enabled: false, decided: true }));
      localStorage.setItem('__journal_seeded', '1');
    }, { G, C, game, conversation, records, dataKey: d.PICTURE_DIARY_DATA_KEY, consentKey: d.PICTURE_DIARY_CONSENT_KEY });
    let diaryCalls = 0;
    await page.route('**/api/picture-diary**', route => { diaryCalls++; return route.fulfill({ status: 503, json: { status: 'UNAVAILABLE' } }); });
    await page.route('**/api/external-topics*', route => route.fulfill({ json: { schemaVersion: 2, fetchedAt: '2026-10-26T04:00:00Z', expiresAt: '2026-10-27T04:00:00Z', topics: [] } }));
    await page.route('**/api/external-briefs*', route => route.fulfill({ json: { schemaVersion: 1, updatedAt: '2026-10-26T04:00:00Z', items: [] } }));
    await context.route('https://suuhimochi-info-hub.huugishiki.workers.dev/diary/image?*', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640"><rect width="640" height="640" fill="#f9ebd1"/><circle cx="320" cy="320" r="130" fill="white" stroke="#c7a573" stroke-width="5"/><text x="320" y="95" text-anchor="middle" font-size="30" fill="#69462b">絵日記・検証用</text></svg>' }));
    await page.goto(BASE);
    await (portrait ? page.getByRole('button', { name: '縦画面で日誌を開く', exact: true }) : page.locator('.game-status')).waitFor({ timeout: 40000 });
    return { page, context, requests: () => diaryCalls };
  };
  const testModes = process.env.SUUHIMOCHI_JOURNAL_MODES?.split(',') ?? ['PC', '360x640', '360x740', '390x844', 'landscape'];
  for (const mode of testModes) {
    const flow = await setup({ mode }), { page, context } = flow; await open(page);
    assert.equal(await page.locator('.journal-page').getAttribute('data-date'), '2026-10-25');
    assert.equal(await page.getByRole('heading', {name:'すうひもちの日誌',exact:true}).count(),1);
    await recordsView(page);
    assert.equal(await page.getByRole('heading',{name:'この日やったこと',exact:true}).count(),1);
    assert.equal(await page.getByText('この日の記録をひらく',{exact:false}).count(),0);
    assert.equal(await page.getByRole('region',{name:'すうひもちの文章日記',exact:true,includeHidden:true}).count(),1);
    await showTask(page,'下書きを進めた：できた');
    assert.equal(await page.getByRole('button',{name:'下書きを進めた：できた',exact:true}).getAttribute('aria-pressed'),'true');
    assert.equal(await page.getByRole('button',{name:'下書きを進めた：できた',exact:true}).locator('xpath=ancestor::li').locator('[data-stamp=hanamaru]').count(),1);
    await showTask(page,'散歩：まだ');
    assert.equal(await page.getByRole('button',{name:'散歩：まだ',exact:true}).getAttribute('aria-pressed'),'true');
    assert.equal(await page.getByRole('button',{name:'散歩：まだ',exact:true}).locator('xpath=ancestor::li').locator('[data-stamp=hanamaru]').count(),0,'pending past actions have no flower');
    assert.equal(await page.getByRole('checkbox').count(),0);
    assert.equal(await page.getByText('この日の進み具合',{exact:true}).count(),0);
    assert.equal(await page.getByText('この日を振り返る',{exact:true}).count(),0);
    await pictureView(page);
    const card = page.getByRole('region', { name: 'ことばの絵日記', exact: true }); await card.getByRole('img').waitFor();
    assert.match(await card.innerText(), /将棋/);
    await page.screenshot({ path: `outputs/journal-ui/${mode}-yesterday.png` });
    if (/^\d+x\d+$/.test(mode)) {
      const layout = await page.locator('.journal-page').evaluate(node => ({ client: node.clientHeight, scroll: node.scrollHeight, bottom: node.getBoundingClientRect().bottom, viewport: innerHeight }));
      measurements.push({ mode, page: 'yesterday', ...layout });
      assert.ok(layout.bottom <= layout.viewport, 'long past records scroll inside the page');
    }
    await today(page);
    assert.equal(await card.count(), 0);
    assert.equal(await page.getByRole('heading',{name:'きょうの日誌',exact:true}).count(),1);
    assert.equal(await page.getByText('きょうのこと',{exact:true}).count(),0);
    assert.equal(await page.getByText('やったことを残す',{exact:true}).count(),0);
    assert.equal(await page.getByText('デイリーミッション', { exact: true }).count(), 0);
    await page.getByRole('button',{name:'前日に決めた下書き：途中',exact:true}).click();
    assert.equal(await page.locator('.journal-page-today [data-stamp=hanamaru]').count(),0);
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).taskPlans['2026-10-26'][0].result === 'in_progress',G);
    await page.getByRole('button',{name:'前日に決めた下書き：できた',exact:true}).click();
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).taskPlans['2026-10-26'][0].result === 'done', G);
    assert.equal(await page.locator('.journal-page-today [data-stamp=hanamaru]').count(),1);
    assert.equal(await page.locator('.journal-page-today [data-stamp=hanamaru]').first().evaluate(node=>node.parentElement?.className.includes('taskText')),true,'flower is stamped directly on the task text');
    assert.equal(await page.locator('.journal-page-today [data-stamp=hanamaru] circle').count(),10,'flower uses a double-ring stamp outline');
    assert.ok(!(await read(page)).dailyMissions['2026-10-26'].completedAt.report);
    await page.screenshot({ path: `outputs/journal-ui/${mode}-today.png` });
    const bounds = await page.locator('.journal-page').boundingBox(); assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= page.viewportSize().width + 1);
    if (/^\d+x\d+$/.test(mode)) {
      const layout = await page.locator('.journal-page').evaluate(node => ({ client: node.clientHeight, scroll: node.scrollHeight, bottom: node.getBoundingClientRect().bottom, viewport: innerHeight, width: node.clientWidth, scrollWidth: node.scrollWidth }));
      measurements.push({ mode, page: 'today', ...layout });
      assert.ok(layout.scroll <= layout.client + 1, `today fits without scrolling: ${JSON.stringify({mode,...layout})}`);
      assert.ok(layout.bottom <= layout.viewport && layout.scrollWidth <= layout.width + 1);
    }
    assert.equal(await page.getByText('きのうの足跡',{exact:true}).count(),1);
    const before = await read(page);
    await page.getByRole('button',{name:'ことばの記録を開く',exact:true}).click();
    await page.getByRole('dialog',{name:'手帳の索引',exact:true}).waitFor();
    await page.getByRole('button',{name:'手帳の索引を閉じる',exact:true}).click();
    assert.deepEqual(await read(page),before,'reading index never changes saved data');
    await page.getByRole('textbox',{name:'明日のもくひょうを入力',exact:true}).fill('明日の清書');
    await page.getByRole('button',{name:'あしたの予定を追加',exact:true}).click();
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).taskPlans['2026-10-27']?.[0].text === '明日の清書', G);
    await page.getByRole('button',{name:'完了したことを追加',exact:true}).click();
    await page.getByRole('textbox',{name:'完了したことを入力',exact:true}).fill('予定外に片付けた');
    await page.getByRole('button',{name:'追加する',exact:true}).click();
    await page.getByRole('button',{name:'予定外に片付けた：できた',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'予定外に片付けた：できた',exact:true}).getAttribute('aria-pressed'),'true');
    await page.getByRole('button',{name:'予定外に片付けた：まだ',exact:true}).click();
    assert.equal((await read(page)).taskPlans['2026-10-26'].filter(task=>task.result==='done').length,1,'not-done removes its flower without changing other pages');
    await page.getByRole('button',{name:'予定外に片付けた：途中',exact:true}).click();
    await page.getByRole('button',{name:'予定外に片付けたを修正',exact:true}).click();
    await page.getByRole('textbox',{name:'項目を修正',exact:true}).fill('予定外に机を片付けた');
    await page.getByRole('button',{name:'修正を保存',exact:true}).click();
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).taskPlans['2026-10-26']?.some(task=>task.text==='予定外に机を片付けた' && task.result==='in_progress'), G);
    assert.equal((await read(page)).taskPlans['2026-10-26'].filter(task=>task.text==='予定外に机を片付けた').length,1);
    assert.equal((await read(page)).journalNotes['2026-10-26'].includes('予定外に机を片付けた'),false);
    assert.equal((await read(page)).journalNotes['2026-10-26'].includes('予定外に片付けた'),false);
    assert.equal(await page.locator('.journal-entry-overlay').count(),0,'inline actions never open a separate editor');
    if (mode === '390x844') {
      await page.emulateMedia({reducedMotion:'reduce'});
      assert.equal(await page.locator('[data-stamp=hanamaru]').first().evaluate(node=>getComputedStyle(node).animationName),'none');
      await page.evaluate(()=>{document.documentElement.style.fontSize='200%';});
      const enlarged=await page.locator('.journal-page').evaluate(node=>{node.scrollTop=node.scrollHeight;return {width:node.clientWidth,scrollWidth:node.scrollWidth,footer:node.querySelector('footer').getBoundingClientRect().bottom};});
      assert.ok(enlarged.scrollWidth<=enlarged.width+1 && enlarged.footer<=page.viewportSize().height,JSON.stringify(enlarged));
      await page.screenshot({path:'outputs/journal-ui/390x844-large-text.png'});
      await page.evaluate(()=>{document.documentElement.style.fontSize='';});
      await page.emulateMedia({reducedMotion:'no-preference'});
    }
    await page.getByRole('button', { name: '日誌を閉じる', exact: true }).click(); await open(page);
    assert.equal(await page.locator('.journal-page').getAttribute('data-date'), '2026-10-26');
    await page.reload(); await ((/^\d+x\d+$/.test(mode)) ? page.getByRole('button', { name: '縦画面で日誌を開く', exact: true }) : page.locator('.game-status')).waitFor({ timeout: 40000 }); await open(page);
    await showTask(page,'予定外に机を片付けた：途中');
    assert.equal(await page.getByRole('button',{name:'予定外に机を片付けた：途中',exact:true}).getAttribute('aria-pressed'),'true');
    await showTask(page,'前日に決めた下書き：できた');
    assert.equal(await page.locator('.journal-page-today [data-stamp=hanamaru]').count(),1,'flower restores from the saved done result');
    await page.getByRole('button', { name: '昨日の手帳を開く', exact: true }).click(); await recordsView(page);
    await showTask(page,'散歩：できた');
    await page.getByRole('button',{name:'散歩：できた',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'散歩：できた',exact:true}).locator('xpath=ancestor::li').locator('[data-stamp=hanamaru]').count(),1);
    assert.equal((await read(page)).dailyMissions['2026-10-26'].completedAt.report !== undefined,true);
    await page.getByRole('button', { name: '前の日', exact: true }).click();
    assert.equal(await page.locator('.journal-page').getAttribute('data-date'), '2026-10-24'); await pictureView(page); assert.match(await card.getByRole('img').getAttribute('src'), /layout-2026-10-24/); await recordsView(page);
    await page.getByRole('button',{name:'完了したことを追加',exact:true}).click();
    await page.getByRole('textbox',{name:'完了したことを入力',exact:true}).fill('あとから思い出した読書');
    await page.getByRole('button',{name:'追加する',exact:true}).click();
    await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).journalNotes['2026-10-24']?.includes('あとから思い出した読書'),G);
    if(mode==='360x640') {
      await page.getByRole('button',{name:'日誌を閉じる',exact:true}).click();
      const toMidnight=Date.parse('2026-10-27T00:00:01+09:00')-await page.evaluate(()=>Date.now());
      await page.clock.fastForward(toMidnight); await open(page); await today(page);
      await page.getByRole('button',{name:'明日の清書：まだ',exact:true}).waitFor();
      assert.equal(await page.getByRole('button',{name:'明日の清書：まだ',exact:true}).getAttribute('aria-pressed'),'true');
      assert.equal((await read(page)).taskPlans['2026-10-27'].length,1);
      console.log('PASS JST next day: tomorrow plan becomes one pending journal item');
    }
    assert.equal(flow.requests(), 0); await context.close(); console.log(`PASS ${mode}: visible past records, inline checklist/add/edit, target dates, restart and compact today`);
  }
  for (const variant of ['first', 'graduate', 'pending']) {
    const flow = await setup({ [variant]: true }); await open(flow.page);
    if (variant === 'first') { assert.equal(await flow.page.locator('.journal-page').getAttribute('data-date'), '2026-10-26'); assert.equal(await flow.page.getByRole('region', { name: 'ことばの絵日記', exact: true }).count(), 0); }
    if (variant === 'graduate') { assert.equal(await flow.page.locator('.journal-page').getAttribute('data-date'), '2026-10-25'); assert.match(await flow.page.getByRole('region', { name: 'ことばの絵日記', exact: true }).innerText(), /前のすうひもち/); }
    if (variant === 'pending') { const card = flow.page.getByRole('region', { name: 'ことばの絵日記', exact: true }); assert.equal(await card.getByRole('img').count(), 0); assert.ok((await card.boundingBox()).height < 150); }
    assert.equal(flow.requests(), 0); await flow.context.close(); console.log(`PASS ${variant}: no generation or blocking placeholder`);
  }
  assert.deepEqual(errors, []); writeFileSync('outputs/journal-ui/measurements.json', JSON.stringify(measurements, null, 2)); console.log(`Journal layout browser: ${testModes.length + 3} flows passed`, JSON.stringify(measurements));
} finally { await browser.close(); await vite.close(); }
