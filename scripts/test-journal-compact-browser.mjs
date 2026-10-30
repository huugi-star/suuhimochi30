import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { createServer } from 'vite';
const require=createRequire(import.meta.url), {chromium}=require(process.env.SUUHIMOCHI_BROWSER_PACKAGE || require.resolve('playwright'));
const vite=await createServer({configFile:false,root:process.cwd(),server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
const browser=await chromium.launch({headless:true,...(process.env.SUUHIMOCHI_BROWSER_EXECUTABLE?{executablePath:process.env.SUUHIMOCHI_BROWSER_EXECUTABLE}:{})});
const G='suuhimochi-30days-save-v1',C='suuhimochi_conversation_v6_choices', L='suuhimochi_room_layout_v1', errors=[];
try {
 const {EMPTY_SAVE}=await vite.ssrLoadModule('/lib/storage.ts'),m=await vite.ssrLoadModule('/lib/dailyMissions.ts');
 const {SuuhimochiConversation}=await vite.ssrLoadModule('/lib/wordMemory.ts');
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const talk=new SuuhimochiConversation({storage,now:()=>new Date('2026-10-25T13:00:00+09:00')});talk.setGoal('作品を作る');
 const conversation=JSON.parse(data.get(C));conversation.startDate='2026-10-10';conversation.dayOverride=16;
 let save={...structuredClone(EMPTY_SAVE),birthday:'2000-01-01',introComplete:true,day:16,suuhimochiDiaries:{'2026-10-25':{date:'2026-10-25',day:15,text:'将棋のことばを覚えたの。新しいことを知るのは楽しいね。',createdAt:'2026-10-26T07:00:00+09:00'}}};
 save=m.addTaskPlans(save,'2026-10-25',['散歩をする','本を読む','部屋を片付ける','日記を書く'],new Date('2026-10-25T13:00:00+09:00'));
 const taskNames=['下書きを進める','資料を読む','長めの予定でも読みやすく表示されることを確かめる','買い物に行く','机を片付ける','写真を整理する'];
 save=m.addTaskPlans(save,'2026-10-26',taskNames,new Date('2026-10-25T13:00:00+09:00'));
 save=m.addTaskPlans(save,'2026-10-27',['清書','散歩','読書'],new Date('2026-10-26T13:00:00+09:00'));
 const read=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),G);
 const openJournal=async page=>{const vertical=page.getByRole('button',{name:'縦画面で日誌を開く',exact:true});if(await vertical.isVisible())await vertical.click();else{const handle=page.locator('.mobile-room-menu-handle');if(await handle.isVisible()&&!(await page.locator('.room-nav').getAttribute('class')).includes('mobile-nav-open'))await handle.click();await page.getByRole('button',{name:'日誌',exact:true}).click();}await page.locator('.journal-page').waitFor();await page.waitForTimeout(500);};
 const fit=async(page,label)=>{const v=await page.locator('.journal-page').evaluate(el=>({height:el.clientHeight,scroll:el.scrollHeight,width:el.clientWidth,scrollWidth:el.scrollWidth,bottom:el.getBoundingClientRect().bottom,view:innerHeight}));console.log(label,JSON.stringify(v));assert.ok(v.scroll<=v.height+2,`${label} has no page scroll`);assert.ok(v.scrollWidth<=v.width+1&&v.bottom<=v.view+1);};
 for(const [width,height] of [[360,640],[360,740],[390,844],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,timezoneId:'Asia/Tokyo'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-26T13:00:00+09:00')});
  await page.addInitScript(({G,C,save,conversation})=>{if(localStorage.getItem('__compact_seed'))return;localStorage.setItem(G,JSON.stringify(save));localStorage.setItem(C,JSON.stringify(conversation));localStorage.setItem('suuhimochi-shared-knowledge-consent-v1',JSON.stringify({version:1,decided:true,enabled:false}));localStorage.setItem('__compact_seed','1');},{G,C,save,conversation});
  await page.route('**/api/external-topics*',r=>r.fulfill({json:{schemaVersion:2,fetchedAt:'2026-10-26T04:00:00Z',expiresAt:'2026-10-26T05:00:00Z',topics:[]}}));await page.route('**/api/external-briefs*',r=>r.fulfill({json:{schemaVersion:1,updatedAt:'2026-10-26T04:00:00Z',items:[]}}));
  await page.goto(process.env.SUUHIMOCHI_TEST_URL||'http://localhost:3000');await (width<height?page.getByRole('button',{name:'縦画面で日誌を開く',exact:true}):page.locator('.game-status')).waitFor({timeout:40000});
  await openJournal(page);await fit(page,`${width}x${height} picture`);await page.screenshot({path:resolve(`../journal-compact-picture-${width}x${height}.png`)});
  await page.getByRole('button',{name:'この日やったこと',exact:true}).click();await page.waitForTimeout(150);await fit(page,`${width}x${height} past records`);
  await page.getByRole('button',{name:'散歩をする：できた',exact:true}).click();assert.equal((await read(page)).taskPlans['2026-10-25'][0].result,'done');
  const pastSeen=new Set();for(let i=0;i<10;i++){for(const text of await page.locator('.journal-page-past [class*=taskText]').allTextContents())pastSeen.add(text.trim());const next=page.getByRole('button',{name:'次の項目',exact:true});if(!await next.isVisible()||await next.isDisabled())break;await next.click();}assert.equal(pastSeen.size,4);
  await page.getByRole('button',{name:'きょうの手帳へ',exact:false}).click();await page.waitForTimeout(400);await fit(page,`${width}x${height} today`);await page.screenshot({path:resolve(`../journal-compact-today-${width}x${height}.png`)});
  const seen=new Set();for(let i=0;i<10;i++){for(const text of await page.locator('.journal-page-today [class*=taskText]').allTextContents())seen.add(text.trim());const next=page.getByRole('button',{name:'次の項目',exact:true});if(await next.isDisabled())break;await next.click();}assert.deepEqual([...seen],taskNames);
  await page.getByRole('button',{name:'写真を整理する：途中',exact:true}).click();assert.equal((await read(page)).taskPlans['2026-10-26'][5].result,'in_progress');
  await page.getByRole('button',{name:'完了したことを追加',exact:true}).click();await fit(page,`${width}x${height} entering a task`);await page.getByRole('textbox',{name:'完了したことを入力',exact:true}).fill('予定外の片付け');await page.getByRole('button',{name:'追加する',exact:true}).click();await page.getByRole('button',{name:'予定外の片付け：できた',exact:true}).waitFor();assert.equal((await read(page)).taskPlans['2026-10-26'][6].result,'done');await fit(page,`${width}x${height} inline add`);
  await page.getByRole('textbox',{name:'明日のもくひょうを入力',exact:true}).fill('テストの予定');await page.getByRole('button',{name:'あしたの予定を追加',exact:true}).click();assert.equal((await read(page)).taskPlans['2026-10-27'].length,4);await fit(page,`${width}x${height} with tomorrow plans`);
  await page.getByRole('button',{name:'日誌を閉じる',exact:true}).click();
  if(width>height){
   const post=page.locator('[data-mission-post]');const initial=await post.boundingBox();assert.ok(initial.x>width*.85,'post starts at right edge');await page.screenshot({path:resolve('../mission-post-right-home.png')});
   const handle=page.locator('.mobile-room-menu-handle');if(await handle.isVisible()&&!(await page.locator('.room-nav').getAttribute('class')).includes('mobile-nav-open'))await handle.click();await page.getByRole('button',{name:'アイテム',exact:true}).click();
   const tile=page.locator('.item-tile').filter({has:page.getByRole('button',{name:'ミッションポストを部屋で確認する',exact:true})});await tile.getByRole('button').click();assert.equal(await tile.getByRole('button',{name:'しまう',exact:true}).count(),0);assert.match(await tile.innerText(),/収納不可/);await page.screenshot({path:resolve('../mission-post-item-edit.png')});
   await page.getByRole('button',{name:'たたむ',exact:true}).click();const box=await post.boundingBox();await page.mouse.move(box.x+30,box.y+25);await page.mouse.down();await page.mouse.move(box.x-100,box.y+50,{steps:8});await page.mouse.up();await page.waitForTimeout(300);
   const moved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),L);assert.ok(moved.positions['mission-post'].x<85);assert.ok(!moved.stored.includes('mission-post'));
   await page.getByRole('button',{name:'ミッションポストを移動',exact:true}).dblclick();await page.waitForTimeout(250);assert.ok(!(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),L)).stored.includes('mission-post'));
   await page.reload();await page.locator('.game-status').waitFor({timeout:40000});const restored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),L);assert.deepEqual(restored.positions['mission-post'],moved.positions['mission-post']);
  }
  await context.close();console.log(`PASS compact diary ${width}x${height}`);
 }
 assert.deepEqual(errors,[]);console.log('Compact diary and fixed movable mission post passed');
}finally{await browser.close();await vite.close();}
