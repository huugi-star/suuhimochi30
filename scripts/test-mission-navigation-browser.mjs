import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
const require=createRequire(import.meta.url);
const {chromium}=require(require.resolve('playwright',{paths:[process.env.SUUHIMOCHI_BROWSER_MODULES||process.cwd()]}));
const vite=await createServer({configFile:false,root:process.cwd(),plugins:[react()],resolve:{alias:{'@':process.cwd()}},server:{host:'127.0.0.1',port:3004,hmr:false,ws:false},appType:'custom'});await vite.listen();
const html=await vite.transformIndexHtml('/__mission-game','<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app/globals.css"></head><body><div id="root"></div><script type="module">import React from "react";import {createRoot} from "react-dom/client";import {SuuhimochiGame} from "/components/SuuhimochiGame.tsx";createRoot(document.getElementById("root")).render(React.createElement(React.StrictMode,null,React.createElement(SuuhimochiGame)));</script></body></html>');
const browser=await chromium.launch({headless:true,...(process.env.SUUHIMOCHI_BROWSER_EXECUTABLE?{executablePath:process.env.SUUHIMOCHI_BROWSER_EXECUTABLE}:{})});
const errors=[];const G='suuhimochi-30days-save-v1';
try{
 await mkdir('outputs/verification/mission-coin',{recursive:true});
 for(const [width,height] of [[1365,900],[360,640]]){
  const context=await browser.newContext({viewport:{width,height},timezoneId:'Asia/Tokyo',isMobile:width===360,hasTouch:width===360});const page=await context.newPage();
  page.on('pageerror',e=>{if(!e.stack?.includes('/@vite/client')&&!errors.includes(e.message))errors.push(e.message)});
  await page.clock.install({time:new Date('2026-10-30T14:00:00+09:00')});
  await page.addInitScript(()=>{
    window.requestIdleCallback=()=>0;window.cancelIdleCallback=()=>{};
    if(localStorage.getItem('__mission_game_seed'))return;
    localStorage.setItem('__mission_game_seed','1');
    localStorage.setItem('suuhimochi-30days-save-v1',JSON.stringify({birthday:'2000-01-01',introComplete:true,day:16,state:'idle',mochiType:1}));
    localStorage.setItem('suuhimochi_conversation_v6_choices',JSON.stringify({version:16,dayOverride:16,startDate:'2026-10-15',goalText:'作品を作る'}));
    localStorage.setItem('suuhimochi-shared-knowledge-consent-v1',JSON.stringify({version:1,enabled:false,decided:true}));
  });
  await page.route('**/api/**',r=>r.fulfill({status:503,json:{error:'TEST_OFFLINE'}}));
  await page.route('**/__mission-game',r=>r.fulfill({contentType:'text/html',body:html}));
  await page.goto('http://127.0.0.1:3004/__mission-game',{waitUntil:'domcontentloaded'});
  const post=page.getByRole('button',{name:'ミッションポストを開く',exact:true});await post.waitFor({state:'attached',timeout:45000});
  const openPost=async()=>{
    for(let i=0;i<25;i++){
      if(await page.getByRole('dialog',{name:'デイリーミッション',exact:true}).isVisible())return;
      try{if(await post.isVisible()){await post.click({timeout:1200});if(await page.getByRole('dialog',{name:'デイリーミッション',exact:true}).isVisible())return;}}catch{}
      const back=page.locator('.face-talk').getByRole('button',{name:'部屋にもどる',exact:true});
      const later=page.getByRole('button',{name:/あとで聞くね|あとでね/}).first();
      if(await later.isVisible())await later.click();
      else if(await back.isVisible())await back.click();
      else if(await page.locator('.face-talk-bubble').isVisible())await page.locator('.face-talk-bubble').click();
      else if(await page.locator('.thought-bubble').isVisible())await page.locator('.thought-bubble').click();
      await page.clock.fastForward(1000);
    }
    await page.screenshot({path:'outputs/verification/mission-coin/navigation-failure.png'});
    throw new Error(`Mission post unavailable: ${(await page.locator('body').innerText()).slice(0,2000)}`);
  };
  await openPost();
  const panel=page.getByRole('dialog',{name:'デイリーミッション',exact:true});
  await panel.waitFor();await page.waitForTimeout(900);
  await page.locator('[data-mission-id=login]').click();await panel.waitFor({state:'hidden'});await openPost();
  await page.locator('[data-mission-id=plan]').click();
  const plan=page.getByRole('textbox',{name:'今日の予定を入力',exact:true});await plan.waitFor();await plan.fill('下書きをする');await page.getByRole('button',{name:'予定を保存',exact:true}).click();
  await page.getByRole('button',{name:'日誌を閉じる',exact:true}).click();await panel.waitFor();await page.locator('[data-completed="2"]').waitFor();
  await page.locator('[data-mission-id=report]').click();await page.getByRole('button',{name:'下書きをする：途中',exact:true}).click();
  await page.getByRole('button',{name:'日誌を閉じる',exact:true}).click();await panel.waitFor();await page.locator('[data-completed="3"]').waitFor();
  await page.locator('[data-mission-id=tomorrow]').click();const tomorrow=page.getByRole('textbox',{name:'明日のもくひょうを入力',exact:true});await tomorrow.waitFor();assert.equal(await tomorrow.evaluate(el=>el===document.activeElement),true);
  await tomorrow.fill('明日の散歩');await page.getByRole('button',{name:'あしたの予定を追加',exact:true}).click();await page.getByRole('button',{name:'日誌を閉じる',exact:true}).click();await panel.waitFor();await page.locator('[data-completed="4"]').waitFor();
  await page.locator('[data-mission-id=actual]').click();await page.getByRole('textbox',{name:'完了したことを入力',exact:true}).fill('机を片付けた');await page.getByRole('button',{name:'追加する',exact:true}).click();
  await page.getByRole('button',{name:'日誌を閉じる',exact:true}).click();await panel.waitFor();await page.locator('[data-flower-tier="3"]').waitFor();await page.waitForTimeout(250);
  await page.screenshot({path:`outputs/verification/mission-coin/flowers-${width}.png`});
  const save=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),G);
  assert.equal(Object.keys(save.dailyMissions['2026-10-30'].completedAt).length,5);assert.equal(save.taskPlans['2026-10-31'][0].text,'明日の散歩');assert.equal(save.taskPlans['2026-10-30'].find(t=>t.kind==='actual').result,'done');
  if(width===1365){
    await page.waitForTimeout(1000);
    await page.evaluate(key=>{const state=JSON.parse(localStorage.getItem(key));state.taskPlans['2026-10-29']=[{id:'yesterday-task',text:'昨日の散歩',createdAt:'2026-10-29T12:00:00+09:00',result:null}];localStorage.setItem(key,JSON.stringify(state))},G);
    await page.reload({waitUntil:'domcontentloaded'});await post.waitFor({state:'attached',timeout:45000});await openPost();await panel.waitFor();await page.waitForTimeout(900);
    assert.equal(await page.locator('[data-flower-tier]').count(),0,'acknowledged celebrations must not replay after reload');
    await page.locator('[data-mission-id=report]').click();await page.getByRole('button',{name:'昨日の散歩：できた',exact:true}).click();
    await page.getByRole('button',{name:'日誌を閉じる',exact:true}).click();await panel.waitFor();
  }
  await page.locator('[data-mission-id=teach]').click();await page.locator('.face-talk').waitFor();
  for(let i=0;i<20;i++){
    if(await page.locator('.face-talk-input').isVisible())break;
    const bubble=page.locator('.face-talk-bubble');if(await bubble.isVisible())await bubble.click();await page.clock.fastForward(1000);
  }
  await page.locator('.face-talk-input').waitFor();
  const state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),G);
  assert.equal(state.dailyMissions['2026-10-30'].completedAt.teach,undefined,'opening teaching must not complete it');
  console.log('PASS',`${width}x${height}`,'login→room, today plan→input, result→today, tomorrow focus, actual input, auto return, tier-3 flowers, teaching UI without false credit');
  await context.close();
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();vite.httpServer?.closeAllConnections();await vite.close();}
