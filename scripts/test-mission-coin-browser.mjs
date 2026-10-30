import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
const require=createRequire(import.meta.url);
const {chromium}=require(require.resolve('playwright',{paths:[process.env.SUUHIMOCHI_BROWSER_MODULES||process.cwd()]}));
const vite=await createServer({configFile:false,root:process.cwd(),plugins:[react()],resolve:{alias:{'@':process.cwd()}},server:{host:'127.0.0.1',port:3003,hmr:false,ws:false},appType:'custom'});
await vite.listen();
const harness=await vite.transformIndexHtml('/__coin-test',`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app/globals.css"><style>body{margin:0;background:#b99c7d;font-family:system-ui}button{font:inherit}*{box-sizing:border-box}</style></head><body><div id="root"></div><script type="module">
import React from 'react';import {createRoot} from 'react-dom/client';import {DailyMissionBoard} from '/components/DailyMissionBoard.tsx';import {getDailyMissionSummary,DAILY_MISSION_IDS} from '/lib/dailyMissions.ts';
const noop=()=>{};function Harness(){const [state,setState]=React.useState(()=>JSON.parse(localStorage.getItem('coin-fixture')||'{"count":0,"presented":false,"date":"2026-10-30"}'));
React.useEffect(()=>{window.__missionSet=(count,date=state.date)=>{const next={count,presented:false,date};localStorage.setItem('coin-fixture',JSON.stringify(next));setState(next)}},[state.date]);
const completedAt=Object.fromEntries([...DAILY_MISSION_IDS].reverse().slice(0,state.count).map(id=>[id,'2026-10-30T12:00:00+09:00']));
const summary=getDailyMissionSummary({taskPlans:{},dailyMissions:{[state.date]:{completedAt,...(state.count===6?{coinCompletedAt:'2026-10-30T12:00:00+09:00'}:{}),...(state.presented?{coinPresentedAt:'2026-10-30T12:01:00+09:00'}:{})}}},state.date);
return React.createElement(DailyMissionBoard,{summary,portrait:true,onOpenChange:noop,onOpenJournal:noop,onCoinPresented:()=>setState(old=>{const next={...old,presented:true};localStorage.setItem('coin-fixture',JSON.stringify(next));return next})});}
createRoot(document.getElementById('root')).render(React.createElement(React.StrictMode,null,React.createElement(Harness)));
</script></body></html>`);
const browser=await chromium.launch({headless:true,...(process.env.SUUHIMOCHI_BROWSER_EXECUTABLE?{executablePath:process.env.SUUHIMOCHI_BROWSER_EXECUTABLE}:{})});
const errors=[];
try{
  await mkdir('outputs/verification/mission-guide',{recursive:true});
  for(const [width,height] of [[360,640],[390,844],[680,370],[650,350],[1365,900]]){
    const page=await browser.newPage({viewport:{width,height}});
    page.on('pageerror',e=>{if(!e.stack?.includes('/@vite/client'))errors.push(e.message)});
    await page.route('**/__coin-test',route=>route.fulfill({contentType:'text/html',body:harness}));
    await page.goto('http://127.0.0.1:3003/__coin-test');
    await page.getByRole('button',{name:'ミッションポストを開く',exact:true}).click();
    await page.getByRole('heading',{name:'デイリーミッション',exact:true}).waitFor();
    assert.equal(await page.getByText('6つの光をつないで、コインをつくろう',{exact:true}).count(),0);
    assert.equal(await page.getByRole('button',{name:/日誌で予定・結果を見る|部屋にもどる/}).count(),0);
    await page.waitForTimeout(350);
    const center=await page.locator('[data-review]').boundingBox();
    if(height>500)assert.ok(Math.abs(center.x+center.width/2-width/2)<2,'ring stays horizontally centered');
    await page.getByAltText('そばで見守るすうひもち').waitFor();
    await page.waitForFunction(()=>{const img=document.querySelector('[data-mission-companion] img');return img?.complete&&img.naturalWidth>0});
    for(let count=0;count<=5;count++){
      await page.evaluate(n=>window.__missionSet(n),count);
      await page.locator(`[data-completed="${count}"]`).waitFor();
      const quote=await page.locator('[data-mission-comment]').innerText();
      assert.ok(quote.length>0);
      if(count===1)assert.ok(quote.includes('あと5個'));
      if(count===3)assert.ok(quote.includes('だんだん'));
      if(count===5)assert.ok(quote.includes('あとひとつ'));
      const companion=await page.locator('[data-mission-companion]').boundingBox();
      assert.ok(companion.x>=0&&companion.y>=0&&companion.x+companion.width<=width&&companion.y+companion.height<=height,'companion fits');
      const host=await page.getByAltText('そばで見守るすうひもち').boundingBox();assert.ok(host.width>=110,'guide is enlarged');assert.equal(await page.locator('[data-mission-companion]').getAttribute('data-mood'),count<=2?'waiting':count<=4?'happy':'excited');
      assert.ok(host.x>=0&&host.y>=0&&host.x+host.width<=width&&host.y+host.height<=height,'standing character stays in viewport');
      assert.ok(await page.locator('[data-mission-id]').evaluateAll(els=>{const h=document.querySelector('[data-mission-companion]').getBoundingClientRect();return els.every(el=>{const r=el.getBoundingClientRect();return r.right<=h.left||r.left>=h.right||r.bottom<=h.top||r.top>=h.bottom})}),'companion must not cover mission buttons');
      await page.waitForFunction(n=>document.querySelectorAll('[data-orb-index][data-lit=true]').length===n,count);
      if(count){
        const tier=count<=2?1:count<=4?2:3;
        await page.locator(`[data-flower-tier="${tier}"]`).waitFor();
      }
      assert.equal(await page.locator('[data-mission-id]').count(),6);
      assert.equal(await page.locator('[data-orb-index][data-lit=true]').count(),count);
      assert.equal(await page.locator('[data-arc-index][data-lit=true]').count(),Math.max(0,count-1));
      assert.ok(await page.locator('[data-arc-index]').evaluateAll(els=>els.every(el=>el.getAttribute('d').includes(' A178,178 '))),'connections follow the circular rim');
      const clipped=await page.locator('[data-mission-id]').evaluateAll(els=>els.filter(el=>el.scrollHeight>el.clientHeight+1).map(el=>el.textContent));
      assert.deepEqual(clipped,[],`${width}: mission text must fit`);
      assert.ok(await page.locator('[data-mission-id]').evaluateAll(els=>els.every(el=>el.getBoundingClientRect().height>=44)),`${width}: mission buttons are at least 44px high`);
      const bounds=await page.locator('dialog').evaluate(el=>{const b=el.getBoundingClientRect();return{fits:b.x>=0&&b.y>=0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1,noScroll:el.scrollHeight<=el.clientHeight+1}});
      assert.ok(bounds.fits,JSON.stringify(bounds));assert.ok(bounds.noScroll,`${width}x${height}: main controls fit without scrolling`);
      if([0,3,5].includes(count))await page.screenshot({path:`outputs/verification/mission-guide/guide-${width}x${height}-${count}.png`});
    }
    await page.evaluate(()=>window.__missionSet(6));
    await page.locator('[data-flower-tier="4"]').waitFor();
    await page.locator('[data-coin-phase=flash]').waitFor();
    assert.equal(await page.locator('[data-arc-index][data-lit=true]').count(),6);
    if(width===360)await page.screenshot({path:'outputs/verification/mission-guide/mobile-complete.png'});
    if(width===360){await page.locator('[data-finale=true]').waitFor();assert.equal(await page.locator('[data-finale=true]>span').count(),36);await page.waitForTimeout(200);await page.screenshot({path:'outputs/verification/mission-guide/mobile-flower-finale.png'});}
    await page.locator('[data-coin-phase=coin]').waitFor();
    assert.ok((await page.locator('[data-mission-comment]').innerText()).includes('コイン完成'));
    assert.equal(await page.locator('[data-mission-id]').count(),0);
    await page.getByRole('button',{name:'完成したすうひもちコイン。達成済みミッションを見る',exact:true}).click();
    assert.equal(await page.locator('[data-mission-id][data-complete=true]').count(),6);
    await page.getByRole('button',{name:'コインにもどる',exact:true}).click();
    await page.screenshot({path:`outputs/verification/mission-guide/coin-${width}x${height}.png`});
    await page.reload();
    await page.getByRole('button',{name:'ミッションポストを開く',exact:true}).click();
    await page.locator('[data-coin-phase=coin]').waitFor();
    await page.evaluate(()=>window.__missionSet(0,'2026-10-31'));
    await page.locator('[data-coin-phase=ring][data-completed="0"]').waitFor();
    assert.equal(await page.locator('[data-orb-index][data-lit=true]').count(),0);
    console.log('PASS',`${width}x${height}`,'0–6, clockwise arcs, text/controls fit, completion, review, restore, next day');
    await page.close();
  }
  const reduced=await browser.newPage({viewport:{width:360,height:640},reducedMotion:'reduce'});
  await reduced.route('**/__coin-test',route=>route.fulfill({contentType:'text/html',body:harness}));
  await reduced.goto('http://127.0.0.1:3003/__coin-test');
  await reduced.getByRole('button',{name:'ミッションポストを開く',exact:true}).click();
  await reduced.evaluate(()=>window.__missionSet(6));
  await reduced.locator('[data-coin-phase=coin]').waitFor({timeout:2000});
  assert.equal(await reduced.locator('[data-flower-tier]').count(),0);assert.equal(await reduced.getByAltText('そばで見守るすうひもち').evaluate(el=>getComputedStyle(el).animationName),'none');
  assert.equal(await reduced.locator('[data-mission-id]').count(),0);
  await reduced.close();console.log('PASS reduced motion: completed coin appears directly');
  assert.deepEqual(errors,[]);
}finally{await browser.close();vite.httpServer?.closeAllConnections();await vite.close();}
