import assert from 'node:assert/strict';
import { createServer } from 'vite';
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
let passed = 0; const check = async (name, fn) => { await fn(); passed++; console.log('PASS', name); };
const memory = () => { const data = new Map(); return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) }; };
const now = new Date('2026-10-26T10:00:00+09:00'), target = '2026-10-25', origin = 'https://app.example';
const secret = 'unit-only-session-secret-at-least-32-characters', token = 'unit-only-worker-token-at-least-32-characters';
try {
  const d = await vite.ssrLoadModule('/lib/pictureDiary.ts'), c = await vite.ssrLoadModule('/lib/pictureDiaryClient.ts');
  const defaults = await vite.ssrLoadModule('/lib/pictureDiaryDefaults.ts');
  const { createDiaryAuth } = await vite.ssrLoadModule('/lib/pictureDiaryAuth.ts');
  const { createPictureDiaryService } = await vite.ssrLoadModule('/lib/pictureDiaryServer.ts');
  const req = (body, cookie = '', requestOrigin = origin) => new Request(`${origin}/api/picture-diary`, { method: 'POST', headers: { origin: requestOrigin, cookie, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const auth = createDiaryAuth(secret, () => now);
  const enroll = (local = 'suuhimochi-cycle-1', start = '2026-10-01', cookie = '') => auth.enroll(req({}, cookie), local, start);
  const first = enroll(), cookie = first.cookie.split(';')[0];
  const identity = auth.verify(req({}, cookie), first.credential);
  const words = [{ word: 'セイバー', majorCategory: '漫画・アニメ・ゲーム・小説', subCategory: 'キャラクター', firstLearnedAt: target, relatedWords: ['Fate'] },
    { word: '野球', majorCategory: 'スポーツ・運動', subCategory: '競技・種目', firstLearnedAt: target }];
  const image = { status: 'OK', generated: true, date: target, imageUrl: '/diary/image?token=unit-image', expiresAt: '2026-12-08T15:00:00.000Z' };
  const make = ({ lookup = 'missing', plan = 'ok', generated = 'ok', configured = true } = {}) => {
    const calls = []; const service = createPictureDiaryService({ token: () => configured ? token : undefined, secret: () => secret, clock: () => now,
      dictionary: async () => ({ keywords: ['セイバー', '野球', 'Fate'] }), fetcher: async (url, init) => {
        calls.push({ url: String(url), init }); assert.equal(init.headers.authorization, `Bearer ${token}`);
        if (url.includes('/diary/lookup?')) return lookup === 'image' ? Response.json(image) : lookup === 'pending' ? Response.json({ status: 'ALREADY_REQUESTED_OR_COOLDOWN' }, { status: 202 })
          : lookup === 'failed' ? Response.json({ status: 'FAILED' }, { status: 202 }) : lookup === 'invalid' ? Response.json({ status: 'OK' }) : Response.json({ status: 'NOT_GENERATED' }, { status: 404 });
        if (url.endsWith('/diary/plan')) return plan === 'short' ? Response.json({ status: 'TWO_LEARNED_KEYWORDS_REQUIRED' }, { status: 422 }) : Response.json({ status: 'PLAN_OK', selectedKeywords: ['セイバー', '野球'] });
        return generated === 'pending' ? Response.json({ status: 'ALREADY_REQUESTED_OR_COOLDOWN' }, { status: 202 }) : generated === 'error' ? Response.json({ status: 'ERROR', detail: token }, { status: 503 }) : Response.json(image);
      } }); return { service, calls };
  };
  const body = (extra = {}) => ({ consent: true, credential: first.credential, diaryDate: target, learnedWords: words, ...extra });
  await check('匿名CookieはHttpOnly/Secure/SameSite、別ユーザー・偽造・CSRFを拒否し、再起動でも所有関係を検証する', () => {
    assert.match(first.cookie, /HttpOnly; Secure; SameSite=Strict/); assert.match(first.cookie, /^__Host-/);
    const other = enroll(); assert.match(identity.ownerId, /^anon_/); assert.notEqual(identity.ownerId, auth.verify(req({}, other.cookie.split(';')[0]), other.credential).ownerId);
  });
  // Separate enrollments belong to different owners; use the corresponding cookie for each grant.
  await check('匿名ユーザー間のID指定・署名改ざん・別オリジンを拒否する', () => {
    const other = enroll(); assert.throws(() => auth.verify(req({}, other.cookie.split(';')[0]), first.credential));
    assert.throws(() => auth.verify(req({}, cookie), `${first.credential}tampered`));
    assert.throws(() => auth.verify(req({}, cookie, 'https://evil.example'), first.credential));
    assert.throws(() => createDiaryAuth(undefined).verify(req({}, cookie), first.credential));
    const restored = createDiaryAuth(secret, () => now); assert.deepEqual(restored.verify(req({}, cookie), first.credential), identity);
    assert.equal(restored.verify(req({}, cookie), enroll('suuhimochi-cycle-1', '2026-10-01', cookie).credential).companionId, identity.companionId);
    assert.notEqual(restored.verify(req({}, cookie), enroll('suuhimochi-cycle-2', '2026-10-26', cookie).credential).companionId, identity.companionId);
  });
  await check('同意なし・ownerId偽装・未認証・Secret未設定ではWorkerを一度も呼ばない', async () => {
    for (const input of [body({ consent: false }), body({ ownerId: 'somebody-else' }), body({ companionId: 'somebody-else' })]) { const { service, calls } = make(); assert.equal((await service(req(input, cookie))).status, 400); assert.equal(calls.length, 0); }
    const anonymous = make(); assert.equal((await anonymous.service(req(body()))).status, 401); assert.equal(anonymous.calls.length, 0);
    const unconfigured = make({ configured: false }); assert.equal((await unconfigured.service(req(body(), cookie))).status, 503); assert.equal(unconfigured.calls.length, 0);
  });
  await check('lookup→plan→generateの順序、検証済みID、同一JSON、相対画像URLを守る', async () => {
    const { service, calls } = make(), response = await service(req(body(), cookie)), result = await response.json();
    assert.equal(response.status, 200); assert.equal(result.imageUrl, 'https://suuhimochi-info-hub.huugishiki.workers.dev/diary/image?token=unit-image');
    assert.deepEqual(calls.map((call) => new URL(call.url).pathname), ['/diary/lookup', '/diary/plan', '/diary/generate']);
    const lookup = new URL(calls[0].url); assert.equal(lookup.searchParams.get('ownerId'), identity.ownerId); assert.equal(lookup.searchParams.get('companionId'), identity.companionId);
    assert.equal(calls[1].init.body, calls[2].init.body); const sent = JSON.parse(calls[2].init.body); assert.equal(sent.startDate, '2026-10-01'); assert.equal(sent.learnedWords.length, 2);
    assert.ok(!JSON.stringify(result).includes(token)); assert.ok(!JSON.stringify(result).includes(identity.ownerId));
  });
  await check('生成済み・生成中・失敗記録・不明な応答では再生成しない', async () => {
    for (const lookup of ['image', 'pending', 'failed', 'invalid']) { const { service, calls } = make({ lookup }); await service(req(body(), cookie)); assert.equal(calls.length, 1); }
    const lookupOnly = make(); await lookupOnly.service(req(body({ lookupOnly: true, learnedWords: [] }), cookie)); assert.equal(lookupOnly.calls.length, 1);
    const short = make({ plan: 'short' }); assert.equal((await (await short.service(req(body(), cookie))).json()).status, 'TWO_LEARNED_KEYWORDS_REQUIRED'); assert.equal(short.calls.length, 2);
  });
  await check('同じ所有者・個体・対象日の同時要求はサーバーでも1回にまとめる', async () => {
    const { service, calls } = make(); const [a, b] = await Promise.all([service(req(body(), cookie)), service(req(body(), cookie))]);
    assert.equal(a.status, 200); assert.equal(b.status, 200); assert.equal(calls.length, 3);
  });
  await check('共有辞書に未掲載でも固定の一般語辞書の語は、公開辞書へ再送せず利用できる', async () => {
    const calls = [];
    const service = createPictureDiaryService({ token: () => token, secret: () => secret, clock: () => now,
      dictionary: async () => { throw new Error('一般語だけなら取得不要'); }, fetcher: async (url, init) => {
        calls.push(url); if (url.includes('/lookup?')) return Response.json({ status: 'NOT_GENERATED' }, { status: 404 });
        if (url.endsWith('/plan')) return Response.json({ status: 'PLAN_OK', selectedKeywords: ['野球', 'サッカー'] });
        return Response.json(image);
      } });
    const response = await service(req(body({ learnedWords: [{ ...words[1], word: '野球' }, { ...words[1], word: 'サッカー' }] }), cookie));
    assert.equal((await response.json()).status, 'GENERATED'); assert.equal(calls.length, 3);
  });
  await check('日誌本文・未知語・一般人名・余分な項目を送らず、24語を超える入力を拒否する', async () => {
    const { service, calls } = make(); const bad = body({ learnedWords: [{ ...words[0], diaryText: '個人の日誌' }] });
    assert.equal((await service(req(bad, cookie))).status, 400); assert.equal(calls.length, 0);
    assert.equal((await service(req(body({ learnedWords: Array(25).fill(words[0]) }), cookie))).status, 400);
    const privateWord = { word: '個人的な友達', majorCategory: '人', subCategory: '友達・知り合い', firstLearnedAt: target };
    const reply = await service(req(body({ learnedWords: [words[0], privateWord, { ...words[1], word: '知らない人名' }] }), cookie));
    assert.equal((await reply.json()).status, 'TWO_LEARNED_KEYWORDS_REQUIRED'); assert.equal(calls.length, 1);
  });
  await check('JST昨日限定・30日範囲・Day30翌日をサーバーで検証する', async () => {
    const { service, calls } = make(); assert.equal((await service(req(body({ diaryDate: '2026-10-24' }), cookie))).status, 400);
    const last = enroll('last-day', '2026-09-26', cookie); assert.equal((await service(req(body({ credential: last.credential }), cookie))).status, 200);
    const tooOld = enroll('too-old', '2026-09-25', cookie); assert.equal((await service(req(body({ credential: tooOld.credential }), cookie))).status, 400); assert.equal(calls.length, 3);
  });
  await check('新語→再訪語→既知語で最大24語、日付不明は省略し、文章から関連語を捏造しない', () => {
    const row = (i, learnedAt) => ({ id: `w${i}`, surface: `ことば${i}`, category: 'GAME_MEDIA', subcategory: 'GAME_MEDIA_3', firstSeenDay: 1, learnedOrder: i, mentionCount: 1, rootWordId: `w${i}`, ...(learnedAt ? { learnedAt } : {}) });
    const rows = [row(1, '2026-10-25T01:00:00Z'), row(2, '2026-10-20T01:00:00Z'), row(3), ...Array.from({ length: 30 }, (_, i) => row(10 + i, '2026-10-19T01:00:00Z')), row(99, '2026-10-26T01:00:00Z')];
    const episodes = [{ topicWordIds: ['w2'], timestamp: '2026-10-25T03:00:00Z' }];
    const selected = d.selectDiaryWords(rows, [], episodes, target); assert.equal(selected.length, 24); assert.equal(selected[0].word, 'ことば1'); assert.equal(selected[1].word, 'ことば2');
    assert.ok(!selected.some((word) => word.word === 'ことば99')); assert.equal(selected[1].lastLearnedAt, '2026-10-25T03:00:00.000Z');
    const unknown = d.selectDiaryWords([row(3)], [], [], target)[0]; assert.equal(unknown.firstLearnedAt, undefined); assert.equal(unknown.lastLearnedAt, undefined);
    assert.equal(d.recordedDiaryTime('2026-10-25T12:00:00'), undefined); assert.equal(d.recordedDiaryTime('2026-02-30'), undefined);
    const mention = d.selectDiaryWords([row(2, '2026-10-20T01:00:00Z')], [], [], target, [], [{ speaker: 'USER', text: 'ことば2', timestamp: '2026-10-25T02:00:00Z' }]); assert.equal(mention[0].lastLearnedAt, '2026-10-25T02:00:00.000Z');
  });
  await check('同意は初期OFF、JST0時・未ログイン日の遡及なし・30日境界を判定する', () => {
    const storage = memory(); assert.equal(d.readPictureDiaryConsent(storage).enabled, false);
    const consent = d.savePictureDiaryConsent(storage, true, new Date('2026-10-25T15:00:00Z')); assert.equal(consent.since, '2026-10-26');
    const day = { localCompanionId: 'a', startDate: '2026-10-01', diaryDate: target, learnedWords: words, conversationCount: 2 };
    assert.equal(d.eligibleDiaryDay(day, consent, now), false);
    const prior = { enabled: true, since: '2026-10-25' };
    assert.equal(d.eligibleDiaryDay(day, prior, new Date('2026-10-25T14:59:59Z')), false); assert.equal(d.eligibleDiaryDay(day, prior, new Date('2026-10-25T15:00:00Z')), true);
    assert.equal(d.eligibleDiaryDay(day, prior, new Date('2026-10-27T10:00:00+09:00')), false);
    assert.equal(d.diaryImageUrl('javascript:alert(1)'), null); assert.equal(d.diaryImageUrl('//evil.example/diary/image?token=x'), null);
  });
  await check('クライアントの翌日起動を匿名認証・Workerまで通し、再起動と同時要求でも生成は1回だけ', async () => {
    const storage = memory(); storage.setItem('existing-game', '日誌・旅・タスク・30日のセーブ'); const consent = { enabled: true, since: target };
    c.rememberDiaryDay(storage, { localCompanionId: 'suuhimochi-cycle-1', startDate: '2026-10-01', diaryDate: target, learnedWords: words, conversationCount: 2 });
    const { service, calls } = make(); let clientCalls = 0, cookie = '';
    const fetcher = async (url, init) => { clientCalls++; const input = JSON.parse(init.body); if (url.endsWith('/session')) { const result = auth.enroll(req({}, cookie), input.localCompanionId, input.startDate); cookie = result.cookie.split(';')[0]; return Response.json({ status: 'OK', credential: result.credential }); }
      return service(req(input, cookie)); };
    const first = c.runPictureDiaryStartup(storage, consent, fetcher, now), second = c.runPictureDiaryStartup(storage, consent, fetcher, now); assert.equal(first, second);
    const result = await first; assert.equal(result.status, 'GENERATED'); assert.equal(calls.length, 3); assert.equal(clientCalls, 2);
    await c.runPictureDiaryStartup(storage, consent, fetcher, now); assert.equal(calls.length, 3); assert.equal(storage.getItem('existing-game'), '日誌・旅・タスク・30日のセーブ');
    assert.equal(c.readPictureDiaryStore(storage).records[0].imageUrl, result.imageUrl);
  });
  await check('中断した生成の再起動はlookupだけ、材料不足も保存し勝手に再試行しない', async () => {
    const storage = memory(), consent = { enabled: true, since: target };
    const day = { localCompanionId: 'suuhimochi-cycle-1', startDate: '2026-10-01', diaryDate: target, learnedWords: words, conversationCount: 2 };
    c.rememberDiaryDay(storage, day); c.saveDiaryRecord(storage, { localCompanionId: day.localCompanionId, diaryDate: target, status: 'CHECKING', attemptedOn: '2026-10-26' });
    let sent;
    const result = await c.runPictureDiaryStartup(storage, consent, async (url, init) => {
      if (url.endsWith('/session')) return Response.json({ credential: first.credential }); sent = JSON.parse(init.body); return Response.json({ status: 'GENERATED', imageUrl: image.imageUrl });
    }, now);
    assert.equal(sent.lookupOnly, true); assert.deepEqual(sent.learnedWords, []); assert.equal(result.status, 'GENERATED');
    const off = await c.runPictureDiaryStartup(storage, { enabled: false, since: null }, async () => { throw new Error('OFF must not fetch'); }, now); assert.equal(off, null);
  });
  await check('材料が1語の日はCloudflareへ送らず、既定画像で完結する', async () => {
    const storage = memory(), consent = { enabled: true, since: target }; let calls = 0;
    c.rememberDiaryDay(storage, { localCompanionId: 'short', startDate: '2026-10-01', diaryDate: target, learnedWords: words.slice(0, 1), conversationCount: 1 });
    assert.equal(await c.runPictureDiaryStartup(storage, consent, async () => { calls++; throw new Error('not eligible'); }, now), null);
    assert.equal(calls, 0);
    const fallback = c.saveDefaultDiaryRecord(storage, { localCompanionId: 'short', startDate: '2026-10-01', diaryDate: target, attemptedOn: '2026-10-26' });
    assert.equal(fallback.status, 'DEFAULT');
    assert.equal(c.readPictureDiaryStore(storage).records[0].status, 'DEFAULT');
  });
  await check('JST日付で30枚を一意に割り当て、複数日の未起動分も固定画像で補完する', () => {
    assert.equal(defaults.DEFAULT_PICTURE_DIARY_IMAGES.length, 30);
    assert.equal(new Set(defaults.DEFAULT_PICTURE_DIARY_IMAGES.map((item) => item.imageUrl)).size, 30);
    assert.equal(defaults.diaryCycleDayNumber('2026-10-01', '2026-10-01'), 1);
    assert.equal(defaults.diaryCycleDayNumber('2026-10-01', '2026-10-30'), 30);
    assert.equal(defaults.diaryCycleDayNumber('2026-10-01', '2026-10-31'), null);
    const storage = memory();
    const first = c.ensureDefaultDiaryRecords(storage, { localCompanionId: 'cycle', startDate: '2026-10-01', today: '2026-10-04', attemptedOn: '2026-10-04' });
    assert.deepEqual(first.map((record) => record.diaryDate), ['2026-10-01', '2026-10-02', '2026-10-03']);
    assert.equal(new Set(first.map((record) => record.imageUrl)).size, 3);
    const again = c.ensureDefaultDiaryRecords(storage, { localCompanionId: 'cycle', startDate: '2026-10-01', today: '2026-10-04', attemptedOn: '2026-10-04' });
    assert.deepEqual(again.map((record) => record.imageUrl), first.map((record) => record.imageUrl));
    c.saveDiaryRecord(storage, { localCompanionId: 'cycle', diaryDate: '2026-10-02', attemptedOn: '2026-10-04', status: 'GENERATED', source: 'CLOUDFLARE', imageUrl: 'https://suuhimochi-info-hub.huugishiki.workers.dev/diary/image?token=unit' });
    c.ensureDefaultDiaryRecords(storage, { localCompanionId: 'cycle', startDate: '2026-10-01', today: '2026-10-04', attemptedOn: '2026-10-04' });
    assert.equal(c.readPictureDiaryStore(storage).records.find((row) => row.diaryDate === '2026-10-02').status, 'GENERATED');
    assert.equal(defaults.isDefaultPictureDiaryUrl(c.readPictureDiaryStore(storage).records.find((row) => row.diaryDate === '2026-10-01').imageUrl), true);
  });
  await check('実会話0回・未起動日は既存単語があってもCloudflareに送らず、生成条件不足も対象外', async () => {
    const storage = memory(), consent = { enabled: true, since: target };
    c.rememberDiaryDays(storage, [
      { localCompanionId: 'cycle', startDate: '2026-10-01', diaryDate: target, learnedWords: words, conversationCount: 0 },
      { localCompanionId: 'cycle', startDate: '2026-10-01', diaryDate: '2026-10-24', learnedWords: words.slice(0, 1), conversationCount: 1 },
    ]);
    let calls = 0;
    assert.equal(await c.runPictureDiaryStartup(storage, consent, async () => { calls++; throw new Error('must not call'); }, now), null);
    assert.equal(calls, 0);
    assert.equal(c.ensureDefaultDiaryRecords(storage, { localCompanionId: 'cycle', startDate: '2026-10-01', today: '2026-10-26', attemptedOn: '2026-10-26', awaitingCloudflareDates: [] }).some((row) => row.diaryDate === target), true);
    assert.equal(c.readPictureDiaryStore(storage).records.find((row) => row.diaryDate === target).status, 'DEFAULT');
    assert.equal((await c.runPictureDiaryStartup(storage, { enabled: false, since: null }, async () => { calls++; throw new Error('OFF'); }, now)), null);
    assert.equal(calls, 0);
  });
  await check('Cloudflare材料不足時はローカル既定絵へ切り替え、失敗応答は既定絵と混同しない', async () => {
    const shortStorage = memory(), consent = { enabled: true, since: target };
    c.rememberDiaryDay(shortStorage, { localCompanionId: 'short', startDate: '2026-10-01', diaryDate: target, learnedWords: words.slice(0, 1), conversationCount: 2 });
    let shortCalls = 0;
    assert.equal(await c.runPictureDiaryStartup(shortStorage, consent, async () => { shortCalls++; return Response.json({ status: 'TWO_LEARNED_KEYWORDS_REQUIRED' }); }, now), null);
    assert.equal(shortCalls, 0);
    const eligible = memory(); c.rememberDiaryDay(eligible, { localCompanionId: 'enough', startDate: '2026-10-01', diaryDate: target, learnedWords: words, conversationCount: 2 });
    const generated = await c.runPictureDiaryStartup(eligible, consent, async (url) => url.endsWith('/session') ? Response.json({ credential: 'test' }) : Response.json({ status: 'GENERATED', imageUrl: image.imageUrl }), now);
    assert.equal(generated.status, 'GENERATED'); assert.equal(generated.source, 'CLOUDFLARE');
    const failed = memory(); c.rememberDiaryDay(failed, { localCompanionId: 'failed', startDate: '2026-10-01', diaryDate: target, learnedWords: words, conversationCount: 2 });
    const errorRecord = await c.runPictureDiaryStartup(failed, consent, async (url) => url.endsWith('/session') ? Response.json({ credential: 'test' }) : Response.json({ status: 'ERROR' }, { status: 503 }), now);
    assert.equal(errorRecord.status, 'UNAVAILABLE');
    assert.notEqual(errorRecord.status, 'DEFAULT');
  });
  await check('保存データ復元でも不正な画像URLと余分な情報を表示しない', () => {
    const storage = memory(); storage.setItem(d.PICTURE_DIARY_DATA_KEY, JSON.stringify({ records: [{ localCompanionId: 'one', diaryDate: target, attemptedOn: '2026-10-26', status: 'FAILED', imageUrl: 'javascript:alert(1)', expiresAt: 'broken', privateText: '送信しない' }] }));
    const record = c.readPictureDiaryStore(storage).records[0]; assert.equal(record.imageUrl, undefined); assert.equal(record.expiresAt, undefined); assert.equal(record.privateText, undefined);
  });
  await check('保存できない場合は生成を始めず、通常セーブを破損させない', async () => {
    const storage = memory(); c.rememberDiaryDay(storage, { localCompanionId: 'one', startDate: '2026-10-01', diaryDate: target, learnedWords: words, conversationCount: 2 });
    const unavailable = { ...storage, setItem: () => { throw new Error('quota'); } }; let calls = 0;
    assert.equal(d.savePictureDiaryConsent(unavailable, true, now).enabled, false);
    const result = await c.runPictureDiaryStartup(unavailable, { enabled: true, since: target }, async () => { calls++; throw new Error('must not fetch'); }, now);
    assert.equal(result.status, 'UNAVAILABLE'); assert.equal(calls, 0);
  });
  await check('同日に代替わりした旧個体Day30と新個体Day1を混ぜず、最大2件だけ処理する', async () => {
    const storage = memory();
    for (const [id, startDate] of [['old-child', '2026-09-26'], ['new-child', target]]) c.rememberDiaryDay(storage, { localCompanionId: id, startDate, diaryDate: target, learnedWords: words, conversationCount: 2 });
    const completed = [];
    await c.runPictureDiaryStartup(storage, { enabled: true, since: target }, async (url, init) => {
      const body = JSON.parse(init.body);
      if (url.endsWith('/session')) { completed.push(body.localCompanionId); return Response.json({ credential: body.localCompanionId }); }
      return Response.json({ status: 'GENERATED', imageUrl: `/diary/image?token=${body.credential}` });
    }, now);
    assert.deepEqual(completed, ['old-child', 'new-child']); assert.equal(c.readPictureDiaryStore(storage).records.length, 2);
  });
  console.log(`Picture diary: ${passed} passed`);
} finally { await vite.close(); }
