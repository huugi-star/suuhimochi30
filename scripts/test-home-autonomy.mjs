import assert from 'node:assert/strict';
import { createServer } from 'vite';
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log('PASS', name); };
try {
  const { HomeAutonomy, HOME_WAIT_MIN_MS, HOME_WAIT_MAX_MS } = await vite.ssrLoadModule('/lib/homeAutonomy.ts');
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');

  const end=(q,now)=>{assert.equal(q.wait(true,true,now),null);return q.wait(true,false,now+1000)};
  check('初回は案内操作後も3〜5秒、通信なしでズーム候補へ代替',()=>{
    for(const r of [0,.5,.999999]){const q=new HomeAutonomy(()=>r);q.interrupt();assert.equal(q.wait(false,false,0),null);assert.equal(q.wait(true,true,1000),null);const delay=q.wait(true,false,2000);assert.ok(delay>=3000&&delay<=5000);assert.equal(q.fire(2000+delay-1,()=>{throw Error('early')}),null);const tried=[];assert.equal(q.fire(2000+delay,k=>{tried.push(k);return k==='external'?null:k}),'invite');assert.deepEqual(tried,['external','invite']);}
  });
  check('外部情報会話の後はSELF/質問の順序を10〜15秒間隔で開始する',()=>{const q=new HomeAutonomy(()=>.5);assert.equal(q.wait(true,false,0),4000);assert.equal(q.fire(4000,k=>k),'external');assert.equal(q.fire(4000,()=>{throw Error('duplicate')}),null);assert.equal(q.wait(true,false,60000),null);assert.equal(end(q,60000),12500);});
  check('外部情報の後は10〜15秒でSELF、さらに10〜15秒でCURIOUSへ順に誘う',()=>{const q=new HomeAutonomy(()=>0);assert.equal(q.wait(true,false,0),3000);assert.equal(q.fire(3000,k=>k==='external'?'外部話題':null),'external');assert.equal(q.wait(true,true,3001),null);assert.equal(q.wait(true,false,4000),10000);assert.equal(q.fire(14000,k=>k),'self-invite');assert.equal(q.wait(true,true,14001),null);assert.equal(q.wait(true,false,15000),10000);assert.equal(q.fire(25000,k=>k),'curious-invite');});
  check('終了とカメラ復帰後の待機は毎回5〜15秒、再描画で期限を延長しない',()=>{
    let r=0;const q=new HomeAutonomy(()=>r);let now=0;const delays=new Set();let delay=q.wait(true,false,now);q.fire(now+delay,k=>k);for(let i=0;i<12;i++){q.wait(true,true,now+delay+1);now+=100000;r=[0,.2,.7,.999999][i%4];delay=q.wait(true,false,now);delays.add(delay);assert.ok(delay>=5000&&delay<=15000);assert.equal(q.wait(true,false,now+1000),delay-1000);assert.ok(q.fire(now+delay,k=>k+':'+i));}assert.ok(delays.size>=3);
  });
  check('操作・非表示・モーダルで予定を破棄し、終了後に新しく計測',()=>{const q=new HomeAutonomy(()=>.5);q.wait(true,false,0);q.fire(4000,k=>k);q.wait(true,true,4001);q.interrupt();q.wait(true,true,60000);assert.equal(q.fire(999999,()=>{throw Error('queued')}),null);assert.equal(q.wait(true,false,1000000),12500);assert.equal(q.fire(1012499,()=>{throw Error('early')}),null);});
  check('種類の連続と偏りを抑え、外部情報0件でも3回以内ごとにズーム',()=>{
    const q=new HomeAutonomy(()=>.5);let now=0,last=null,plain=0;const kinds=new Set();for(let i=0;i<30;i++){const delay=q.wait(true,false,now);now+=delay;const kind=q.fire(now,(k,recent)=>{assert.ok(recent.length<=8);return k==='external'?null:k+':'+i});if(last)assert.notEqual(kind,last);kinds.add(kind);plain=['invite','interest','external'].includes(kind)?0:plain+1;assert.ok(plain<=2);last=kind;q.wait(true,true,now+1);now+=1000;}assert.equal(kinds.size,4);
  });
  check('初回に未読DAYがなくても興味ズーム、全候補なしは新しいランダム待機で再試行',()=>{const q=new HomeAutonomy(()=>.5);q.wait(true,false,0);assert.equal(q.fire(4000,k=>k==='interest'?'質問':null),'interest');const empty=new HomeAutonomy(()=>.5);empty.wait(true,false,0);assert.equal(empty.fire(4000,()=>null),null);assert.equal(empty.wait(true,false,4001),10000);});
  check('誘いの候補確認は既読・辞書・会話数を変更せず、応じた時だけDAY台本を開始', () => {
    const map = new Map(); const storage = { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) };
    const key = 'suuhimochi_conversation_v6_choices'; const now = () => new Date('2026-10-28T12:00:00+09:00');
    const talk = new SuuhimochiConversation({ storage, now, random: () => 0 }); talk.setGoal('作品を作る');
    const state = JSON.parse(map.get(key)); state.dayOverride = 2; state.conversationCount = 19; map.set(key, JSON.stringify(state));
    const restored = new SuuhimochiConversation({ storage, now, random: () => 0 }); const before = map.get(key);
    assert.equal(restored.hasPendingDayConversation(), true); assert.equal(map.get(key), before);
    const response = restored.startDayConversation(); assert.match(response.debug.selectedTemplate, /^DAY02_SELF_/);
    const after = JSON.parse(map.get(key)); assert.equal(after.seenConversationIds.length, 1); assert.equal(after.conversationCount, 20);
    assert.deepEqual(after.words, state.words); assert.deepEqual(after.goalChecks, state.goalChecks);
  });
  check('自発ズームの次の誘いでSELFとCURIOUSを指定して選べる', () => {
    const map = new Map(); const storage = { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) };
    const now = () => new Date('2026-10-28T12:00:00+09:00');
    const talk = new SuuhimochiConversation({ storage, now, random: () => 0 }); talk.setGoal('作品を作る');
    const state = JSON.parse(map.get('suuhimochi_conversation_v6_choices')); state.dayOverride = 2; map.set('suuhimochi_conversation_v6_choices', JSON.stringify(state));
    const restored = new SuuhimochiConversation({ storage, now, random: () => 0 });
    assert.equal(restored.hasPendingDayConversation('SELF'), true); assert.equal(restored.hasPendingDayConversation('CURIOUS'), true);
    assert.match(restored.startDayConversation('SELF').debug.selectedTemplate, /^DAY02_SELF_/);
    const next = new SuuhimochiConversation({ storage, now, random: () => 0 });
    assert.match(next.startDayConversation('CURIOUS').debug.selectedTemplate, /^DAY02_CURIOUS_/);
  });
  check('未読台本なしでは誘いから別会話や卒業を勝手に開始しない', () => {
    const map = new Map(); const storage = { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) };
    const talk = new SuuhimochiConversation({ storage }); const before = JSON.stringify([...map]);
    assert.equal(talk.hasPendingDayConversation(), false); assert.equal(talk.startDayConversation(), null); assert.equal(JSON.stringify([...map]), before);
  });
  console.log(`${passed} home autonomy checks passed`);
} finally { await vite.close(); }
