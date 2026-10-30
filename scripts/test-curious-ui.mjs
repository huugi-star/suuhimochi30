import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {createServer} from 'vite';
const require=createRequire(import.meta.url),{chromium}=require(require.resolve('playwright',{paths:[process.env.SUUHIMOCHI_BROWSER_MODULES]}));
const vite=await createServer({configFile:false,root:process.cwd(),server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
const browser=await chromium.launch({headless:true,executablePath:process.env.SUUHIMOCHI_BROWSER_EXECUTABLE});
try{const {EMPTY_SAVE}=await vite.ssrLoadModule('/lib/storage.ts'),{SuuhimochiConversation}=await vite.ssrLoadModule('/lib/wordMemory.ts');
const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};const now='2026-10-22T13:00:00+09:00';
const talk=new SuuhimochiConversation({storage,now:()=>new Date(now),random:()=>0});talk.setGoal('作品');
const state=JSON.parse(values.get('suuhimochi_conversation_v6_choices'));state.dayOverride=16;state.lastGoalCheckDate='2026-10-22';state.seenConversationIds=Array.from({length:6},(_,i)=>`DAY16_SELF_0${i+1}`);
const context=await browser.newContext({viewport:{width:1365,height:900},timezoneId:'Asia/Tokyo'}),page=await context.newPage();await page.clock.install({time:new Date(now)});
await page.addInitScript(({game,state})=>{localStorage.setItem('suuhimochi-30days-save-v1',JSON.stringify(game));localStorage.setItem('suuhimochi_conversation_v6_choices',JSON.stringify(state));localStorage.setItem('suuhimochi-shared-knowledge-consent-v1',JSON.stringify({version:1,enabled:false,decided:true}));},{game:{...structuredClone(EMPTY_SAVE),birthday:'2000-01-01',introComplete:true,day:16},state});
await page.route('**/api/**',route=>route.fulfill({status:503,json:{error:'offline'}}));await page.goto('http://localhost:3000');await page.locator('.game-status').waitFor({timeout:45000});
for(let i=0;i<30&&await page.locator('.face-talk').count();i++){const bubble=page.locator('.face-talk-bubble');if(await bubble.count()){await bubble.click();await page.waitForTimeout(200);}else{const close=page.getByRole('button',{name:'会話を閉じる',exact:true});if(await close.count())await close.click();break;}}
await page.locator('.room-nav').getByRole('button',{name:'はなす',exact:true}).click();await page.getByRole('button',{name:'お話する',exact:true}).click();
for(let i=0;i<40;i++){if(await page.locator('#talk-text').count())break;const bubble=page.locator('.face-talk-bubble');if(await bubble.count())await bubble.click();await page.waitForTimeout(200);}
await page.locator('#talk-text').waitFor();assert.equal(await page.locator('.face-talk-close').count(),0);
await page.locator('#talk-text').fill('とまと');await page.getByRole('button',{name:'読み返す',exact:true}).click();const review=page.getByRole('region',{name:'直前の会話を読み返す'});await review.waitFor();
for(let i=0;i<40;i++){const body=review.locator('.face-talk-review-pages');const fits=await body.evaluate(el=>{const r=el.getBoundingClientRect(),p=el.querySelector('p');const t=p.getBoundingClientRect();return t.bottom<=r.bottom+1&&t.right<=r.right+1;});assert.ok(fits,'読み返し本文が枠内');const next=review.getByRole('button',{name:'次へ',exact:true});if(await next.isDisabled())break;await next.click();}
await review.getByRole('button',{name:'回答に戻る'}).click();await page.locator('#talk-text').waitFor();assert.equal(await page.locator('#talk-text').inputValue(),'とまと');await page.locator('.face-talk-send').click();await page.waitForTimeout(300);
const next=JSON.parse(await page.evaluate(()=>localStorage.getItem('suuhimochi_conversation_v6_choices')));assert.ok(next.seenConversationIds.some(id=>id.startsWith('DAY16_CURIOUS_')));assert.ok(next.conversations.some(entry=>entry.speaker==='USER'&&entry.text==='とまと'));
console.log('PASS CURIOUS 会話のページ送り・自由入力・回答記録');await context.close();
}finally{await browser.close();await vite.close();}
