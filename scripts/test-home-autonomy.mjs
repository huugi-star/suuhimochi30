import assert from 'node:assert/strict';
import { createServer } from 'vite';
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log('PASS', name); };
try {
  const { HomeAutonomy, HOME_WAIT_MIN_MS, HOME_WAIT_MAX_MS } = await vite.ssrLoadModule('/lib/homeAutonomy.ts');
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const cycleEnd = (q, time) => { assert.equal(q.wait(true, true, time), null); return q.wait(true, false, time + 1000); };
  check('起動は外部情報→終了15秒後にひとり言→終了15秒後に興味ズーム', () => {
    const q = new HomeAutonomy(() => 0.5), kinds = [];
    const show = (kind) => { kinds.push(kind); return kind; };
    assert.equal(q.wait(true, false, 0), 0); assert.equal(q.fire(0, show), 'external');
    assert.equal(q.wait(true, false, 60000), null, 'render alone cannot declare an animation finished');
    assert.equal(q.fire(60000, show), null);
    assert.equal(cycleEnd(q, 60000), 15000); assert.equal(q.fire(75999, show), null);
    assert.equal(q.fire(76000, show), 'monologue');
    assert.equal(cycleEnd(q, 90000), 15000); assert.equal(q.fire(106000, show), 'interest');
    assert.deepEqual(kinds, ['external', 'monologue', 'interest']);
  });
  check('待機は毎回15〜30秒を再抽選し、再描画で期限を延長しない', () => {
    const values = [0, 0.2, 0.7, 0.999999]; let value = 0;
    const q = new HomeAutonomy(() => value); q.interrupt();
    const delays = new Set();
    for (let n = 0; n < 16; n++) {
      const start = n * 100000; value = values[n % values.length];
      const delay = q.wait(true, false, start); delays.add(delay);
      assert.ok(delay >= HOME_WAIT_MIN_MS && delay <= HOME_WAIT_MAX_MS);
      assert.equal(q.wait(true, false, start + 1000), delay - 1000);
      const action = q.fire(start + delay, (kind) => `${kind}:${n}`); assert.ok(action);
      q.wait(true, true, start + delay + 1); q.interrupt();
    }
    assert.ok(delays.size >= 3);
  });
  check('操作・モーダル・カメラ復帰中は待機を破棄、終了から新しく計測', () => {
    const q = new HomeAutonomy(() => 0.5); q.interrupt();
    assert.equal(q.wait(true, false, 0), 22500);
    q.interrupt(); assert.equal(q.wait(true, true, 22000), null);
    assert.equal(q.fire(999999, () => { throw Error('must not play'); }), null);
    assert.equal(q.wait(true, false, 1000000), 22500);
    assert.equal(q.fire(1022499, () => 'too soon'), null);
  });
  check('起動演出中に手動操作した後は、残りの起動演出を連続再生しない', () => {
    const q = new HomeAutonomy(() => 0.5); q.wait(true, false, 0); q.fire(0, () => 'first');
    q.wait(true, true, 1); q.interrupt(); q.wait(true, true, 50000);
    assert.equal(q.wait(true, false, 100000), 22500);
  });
  check('同じタイマーの二重実行を拒否し、直近の種類の偏りを避ける', () => {
    const q = new HomeAutonomy(() => 0.5); q.interrupt(); let time = 0, last;
    const kinds = new Set();
    for (let n = 0; n < 20; n++) {
      const delay = q.wait(true, false, time); time += delay;
      const kind = q.fire(time, (kind, recent) => { assert.ok(recent.length <= 8); return `${kind}:${n}`; });
      if (last) assert.notEqual(kind, last); last = kind; kinds.add(kind);
      assert.equal(q.fire(time, () => { throw Error('duplicate'); }), null);
      q.wait(true, true, time + 1); time += 1000;
    }
    assert.equal(kinds.size, 5);
  });
  check('外部情報0件は他の演出で代替し、全候補なしでも再試行ループにならない', () => {
    const q = new HomeAutonomy(() => 0.5); q.wait(true, false, 0);
    assert.ok(q.fire(0, (kind) => kind === 'external' ? null : 'fallback'));
    const empty = new HomeAutonomy(() => 0.5); empty.wait(true, false, 0);
    assert.equal(empty.fire(0, () => null), null); assert.equal(empty.wait(true, false, 1), 22500);
  });
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
  check('未読台本なしでは誘いから別会話や卒業を勝手に開始しない', () => {
    const map = new Map(); const storage = { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) };
    const talk = new SuuhimochiConversation({ storage }); const before = JSON.stringify([...map]);
    assert.equal(talk.hasPendingDayConversation(), false); assert.equal(talk.startDayConversation(), null); assert.equal(JSON.stringify([...map]), before);
  });
  console.log(`${passed} home autonomy checks passed`);
} finally { await vite.close(); }
