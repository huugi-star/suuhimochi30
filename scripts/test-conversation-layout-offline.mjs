import fs from 'node:fs';import ts from 'typescript';import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const {chromium}=require(require.resolve('playwright',{paths:[process.env.SUUHIMOCHI_BROWSER_MODULES]}));
const source=fs.readFileSync('components/SuuhimochiGame.tsx','utf8');
const code=source.slice(source.indexOf('function fitTalkPages('),source.indexOf('function buildTalkPagesFromLines('));
const fn=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const css=source.slice(source.indexOf('<style>{`')+9,source.indexOf('`}</style>',source.indexOf('<style>{`'))).replace(/\$\{[^}]+\}/g,'100');
const browser=await chromium.launch({headless:true,executablePath:process.env.SUUHIMOCHI_BROWSER_EXECUTABLE});
try{for(const size of [{width:1365,height:900},{width:680,height:370},{width:650,height:350},{width:390,height:844},{width:375,height:667}]){
 const page=await browser.newPage({viewport:size});await page.setContent(`<style>${css}</style><main class="game-shell ${size.width>size.height?'mobile-landscape':''}"><section class="face-talk"><button class="face-talk-bubble"><span class="face-talk-line"></span></button></section></main>`);
 const outcome=await page.evaluate(({fn})=>{const fit=new Function(fn+';return fitTalkPages')();const text='人間さん！ぼく、ちょっと不思議なことを考えたの。最初の日のぼくと、今のぼくって何が違うんだろう。'.repeat(8);const pages=fit([{lines:[text]}],false);const line=document.querySelector('.face-talk-line');const dims=pages.map(p=>{line.textContent=p.lines.join('\n');return [line.scrollHeight,line.clientHeight,line.scrollWidth,line.clientWidth]});return {text,pages:pages.map(p=>p.lines.join('\n')),dims};},{fn});
 assert.equal(outcome.pages.join(''),outcome.text);assert.ok(outcome.pages.length>1);for(const [sh,ch,sw,cw] of outcome.dims)assert.ok(sh<=ch&&sw<=cw,JSON.stringify({size,sh,ch,sw,cw}));

 await page.evaluate(()=>{const section=document.querySelector('.face-talk');section.innerHTML='<div class="face-talk-right"><section class="face-talk-answer-context"><header><strong>質問：</strong><button>読み返す</button></header><p>人間さんはどう思う？</p></section><div class="tactile-choice-list"><button class="tactile-choice-button">ひとつめ</button><button class="tactile-choice-button">ふたつめ</button><button class="tactile-choice-button">みっつめ</button></div><button class="face-talk-action face-talk-secondary">今日はここまで</button></div>'});
 const visible=await page.locator('.tactile-choice-button, .face-talk-action.face-talk-secondary').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect(),p=n.closest('.face-talk-right').getBoundingClientRect();return {ok:r.top>=p.top&&r.bottom<=p.bottom&&r.top>=0&&r.bottom<=innerHeight,top:r.top,bottom:r.bottom,parentTop:p.top,parentBottom:p.bottom};}));
 assert.equal(visible.length,4);assert.ok(visible.every(v=>v.ok),JSON.stringify({size,visible}));

 const review=await page.evaluate(({fn})=>{
  const fit=new Function(fn+';return fitTalkPages')();const text='人間さん！ ぼくが考えたお話をもう一度読んでほしいの。'.repeat(12);const pages=fit([{lines:[text]}],false,true);
  const section=document.querySelector('.face-talk');section.innerHTML='<div class="face-talk-right"><section class="face-talk-review"><header><strong>さっきのおはなし</strong><small>1 / 3</small></header><div class="face-talk-review-pages"><article><p></p></article></div><div class="face-talk-review-controls"><button class="face-talk-action">回答に戻る</button><button class="face-talk-action">前へ</button><button class="face-talk-action">次へ</button></div></section></div>';
  const body=section.querySelector('.face-talk-review-pages'),p=body.querySelector('p');const dims=pages.map(row=>{p.textContent=row.lines.join('\n');const a=body.getBoundingClientRect(),b=p.getBoundingClientRect();return {ok:b.bottom<=a.bottom+1&&b.right<=a.right+1,height:a.height,textheight:b.height};});
  const controls=[...section.querySelectorAll('.face-talk-review-controls button')].map(n=>{const r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;});return {text,pages:pages.map(row=>row.lines.join('\n')),dims,controls};
 },{fn});
 assert.equal(review.pages.join(''),review.text);assert.ok(review.dims.every(row=>row.ok),JSON.stringify({size,review:review.dims}));assert.ok(review.controls.every(Boolean),JSON.stringify({size,controls:review.controls}));
 console.log('PASS',size.width+'x'+size.height,'本文・3択・終了・振り返り');await page.close();}
}finally{await browser.close();}
