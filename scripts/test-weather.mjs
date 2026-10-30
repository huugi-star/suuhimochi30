import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { prefectures } from './fixtures/weather-prefectures.mjs';
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
const memory = () => { const data = new Map(); return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) }; };
const now = new Date('2026-10-22T13:00:00+09:00');
const selection = { pref: { code: '130000', name: '東京都' } };
const forecast = () => ({ status: 'OK', office: selection.pref, prefecture: '東京都', representativeArea: true, area: { code: '130010', name: '東京地方' }, reportAt: '2026-10-22T11:00:00+09:00', retrievedAt: now.toISOString(),
  freshness: 'fresh', warning: null, source: '気象庁ホームページ', sourceUrl: 'https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json',
  note: '予報の抽出・整形結果です。会話文は予報ではありません。', temperatureStation: { code: '44132', name: '東京' },
  temperaturePoints: [{ at: '2026-10-22T09:00:00+09:00', valueC: 25 }, { at: '2026-10-23T00:00:00+09:00', valueC: 14 }, { at: '2026-10-23T09:00:00+09:00', valueC: 22 }],
  days: [0, 1].map((offset) => ({ offset, date: `2026-10-${22 + offset}`, weather: offset ? '晴れ　夜　くもり' : '晴れ　夕方　から　くもり', weatherCode: '111',
    temperatureMinC: null, temperatureMaxC: null, precipitationPeriods: [{ from: `2026-10-${22 + offset}T12:00:00+09:00`, to: `2026-10-${22 + offset}T18:00:00+09:00`, probabilityPercent: offset ? 40 : 0 }] })),
  dialogue: { text: '今日は晴れの予報なんだね。窓の向こうが明るいと、ちょっと遠くまで見たくなるの。', isForecast: false } });
let passed = 0;
const check = async (name, test) => { await test(); passed++; console.log('PASS', name); };
try {
  const w = await vite.ssrLoadModule('/lib/weather.ts'), c = await vite.ssrLoadModule('/lib/weatherClient.ts');
  const { createWeatherService, parseWeatherRequest } = await vite.ssrLoadModule('/lib/weatherServer.ts');
  const route = await vite.ssrLoadModule('/app/api/weather/route.ts');
  await check('都道府県だけを端末に保存・復元・解除し、既存データを変えない', () => {
    const storage = memory(); storage.setItem('game-save', '日誌と個体のデータ');
    assert.equal(w.readWeatherSelection(storage), null); assert.equal(w.saveWeatherSelection(storage, selection), true);
    assert.deepEqual(w.readWeatherSelection(storage), selection); assert.equal(w.saveWeatherSelection(storage, { pref: { code: '../secret', name: 'invalid' } }), false);
    assert.deepEqual(JSON.parse(storage.getItem(w.WEATHER_SELECTION_KEY)), selection);
    assert.equal(w.saveWeatherSelection(storage, null), true); assert.equal(w.readWeatherSelection(storage), null); assert.equal(storage.getItem('game-save'), '日誌と個体のデータ');
  });
  await check('旧地方・区域・観測地点の設定を都道府県コードへ移行する', () => {
    for (const [code, name, expected] of [['130000', '東京都', '130000'], ['011000', '宗谷地方', '016000'], ['014030', '十勝地方', '016000'], ['460040', '奄美地方', '460100'], ['474000', '八重山地方', '471000']]) {
      const storage = memory(); storage.setItem(w.WEATHER_SELECTION_KEY, JSON.stringify({ office: { code, name }, area: { code: '130020', name: '旧区域' }, station: { code: '44172', name: '旧地点' } }));
      assert.equal(w.readWeatherSelection(storage).pref.code, expected);
      assert.deepEqual(Object.keys(JSON.parse(storage.getItem(w.WEATHER_SELECTION_KEY))), ['pref']);
    }
  });
  await check('実際のAPI形式の天気・時刻別気温・降水確率・原文を保持し、最高最低を捏造しない', () => {
    const raw = forecast(), parsed = w.parseWeatherForecast(raw, selection); assert.ok(parsed);
    assert.deepEqual(parsed.days, raw.days); assert.deepEqual(parsed.temperaturePoints, raw.temperaturePoints); assert.equal(parsed.days[0].temperatureMaxC, null);
    assert.equal(parsed.dialogue.text, raw.dialogue.text); assert.equal(w.weatherTime(parsed.temperaturePoints[0].at), '09:00');
    assert.equal(w.weatherDateLabel(parsed.days[0].date, now), '今日'); assert.equal(w.weatherDateLabel(parsed.days[1].date, now), '明日');
  });
  await check('47都道府県を読み、旧58地方・欠損・不正コードは採用しない', () => {
    assert.deepEqual(w.parseWeatherRegions({ status: 'OK', areaLevel: 'prefectures', areas: prefectures }), prefectures);
    assert.equal(w.parseWeatherRegions({ status: 'OK', areaLevel: 'offices', areas: prefectures }), null);
    assert.equal(w.parseWeatherRegions({ status: 'OK', areaLevel: 'prefectures', areas: prefectures.slice(1) }), null);
    assert.equal(w.prefectureCodeValid('011000'), false); assert.equal(w.prefectureCodeValid('474000'), false);
  });
  await check('異なる地域・不正な数値・HTML・危険なリンクは表示しない', () => {
    assert.equal(w.parseWeatherForecast({ ...forecast(), office: { code: '270000', name: '大阪府' }, prefecture: '大阪府' }, selection), null);
    assert.equal(w.parseWeatherForecast({ ...forecast(), representativeArea: false }, selection), null);
    const bad = forecast(); bad.days[0].precipitationPeriods[0].probabilityPercent = 140; assert.equal(w.parseWeatherForecast(bad, selection), null);
    assert.equal(w.parseWeatherForecast({ ...forecast(), sourceUrl: 'javascript:alert(1)' }, selection), null);
    assert.equal(w.parseWeatherForecast({ ...forecast(), dialogue: { text: '<script>attack</script>', isForecast: false } }, selection).dialogue, null);
  });
  await check('午前0時で予報日を切り替え、前日の「今日」のセリフを翌日に話さない', () => {
    const midnight = new Date('2026-10-23T00:01:00+09:00'), raw = forecast(); raw.reportAt = '2026-10-22T23:00:00+09:00';
    const parsed = w.parseWeatherForecast(raw, selection);
    assert.equal(w.weatherDate(midnight), '2026-10-23'); assert.equal(w.weatherDateLabel('2026-10-23', midnight), '今日');
    assert.equal(w.weatherUsable(parsed, midnight), true); assert.equal(w.weatherMonologue(memory(), selection, parsed, midnight), null);
  });
  await check('同じ日の同じ天気セリフを再起動や取得時刻の変更だけで繰り返さない', () => {
    const storage = memory(), parsed = w.parseWeatherForecast(forecast(), selection);
    assert.equal(w.weatherMonologue(storage, selection, parsed, now), parsed.dialogue.text);
    w.markWeatherSpoken(storage, selection, parsed.dialogue.text, now);
    assert.equal(w.weatherMonologue(storage, selection, { ...parsed, retrievedAt: '2026-10-22T06:00:00Z' }, new Date(now.getTime() + 2 * 3600000)), null);
    const changed = { ...parsed, dialogue: { text: '明日はくもりの予報なの。', isForecast: false } };
    assert.equal(w.weatherMonologue(storage, selection, changed, new Date(now.getTime() + 60000)), null);
    assert.equal(w.weatherMonologue(storage, selection, changed, new Date(now.getTime() + 2 * 3600000)), changed.dialogue.text);
    assert.deepEqual([...storage.data.keys()], [w.WEATHER_SPOKEN_KEY]);
    assert.equal(w.weatherMonologue(memory(), selection, { ...parsed, freshness: 'stale' }, now), null);
  });
  await check('起動時取得は公開地域コードだけを送信し、短時間の重複取得を防ぐ', async () => {
    const storage = memory(); w.saveWeatherSelection(storage, selection); let calls = 0;
    const fetcher = async (url, init) => { calls++; assert.equal(url, '/api/weather?resource=forecast&pref=130000');
      assert.equal(init.credentials, 'omit'); assert.equal(init.body, undefined); return Response.json(forecast()); };
    const [a, b] = await Promise.all([c.loadWeather(storage, selection, fetcher, now), c.loadWeather(storage, selection, fetcher, now)]);
    assert.equal(calls, 1); assert.deepEqual(a, b); assert.ok(w.readWeatherCache(storage, selection, now).forecast);
    await c.loadWeather(storage, selection, fetcher, now); assert.equal(calls, 1);
    await c.loadWeather(storage, selection, fetcher, new Date(now.getTime() + 3600001)); assert.equal(calls, 2);
  });
  await check('通信・JSON障害では正常なキャッシュを残し、既存セーブを変えない', async () => {
    const storage = memory(); w.saveWeatherSelection(storage, selection); storage.setItem('game-save', 'unchanged');
    await c.loadWeather(storage, selection, async () => Response.json(forecast()), now);
    const before = storage.getItem(w.WEATHER_CACHE_KEY);
    const result = await c.loadWeather(storage, selection, async () => { throw new Error('offline'); }, now, true);
    assert.ok(result.error); assert.ok(result.forecast); assert.equal(storage.getItem(w.WEATHER_CACHE_KEY), before); assert.equal(storage.getItem('game-save'), 'unchanged');
    const empty = await c.loadWeather(memory(), selection, async () => Response.json({ status: 'ERROR' }), now); assert.equal(empty.forecast, null);
  });
  await check('地域変更後に遅れて返る前地域の応答をキャッシュしない', async () => {
    const storage = memory(); w.saveWeatherSelection(storage, selection); let release;
    const pending = c.loadWeather(storage, selection, () => new Promise((resolve) => { release = resolve; }), now);
    w.saveWeatherSelection(storage, { pref: { code: '270000', name: '大阪府' } });
    release(Response.json(forecast())); await pending; assert.equal(storage.getItem(w.WEATHER_CACHE_KEY), null);
  });
  await check('アプリAPIは固定公開URLだけを取得し、個人情報や受信ヘッダーを転送しない', async () => {
    let calls = 0;
    const service = createWeatherService(async (url, init) => { calls++; assert.equal(url, 'https://suuhimochi-info-hub.huugishiki.workers.dev/weather?pref=130000&office=130000');
      assert.deepEqual(init.headers, { accept: 'application/json' }); assert.equal(init.redirect, 'error'); return Response.json(forecast()); }, () => now);
    const request = { resource: 'forecast', pref: '130000' };
    await service(request); await service(request); assert.equal(calls, 1); await service({ ...request, force: true }); assert.equal(calls, 2);
    assert.equal(parseWeatherRequest(new URL('https://app/api/weather?resource=forecast&pref=https://evil')), null);
    assert.equal(parseWeatherRequest(new URL('https://app/api/weather?resource=areas&office=130000')), null);
    assert.equal((await route.GET(new Request('https://app/api/weather?office=invalid'))).status, 400);
  });
  await check('公開APIが既定の別都道府県を返しても表示・キャッシュしない', async () => {
    const storage = memory(); w.saveWeatherSelection(storage, selection);
    await c.loadWeather(storage, selection, async () => Response.json(forecast()), now);
    const before = storage.getItem(w.WEATHER_CACHE_KEY);
    const wrong = { ...forecast(), office: { code: '270000', name: '大阪府' }, prefecture: '大阪府' };
    const result = await c.loadWeather(storage, selection, async () => Response.json(wrong), now, true);
    assert.ok(result.error); assert.equal(result.forecast.prefecture, '東京都'); assert.equal(storage.getItem(w.WEATHER_CACHE_KEY), before);
    const service = createWeatherService(async () => Response.json(wrong), () => now);
    await assert.rejects(service({ resource: 'forecast', pref: '130000' }), /WEATHER_INVALID/);
  });
  await check('旧区域のキャッシュを新しい代表区域の予報として再利用しない', () => {
    const storage = memory(); storage.setItem(w.WEATHER_CACHE_KEY, JSON.stringify({ selectionId: '130000:130020:44172', fetchedAt: now.toISOString(), forecast: forecast() }));
    assert.equal(w.readWeatherCache(storage, selection, now).forecast, null);
    storage.setItem(w.WEATHER_SPOKEN_KEY, JSON.stringify([{ selectionId: '130000:130010:44132', date: '2026-10-22', text: forecast().dialogue.text, spokenAt: new Date(now.getTime() - 2 * 3600000).toISOString() }]));
    assert.equal(w.weatherMonologue(storage, selection, w.parseWeatherForecast(forecast(), selection), now), null);
  });
  await check('API通信にタイムアウトを設けて、停止した公開元を待ち続けない', async () => {
    const service = createWeatherService((_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('timeout')))), () => now, 10);
    await assert.rejects(service({ resource: 'regions' }), /timeout/);
  });
  console.log(`Weather: ${passed} passed`);
} finally { await vite.close(); }
