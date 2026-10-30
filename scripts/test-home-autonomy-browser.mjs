import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'vite';
import { NOW, brief, feed } from './fixtures/external-monologues.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.SUUHIMOCHI_BROWSER_MODULES || process.cwd()] }));
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
const browser = await chromium.launch({ headless: true, ...(process.env.SUUHIMOCHI_BROWSER_EXECUTABLE ? { executablePath: process.env.SUUHIMOCHI_BROWSER_EXECUTABLE } : {}) });
const G='suuhimochi-30days-save-v1', C='suuhimochi_conversation_v6_choices', H='suuhimochi-external-monologues-v1';
const errors=[];
try {
  const { EMPTY_SAVE } = await vite.ssrLoadModule('/lib/storage.ts');
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const map=new Map(), storage={getItem:(k)=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:(k)=>map.delete(k)};
  const talk=new SuuhimochiConversation({ storage, now:()=>new Date(NOW), random:()=>0.5 }); talk.setGoal('作品を作る');
  const saved=JSON.parse(map.get(C)); saved.dayOverride=16; saved.startDate='2026-10-07';
  const game={...structuredClone(EMPTY_SAVE),birthday:'2000-01-01',introComplete:true,day:16};
  const setup=async(mobile=false,empty=false,slow=false)=>{
    let release;const waiting=new Promise(resolve=>{release=resolve;});
    const context=await browser.newContext({viewport:mobile?{width:680,height:370}:{width:1365,height:900},timezoneId:'Asia/Tokyo',isMobile:mobile,hasTouch:mobile});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date(NOW)});
    await page.addInitScript(({G,C,game,saved})=>{
      if(!localStorage.getItem('__home_test')){ localStorage.setItem(G,JSON.stringify(game));localStorage.setItem(C,JSON.stringify(saved));localStorage.setItem('suuhimochi-shared-knowledge-consent-v1',JSON.stringify({version:1,enabled:false,decided:true}));localStorage.setItem('__home_test','1'); }
      Math.random=()=>0.5;
    },{G,C,game,saved});
    await page.route('**/api/**',async route=>{
      const url=new URL(route.request().url());
      if(url.pathname==='/api/external-briefs'){if(slow)await waiting;return route.fulfill({json:feed(empty?[]:[brief('g','google_trending_now','お部屋にいても、知らない話題があるんだね。'),brief('w','wikipedia_pageviews','記事の中の名前って、いくつもつながっているのかな。')])});}
      if(url.pathname==='/api/external-topics')return route.fulfill({json:{schemaVersion:2,fetchedAt:NOW,expiresAt:'2026-10-23T00:00:00+09:00',topics:[]}});
      return route.fulfill({status:503,json:{error:'TEST_UNAVAILABLE'}});
    });
    await page.goto(process.env.SUUHIMOCHI_TEST_URL||'http://localhost:3000');
    return {page,context,release};
  };
  const state=page=>page.evaluate(({G,C,H})=>({game:JSON.parse(localStorage.getItem(G)),talk:JSON.parse(localStorage.getItem(C)),history:JSON.parse(localStorage.getItem(H)||'[]')}),{G,C,H});
  const invariants=(a,b)=>{for(const k of ['seenConversationIds','conversationCount','words','goalChecks'])assert.deepEqual(a.talk[k],b.talk[k],k);for(const k of ['friendship','personaExp','experienceFruits','journalNotes'])assert.deepEqual(a.game[k],b.game[k],k);};
  const finishZoom=async page=>{
    for(let n=0;n<30&&await page.locator('.face-talk').count();n++){
      const bubble=page.locator('.face-talk-bubble');if(!await bubble.count())break;
      await bubble.click();await page.clock.runFor(400);
      const line=page.locator('.face-talk-line');if(await line.count()){const fits=await line.evaluate(el=>el.scrollHeight<=el.clientHeight&&el.scrollWidth<=el.clientWidth);assert.ok(fits,'会話本文が吹き出しに収まる');}
    }
    await page.clock.runFor(1300);
  };
  for(const mobile of [false,true]){
    const {page,context}=await setup(mobile);
    await page.locator('[data-startup-talk="active"]').waitFor({timeout:45000});
    await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now())+100));
    const initial=await state(page);assert.equal(initial.history.length,1);
    await page.getByRole('button',{name:'部屋にもどる（スキップ）',exact:true}).click();await page.clock.runFor(200);
    assert.equal(await page.locator('.face-talk').count(),0);
    await page.clock.runFor(14000);assert.equal(await page.locator('.thought-bubble').count(),0);
    await page.clock.runFor(1200);assert.equal(await page.locator('.thought-bubble').count(),1,'startup monologue follows completion by 15 seconds');
    for(let n=0;n<8&&await page.locator('.thought-bubble').count();n++){await page.locator('.thought-bubble').click();await page.clock.runFor(200);}
    await page.clock.runFor(14000);assert.equal(await page.locator('[data-home-action="interest"]').count(),0);
    await page.clock.runFor(1200);assert.equal(await page.locator('[data-home-action="interest"]').count(),1);
    await finishZoom(page);assert.equal(await page.locator('.face-talk').count(),0);
    const afterInterest=await state(page);invariants(initial,afterInterest);
    await page.clock.runFor(21000);assert.equal(await page.locator('.face-talk').count(),0,'wait begins after camera return');
    await page.clock.runFor(1800);assert.equal(await page.locator('[data-home-action="invite"]').count(),1);
    await finishZoom(page);await page.locator('[data-home-invite]').waitFor();
    invariants(initial,await state(page));
    {
      await page.locator('[data-home-invite]').getByRole('button',{name:'うん、聞かせて！',exact:true}).click();
      await page.clock.runFor(100);
      const started=await state(page);assert.equal(started.talk.seenConversationIds.length,1);assert.equal(started.talk.conversationCount,initial.talk.conversationCount+1);
      await finishZoom(page);
      const choices=page.locator('.face-talk-right .tactile-choice-list .tactile-choice-button');assert.equal(await choices.count(),3);
      const controls=page.locator('.face-talk-right .tactile-choice-button, .face-talk-right .face-talk-action.face-talk-secondary');
      const bounds=await controls.evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect(),p=n.closest('.face-talk-right').getBoundingClientRect();return r.top>=p.top-1&&r.bottom<=p.bottom+1&&r.top>=0&&r.bottom<=innerHeight;}));
      assert.equal(bounds.length,4);assert.ok(bounds.every(Boolean),JSON.stringify(bounds));
      assert.equal(await page.locator('.face-talk-close').count(),0);
      if(mobile)await page.screenshot({path:'node_modules/.cache/conversation-680x370.png'});
      const beforeChoices=(await state(page)).talk.conversationChoiceRecords.length;
      await choices.first().evaluate(el=>{el.click();el.click();});await page.clock.runFor(200);
      assert.equal((await state(page)).talk.conversationChoiceRecords.length,beforeChoices+1);
      await finishZoom(page);if(await page.getByRole('button',{name:'会話を閉じる',exact:true}).count())await page.getByRole('button',{name:'会話を閉じる',exact:true}).click();
    }
    await page.clock.runFor(1400);const postInvite=await state(page);
    await page.clock.runFor(19000);assert.equal(await page.locator('[data-home-action="dance"]').count(),0);
    for(let i=0;i<24&&!await page.locator('[data-home-action="dance"]').count();i++)await page.clock.runFor(250);
    assert.equal(await page.locator('[data-home-action="dance"]').count(),1);
    await page.locator('.mochi .word-combo-dance').waitFor();
    const frames=new Set();
    for(let step=0;step<20&&await page.locator('[data-home-action="dance"]').count();step++){
      frames.add(await page.locator('.mochi .word-combo-dance').getAttribute('data-frame'));
      await page.clock.runFor(250);await page.waitForTimeout(20);
    }
    assert.ok(frames.size>=2,'dance must actually advance its frames');
    assert.equal(await page.locator('[data-home-action="dance"]').count(),0);invariants(postInvite,await state(page));
    // User screens pause and discard the idle deadline, including delayed external updates.
    if(mobile)await page.getByRole('button',{name:'メニュー',exact:true}).click();
    await page.locator('.room-nav').getByRole('button',{name:'アイテム',exact:true}).click();
    await page.clock.runFor(120000);assert.equal(await page.locator('.face-talk').count(),0);assert.equal(await page.locator('.thought-bubble').count(),0);
    if(mobile)await page.getByRole('button',{name:'メニュー',exact:true}).click();
    await page.locator('.room-nav').getByRole('button',{name:'部屋',exact:true}).click();
    await page.clock.runFor(14000);assert.equal(await page.locator('.face-talk').count(),0,'no queued replay after modal');
    // Manual DAY conversation remains immediately available, even during the random cooldown.
    if(mobile)await page.getByRole('button',{name:'メニュー',exact:true}).click();
    await page.locator('.room-nav').getByRole('button',{name:'はなす',exact:true}).click();
    await page.getByRole('button',{name:/お話する/}).click();await page.clock.runFor(100);
    const accepted=await state(page);assert.ok(accepted.talk.seenConversationIds.length>=postInvite.talk.seenConversationIds.length);assert.equal(accepted.talk.conversationCount,postInvite.talk.conversationCount+1);
    console.log('PASS',mobile?'スマホ':'PC','起動順序・終了後待機・誘いの非消費・ダンス・操作中抑止・手動開始');
    await page.screenshot({path:`node_modules/.cache/home-autonomy-${mobile?'mobile':'pc'}.png`});
    await context.close();
  }
  const {page,context}=await setup(false,true);
  await page.locator('[data-home-action="invite"]').waitFor({timeout:45000});
  assert.equal(await page.locator('[data-startup-talk="active"]').count(),0);
  assert.ok((await state(page)).history.length===0);
  await context.close();
  const slow=await setup(false,false,true);
  await slow.page.locator('.game-status').waitFor({timeout:45000});
  await slow.page.locator('.room-nav').getByRole('button',{name:'アイテム',exact:true}).click();
  slow.release();await slow.page.waitForTimeout(500);
  await slow.page.clock.pauseAt(new Date(await slow.page.evaluate(()=>Date.now())+100));
  await slow.page.clock.runFor(120000);
  assert.equal(await slow.page.locator('.face-talk').count(),0);assert.equal((await state(slow.page)).history.length,0);
  // A manual information refresh while a developer screen is open must not bypass the scheduler.
  await slow.page.locator('.room-nav').getByRole('button',{name:'部屋',exact:true}).click();
  await slow.page.locator('.dev-panel > summary').click();await slow.page.getByRole('tab',{name:'外部話題',exact:true}).click();
  await slow.page.getByRole('region',{name:'外部話題モニター',exact:true}).getByRole('button',{name:'今すぐ再取得',exact:true}).click();
  await slow.page.waitForTimeout(300);await slow.page.clock.runFor(60000);
  assert.equal(await slow.page.locator('.face-talk').count(),0);assert.equal((await state(slow.page)).history.length,0);
  await slow.page.locator('.dev-panel > summary').click();
  await slow.page.clock.runFor(14000);assert.equal(await slow.page.locator('.face-talk').count(),0);
  await slow.page.clock.runFor(9000);assert.equal(await slow.page.locator('[data-home-action="invite"]').count(),1);
  assert.equal((await state(slow.page)).history.length,0,'late refresh is a candidate, never a queued forced zoom');
  await slow.context.close();
  assert.deepEqual(errors,[]);console.log('PASS 外部情報0件・遅い通信・手動更新中の割り込み抑止・復帰後の新しい待機、ブラウザ例外なし');
} finally { await browser.close();await vite.close(); }
