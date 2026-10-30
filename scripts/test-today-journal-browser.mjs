import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import sharp from 'sharp';
const require=createRequire(import.meta.url);
const {chromium}=require(require.resolve('playwright',{paths:[process.env.SUUHIMOCHI_BROWSER_MODULES||process.cwd()]}));
const baseline=process.env.SUUHIMOCHI_JOURNAL_BASELINE==='1';
const out='outputs/verification/today-journal';await mkdir(out,{recursive:true});
const vite=await createServer({configFile:false,root:process.cwd(),plugins:[react()],resolve:{alias:{'@':process.cwd()}},server:{host:'127.0.0.1',port:3005,hmr:false,ws:false},appType:'custom'});await vite.listen();
const html=await vite.transformIndexHtml('/__journal-test',`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app/globals.css"></head><body><div id="root"></div><script type="module">
import React from 'react';import {createRoot} from 'react-dom/client';import {JournalPanel} from '/components/JournalPanel.tsx';import {PictureDiaryCard} from '/components/PictureDiary.tsx';import {defaultPictureDiaryForDay} from '/lib/pictureDiaryDefaults.ts';import * as m from '/lib/dailyMissions.ts';import {EMPTY_SAVE} from '/lib/storage.ts';import {saveJournalChecklistItem,removeJournalItem} from '/lib/journalProgress.ts';
const now=()=>new Date();const noop=()=>{};const words=[{id:'word-1',surface:'将棋',learnedAt:'2026-10-29T12:00:00+09:00',firstSeenDay:15}];
const seed=()=>{let s=structuredClone(EMPTY_SAVE);for(const d of ['2026-10-28','2026-10-29','2026-10-30'])s=m.addTaskPlans(s,d,[d==='2026-10-30'?'下書きを進める':'散歩をする', '資料を読む'],new Date(d+'T12:00:00+09:00'));s=m.addTaskPlans(s,'2026-10-31',['明日の散歩'],now());s=saveJournalChecklistItem(s,'2026-10-29',{taskId:s.taskPlans['2026-10-29'][0].id,text:'散歩をする',result:'done'},{currentDay:16,memories:[],words,now:now()});for(const d of ['2026-10-28','2026-10-29'])s.suuhimochiDiaries[d]={date:d,day:d.endsWith('29')?15:14,text:'将棋ということばを覚えたの。人間さんとお話して楽しかったの。',createdAt:'2026-10-30T07:00:00+09:00'};return s;};
function Harness(){const [save,setSave]=React.useState(()=>JSON.parse(localStorage.getItem('today-fixture')||'null')||seed());React.useEffect(()=>{window.__journalSave=save;window.__addIndexHistory=()=>setSave(old=>({...old,journalNotes:{...old.journalNotes,...Object.fromEntries(Array.from({length:13},(_,i)=>['2026-10-'+(i+15),[]]))}}));localStorage.setItem('today-fixture',JSON.stringify(save))},[save]);
const pictures=['2026-10-28','2026-10-29'].map((d,i)=>({localCompanionId:'test',diaryDate:d,status:'GENERATED',source:'CLOUDFLARE',imageUrl:defaultPictureDiaryForDay(i+14).imageUrl}));
return React.createElement('div',{style:{position:'relative',height:'100dvh',background:'#a88e6c'}},React.createElement(JournalPanel,{currentDay:16,currentPhase:'LIVE',currentActivityDate:'2026-10-30',dailyMissionSummary:m.getDailyMissionSummary(save,m.dailyMissionDateKey()),taskPlans:save.taskPlans,
onAddTaskPlans:(date,items)=>{if(!m.canPlanFor(date))return false;setSave(old=>m.addTaskPlans(old,date,items));return true},
onEditTaskPlan:(date,id,text)=>{setSave(old=>m.updateTaskPlan(old,date,id,text));return true},
onDeleteJournalItem:(date,item)=>{setSave(old=>removeJournalItem(old,date,item));return true},
onChecklistChange:(date,change)=>setSave(old=>saveJournalChecklistItem(old,date,change,{currentDay:16,memories:[],words,now:now()})),
pictureDiary:(date,comment)=>React.createElement(PictureDiaryCard,{records:pictures,enabled:false,onCheck:noop,individual:'test',date,comment}),pictureDiaryDates:pictures.map(p=>p.diaryDate),userName:'人間さん',goalText:'作品をつくる',goalType:null,records:[],journalNotes:save.journalNotes,suuhimochiDiaries:save.suuhimochiDiaries,strategyRecords:[],divinationRecords:[],memories:[{day:15,topic:'将棋',quote:'いっしょに覚えたの。'},{day:14,topic:'散歩',quote:'外のことを教わったの。'}],words,farewellLetter:null,cycleArchives:[],experienceFruitDates:[],onClose:noop,onChangeGoalType:noop,onReviewGoal:noop}));}
createRoot(document.getElementById('root')).render(React.createElement(React.StrictMode,null,React.createElement(Harness)));
</script></body></html>`);
const browser=await chromium.launch({headless:true,...(process.env.SUUHIMOCHI_BROWSER_EXECUTABLE?{executablePath:process.env.SUUHIMOCHI_BROWSER_EXECUTABLE}:{})});
const errors=[];
try{
for(const [width,height] of [[360,640],[375,667],[390,844],[680,370],[650,350],[1365,900]]){
 const context=await browser.newContext({viewport:{width,height},timezoneId:'Asia/Tokyo'});const page=await context.newPage();await page.clock.install({time:new Date('2026-10-30T14:00:00+09:00')});page.on('pageerror',e=>{if(!e.stack?.includes('/@vite/client'))errors.push(e.message)});
 await page.route('**/__journal-test',r=>r.fulfill({contentType:'text/html',body:html}));await page.goto('http://127.0.0.1:3005/__journal-test');await page.locator('.journal-page-past').waitFor();await page.evaluate(()=>document.fonts.ready);
 const capture=async(date,view)=>{
   const toggle=page.getByRole('button',{name:view==='picture'?'絵日記':'この日やったこと',exact:true});if(await toggle.isVisible()&&await toggle.getAttribute('aria-pressed')!=='true')await toggle.click();
   await page.waitForTimeout(400);await page.locator('.journal-page').evaluate(el=>el.scrollTop=0);
   if(view==='picture')await page.waitForFunction(()=>{const img=document.querySelector('.journal-picture-pane img');return img?.complete&&img.naturalWidth>0});
   const bytes=await page.screenshot({path:out+'/'+(baseline?'before':'after')+'-'+width+'x'+height+'-'+date+'-'+view+'.png'});
   const measurement=await page.locator('.journal-page-past').evaluate(el=>({html:el.outerHTML,rect:el.getBoundingClientRect().toJSON(),image:el.querySelector('.journal-picture-pane img')?.getBoundingClientRect().toJSON(),comment:el.querySelector('.journal-picture-pane article>p')?.textContent,index:[...el.querySelectorAll('.journal-index button')].map(x=>x.textContent)}));
   const record={hash:createHash('sha256').update(bytes).digest('hex'),measurement};const path=out+'/'+width+'x'+height+'-'+date+'-'+view+'.json';
   if(baseline)await writeFile(path,JSON.stringify(record,null,2));else{const before=JSON.parse(await readFile(path,'utf8'));assert.deepEqual(measurement.rect,before.measurement.rect,'past paper geometry unchanged');assert.deepEqual(measurement.image,before.measurement.image,'past picture geometry unchanged');assert.deepEqual(measurement.index,before.measurement.index,'past history unchanged');assert.equal(measurement.comment,before.measurement.comment);
     const leaves=await page.locator('.journal-page-past').evaluate((el,oldHtml)=>{const old=new DOMParser().parseFromString(oldHtml,'text/html');return ['.journal-picture-pane','.journal-record-pane','.journal-index'].every(selector=>el.querySelector(selector)?.outerHTML===old.querySelector(selector)?.outerHTML)},before.measurement.html);assert.equal(leaves,true,'past content DOM unchanged');
     if(record.hash!==before.hash){
     const old=await sharp(out+'/before-'+width+'x'+height+'-'+date+'-'+view+'.png').ensureAlpha().raw().toBuffer(),current=await sharp(bytes).ensureAlpha().raw().toBuffer();let pixels=0,maxDelta=0;
     for(let i=0;i<old.length;i+=4){const x=i/4%width,y=Math.floor(i/4/width),r=before.measurement.rect;if(x<r.left+25||x>=r.right-40||y<r.top||y>=r.bottom-55)continue;let changed=false;for(let c=0;c<3;c++){const delta=Math.abs(old[i+c]-current[i+c]);maxDelta=Math.max(maxDelta,delta);changed ||=delta>0;}if(changed)pixels++;}
     // Chromium can round a handful of image-edge pixels differently between runs.
     assert.ok(pixels<=12&&maxDelta<=10,`past screenshot changed: ${pixels} pixels, max delta ${maxDelta}`);
   }}
 };
 for(const date of ['2026-10-29','2026-10-28']){await capture(date,'picture');await capture(date,'records');if(date.endsWith('29'))await page.getByRole('button',{name:'前の日',exact:true}).click();}
 if(!baseline){
   for(const name of ['会話','ことば','軍師','六占']){await page.getByRole('button',{name:name+'の記録を開く',exact:true}).click();await page.getByRole('dialog',{name:'手帳の索引',exact:true}).waitFor();await page.getByRole('button',{name:'手帳の索引を閉じる',exact:true}).click();}
   await page.getByRole('button',{name:/きょうの手帳へ/}).click();await page.locator('.journal-page-today').waitFor();await page.waitForTimeout(350);
   await page.getByRole('heading',{name:'きょうの予定',exact:true}).waitFor();assert.equal(await page.locator('.journal-page-today .journal-index').count(),0);
   const fit=await page.locator('.journal-page-today').evaluate(el=>({client:el.clientHeight,scroll:el.scrollHeight}));assert.ok(fit.scroll<=fit.client+2,'today basic controls fit one screen');
   const dates=await page.locator('[data-index-date]').evaluateAll(els=>els.map(el=>el.getAttribute('data-index-date')));assert.deepEqual(dates,['2026-10-28','2026-10-29']);
   assert.equal(await page.locator('[aria-label="前の日誌"] [data-index-date]').count(),2);assert.equal(await page.locator('[aria-label="後の日誌"]').count(),0);
   assert.equal(await page.locator('.journal-page-today [data-stamp=hanamaru]').count(),0);
   const header=await page.locator('.journal-page-header').evaluate(el=>{const d=el.querySelector('strong').getBoundingClientRect(),g=document.querySelector('.journal-goal-entry').getBoundingClientRect();return{day:el.querySelector('strong').textContent,overlap:d.left<g.right&&d.right>g.left&&d.top<g.bottom&&d.bottom>g.top}});
   assert.ok(header.day.includes('DAY'));assert.equal(header.overlap,false,'DAY is not covered by the goal button');
   for(const result of ['できた','途中','まだ']){const b=page.getByRole('button',{name:'下書きを進める：'+result,exact:true});await b.click();assert.equal(await b.getAttribute('aria-pressed'),'true');}
   const showTask=async(name)=>{for(let i=0;i<20&&!(await page.getByRole('button',{name,exact:true}).isVisible());i++){const next=page.getByRole('button',{name:'次の予定',exact:true});if(await next.isDisabled()){await page.getByRole('button',{name:'前の予定',exact:true}).click()}else await next.click();}await page.getByRole('button',{name,exact:true}).waitFor()};
   await page.getByRole('button',{name:'次の予定',exact:true}).click();await page.getByRole('button',{name:'資料を読む：途中',exact:true}).click();await page.getByRole('button',{name:'前の予定',exact:true}).click();
   await page.getByRole('button',{name:'完了したことを追加',exact:true}).click();await page.getByRole('textbox',{name:'完了したことを入力',exact:true}).fill('机を片付けた');
   if(width===375){await page.setViewportSize({width,height:360});await page.waitForTimeout(100);const d=await page.getByRole('dialog',{name:'やったことを追加',exact:true}).boundingBox(),input=await page.getByRole('textbox',{name:'完了したことを入力',exact:true}).boundingBox();assert.ok(d.y>=0&&d.y+d.height<=360&&input.y>=0&&input.y+input.height<=360,'keyboard-sized viewport keeps input visible');}
   await page.getByRole('button',{name:'追加する',exact:true}).click();if(width===375)await page.setViewportSize({width,height});
   await page.getByRole('button',{name:'机を片付けた：できた',exact:true}).waitFor();
   await page.getByRole('textbox',{name:'明日のもくひょうを入力',exact:true}).fill('明日の読書');
   if(width===375){await page.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,value:320});visualViewport.dispatchEvent(new Event('resize'))});await page.waitForTimeout(150);const input=await page.getByRole('textbox',{name:'明日のもくひょうを入力',exact:true}).boundingBox();assert.ok(input.y>=0&&input.y+input.height<=320,'inline goal stays above simulated keyboard');}
   await page.getByRole('button',{name:'あしたの予定を追加',exact:true}).click();if(width===375){await page.evaluate(()=>{delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'))});await page.waitForTimeout(100);}
   await page.getByRole('button',{name:'明日のもくひょう一覧を開く',exact:true}).click();await page.getByRole('button',{name:'明日の散歩を編集',exact:true}).click();await page.getByRole('textbox',{name:'明日のもくひょうを編集',exact:true}).fill('明日の長い散歩');await page.getByRole('button',{name:'変更を保存',exact:true}).click();
   assert.equal(await page.evaluate(()=>window.__journalSave.taskPlans['2026-10-31'][0].text),'明日の長い散歩');
   await page.locator('.journal-page').evaluate(el=>el.scrollTop=0);await page.screenshot({path:out+'/today-'+width+'x'+height+'.png'});
   await page.locator('.journal-page').evaluate(el=>el.scrollTop=el.scrollHeight);await page.screenshot({path:out+'/today-plans-'+width+'x'+height+'.png'});
   const overflow=await page.locator('.journal-page-today').evaluate(el=>el.scrollWidth>el.clientWidth+1);assert.equal(overflow,false,'no horizontal overflow');
   const paper=await page.locator('.journal-page-today').boundingBox();assert.ok(paper.x>=0&&paper.y>=0&&paper.x+paper.width<=width+1&&paper.y+paper.height<=height+1,'today paper stays within viewport; long content scrolls inside it');
   assert.ok(await page.locator('[data-today-journal] fieldset button').evaluateAll(els=>els.every(el=>el.getBoundingClientRect().height>=44)),'result buttons have touch space');
   await page.reload();await page.locator('.journal-page-today').waitFor();assert.equal(await page.getByRole('button',{name:'下書きを進める：まだ',exact:true}).getAttribute('aria-pressed'),'true');
   await page.getByRole('button',{name:'完了したことを追加',exact:true}).click();await page.getByRole('textbox',{name:'完了したことを入力',exact:true}).fill('下書きを進める');await page.getByRole('button',{name:'追加する',exact:true}).click();
   assert.equal(await page.getByRole('button',{name:'下書きを進める：できた',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await page.evaluate(()=>window.__journalSave.taskPlans['2026-10-30'].length),3,'same-text pending plan is completed without duplication');
   const oldId=await page.evaluate(()=>window.__journalSave.taskPlans['2026-10-30'][1].id);await showTask('資料を読む：途中');await page.getByRole('button',{name:'資料を読むを修正',exact:true}).click();await page.getByRole('textbox',{name:'項目を修正',exact:true}).fill('資料をじっくり読む');await page.getByRole('button',{name:'修正を保存',exact:true}).click();
   assert.equal(await page.evaluate(()=>window.__journalSave.taskPlans['2026-10-30'][1].id),oldId);await page.getByRole('button',{name:'資料をじっくり読む：途中',exact:true}).waitFor();
   await page.getByRole('button',{name:'資料をじっくり読むを修正',exact:true}).click();await page.getByRole('button',{name:'この項目を削除',exact:true}).click();await page.getByRole('button',{name:'削除する',exact:true}).click();assert.equal(await page.evaluate(()=>window.__journalSave.taskPlans['2026-10-30'].length),2);
   await page.getByRole('button',{name:'昨日の手帳を開く',exact:true}).click();await page.locator('.journal-page-past').waitFor();await page.waitForTimeout(400);
   const pastImage=page.locator('.journal-picture-pane img');await pastImage.waitFor();
   const returned=await pastImage.boundingBox(),oldPast=JSON.parse(await readFile(out+'/'+width+'x'+height+'-2026-10-29-picture.json','utf8'));
   for(const key of ['x','y','width','height'])assert.equal(returned[key],oldPast.measurement.image[key],'return from today retains picture layout');
   assert.equal(await page.locator('.journal-picture-pane article>p').innerText(),oldPast.measurement.comment);
   assert.equal(await page.locator('[data-today-journal]').count(),0);assert.equal(await page.locator('.journal-index button').count(),4);
   assert.deepEqual(await page.locator('[aria-label="前の日誌"] [data-index-date]').evaluateAll(els=>els.map(el=>el.dataset.indexDate)),['2026-10-28']);assert.deepEqual(await page.locator('[aria-label="後の日誌"] [data-index-date]').evaluateAll(els=>els.map(el=>el.dataset.indexDate)),['2026-10-30']);await page.locator('[data-index-date="2026-10-30"]').click();await page.locator('.journal-page-today').waitFor();await page.locator('[data-index-date="2026-10-29"]').click();await page.locator('.journal-page-past[data-date="2026-10-29"]').waitFor();
   await page.evaluate(()=>window.__addIndexHistory());await page.waitForTimeout(100);const older=page.getByRole('navigation',{name:'前の日誌',exact:true}),newer=page.getByRole('navigation',{name:'後の日誌',exact:true});assert.ok(await older.locator('[data-index-date]').count()<=5);assert.ok(await newer.locator('[data-index-date]').count()<=5);assert.equal(await page.locator('[data-index-date]').count(),6);assert.equal(await page.locator('[data-index-date]').evaluateAll(els=>els.some(el=>el.dataset.indexDate>'2026-10-30')),false);
   if(width===375){await page.getByRole('button',{name:/きょうの手帳へ/}).click();await page.locator('.journal-page-today').waitFor();const long='ゆっくり取り組む予定です。'.repeat(30);await page.getByRole('button',{name:'下書きを進めるを修正',exact:true}).click();await page.getByRole('textbox',{name:'項目を修正',exact:true}).fill(long);await page.getByRole('button',{name:'修正を保存',exact:true}).click();assert.equal(await page.locator('[data-today-journal] ul>li p').innerText(),long);await page.getByRole('button',{name:long+'：途中',exact:true}).click();assert.equal(await page.evaluate(()=>window.__journalSave.taskPlans['2026-10-30'][0].result),'in_progress');assert.ok(await page.locator('.journal-page-today').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'long content wraps without horizontal clipping');}
 }
 console.log('PASS',width+'x'+height,baseline?'past baseline captured':'past DOM/geometry and screenshot match; today actions, tomorrow editing, restore, history menus');await context.close();
}
assert.deepEqual(errors,[]);
}finally{await browser.close();vite.httpServer?.closeAllConnections();await vite.close();}

